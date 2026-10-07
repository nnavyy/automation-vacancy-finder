// ============================================================
// Nanda AI Job Assistant — Search Preference Settings
// ============================================================
// GET  /api/settings  — retrieve the user's active SearchPreference
// POST /api/settings  — update (or bootstrap) the SearchPreference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { encrypt } from "@/lib/crypto";
import { recordPreferenceCatalogTerms } from "@/lib/catalog/dynamic";
import type { SearchPreferenceData } from "@/types";

// ── Default Values ────────────────────────────────────────────

const PREF_DEFAULTS = {
  name:                  "Default",
  targetRoles:           ["Frontend Developer", "Full Stack Developer", "Software Engineer"],
  searchKeywordsEn:      ["frontend developer", "full stack developer", "react developer", "next.js developer"],
  searchKeywordsRu:      ["фронтенд разработчик", "фулл стек разработчик", "веб разработчик", "react разработчик"],
  requiredSkills:        ["React", "TypeScript", "JavaScript", "Next.js"],
  niceToHaveSkills:      ["Tailwind CSS", "Node.js", "PostgreSQL", "REST API", "Git"],
  experience:            ["between1And3", "between3And6"],
  workFormat:            ["remote", "hybrid"],
  salaryMinimum:         null as number | null,
  salaryCurrency:        "RUR",
  excludeKeywords:       [],
  redFlagKeywords:       ["паспорт", "залог", "unpaid"],
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
  const hasHhToken = Boolean(pref.hhToken);
  // Clone and redact sensitive session cookies
  const clean = { ...pref };
  delete clean.hhToken;

  return {
    ...clean,
    hasHhToken,
    targetRoles:           Array.isArray(pref.targetRoles)           ? pref.targetRoles           : [],
    searchKeywordsEn:      Array.isArray(pref.searchKeywordsEn)      ? pref.searchKeywordsEn      : [],
    searchKeywordsRu:      Array.isArray(pref.searchKeywordsRu)      ? pref.searchKeywordsRu      : [],
    requiredSkills:        Array.isArray(pref.requiredSkills)        ? pref.requiredSkills        : [],
    niceToHaveSkills:      Array.isArray(pref.niceToHaveSkills)      ? pref.niceToHaveSkills      : [],
    experience:            Array.isArray(pref.experience)            ? pref.experience            : [],
    workFormat:            Array.isArray(pref.workFormat)            ? pref.workFormat            : [],
    excludeKeywords:       Array.isArray(pref.excludeKeywords)       ? pref.excludeKeywords       : [],
    redFlagKeywords:       Array.isArray(pref.redFlagKeywords)       ? pref.redFlagKeywords       : [],
    aiProviderOrder:       Array.isArray(pref.aiProviderOrder)       ? pref.aiProviderOrder       : ["groq", "gemini", "openrouter"],
  };
}

// ── GET ───────────────────────────────────────────────────────

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let pref = await prisma.searchPreference.findFirst({
      where:   { userId: user.id, isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    // Auto-recover if user has profiles but none marked active
    if (!pref) {
      pref = await prisma.searchPreference.findFirst({
        where:   { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });

      if (pref) {
        await prisma.searchPreference.update({
          where: { id: pref.id },
          data: { isActive: true },
        });
      }
    }

    // Auto-bootstrap default profile if account has none
    if (!pref) {
      pref = await prisma.searchPreference.create({
        data: {
          ...PREF_DEFAULTS,
          userId: user.id,
          name: "Default Profile",
          isActive: true,
        },
      });
    }

    // Live telemetry stats for the user
    const [totalVacancies, appliedCount, avgScoreResult] = await Promise.all([
      prisma.vacancy.count({ where: { userId: user.id } }),
      prisma.vacancy.count({ where: { userId: user.id, status: "applied" } }),
      prisma.vacancyAnalysis.aggregate({
        where: { vacancy: { userId: user.id } },
        _avg: { matchScore: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: serializePref(pref),
      stats: {
        totalVacancies,
        appliedCount,
        avgScore: Math.round(avgScoreResult._avg.matchScore ?? 0),
      },
    });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json({ success: false, error: "Failed to load settings" }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<SearchPreferenceData> & { id?: string };

    // Scalar fields
    const scalarFields = pick(body, [
      "name", "salaryMinimum", "salaryCurrency",
      "minimumScoreToNotify", "maxNotificationsPerDay",
      "coverLetterLanguage", "resumeText", "isActive", "portfolioUrl",
      "hhResumeId", "hhResumeTitle",
      "hhProfileName", "hhProfileAvatar", "hhTotalApplications",
      "hhSessionStatus", "hhLastVerifiedAt", "hhExpiresAt",
    ]);

    // Encrypt hhToken if a fresh token string was provided
    if (typeof body.hhToken === "string" && body.hhToken.trim().length > 0 && !body.hhToken.includes("***")) {
      scalarFields.hhToken = encrypt(body.hhToken.trim());
    }

    // JSON array fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsonFields: Record<string, any> = {};
    const arrayKeys: (keyof SearchPreferenceData)[] = [
      "targetRoles", "searchKeywordsEn", "searchKeywordsRu",
      "requiredSkills", "niceToHaveSkills", "experience",
      "workFormat", "excludeKeywords", "redFlagKeywords",
      "aiProviderOrder",
    ];
    for (const key of arrayKeys) {
      if (key in body && Array.isArray(body[key])) jsonFields[key] = body[key];
    }

    const safeData = { ...scalarFields, ...jsonFields };

    let existing = null;
    if (body.id) {
      existing = await prisma.searchPreference.findFirst({
        where: { id: body.id, userId: user.id },
      });
    }

    if (!existing) {
      existing = await prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
      });
    }

    if (existing) {
      const updated = await prisma.searchPreference.update({
        where: { id: existing.id },
        data:  { ...safeData, userId: user.id },
      });
      void recordPreferenceCatalogTerms(jsonFields);
      return NextResponse.json({ success: true, data: serializePref(updated) });
    }

    // No preference yet — create with defaults
    const created = await prisma.searchPreference.create({
      data: { ...PREF_DEFAULTS, ...safeData, userId: user.id, isActive: true },
    });
    void recordPreferenceCatalogTerms(jsonFields);
    return NextResponse.json({ success: true, data: serializePref(created) });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}

// ts recheck
