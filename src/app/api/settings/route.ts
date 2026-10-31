// ============================================================
// Nanda AI Job Assistant — Search Preference Settings
// ============================================================
// GET  /api/settings  — retrieve the user's active SearchPreference
// POST /api/settings  — update (or bootstrap) the SearchPreference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { encrypt } from "@/lib/crypto";
import type { SearchPreference } from "@prisma/client";
import { recordPreferenceCatalogTerms } from "@/lib/catalog/dynamic";
import type { SearchPreferenceData } from "@/types";

// ── Default Values (unconfigured until user sets their roles/keywords) ────

const PREF_DEFAULTS = {
  name:                  "Default",
  targetRoles:           [] as string[],
  searchKeywordsEn:      [] as string[],
  searchKeywordsRu:      [] as string[],
  requiredSkills:        [] as string[],
  niceToHaveSkills:      [] as string[],
  experience:            ["between1And3", "between3And6"],
  workFormat:            ["remote", "hybrid"],
  salaryMinimum:         null as number | null,
  salaryCurrency:        "RUR",
  excludeKeywords:       [] as string[],
  redFlagKeywords:       ["паспорт", "залог", "unpaid"],
  minimumScoreToNotify:  70,
  maxNotificationsPerDay: 20,
  aiProviderOrder:       ["groq", "gemini", "openrouter"],
  coverLetterLanguage:   "English",
  language:              "en",
  resumeText:            "",
  isActive:              true,
};

// ── Helpers ───────────────────────────────────────────────────

const ARRAY_KEYS = [
  "targetRoles", "searchKeywordsEn", "searchKeywordsRu", "requiredSkills", "niceToHaveSkills",
  "experience", "workFormat", "excludeKeywords", "redFlagKeywords",
] as const;
type SettingsBody = Partial<Omit<SearchPreferenceData, "salaryMinimum">> & { salaryMinimum?: number | null };

function isSettingsBody(value: unknown): value is SettingsBody {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if ("aiCustomConfig" in value || "aiProviderOrder" in value) return false;
  for (const [key, field] of Object.entries(value)) {
    if (ARRAY_KEYS.some((arrayKey) => arrayKey === key)) {
      if (!Array.isArray(field) || field.length > 100 || !field.every((item: unknown) => typeof item === "string" && item.length <= 300)) return false;
    } else if (["salaryMinimum", "minimumScoreToNotify", "maxNotificationsPerDay", "hhTotalApplications"].includes(key)) {
      if (field === null && ["salaryMinimum", "hhTotalApplications"].includes(key)) continue;
      if (typeof field !== "number" || !Number.isInteger(field) || field < 0 || field > 2_147_483_647) return false;
      if (key === "minimumScoreToNotify" && field > 100) return false;
      if (key === "maxNotificationsPerDay" && (field < 1 || field > 100)) return false;
    } else if (key === "isActive") {
      if (typeof field !== "boolean") return false;
    } else if (["hhLastVerifiedAt", "hhExpiresAt"].includes(key)) {
      if (field !== null && (typeof field !== "string" || !Number.isFinite(Date.parse(field)))) return false;
    } else if (["id", "name", "salaryCurrency", "coverLetterLanguage", "language", "resumeText", "portfolioUrl", "hhToken", "hhResumeId", "hhResumeTitle", "hhProfileName", "hhProfileAvatar", "hhSessionStatus"].includes(key)) {
      if (field === null && ["resumeText", "portfolioUrl", "hhToken", "hhResumeId", "hhResumeTitle", "hhProfileName", "hhProfileAvatar", "hhSessionStatus"].includes(key)) continue;
      if (typeof field !== "string" || field.length > (key === "resumeText" ? 50_000 : 4096)) return false;
      if (key === "id" && !field.trim()) return false;
      if (key === "language" && !["en", "ru"].includes(field)) return false;
    }
  }
  return true;
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<Pick<T, K>> {
  const result: Partial<Pick<T, K>> = {};
  for (const key of keys) if (key in obj) result[key] = obj[key];
  return result;
}

function serializePref(pref: SearchPreference) {
  return {
    ...pref,
    hhToken: undefined,
    aiProviderOrder: undefined,
    hasHhToken: Boolean(pref.hhToken),
    ...Object.fromEntries(ARRAY_KEYS.map((key) => [key, Array.isArray(pref[key]) ? pref[key] : []])),
  };
}

// ── GET ───────────────────────────────────────────────────────

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fast parallel batch query: preferences, telegram link, and basic counts
    const [prefRecord, tgLink, totalVacancies, appliedCount, scoreAgg] = await Promise.all([
      prisma.searchPreference.findFirst({
        where:   { userId: user.id, isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.telegramLink.findFirst({
        where:   { userId: user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacancy.count({ where: { userId: user.id } }),
      prisma.vacancy.count({ where: { userId: user.id, status: { in: ["applied_manual", "applied_hh", "applied_auto"] } } }),
      prisma.vacancyAnalysis.aggregate({ where: { vacancy: { userId: user.id } }, _avg: { matchScore: true } }),
    ]);

    let pref = prefRecord;

    // Auto-recover or bootstrap only if no active profile exists
    if (!pref) {
      pref = await prisma.searchPreference.findFirst({
        where:   { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });

      if (pref) {
        pref = await prisma.searchPreference.update({
          where: { id: pref.id },
          data: { isActive: true },
        });
      } else {
        pref = await prisma.searchPreference.create({
          data: {
            ...PREF_DEFAULTS,
            userId: user.id,
            name: "Default",
            isActive: true,
          },
        });
      }
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "Wongkiisbot";

    let activeTgLink = tgLink;
    if (!activeTgLink) {
      const token = crypto.randomBytes(24).toString("hex").toUpperCase();
      activeTgLink = await prisma.telegramLink.create({
        data: {
          userId: user.id,
          token,
          isActive: true,
          language: pref.language || "en",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: serializePref(pref),
      systemCapabilities: {
        hasOfficialHhOAuth: Boolean(process.env.HH_CLIENT_ID && process.env.HH_CLIENT_SECRET),
        hasTelegramBot: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        hasEmailService: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER),
      },
      telegramLink: {
        linked: !!activeTgLink.telegramChatId,
        token: activeTgLink.token,
        chatId: activeTgLink.telegramChatId,
        username: activeTgLink.telegramUsername,
        linkedAt: activeTgLink.linkedAt,
        botUsername,
        deepLink: activeTgLink.token ? `https://t.me/${botUsername}?start=${activeTgLink.token}` : null,
      },
      stats: {
        totalVacancies,
        appliedCount,
        avgScore: Math.round(scoreAgg._avg.matchScore ?? 0),
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
    const body: unknown = await req.json().catch(() => null);
    if (!isSettingsBody(body)) {
      return NextResponse.json({ success: false, error: "Invalid settings. AI configuration is managed by the service." }, { status: 400 });
    }

    // Scalar fields
    const scalarFields = { ...pick(body, [
      "name", "salaryMinimum", "salaryCurrency",
      "minimumScoreToNotify", "maxNotificationsPerDay",
      "coverLetterLanguage", "language", "resumeText", "isActive", "portfolioUrl",
      "hhResumeId", "hhResumeTitle",
      "hhProfileName", "hhProfileAvatar", "hhTotalApplications",
      "hhSessionStatus", "hhLastVerifiedAt", "hhExpiresAt",
    ]), hhToken: undefined as string | null | undefined };

    if (typeof scalarFields.name === "string") {
      scalarFields.name = scalarFields.name.trim() || "Default";
    }

    if (typeof scalarFields.language !== "string" || !scalarFields.language) {
      delete scalarFields.language;
    }

    // Encrypt and persist hhToken if provided
    if (typeof body.hhToken === "string") {
      const trimmed = body.hhToken.trim();
      if (trimmed.length > 0 && !trimmed.includes("***")) {
        scalarFields.hhToken = encrypt(trimmed);
      } else if (trimmed === "" && body.hhSessionStatus === "disconnected") {
        scalarFields.hhToken = null;
      }
    }

    const jsonFields: Partial<Record<typeof ARRAY_KEYS[number], string[]>> = {};
    for (const key of ARRAY_KEYS) if (body[key] !== undefined) jsonFields[key] = body[key];

    let existing = null;
    if (body.id) {
      existing = await prisma.searchPreference.findFirst({
        where: { id: body.id, userId: user.id },
      });
      if (!existing) return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    if (!existing) {
      existing = await prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
      });
    }

    const safeData = { ...scalarFields, ...jsonFields };

    if (existing) {
      const updated = await prisma.searchPreference.update({
        where: { id: existing.id },
        data:  { ...safeData, userId: user.id },
      });
      if (scalarFields.language || scalarFields.coverLetterLanguage) {
        const langToSync = scalarFields.language || (scalarFields.coverLetterLanguage === "Russian" ? "ru" : "en");
        await prisma.telegramLink.updateMany({
          where: { userId: user.id },
          data: { language: langToSync },
        });
      }
      void recordPreferenceCatalogTerms(jsonFields);
      return NextResponse.json({ success: true, data: serializePref(updated) });
    }

    // No preference yet — create with defaults
    const created = await prisma.searchPreference.create({
      data: { ...PREF_DEFAULTS, ...safeData, userId: user.id, isActive: true },
    });
    if (scalarFields.language || scalarFields.coverLetterLanguage) {
      const langToSync = scalarFields.language || (scalarFields.coverLetterLanguage === "Russian" ? "ru" : "en");
      await prisma.telegramLink.updateMany({
        where: { userId: user.id },
        data: { language: langToSync },
      });
    }
    void recordPreferenceCatalogTerms(jsonFields);
    return NextResponse.json({ success: true, data: serializePref(created) });
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
  }
}
