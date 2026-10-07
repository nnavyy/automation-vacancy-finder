// ============================================================
// Vacancy AI Assistant — Rule-Based Pre-Filter
// ============================================================
// Runs BEFORE AI analysis to disqualify obviously bad vacancies.
// Saves AI quota by rejecting scams, incompatible roles, and
// strict constraint conflicts early.
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

// ── Helper ────────────────────────────────────────────────────

/**
 * Case-insensitive substring search across a list of patterns.
 * Returns the first matched pattern string, or null if no match.
 */
function containsAny(text: string, patterns: string[]): string | null {
  const lower = text.toLowerCase();
  for (const pattern of patterns) {
    if (lower.includes(pattern.toLowerCase())) {
      return pattern;
    }
  }
  return null;
}

// ── Main Filter ───────────────────────────────────────────────

/**
 * Pre-filters a vacancy against hard disqualification rules before AI analysis.
 *
 * Returns `{ passes: false, reason }` for any definite disqualifier,
 * or `{ passes: true }` if the vacancy should proceed to AI scoring.
 *
 * @param vacancy - Normalized vacancy to evaluate
 * @param pref    - Active search preferences
 * @returns Filter result — { passes: true } or { passes: false, reason }
 */
export function passesBasicFilter(
  vacancy: NormalizedVacancy,
  pref: SearchPreferenceData
): { passes: boolean; reason?: string } {
  // Build a single lowercase search corpus from all text fields
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
  // Ensure we don't disqualify if it says "гражданство РФ не требуется"
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

  // All checks passed — vacancy may proceed to AI analysis
  return { passes: true };
}
