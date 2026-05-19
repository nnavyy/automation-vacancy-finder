// ============================================================
// Nanda AI Job Assistant — Search Preference Settings
// ============================================================
// GET  /api/settings  — retrieve the user's active SearchPreference
// POST /api/settings  — update (or bootstrap) the SearchPreference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import type { SearchPreferenceData } from "@/types";

// ── Default Values ────────────────────────────────────────────

const PREF_DEFAULTS = {
  name:                  "Default",
  targetRoles:           ["Frontend Developer"],
  searchKeywordsEn:      ["frontend developer"],
  searchKeywordsRu:      ["фронтенд разработчик"],
  requiredSkills:        ["React", "JavaScript"],
  niceToHaveSkills:      [],
  experience:            ["noExperience"],
  workFormat:            ["remote"],
  salaryMinimum:         null as number | null,
  salaryCurrency:        "RUR",
  excludeKeywords:       [],
  redFlagKeywords:       ["паспорт", "залог"],
  minimumScoreToNotify:  70,
  maxNotificationsPerDay: 20,
  aiProviderOrder:       ["groq", "gemini", "openrouter"],
  coverLetterLanguage:   "English",
  resumeText:            "",
  isActive:              true,
};

// ── Helpers ───────────────────────────────────────────────────

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
  const result: Partial<T> = {};
  for (const k of keys) {
    if (k in obj) result[k] = obj[k];
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializePref(pref: any) {
  return {
    ...pref,
    targetRoles:           Array.isArray(pref.targetRoles)           ? pref.targetRoles           : [],
    searchKeywordsEn:      Array.isArray(pref.searchKeywordsEn)      ? pref.searchKeywordsEn      : [],
    searchKeywordsRu:      Array.isArray(pref.searchKeywordsRu)      ? pref.searchKeywordsRu      : [],
    requiredSkills:        Array.isArray(pref.requiredSkills)        ? pref.requiredSkills        : [],
    niceToHaveSkills:      Array.isArray(pref.niceToHaveSkills)      ? pref.niceToHaveSkills      : [],
    experience:            Array.isArray(pref.experience)            ? pref.experience            : [],
    workFormat:            Array.isArray(pref.workFormat)            ? pref.workFormat            : [],
    excludeKeywords:       Array.isArray(pref.excludeKeywords)       ? pref.excludeKeywords       : [],
    redFlagKeywords:       Array.isArray(pref.redFlagKeywords)       ? pref.redFlagKeywords       : [],
    aiProviderOrder:       Array.isArray(pref.aiProviderOrder)       ? pref.aiProviderOrder       : [],
  };
}

// ── GET ───────────────────────────────────────────────────────

export async function GET() {
  const user = await requireUser();
  try {
    const pref = await prisma.searchPreference.findFirst({
      where:   { userId: user.id, isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!pref) {
      return NextResponse.json({ success: false, error: "No settings found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializePref(pref) });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireUser();
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<SearchPreferenceData>;

    // Scalar fields
    const scalarFields = pick(body, [
      "name", "salaryMinimum", "salaryCurrency",
      "minimumScoreToNotify", "maxNotificationsPerDay",
      "coverLetterLanguage", "resumeText", "isActive",
    ]);

    // JSON array fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonFields: Record<string, any> = {};
    const arrayKeys: (keyof SearchPreferenceData)[] = [
      "targetRoles", "searchKeywordsEn", "searchKeywordsRu",
      "requiredSkills", "niceToHaveSkills", "experience",
      "workFormat", "excludeKeywords", "redFlagKeywords", "aiProviderOrder",
    ];
    for (const key of arrayKeys) {
      if (key in body) jsonFields[key] = body[key];
    }

    const safeData = { ...scalarFields, ...jsonFields };

    const existing = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (existing) {
      const updated = await prisma.searchPreference.update({
        where: { id: existing.id },
        data:  { ...safeData, userId: user.id },
      });
      return NextResponse.json({ success: true, data: serializePref(updated) });
    }

    // No preference yet — create with defaults
    const created = await prisma.searchPreference.create({
      data: { ...PREF_DEFAULTS, ...safeData, userId: user.id, isActive: true },
    });
    return NextResponse.json({ success: true, data: serializePref(created) });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
