// ============================================================
// Vacancy AI Assistant — Rule-Based Vacancy Scorer
// ============================================================
// Calculates a deterministic 0–100 score for a vacancy using
// dynamic candidate preferences & keyword heuristics.
// Used both as:
//   1. A pre-score before AI analysis (helps with ranking)
//   2. A complete fallback when all AI providers are unavailable
// ============================================================

import type { NormalizedVacancy, RuleScoreResult, SearchPreferenceData } from "@/types";

// ── Fallback Pattern Groups (Used when user preference is not set) ────

const DEFAULT_TITLE_KEYWORDS: string[] = [
  "developer",
  "engineer",
  "frontend",
  "backend",
  "fullstack",
  "software",
  "разработчик",
  "программист",
  "инженер",
];

/** Remote work indicators across Russian and English */
const REMOTE_KEYWORDS: string[] = [
  "remote",
  "удаленно",
  "удалённо",
  "дистанционно",
  "дистанционная",
  "work from home",
];

/** Junior / entry-level indicators in text */
const JUNIOR_TEXT_KEYWORDS: string[] = [
  "junior",
  "intern",
  "стажер",
  "стажёр",
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

// ── Penalty Pattern Groups ────────────────────────────────────

/** Senior / leadership / 5+ year requirements */
const SENIOR_KEYWORDS: string[] = [
  "senior",
  "team lead",
  "tech lead",
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
  "только граждане рф",
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

/** Contextual Scam / fraud / unpaid / document-request patterns */
const SCAM_KEYWORDS: string[] = [
  "работа без оплаты",
  "unpaid internship",
  "оплата обучения",
  "залог",
  "deposit",
  "код из смс",
  "смс-код",
  "скан паспорта",
  "фото паспорта",
  "пришлите паспорт",
  "паспортные данные",
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

// ── Helper with Regex Word Boundary ───────────────────────────

function matchesWordBoundary(text: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|[^a-zA-Zа-яА-Я0-9_])${escaped}([^a-zA-Zа-яА-Я0-9_]|$)`, "i");
  return regex.test(text);
}

/**
 * Returns true if the text contains any keyword from the list.
 * Multi-word phrases use case-insensitive substring search.
 * Single words use boundary regex to avoid false positives (e.g. "lead" in "leading").
 */
function matchesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((k) => {
    const kLower = k.toLowerCase().trim();
    if (!kLower) return false;
    if (kLower.includes(" ") || kLower.includes("+") || kLower.includes("-")) {
      return lower.includes(kLower);
    }
    return matchesWordBoundary(text, kLower);
  });
}

// ── Dynamic Scorer ────────────────────────────────────────────

/**
 * Calculates a rule-based score (0–100) for a vacancy using dynamic candidate preferences.
 *
 * @param vacancy - Normalized vacancy to evaluate
 * @param pref    - Optional candidate search preferences
 * @returns RuleScoreResult with clamped score, positive reasons, and penalties
 */
export function calculateRuleScore(
  vacancy: NormalizedVacancy,
  pref?: SearchPreferenceData
): RuleScoreResult {
  let score = 0;
  const reasons: string[] = [];
  const penalties: string[] = [];

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

  // ── 1. TARGET ROLE & KEYWORDS MATCH (+25) ───────────────────
  const roleKeywords = [
    ...(pref?.targetRoles ?? []),
    ...(pref?.searchKeywordsEn ?? []),
    ...(pref?.searchKeywordsRu ?? []),
  ].filter(Boolean);

  const effectiveTitleKeywords = roleKeywords.length > 0 ? roleKeywords : DEFAULT_TITLE_KEYWORDS;
  if (matchesAny(title, effectiveTitleKeywords)) {
    score += 25;
    reasons.push(`+25 Title matches target roles / keywords`);
  }

  // ── 2. REMOTE / WORK FORMAT FIT (+20) ───────────────────────
  const userWantsRemote = !pref?.workFormat?.length || pref.workFormat.some((w) => w.toLowerCase().includes("remote"));
  const isRemoteVacancy =
    schedule.includes("remote") ||
    matchesAny(workFormatStr, REMOTE_KEYWORDS) ||
    matchesAny(description, REMOTE_KEYWORDS);

  if (isRemoteVacancy) {
    score += 20;
    reasons.push("+20 Remote work format supported");
  } else if (!userWantsRemote && matchesAny(workFormatStr, ["office", "hybrid"])) {
    score += 15;
    reasons.push("+15 Work format matches candidate preference");
  }

  // ── 3. CANDIDATE SKILLS OVERLAP (+15) ────────────────────────
  const customSkills = [
    ...(pref?.requiredSkills ?? []),
    ...(pref?.niceToHaveSkills ?? []),
  ].filter(Boolean);

  if (customSkills.length > 0) {
    const matchedSkills = customSkills.filter((s) => matchesAny(fullText, [s]));
    if (matchedSkills.length > 0) {
      score += 15;
      reasons.push(`+15 Matches candidate skills (${matchedSkills.slice(0, 3).join(", ")})`);
    }
  } else {
    // Generic fallback for fresh setup
    if (matchesAny(fullText, ["javascript", "typescript", "react", "python", "sql", "api"])) {
      score += 10;
      reasons.push("+10 Mentions standard software engineering skills");
    }
  }

  // ── 4. EXPERIENCE FIT (+15) ──────────────────────────────────
  const isJuniorExperience =
    JUNIOR_EXPERIENCE_IDS.some((id) => experience.toLowerCase().includes(id.toLowerCase())) ||
    matchesAny(fullText, JUNIOR_TEXT_KEYWORDS);

  if (pref?.experience?.length) {
    const matchesExp = pref.experience.some((exp) => experience.toLowerCase().includes(exp.toLowerCase()));
    if (matchesExp || isJuniorExperience) {
      score += 15;
      reasons.push("+15 Experience level matches candidate profile");
    }
  } else if (isJuniorExperience) {
    score += 15;
    reasons.push("+15 Entry / junior / adaptable experience level");
  }

  // ── 5. SALARY FIT (+10) ──────────────────────────────────────
  if (pref?.salaryMinimum && vacancy.salary?.from) {
    if (vacancy.salary.from >= pref.salaryMinimum) {
      score += 10;
      reasons.push(`+10 Salary meets or exceeds threshold (${pref.salaryMinimum} ${pref.salaryCurrency || "RUR"})`);
    }
  } else if (vacancy.salary && (vacancy.salary.from || vacancy.salary.to)) {
    score += 10;
    reasons.push("+10 Salary is specified");
  }

  // ── 6. LANGUAGE PREFERENCE (+10) ─────────────────────────────
  if (
    description.includes("english") ||
    description.includes("английский") ||
    description.includes("английского")
  ) {
    score += 10;
    reasons.push("+10 English language explicitly supported in vacancy");
  }

  // ── PENALTIES ────────────────────────────────────────────────

  // -30: Senior / lead / 5+ years required
  if (matchesAny(fullText, SENIOR_KEYWORDS)) {
    // Only penalize if candidate didn't specify senior experience
    const candidateIsSenior = pref?.experience?.some((e) => e.includes("6+") || e.includes("3-6"));
    if (!candidateIsSenior) {
      score -= 30;
      penalties.push("-30 Requires senior / lead or 5+ years of experience");
    }
  }

  // -40: Russian citizenship explicitly required
  if (matchesAny(fullText, CITIZENSHIP_KEYWORDS)) {
    score -= 40;
    penalties.push("-40 Requires Russian citizenship (candidate constraint)");
  }

  // -35: Russian language at C1 / C2 level mandatory
  if (matchesAny(fullText, RUSSIAN_MANDATORY_KEYWORDS)) {
    score -= 35;
    penalties.push("-35 Requires Russian C1/C2 near-native language level");
  }

  // -50: Scam/fraud signals
  if (matchesAny(fullText, SCAM_KEYWORDS)) {
    score -= 50;
    penalties.push("-50 Suspicious signals detected (unpaid / payment / OTP / passport scan)");
  }

  // User excluded keywords
  if (pref?.excludeKeywords?.length) {
    const matchedExcludes = pref.excludeKeywords.filter((k) => matchesAny(fullText, [k]));
    if (matchedExcludes.length > 0) {
      score -= 30;
      penalties.push(`-30 Matches user excluded keywords (${matchedExcludes.join(", ")})`);
    }
  }

  // User red flag keywords
  if (pref?.redFlagKeywords?.length) {
    const matchedRed = pref.redFlagKeywords.filter((k) => matchesAny(fullText, [k]));
    if (matchedRed.length > 0) {
      score -= 50;
      penalties.push(`-50 Matches user red flag keywords (${matchedRed.join(", ")})`);
    }
  }

  // -25: Office-only without any relocation / hybrid option mentioned
  if (
    userWantsRemote &&
    matchesAny(fullText, OFFICE_ONLY_KEYWORDS) &&
    !matchesAny(fullText, RELOCATION_KEYWORDS)
  ) {
    score -= 25;
    penalties.push("-25 Office-only position without relocation or remote option");
  }

  // Clamp to valid range [0, 100]
  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    reasons,
    penalties,
  };
}
