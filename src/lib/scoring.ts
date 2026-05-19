// ============================================================
// Nanda AI Job Assistant — Rule-Based Vacancy Scorer
// ============================================================
// Calculates a deterministic 0–100 score for a vacancy using
// keyword matching rules. Used both as:
//   1. A pre-score before AI analysis (helps with ranking)
//   2. A complete fallback when all AI providers are unavailable
// ============================================================

import type { NormalizedVacancy, RuleScoreResult } from "@/types";

// ── Scoring Rule Pattern Groups ───────────────────────────────

/** Frontend / framework keywords that earn +20 when found in title */
const FRONTEND_TITLE_KEYWORDS: string[] = [
  "frontend",
  "front-end",
  "react",
  "next",
  "nextjs",
  "next.js",
  "typescript",
  "vue",
  "angular",
  "фронтенд",
];

/** Remote work indicators across Russian and English */
const REMOTE_KEYWORDS: string[] = [
  "remote",
  "удаленно",
  "удалённо",
  "дистанционно",
  "дистанционная",
  "remot",
  "work from home",
];

/** Junior / entry-level indicators in text */
const JUNIOR_TEXT_KEYWORDS: string[] = [
  "junior",
  "intern",
  "стажер",
  "стажёр",
  "intern",
  "no experience",
  "без опыта",
  "начинающий",
  "trainee",
];

/** HH experience IDs considered junior/no-experience */
const JUNIOR_EXPERIENCE_IDS: string[] = [
  "noExperience",
  "noexperience",
  "between1And3",
  "between1and3",
];

/** Tools / specializations aligned with Nanda's profile */
const TOOLS_KEYWORDS: string[] = [
  "figma",
  "ui/ux",
  "ui ux",
  "uiux",
  "wordpress",
  "chatbot",
  "elementor",
  "webflow",
  "чат-бот",
];

// ── Penalty Pattern Groups ────────────────────────────────────

/** Senior / leadership / 5+ year requirements */
const SENIOR_KEYWORDS: string[] = [
  "senior",
  "lead",
  "5+ years",
  "5 лет опыта",
  "5+ лет",
  "более 5 лет",
  "от 5 лет",
  "5 years experience",
];

/** Russian citizenship required */
const CITIZENSHIP_KEYWORDS: string[] = [
  "гражданство рф",
  "гражданин рф",
  "russian citizenship",
  "гражданство российской федерации",
];

/** Mandatory Russian C1 / C2 language level */
const RUSSIAN_MANDATORY_KEYWORDS: string[] = [
  "русский c1",
  "русский c2",
  "russian c1",
  "russian c2",
  "уровень русского c1",
  "уровень русского c2",
  "c1/c2 russian",
  "носитель языка",
];

/** Scam / fraud / unpaid / document-request patterns */
const SCAM_KEYWORDS: string[] = [
  "без оплаты",
  "unpaid",
  "оплата обучения",
  "залог",
  "deposit",
  "otp",
  "паспорт",
  "passport",
  "смс код",
];

/** Office-only keywords */
const OFFICE_ONLY_KEYWORDS: string[] = [
  "только офис",
  "office only",
  "в офисе",
  "без удаленки",
  "без возможности удаленной работы",
  "без возможности удалённой работы",
];

/** Relocation / hybrid mentions that soften office-only penalty */
const RELOCATION_KEYWORDS: string[] = [
  "relocation",
  "релокация",
  "переезд",
  "hybrid",
  "гибрид",
];

// ── Helper ────────────────────────────────────────────────────

/**
 * Returns true if the text contains any keyword from the list (case-insensitive).
 */
function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

// ── Scorer ────────────────────────────────────────────────────

/**
 * Calculates a rule-based score (0–100) for a vacancy using keyword heuristics.
 *
 * Positive contributions:
 *   +20  Title contains frontend / React / Next.js / TypeScript keywords
 *   +20  Remote work detected in schedule, workFormat, or description
 *   +15  Position is junior / intern / no-experience level
 *   +15  Description / title mentions Figma, UI/UX, WordPress, chatbot, Elementor
 *   +10  Salary is specified (from or to)
 *   +10  English language mentioned in description
 *
 * Penalty deductions:
 *   -30  Senior / lead / 5+ years requirement detected
 *   -40  Russian citizenship required
 *   -35  Russian C1 / C2 language level mandatory
 *   -50  Unpaid, payment from applicant, OTP, or passport request
 *   -25  Office-only without any relocation or hybrid mention
 *
 * Final score is clamped to the [0, 100] range.
 *
 * @param vacancy - Normalized vacancy to evaluate
 * @returns RuleScoreResult with clamped score, positive reasons, and penalties
 */
export function calculateRuleScore(vacancy: NormalizedVacancy): RuleScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const penalties: string[] = [];

  // ── Build search corpora ──────────────────────────────────

  const title = (vacancy.title ?? "").toLowerCase();

  const description = (vacancy.description ?? "").toLowerCase();

  const schedule = (vacancy.schedule ?? "").toLowerCase();

  const experience = (vacancy.experience ?? "");

  const workFormatStr = (vacancy.workFormat ?? [])
    .map((w) => w.name)
    .join(" ")
    .toLowerCase();

  const snippetText = [
    vacancy.snippet?.requirement ?? "",
    vacancy.snippet?.responsibility ?? "",
  ]
    .join(" ")
    .toLowerCase();

  // Full corpus used for most checks
  const fullText = `${title} ${description} ${snippetText}`;

  // ── POSITIVE RULES ────────────────────────────────────────

  // +20: Title matches core frontend tech stack
  if (matchesAny(title, FRONTEND_TITLE_KEYWORDS)) {
    score += 20;
    reasons.push("+20 Title matches frontend / React / Next.js / TypeScript");
  }

  // +20: Remote work available (schedule ID, workFormat name, or description mention)
  if (
    schedule.includes("remote") ||
    matchesAny(workFormatStr, REMOTE_KEYWORDS) ||
    matchesAny(description, REMOTE_KEYWORDS)
  ) {
    score += 20;
    reasons.push("+20 Remote work format detected");
  }

  // +15: Junior / intern / no-experience position
  // Checks both the HH experience ID and free-text in description
  if (
    JUNIOR_EXPERIENCE_IDS.some((id) =>
      experience.toLowerCase().includes(id.toLowerCase())
    ) ||
    matchesAny(fullText, JUNIOR_TEXT_KEYWORDS)
  ) {
    score += 15;
    reasons.push("+15 Junior / intern / entry-level position");
  }

  // +15: Mentions preferred tools aligned with Nanda's skill set
  if (matchesAny(fullText, TOOLS_KEYWORDS)) {
    score += 15;
    reasons.push("+15 Mentions preferred tools (Figma / UI-UX / WordPress / Chatbot / Elementor)");
  }

  // +10: Salary is provided (at least from or to)
  if (vacancy.salary && (vacancy.salary.from || vacancy.salary.to)) {
    score += 10;
    reasons.push("+10 Salary is specified");
  }

  // +10: English language explicitly mentioned
  if (
    description.includes("english") ||
    description.includes("английский") ||
    description.includes("английского")
  ) {
    score += 10;
    reasons.push("+10 English language mentioned in description");
  }

  // ── PENALTY RULES ─────────────────────────────────────────

  // -30: Senior / lead / 5+ years required
  if (matchesAny(fullText, SENIOR_KEYWORDS)) {
    score -= 30;
    penalties.push("-30 Requires senior level or 5+ years of experience");
  }

  // -40: Russian citizenship explicitly required
  if (matchesAny(fullText, CITIZENSHIP_KEYWORDS)) {
    score -= 40;
    penalties.push("-40 Requires Russian citizenship — Nanda is not eligible");
  }

  // -35: Russian language at C1 / C2 level mandatory
  if (matchesAny(fullText, RUSSIAN_MANDATORY_KEYWORDS)) {
    score -= 35;
    penalties.push("-35 Requires Russian C1/C2 language level — Nanda has basic Russian only");
  }

  // -50: Scam/fraud signals (unpaid, payment from applicant, OTP, passport)
  if (matchesAny(fullText, SCAM_KEYWORDS)) {
    score -= 50;
    penalties.push("-50 Scam / fraud indicators detected (unpaid / payment / OTP / passport)");
  }

  // -25: Office-only in Moscow without any relocation / hybrid option mentioned
  if (
    matchesAny(fullText, OFFICE_ONLY_KEYWORDS) &&
    !matchesAny(fullText, RELOCATION_KEYWORDS)
  ) {
    score -= 25;
    penalties.push("-25 Office-only position without relocation or hybrid option");
  }

  // Clamp to valid range [0, 100]
  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    reasons,
    penalties,
  };
}
