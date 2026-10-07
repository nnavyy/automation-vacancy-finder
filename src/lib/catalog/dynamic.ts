import prisma from "@/lib/db";
import type { CatalogItem } from "./data";

/**
 * Detects whether a string is primarily Russian (Cyrillic) or English/Latin.
 */
export function detectLanguage(text: string): "ru" | "en" | "all" {
  const hasCyrillic = /[а-яёА-ЯЁ]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  if (hasCyrillic && !hasLatin) return "ru";
  if (hasLatin && !hasCyrillic) return "en";
  return "all";
}

/**
 * Normalizes input value for deduplication.
 */
function normalizeTerm(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Records user-submitted terms into the dynamic catalog.
 * Increments `usageCount` if the term already exists.
 * Gracefully swallows errors to never block main user request.
 */
export async function recordCatalogUsage(
  category: string,
  values: string[] | undefined | null
): Promise<void> {
  if (!Array.isArray(values) || values.length === 0) return;

  const cleanValues = Array.from(
    new Set(
      values
        .map((v) => (typeof v === "string" ? normalizeTerm(v) : ""))
        .filter((v) => v.length >= 2 && v.length <= 80)
    )
  );

  for (const val of cleanValues) {
    try {
      const lang = detectLanguage(val);
      await prisma.catalogTerm.upsert({
        where: {
          category_value: {
            category,
            value: val,
          },
        },
        update: {
          usageCount: { increment: 1 },
          lang,
        },
        create: {
          category,
          value: val,
          lang,
          usageCount: 1,
        },
      });
    } catch (err) {
      // Non-blocking background telemetry
      console.warn(`[Catalog] Failed to record dynamic term "${val}" in ${category}:`, err);
    }
  }
}

/**
 * Records all tags from a saved SearchPreference into the dynamic catalog.
 */
export async function recordPreferenceCatalogTerms(pref: {
  targetRoles?: string[];
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  searchKeywordsEn?: string[];
  searchKeywordsRu?: string[];
  excludeKeywords?: string[];
  redFlagKeywords?: string[];
}): Promise<void> {
  try {
    const tasks = [
      { category: "roles", values: pref.targetRoles },
      { category: "skills", values: pref.requiredSkills },
      { category: "skills", values: pref.niceToHaveSkills },
      { category: "keywords_en", values: pref.searchKeywordsEn },
      { category: "keywords_ru", values: pref.searchKeywordsRu },
      { category: "exclude", values: pref.excludeKeywords },
      { category: "red_flag", values: pref.redFlagKeywords },
    ];

    for (const task of tasks) {
      if (task.values && task.values.length > 0) {
        await recordCatalogUsage(task.category, task.values);
      }
    }
  } catch (err) {
    console.error("[Catalog] Bulk recording error:", err);
  }
}

/**
 * Fetches dynamic terms from the database for a category, ordered by popularity.
 */
export async function getDynamicCatalogTerms(
  category: string,
  limit = 100
): Promise<CatalogItem[]> {
  try {
    const terms = await prisma.catalogTerm.findMany({
      where: { category },
      orderBy: [{ usageCount: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: { value: true },
    });

    return terms.map((t) => ({ value: t.value }));
  } catch (err) {
    console.warn(`[Catalog] Failed to fetch dynamic terms for ${category}:`, err);
    return [];
  }
}

/**
 * Merges baseline static catalog with crowd-sourced dynamic terms,
 * prioritizing frequently-used community entries.
 */
export function mergeCatalogs(
  staticItems: CatalogItem[],
  dynamicItems: CatalogItem[]
): CatalogItem[] {
  const seen = new Set<string>();
  const merged: CatalogItem[] = [];

  // 1. Add dynamic items that have established usage first
  for (const item of dynamicItems) {
    const key = item.value.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  // 2. Add static baseline items if not already present
  for (const item of staticItems) {
    const key = item.value.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}
