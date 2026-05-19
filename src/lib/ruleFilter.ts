// ============================================================
// Nanda AI Job Assistant — Rule-Based Pre-Filter
// ============================================================
// Runs BEFORE AI analysis to disqualify obviously bad vacancies.
// Saves AI quota by rejecting scams, overly-senior roles, and
// citizenship-restricted positions early.
// ============================================================

import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

// ── Constant Pattern Lists ────────────────────────────────────

/** Russian / English citizenship restriction phrases */
const CITIZENSHIP_PATTERNS: string[] = [
  "гражданство рф",
  "гражданин рф",
  "russian citizenship required",
  "гражданство российской федерации",
  "только граждане рф",
];

/** Unpaid / "free internship" indicators */
const UNPAID_PATTERNS: string[] = [
  "без оплаты",
  "бесплатная стажировка",
  "unpaid",
  "бесплатно",
  "без зарплаты",
];

/** Requests payment FROM the applicant (scam indicators) */
const PAYMENT_REQUEST_PATTERNS: string[] = [
  "оплата обучения",
  "внесите",
  "залог",
  "взнос",
  "предоплата",
  "оплатите",
  "стоимость обучения",
];

/** Requests sensitive documents or verification codes */
const OTP_PASSPORT_PATTERNS: string[] = [
  "паспорт",
  "passport copy",
  "otp",
  "смс код",
  "sms code",
  "скан паспорта",
  "верификационный код",
];

/**
 * HH experience IDs that indicate a senior-level role (6+ years).
 * Nanda is targeting junior / no-experience positions.
 */
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
 * Checks (in order):
 *  1. User-defined excludeKeywords (case-insensitive match in title or description)
 *  2. Experience level "more6" / "moreThan6" (senior 6+ years — not suitable)
 *  3. Russian citizenship requirement
 *  4. Unpaid / free internship
 *  5. Payment requested from applicant
 *  6. OTP, passport, or SMS code requests (scam indicators)
 *
 * @param vacancy - Normalized vacancy to evaluate
 * @param pref    - Active search preferences (provides excludeKeywords)
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
    if (combinedText.includes(keyword.toLowerCase())) {
      return {
        passes: false,
        reason: `Contains excluded keyword: "${keyword}"`,
      };
    }
  }

  // ── Rule 2: Senior 6+ years experience (HH experience ID) ─
  if (
    vacancy.experience &&
    SENIOR_EXPERIENCE_IDS.includes(vacancy.experience)
  ) {
    return {
      passes: false,
      reason: `Requires 6+ years of experience (HH ID: ${vacancy.experience})`,
    };
  }

  // ── Rule 3: Russian citizenship requirement ────────────────
  const citizenshipMatch = containsAny(combinedText, CITIZENSHIP_PATTERNS);
  if (citizenshipMatch) {
    return {
      passes: false,
      reason: `Requires Russian citizenship — detected: "${citizenshipMatch}"`,
    };
  }

  // ── Rule 4: Unpaid / free internship ──────────────────────
  const unpaidMatch = containsAny(combinedText, UNPAID_PATTERNS);
  if (unpaidMatch) {
    return {
      passes: false,
      reason: `Appears to be unpaid — detected: "${unpaidMatch}"`,
    };
  }

  // ── Rule 5: Payment requested from applicant (scam) ───────
  const paymentMatch = containsAny(combinedText, PAYMENT_REQUEST_PATTERNS);
  if (paymentMatch) {
    return {
      passes: false,
      reason: `Requests payment from applicant — detected: "${paymentMatch}"`,
    };
  }

  // ── Rule 6: OTP / passport / SMS code requests ────────────
  const otpMatch = containsAny(combinedText, OTP_PASSPORT_PATTERNS);
  if (otpMatch) {
    return {
      passes: false,
      reason: `Requests personal documents or OTP code — detected: "${otpMatch}"`,
    };
  }

  // All checks passed — vacancy may proceed to AI analysis
  return { passes: true };
}
