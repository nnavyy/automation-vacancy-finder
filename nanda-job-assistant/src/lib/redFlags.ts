// ============================================================
// Nanda AI Job Assistant — Red Flag Detector
// ============================================================
// Standalone utility that scans vacancy text for suspicious /
// disqualifying patterns and returns structured RedFlag objects.
// Can be used independently or as a post-process after AI analysis.
// ============================================================

import type { RedFlag } from "@/types";

// ── Pattern Definition ────────────────────────────────────────

interface RedFlagPattern {
  /** Trigger phrases to search for in the text (any one match fires the flag) */
  patterns: string[];
  /** Human-readable explanation surfaced in the UI / Telegram message */
  reason: string;
  /** How serious this flag is */
  severity: "low" | "medium" | "high";
}

/**
 * Ordered list of red flag definitions.
 * Each group contains synonymous patterns that share one reason string.
 * The first matching pattern within a group is used as trigger_text.
 */
const RED_FLAG_DEFINITIONS: RedFlagPattern[] = [
  // ── HIGH SEVERITY ──────────────────────────────────────────

  {
    // No payment for work — financial exploitation
    patterns: ["без оплаты", "unpaid", "без зарплаты", "бесплатная работа"],
    reason: "Unpaid position — potential exploitation or volunteer-only role",
    severity: "high",
  },
  {
    // Applicant is charged for training — classic scam
    patterns: [
      "оплата обучения",
      "training fee",
      "платное обучение",
      "стоимость обучения",
      "обучение за свой счёт",
    ],
    reason: "Applicant is asked to pay for training — almost certainly a scam",
    severity: "high",
  },
  {
    // Deposit / upfront money from applicant
    patterns: [
      "залог",
      "deposit",
      "внесите залог",
      "возвратный взнос",
      "страховой взнос",
    ],
    reason: "Deposit or upfront payment is requested from the applicant — scam indicator",
    severity: "high",
  },
  {
    // Identity document / verification code requests
    patterns: [
      "паспорт",
      "passport",
      "скан паспорта",
      "passport copy",
      "otp",
      "смс код",
      "sms code",
      "верификационный код",
    ],
    reason:
      "Requests passport scan, OTP, or SMS verification codes — high identity fraud risk",
    severity: "high",
  },
  {
    // Russian citizenship barrier — Nanda is Indonesian
    patterns: [
      "гражданство рф",
      "гражданин рф",
      "russian citizenship required",
      "гражданство российской федерации",
      "только граждане рф",
    ],
    reason:
      "Russian citizenship is required — Nanda is an Indonesian national and is not eligible",
    severity: "high",
  },
  {
    // Advanced Russian language — Nanda has only basic Russian
    patterns: [
      "русский c1",
      "русский c2",
      "russian c1",
      "russian c2",
      "уровень c1",
      "уровень c2",
      "c1/c2 russian",
      "носитель языка",
      "native russian",
    ],
    reason:
      "Requires Russian at C1/C2 (near-native) level — Nanda has basic Russian only",
    severity: "high",
  },

  // ── MEDIUM SEVERITY ────────────────────────────────────────

  {
    // Recruitment exclusively through Telegram — non-standard / suspicious channel
    patterns: [
      "только telegram",
      "telegram only",
      "пишите в telegram",
      "связь только в telegram",
      "только в tg",
    ],
    reason:
      "Recruits exclusively via Telegram — non-standard channel, potentially suspicious",
    severity: "medium",
  },
  {
    // Over-qualification / experience mismatch
    patterns: [
      "5 лет опыта",
      "5+ years",
      "senior",
      "от 5 лет",
      "более 5 лет",
      "5+ лет опыта",
      "5 years experience",
    ],
    reason:
      "Requires 5+ years experience or senior level — Nanda is a junior/fresh-grad candidate",
    severity: "medium",
  },
  {
    // Office-only conflicts with Nanda's remote preference
    patterns: [
      "только офис",
      "office only",
      "без удаленки",
      "без возможности удалённой работы",
      "без возможности удаленной работы",
    ],
    reason:
      "Office-only position — conflicts with Nanda's remote work preference",
    severity: "medium",
  },
];

// ── Main Detector ─────────────────────────────────────────────

/**
 * Scans a combined text string (title + description) for known red flag patterns.
 *
 * Each RedFlagPattern group fires at most once — if multiple synonymous patterns
 * match, only the first hit is recorded to avoid duplicate reasons.
 *
 * Additionally, a low-severity heuristic flag is added when the vacancy has
 * no salary mention AND a very short description (vague posting).
 *
 * @param text - Combined vacancy text (title + full description)
 * @returns Array of RedFlag objects (may be empty if no flags found)
 */
export function detectRedFlags(text: string): RedFlag[] {
  const lowerText = text.toLowerCase();
  const flags: RedFlag[] = [];

  // Track which reason strings have already fired to prevent duplicates
  const firedReasons = new Set<string>();

  for (const def of RED_FLAG_DEFINITIONS) {
    // Skip if this reason group already fired
    if (firedReasons.has(def.reason)) continue;

    for (const pattern of def.patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        // Record only the first matching pattern as trigger_text
        flags.push({
          trigger_text: pattern,
          reason: def.reason,
          severity: def.severity,
        });
        firedReasons.add(def.reason);
        break; // Move to next pattern group after first match
      }
    }
  }

  // ── Heuristic: No salary + very short description ──────────
  // Low-severity flag for vague or low-effort postings
  const hasSalaryMention =
    lowerText.includes("salary") ||
    lowerText.includes("зарплата") ||
    lowerText.includes("оклад") ||
    lowerText.includes("руб") ||
    lowerText.includes("rub") ||
    lowerText.includes("₽") ||
    lowerText.includes("usd") ||
    lowerText.includes("$") ||
    lowerText.includes("€");

  const isVagueDescription = text.trim().length < 250;

  if (!hasSalaryMention && isVagueDescription) {
    flags.push({
      trigger_text: "(no salary info + very short description)",
      reason:
        "No salary information and description is very short — may indicate a vague or low-effort job posting",
      severity: "low",
    });
  }

  return flags;
}
