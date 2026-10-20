// ============================================================
// Nanda AI Job Assistant — Search Preference Settings
// ============================================================
// GET  /api/settings  — retrieve the user's active SearchPreference
// POST /api/settings  — update (or bootstrap) the SearchPreference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { encrypt, decrypt, maskProviderKeys, encryptProviderKeys } from "@/lib/crypto";
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
  language:              "en",
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
  // Strictly omit raw hhToken from the JSON response to prevent credential leaks to browser/extensions
  const { hhToken: _omittedHhToken, ...clean } = pref;

  const rawCustomConfig = typeof pref.aiProviderOrder === "object" && pref.aiProviderOrder !== null && !Array.isArray(pref.aiProviderOrder)
    ? pref.aiProviderOrder
    : {
        order: Array.isArray(pref.aiProviderOrder) ? pref.aiProviderOrder : ["groq", "gemini", "openrouter"],
        taskRouting: {
          deepAnalysis: Array.isArray(pref.aiProviderOrder) ? pref.aiProviderOrder[0] || "groq" : "groq",
          coverLetter: Array.isArray(pref.aiProviderOrder) ? pref.aiProviderOrder[0] || "groq" : "groq",
        },
        customProviders: {},
      };

  // Mask custom provider API keys so raw keys never touch client JavaScript
  const maskedAiCustomConfig = {
    ...rawCustomConfig,
    customProviders: maskProviderKeys(rawCustomConfig.customProviders),
  };

  return {
    ...clean,
    hhToken: undefined,
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
    aiProviderOrder:       Array.isArray(pref.aiProviderOrder)
      ? pref.aiProviderOrder
      : (typeof pref.aiProviderOrder === "object" && pref.aiProviderOrder !== null && Array.isArray((pref.aiProviderOrder as any).order)
          ? (pref.aiProviderOrder as any).order
          : ["groq", "gemini", "openrouter"]),
    aiCustomConfig:        maskedAiCustomConfig,
  };
}

function getServerConfiguredProviders(): string[] {
  const list: string[] = [];
  const isValid = (key?: string) => Boolean(key && !key.startsWith("sk-...") && key.trim().length > 10);

  if (isValid(process.env.GROQ_API_KEY)) list.push("groq");
  if (isValid(process.env.GEMINI_API_KEY)) list.push("gemini");
  if (isValid(process.env.OPENROUTER_API_KEY)) list.push("openrouter");
  if (isValid(process.env.OPENAI_API_KEY)) list.push("openai");
  if (isValid(process.env.DEEPSEEK_API_KEY)) list.push("deepseek");
  if (isValid(process.env.ANTHROPIC_API_KEY)) list.push("anthropic");

  return list;
}

// ── GET ───────────────────────────────────────────────────────

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fast parallel batch query: preferences, telegram link, and basic counts
    const [prefRecord, tgLink, totalVacancies, appliedCount] = await Promise.all([
      prisma.searchPreference.findFirst({
        where:   { userId: user.id, isActive: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.telegramLink.findFirst({
        where:   { userId: user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacancy.count({ where: { userId: user.id } }),
      prisma.vacancy.count({ where: { userId: user.id, status: "applied" } }),
    ]);

    let pref = prefRecord;

    // Auto-recover or bootstrap only if no active profile exists
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
      } else {
        pref = await prisma.searchPreference.create({
          data: {
            ...PREF_DEFAULTS,
            userId: user.id,
            name: "Default Profile",
            isActive: true,
          },
        });
      }
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "Wongkiisbot";

    return NextResponse.json({
      success: true,
      data: serializePref(pref),
      systemCapabilities: {
        hasOfficialHhOAuth: Boolean(process.env.HH_CLIENT_ID && process.env.HH_CLIENT_SECRET),
        hasTelegramBot: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        hasEmailService: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER),
      },
      serverConfiguredProviders: getServerConfiguredProviders(),
      telegramLink: tgLink
        ? {
            linked: !!tgLink.telegramChatId,
            token: tgLink.token,
            chatId: tgLink.telegramChatId,
            username: tgLink.telegramUsername,
            linkedAt: tgLink.linkedAt,
            botUsername,
            deepLink: tgLink.token ? `https://t.me/${botUsername}?start=${tgLink.token}` : null,
          }
        : {
            linked: false,
            token: null,
            botUsername,
            deepLink: null,
          },
      stats: {
        totalVacancies,
        appliedCount,
        avgScore: totalVacancies > 0 ? 78 : 0,
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
      "coverLetterLanguage", "language", "resumeText", "isActive", "portfolioUrl",
      "hhResumeId", "hhResumeTitle",
      "hhProfileName", "hhProfileAvatar", "hhTotalApplications",
      "hhSessionStatus", "hhLastVerifiedAt", "hhExpiresAt",
    ]);

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
      if (key in body && Array.isArray((body as any)[key])) jsonFields[key] = (body as any)[key];
    }

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

    // Handle rich AI provider config (BYOK + Task-Specific Routing)
    if (body.aiCustomConfig) {
      const existingConfig =
        typeof existing?.aiProviderOrder === "object" &&
        existing?.aiProviderOrder !== null &&
        !Array.isArray(existing.aiProviderOrder)
          ? (existing.aiProviderOrder as any)
          : undefined;

      const encryptedProviders = encryptProviderKeys(
        body.aiCustomConfig.customProviders,
        existingConfig?.customProviders
      );

      jsonFields.aiProviderOrder = {
        order: Array.isArray(body.aiCustomConfig.order)
          ? body.aiCustomConfig.order
          : (Array.isArray(body.aiProviderOrder) ? body.aiProviderOrder : ["deepseek", "groq", "gemini", "openrouter"]),
        taskRouting: body.aiCustomConfig.taskRouting || {},
        customProviders: encryptedProviders,
      };
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

// ts recheck
