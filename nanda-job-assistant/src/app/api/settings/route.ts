// ============================================================
// Nanda AI Job Assistant — Search Preference Settings
// ============================================================
// GET  /api/settings  — retrieve the active SearchPreference
// POST /api/settings  — update (or bootstrap) the SearchPreference
//
// The app uses a single active SearchPreference row.
// If no active preference exists on POST, a sensible default
// is created with the provided fields merged on top.
//
// POST body: Partial<SearchPreferenceData>
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { SearchPreferenceData } from "@/types";

// ── Default Values ────────────────────────────────────────────

/**
 * Baseline defaults used when bootstrapping a brand-new SearchPreference.
 * These reflect Nanda's typical job search profile.
 */
const PREF_DEFAULTS = {
  name: "Default",
  targetRoles: [
    "Frontend Developer",
    "Full Stack Developer",
    "UI/UX Designer",
    "Web Developer",
  ],
  searchKeywordsEn: [
    "frontend developer",
    "react developer",
    "next.js developer",
    "UI/UX designer",
    "web developer intern",
  ],
  searchKeywordsRu: [
    "фронтенд разработчик",
    "веб разработчик",
    "react разработчик",
    "стажёр разработчик",
  ],
  requiredSkills: ["React", "TypeScript", "JavaScript"],
  niceToHaveSkills: ["Next.js", "Figma", "Node.js", "Tailwind CSS"],
  experience: ["noExperience", "between1And3"],
  workFormat: ["remote"],
  salaryMinimum: null as number | null,
  salaryCurrency: "RUR",
  excludeKeywords: [
    "1С",
    "C#",
    "Java",
    ".NET",
    "PHP разработчик",
    "только офис Москва",
  ],
  redFlagKeywords: ["паспорт", "залог", "otp", "без оплаты"],
  minimumScoreToNotify: 70,
  maxNotificationsPerDay: 20,
  aiProviderOrder: ["groq", "gemini", "openrouter"],
  coverLetterLanguage: "English",
  resumeText: "",
  isActive: true,
};

// ── Helpers ───────────────────────────────────────────────────

/**
 * Returns a shallow copy of `source` containing only the specified `keys`.
 * Keys not present in `source` are omitted from the result.
 * Used to build partial Prisma update payloads from the request body.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick<T extends Record<string, any>>(
  source: T,
  keys: (keyof T)[],
): Partial<T> {
  const result: Partial<T> = {};
  for (const k of keys) {
    if (k in source) result[k] = source[k];
  }
  return result;
}

/**
 * Converts a Prisma SearchPreference record to the public SearchPreferenceData
 * shape. JSON fields (stored as Prisma.JsonValue) are safely cast to typed arrays.
 */
function serializePref(p: any): SearchPreferenceData & { createdAt: Date; updatedAt: Date } {
  return {
    id: p.id,
    name: p.name,
    targetRoles: (p.targetRoles as string[]) ?? [],
    searchKeywordsEn: (p.searchKeywordsEn as string[]) ?? [],
    searchKeywordsRu: (p.searchKeywordsRu as string[]) ?? [],
    requiredSkills: (p.requiredSkills as string[]) ?? [],
    niceToHaveSkills: (p.niceToHaveSkills as string[]) ?? [],
    experience: (p.experience as string[]) ?? [],
    workFormat: (p.workFormat as string[]) ?? [],
    salaryMinimum: p.salaryMinimum ?? undefined,
    salaryCurrency: p.salaryCurrency ?? "RUR",
    excludeKeywords: (p.excludeKeywords as string[]) ?? [],
    redFlagKeywords: (p.redFlagKeywords as string[]) ?? [],
    minimumScoreToNotify: p.minimumScoreToNotify,
    maxNotificationsPerDay: p.maxNotificationsPerDay,
    aiProviderOrder: Array.isArray(p.aiProviderOrder)
      ? (p.aiProviderOrder as string[])
      : [],
    coverLetterLanguage: p.coverLetterLanguage,
    resumeText: p.resumeText,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ── GET Handler ───────────────────────────────────────────────

/**
 * GET /api/settings
 *
 * Returns the currently active SearchPreference.
 * Returns 404 if no active preference has been configured yet.
 *
 * Returns:
 *   200 { success: true, data: SearchPreferenceData }
 *   404 { success: false, error: "No active SearchPreference found..." }
 *   500 { success: false, error: string }
 */
export async function GET() {
  try {
    const pref = await prisma.searchPreference.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!pref) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active SearchPreference found. POST to /api/settings to create one.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serializePref(pref),
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// ── POST Handler ──────────────────────────────────────────────

/**
 * POST /api/settings
 *
 * Creates or updates the active SearchPreference.
 *
 * Behaviour:
 *   - If an active preference already exists → update it with provided fields.
 *   - If no active preference exists → create one using PREF_DEFAULTS merged
 *     with the provided fields.
 *
 * Body: Partial<SearchPreferenceData> — any subset of fields to update.
 *
 * Returns:
 *   200 { success: true, message: string, data: SearchPreferenceData }
 *   500 { success: false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req
      .json()
      .catch(() => ({}))) as Partial<SearchPreferenceData>;

    // ── Find existing active preference ───────────────────
    const existing = await prisma.searchPreference.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // ── Build the data object, sanitising scalar / JSON fields ──

    // Fields that map directly to DB columns (scalar or JSON)
    const scalarFields = pick(body, [
      "name",
      "salaryMinimum",
      "salaryCurrency",
      "minimumScoreToNotify",
      "maxNotificationsPerDay",
      "coverLetterLanguage",
      "resumeText",
      "isActive",
    ]);

    // JSON array fields — only include if the body supplies them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonFields: Record<string, any> = {};
    const arrayFieldKeys: (keyof SearchPreferenceData)[] = [
      "targetRoles",
      "searchKeywordsEn",
      "searchKeywordsRu",
      "requiredSkills",
      "niceToHaveSkills",
      "experience",
      "workFormat",
      "excludeKeywords",
      "redFlagKeywords",
      "aiProviderOrder",
    ];
    for (const key of arrayFieldKeys) {
      if (key in body) {
        jsonFields[key] = body[key];
      }
    }

    const updateData = { ...scalarFields, ...jsonFields };

    let result;

    if (existing) {
      // ── Update existing preference ─────────────────────
      result = await prisma.searchPreference.update({
        where: { id: existing.id },
        data: updateData,
      });

      console.log(`[Settings] Updated SearchPreference ${existing.id}`);
    } else {
      // ── Bootstrap a new preference with defaults ────────
      result = await prisma.searchPreference.create({
        data: {
          ...PREF_DEFAULTS,
          ...updateData,
        },
      });

      console.log(`[Settings] Created new SearchPreference ${result.id}`);
    }

    return NextResponse.json({
      success: true,
      message: existing
        ? "Search preferences updated successfully"
        : "Search preferences created with defaults",
      data: serializePref(result),
    });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
