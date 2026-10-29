// ============================================================
// Nanda AI Job Assistant — HH API Query Builder
// ============================================================
// Translates SearchPreferenceData into HH API-compatible
// query strings and URL parameter objects.
// ============================================================

import type { SearchPreferenceData } from "@/types";

/**
 * Builds an array of HH API search query strings from SearchPreferenceData.
 *
 * Combines English and Russian keywords, deduplicates, trims whitespace,
 * expands adjacent profile roles (e.g. Web Design, UI/UX, Vibe Coding / AI coding
 * for Full Stack & Frontend engineers), and caps at 20 total queries.
 *
 * @param pref - The active search preferences from DB
 * @returns Deduplicated array of query strings (max 20)
 */
export function buildSearchQueries(pref: SearchPreferenceData): string[] {
  const baseKeywords: string[] = [
    ...(pref.targetRoles ?? []),
    ...(pref.searchKeywordsEn ?? []),
    ...(pref.searchKeywordsRu ?? []),
  ];

  const joined = [
    ...baseKeywords,
    ...(pref.requiredSkills ?? []),
    ...(pref.niceToHaveSkills ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const isWebOrFullStack =
    /full[\s-]?stack|frontend|front[\s-]?end|react|next|typescript|javascript|web|сайт|фронтенд|фулстек|разработчик/i.test(
      joined,
    );

  const adjacentQueries = isWebOrFullStack
    ? [
        "Web Designer",
        "UI/UX Designer",
        "Веб-дизайнер",
        "AI Developer",
        "Vibe coding",
        "No-code разработчик",
      ]
    : [];

  const allKeywords = [...baseKeywords, ...adjacentQueries];

  const unique = Array.from(
    new Set(allKeywords.map((k) => k.trim()).filter((k) => k.length > 0)),
  );

  return unique.slice(0, 20);
}

// ── HH Params Type ────────────────────────────────────────────

export type HHParams = Record<string, string | string[]>;

export function buildHHParams(
  query: string,
  pref: SearchPreferenceData,
  page: number,
): HHParams {
  const params: HHParams = {
    text: query,
    per_page: "50",
    page: String(page),
    order_by: "publication_time",
  };

  if (pref.experience && pref.experience.length > 0) {
    params.experience = pref.experience;
  }

  if (pref.workFormat && pref.workFormat.includes("remote")) {
    params.schedule = "remote";
  }

  params.area = (pref as any).area ? String((pref as any).area) : "113";

  if (pref.salaryMinimum) {
    params.salary = String(pref.salaryMinimum);
    if (pref.salaryCurrency) {
      params.currency = pref.salaryCurrency;
    }
  }

  return params;
}

export function serializeHHParams(params: HHParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        searchParams.append(key, v);
      }
    } else {
      searchParams.append(key, value);
    }
  }

  return searchParams.toString();
}
