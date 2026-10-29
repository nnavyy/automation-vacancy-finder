// ============================================================
// Vacancy AI Assistant — Rule-Based Pre-Filter & Profile Matcher
// ============================================================
// Runs BEFORE AI analysis to disqualify obviously bad vacancies,
// and builds Prisma profile-relevance filters so each profile
// only displays related roles (including adjacent domains like
// Web Design, UI/UX, and Vibe Coding for Full Stack profiles).
// ============================================================

import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

// ── Constant Pattern Lists ────────────────────────────────────

/** Russian / English citizenship mandatory restriction phrases */
const CITIZENSHIP_MANDATORY_PATTERNS: string[] = [
  "только граждане рф",
  "гражданство рф обязательно",
  "строго граждане рф",
  "требуется гражданство рф",
  "наличие гражданства рф обязательно",
];

/** Unpaid / "free work" indicators (contextual to avoid benefit false positives) */
const UNPAID_PATTERNS: string[] = [
  "работа без оплаты",
  "неоплачиваемая стажировка",
  "неоплачиваемый",
  "unpaid internship",
  "без выплаты заработной платы",
  "без зарплаты",
];

/** Requests payment FROM the applicant (scam indicators) */
const PAYMENT_REQUEST_PATTERNS: string[] = [
  "оплата обучения кандидатом",
  "взнос за трудоустройство",
  "страховой залог",
  "предоплата за материалы",
  "купите курс",
];

/** Requests sensitive documents or verification codes (scam indicators) */
const OTP_PASSPORT_PATTERNS: string[] = [
  "скан паспорта",
  "фото паспорта",
  "пришлите паспорт",
  "паспортные данные для допуска",
  "код из смс",
  "смс-код",
  "сообщите код подтверждения",
  "пароль из смс",
];

/** HH experience IDs that indicate a senior-level role (6+ years) */
const SENIOR_EXPERIENCE_IDS: string[] = ["more6", "moreThan6"];

/** Irrelevant non-development / non-target roles that HH.ru fuzzy search often returns */
export const IRRELEVANT_ROLE_PATTERNS: string[] = [
  "media buyer",
  "медиабайер",
  "медиа байер",
  "арбитражник",
  "трафик-менеджер",
  "traffic manager",
  "закупщик рекламы",
  "техник",
  "техническ специалист",
  "технической поддержки",
  "техническая поддержка",
  "специалист техподдержки",
  "инженер техподдержки",
  "дежурный инженер",
  "сервисный инженер",
  "инженер по ремонту",
  "инженер связи",
  "системный администратор",
  "сисадмин",
  "эникей",
  "эникейщик",
  "монтажник",
  "helpdesk",
  "service desk",
  "call-центр",
  "колл-центр",
  "коллцентр",
  "оператор call",
  "оператор колл",
  "оператор на телефон",
  "оператор чата",
  "оператор пк",
  "оператор базы",
  "оператор ввода",
  "диспетчер",
  "менеджер по продажам",
  "менеджер по работе с клиентами",
  "менеджер по входящим",
  "клиентский менеджер",
  "специалист по продажам",
  "продавец",
  "кассир",
  "консультант банка",
  "геймер",
  "игрок в онлайн",
  "бустер",
  "водитель",
  "курьер",
  "кладовщик",
  "комплектовщик",
  "упаковщик",
  "уборщик",
  "повар",
  "охранник",
  "риелтор",
  "копирайтер",
  "контент-менеджер",
  "модератор",
  "smm",
  "таргетолог",
  "телемаркетолог",
  "бухгалтер",
];

// ── Helper ────────────────────────────────────────────────────

function containsAny(text: string, patterns: string[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }
  return null;
}

/**
 * Expands a user's active profile into a list of related role/title tokens.
 * For Full Stack / Frontend / Web profiles, automatically includes adjacent
 * creative & AI-assisted roles (Vibe Coding, No-Code/Low-Code, Web Design, UI/UX).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProfileRelatedKeywords(pref: any): string[] {
  if (!pref) return [];

  const asStringArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((x): x is string => typeof x === "string") : [];

  const base = [
    ...asStringArray(pref.targetRoles),
    ...asStringArray(pref.searchKeywordsEn),
    ...asStringArray(pref.searchKeywordsRu),
    ...asStringArray(pref.requiredSkills),
    ...asStringArray(pref.niceToHaveSkills),
  ]
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 2);

  const joined = base.join(" ");
  const isWebOrEngineering =
    /full[\s-]?stack|frontend|front[\s-]?end|backend|back[\s-]?end|react|next|typescript|javascript|node|web|software|ai|сайт|фронтенд|фулстек|бэкенд|разработчик|программист/i.test(
      joined,
    );

  const expanded = isWebOrEngineering
    ? [
        ...base,
        // Core Full Stack / Web Engineering
        "fullstack",
        "full stack",
        "full-stack",
        "frontend",
        "front-end",
        "backend",
        "back-end",
        "react",
        "next.js",
        "nextjs",
        "typescript",
        "javascript",
        "node.js",
        "nodejs",
        "vue",
        "python",
        "web developer",
        "software engineer",
        "разработчик",
        "программист",
        "фронтенд",
        "фулстек",
        // Adjacent: Vibe Coding / AI Coding / No-Code & Low-Code
        "vibe",
        "ai engineer",
        "ai developer",
        "llm",
        "prompt",
        "cursor",
        "no-code",
        "nocode",
        "low-code",
        "webflow",
        "framer",
        "tilda",
        "тильда",
        "bubble",
        // Adjacent: Website Design & UI/UX
        "web design",
        "website design",
        "ui/ux",
        "ux/ui",
        "product designer",
        "figma",
        "веб-дизайн",
        "дизайнер",
        "верстальщик",
        "лендинг",
      ]
    : base;

  return Array.from(new Set(expanded)).slice(0, 45);
}

/**
 * Builds a Prisma `VacancyWhereInput` that scopes queries to genuine HH vacancies
 * related to the user's active profile (including adjacent roles like Vibe Coding & Web Design)
 * while excluding irrelevant roles (e.g. Media Buyer, Sales, Call Center).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildProfileVacancyWhere(userId: string, pref?: any): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    userId,
    NOT: { hhId: { startsWith: "manual-" } },
    url: { startsWith: "http" },
  };

  if (!pref) return where;

  const asStringArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((x): x is string => typeof x === "string") : [];

  const userExcludes = asStringArray(pref.excludeKeywords)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const userWantsSupportOrSales = asStringArray(pref.targetRoles).some((role) =>
    /поддержк|support|helpdesk|продаж|sales|оператор|media buyer|медиабайер|таргетолог|smm/i.test(
      role,
    ),
  );

  const blockedTitleTerms = [
    ...userExcludes,
    ...(userWantsSupportOrSales ? [] : IRRELEVANT_ROLE_PATTERNS),
  ].slice(0, 60);

  const relatedTerms = buildProfileRelatedKeywords(pref);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const andConditions: Record<string, any>[] = [];

  if (blockedTitleTerms.length > 0) {
    andConditions.push({
      NOT: {
        OR: blockedTitleTerms.map((term) => ({
          title: { contains: term, mode: "insensitive" },
        })),
      },
    });
  }

  if (relatedTerms.length > 0) {
    andConditions.push({
      OR: [
        ...relatedTerms.map((term) => ({
          title: { contains: term, mode: "insensitive" },
        })),
        ...relatedTerms.slice(0, 20).map((term) => ({
          sourceKeyword: { contains: term, mode: "insensitive" },
        })),
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  return where;
}

// ── Main Filter ───────────────────────────────────────────────

export function passesBasicFilter(
  vacancy: NormalizedVacancy,
  pref: SearchPreferenceData,
): { passes: boolean; reason?: string } {
  const combinedText = [
    vacancy.title ?? "",
    vacancy.description ?? "",
    vacancy.snippet?.requirement ?? "",
    vacancy.snippet?.responsibility ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // ── Rule 1: User-defined exclude keywords ─────────────────
  for (const keyword of pref.excludeKeywords) {
    const k = keyword.trim().toLowerCase();
    if (k && combinedText.includes(k)) {
      return {
        passes: false,
        reason: `Contains excluded keyword: "${keyword}"`,
      };
    }
  }

  // ── Rule 2: User-defined red flag keywords ────────────────
  for (const keyword of pref.redFlagKeywords) {
    const k = keyword.trim().toLowerCase();
    if (k && combinedText.includes(k)) {
      return {
        passes: false,
        reason: `Contains user red-flag keyword: "${keyword}"`,
      };
    }
  }

  // ── Rule 3: Senior 6+ years experience (only if user is not senior) ─
  const userIsSenior = pref.experience?.some((e) => e.includes("6+") || e.includes("more6"));
  if (
    !userIsSenior &&
    vacancy.experience &&
    SENIOR_EXPERIENCE_IDS.includes(vacancy.experience)
  ) {
    return {
      passes: false,
      reason: `Requires 6+ years of senior experience (${vacancy.experience})`,
    };
  }

  // ── Rule 4: Russian citizenship mandatory requirement ─────
  if (
    !combinedText.includes("не требуется") &&
    !combinedText.includes("не имеет значения")
  ) {
    const citizenshipMatch = containsAny(combinedText, CITIZENSHIP_MANDATORY_PATTERNS);
    if (citizenshipMatch) {
      return {
        passes: false,
        reason: `Requires mandatory Russian citizenship — detected: "${citizenshipMatch}"`,
      };
    }
  }

  // ── Rule 5: Unpaid / unpaid internship ────────────────────
  const unpaidMatch = containsAny(combinedText, UNPAID_PATTERNS);
  if (unpaidMatch) {
    return {
      passes: false,
      reason: `Appears to be unpaid role — detected: "${unpaidMatch}"`,
    };
  }

  // ── Rule 6: Payment requested from applicant (scam) ───────
  const paymentMatch = containsAny(combinedText, PAYMENT_REQUEST_PATTERNS);
  if (paymentMatch) {
    return {
      passes: false,
      reason: `Requests financial payment from applicant — detected: "${paymentMatch}"`,
    };
  }

  // ── Rule 7: OTP / sensitive document requests (scam) ──────
  const otpMatch = containsAny(combinedText, OTP_PASSPORT_PATTERNS);
  if (otpMatch) {
    return {
      passes: false,
      reason: `Requests sensitive personal documents or OTP code — detected: "${otpMatch}"`,
    };
  }

  // ── Rule 8: Disqualify irrelevant non-target / support / sales / media buyer roles ──
  const titleLower = (vacancy.title ?? "").toLowerCase();
  const userWantsSupportOrSales = pref.targetRoles?.some((role) => {
    const r = role.toLowerCase();
    return (
      r.includes("поддержк") ||
      r.includes("support") ||
      r.includes("helpdesk") ||
      r.includes("продаж") ||
      r.includes("sales") ||
      r.includes("оператор") ||
      r.includes("media buyer") ||
      r.includes("медиабайер")
    );
  });

  if (!userWantsSupportOrSales) {
    const irrelevantMatch = containsAny(titleLower, IRRELEVANT_ROLE_PATTERNS);
    if (irrelevantMatch) {
      return {
        passes: false,
        reason: `Title indicates non-target support/sales/operator role — detected: "${irrelevantMatch}"`,
      };
    }
  }

  return { passes: true };
}
