// ============================================================
// Nanda AI Job Assistant — AI Vacancy Analyzer
// ============================================================
// Orchestrates the full analysis pipeline for a single vacancy:
//
//   1. buildAnalysisPrompt()  — constructs the full prompt string
//   2. callAI()               — sends to AI provider chain (Groq → Gemini → OpenRouter)
//   3. parseAIResponse()      — extracts and validates the JSON from the AI reply
//   4. buildRuleBasedResult() — rule-based fallback when all AI providers fail
//
// Returns aiStatus:
//   "completed"       — AI responded and JSON was parsed successfully
//   "rule_based_only" — AI failed or returned unparseable JSON; rule-based used
//   "pending_limit"   — reserved for deferred analysis (not yet triggered here)
// ============================================================

import type {
  AIAnalysisResult,
  AIStatus,
  AIFallbackResult,
  HHSalary,
  NormalizedVacancy,
  SimilarFeedbackExample,
} from "@/types";
import { callAI } from "@/lib/aiProviderRouter";
import { calculateRuleScore } from "@/lib/scoring";
import { detectRedFlags } from "@/lib/redFlags";

// ── Prompt Helpers ────────────────────────────────────────────

/**
 * Formats an HHSalary object into a short prompt-friendly string.
 */
function formatSalaryForPrompt(salary?: HHSalary): string {
  if (!salary || (!salary.from && !salary.to)) return "Not specified";
  const parts: string[] = [];
  if (salary.from) parts.push(`from ${salary.from.toLocaleString("en-US")}`);
  if (salary.to) parts.push(`to ${salary.to.toLocaleString("en-US")}`);
  if (salary.currency) parts.push(salary.currency);
  return parts.join(" ");
}

// ── Prompt Builder ────────────────────────────────────────────

/**
 * Builds the complete AI analysis prompt for a vacancy.
 *
 * The prompt includes:
 *  - A fixed candidate profile section (Nanda's details)
 *  - A "avoid" list of hard disqualifiers
 *  - Injected past feedback examples (positive and negative) for personalisation
 *  - All relevant vacancy fields
 *  - Strict JSON output specification
 *
 * The description is truncated at 3,000 characters to stay within token limits
 * while preserving the most important content (beginning of the description).
 *
 * @param vacancy        - Vacancy being analysed
 * @param similarFeedback - Optional past feedback for prompt personalisation
 * @returns Full prompt string ready to send to an AI provider
 */
export function buildAnalysisPrompt(
  vacancy: NormalizedVacancy,
  similarFeedback?: SimilarFeedbackExample[],
  pref?: any
): string {
  // ── Format past feedback examples ────────────────────────
  const positiveLines = similarFeedback
    ?.filter((f) => ["apply", "save", "interview"].includes(f.userAction))
    ?.slice(0, 5)
    ?.map(
      (f) =>
        `  - "${f.title}" @ ${f.company ?? "Unknown"} ` +
        `→ ${f.userAction} (score: ${f.matchScore ?? "N/A"})`
    )
    ?.join("\n");

  const negativeLines = similarFeedback
    ?.filter((f) => f.userAction === "skip")
    ?.slice(0, 5)
    ?.map(
      (f) =>
        `  - "${f.title}" @ ${f.company ?? "Unknown"} ` +
        `→ skipped${f.summary ? ` (${f.summary})` : ""}`
    )
    ?.join("\n");

  const positiveFeedbackBlock =
    positiveLines && positiveLines.length > 0
      ? positiveLines
      : "  (no positive examples yet — ignore this section)";

  const negativeFeedbackBlock =
    negativeLines && negativeLines.length > 0
      ? negativeLines
      : "  (no negative examples yet — ignore this section)";

  // ── Format work format ────────────────────────────────────
  const workFormatStr =
    vacancy.workFormat && vacancy.workFormat.length > 0
      ? vacancy.workFormat.map((w) => w.name).join(", ")
      : "Not specified";

  // ── Format snippet ────────────────────────────────────────
  const snippetParts: string[] = [];
  if (vacancy.snippet?.requirement)
    snippetParts.push(`Requirements: ${vacancy.snippet.requirement}`);
  if (vacancy.snippet?.responsibility)
    snippetParts.push(`Responsibilities: ${vacancy.snippet.responsibility}`);
  const snippetStr =
    snippetParts.length > 0 ? snippetParts.join(" | ") : "Not available";

  // Truncate description to avoid exceeding model context windows
  const descriptionStr = vacancy.description
    ? vacancy.description.slice(0, 3000)
    : "Not available";

  // ── Format Profile Data ──
  const candidateName = pref?.name || "the candidate";
  const targetRoles = pref?.targetRoles?.length ? pref.targetRoles.join(", ") : "Not specified";
  const requiredSkills = pref?.requiredSkills?.length ? pref.requiredSkills.join(", ") : "Not specified";
  const niceToHaveSkills = pref?.niceToHaveSkills?.length ? pref.niceToHaveSkills.join(", ") : "Not specified";
  const redFlags = pref?.redFlagKeywords?.length ? pref.redFlagKeywords.join(", ") : "Not specified";
  const resumeText = pref?.resumeText ? `- Resume/Background:\n${pref.resumeText}` : "";
  const coverLetterLang = pref?.coverLetterLanguage || "Auto (Match Vacancy)";

  let coverLetterLangInstruction = "";
  if (coverLetterLang === "English") {
    coverLetterLangInstruction = "- MUST write the cover letter in English.";
  } else if (coverLetterLang === "Russian") {
    coverLetterLangInstruction = "- MUST write the cover letter in Russian.";
  } else {
    coverLetterLangInstruction = "- If job is Russian but English may be acceptable, write in English. Otherwise write a simple Russian cover letter.";
  }

  // ── Assemble full prompt ──────────────────────────────────
  return `You are an AI vacancy analysis assistant for ${candidateName}.

Analyze this HH vacancy and decide whether ${candidateName} should apply.

Candidate profile:
- Name: ${candidateName}
- Target roles: ${targetRoles}
- Core Skills: ${requiredSkills}
- Nice-to-have Skills: ${niceToHaveSkills}
${resumeText}

Avoid (Red Flags):
- ${redFlags}
- suspicious test tasks
- payment before work
- no contract
- passport/OTP/SMS code requests

User feedback examples (learn from these to calibrate your scoring):
Positive (Nanda liked / applied to similar roles):
${positiveFeedbackBlock}

Negative (Nanda skipped similar roles):
${negativeFeedbackBlock}

Vacancy data:
Title: ${vacancy.title}
Company: ${vacancy.company ?? "Not specified"}
Area: ${vacancy.area ?? "Not specified"}
Salary: ${formatSalaryForPrompt(vacancy.salary)}
Experience: ${vacancy.experience ?? "Not specified"}
Employment: ${vacancy.employment ?? "Not specified"}
Schedule: ${vacancy.schedule ?? "Not specified"}
Work format: ${workFormatStr}
Snippet: ${snippetStr}
Description: ${descriptionStr}

Return STRICT JSON ONLY — no markdown, no code fences, no extra text before or after:
{
  "match_score": 0,
  "recommendation": "apply | maybe | skip",
  "best_language": "english | russian",
  "summary": "",
  "match_reasons": [],
  "missing_requirements": [],
  "red_flags": [{"trigger_text": "", "reason": "", "severity": "low | medium | high"}],
  "cover_letter": "",
  "questions_to_recruiter": [],
  "confidence": 85
}

Scoring guide:
90-100 = excellent fit, apply immediately
75-89 = good fit, apply
60-74 = possible fit, maybe apply
40-59 = weak fit, apply only if few risks
0-39 = skip

Rules:
- Mention exact red flag trigger text if found.
- Cover letter must sound natural and human.
- Confidence should be a number from 0-100 indicating how confident you are in your score based on the available data.
${coverLetterLangInstruction}
- Note: If candidate's skills match perfectly, do not penalize heavily for language if it is a remote tech role, just note it in missing_requirements.`;
}

// ── Response Parser ───────────────────────────────────────────

/**
 * Extracts and validates a structured AIAnalysisResult from raw AI output.
 *
 * Handles common AI response patterns:
 *  - Clean JSON  (ideal)
 *  - JSON wrapped in ```json ... ``` markdown fences (common with Gemini)
 *  - JSON preceded by a preamble sentence (common with Llama models)
 *
 * After parsing, all required fields are validated and given safe defaults
 * so downstream code never needs to null-check individual fields.
 *
 * @param raw - Raw string returned by the AI provider
 * @returns Validated AIAnalysisResult
 * @throws Error if no valid JSON object can be extracted
 */
export function parseAIResponse(raw: string): AIAnalysisResult {
  let jsonStr = raw.trim();

  // 1. Strip markdown code fences  (```json ... ``` or ``` ... ```)
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    jsonStr = fenceMatch[1].trim();
  }

  // 2. Find the outermost JSON object in case the AI added preamble text
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  // 3. Parse
  let parsed: Partial<AIAnalysisResult>;
  try {
    parsed = JSON.parse(jsonStr) as Partial<AIAnalysisResult>;
  } catch (err) {
    throw new Error(
      `parseAIResponse: JSON.parse failed — ${String(err)}\n` +
        `Raw snippet: ${raw.slice(0, 400)}`
    );
  }

  // 4. Validate / apply defaults for every required field
  const result: AIAnalysisResult = {
    match_score:
      typeof parsed.match_score === "number" ? parsed.match_score : 0,

    recommendation: ["apply", "maybe", "skip"].includes(
      parsed.recommendation ?? ""
    )
      ? (parsed.recommendation as AIAnalysisResult["recommendation"])
      : "maybe",

    best_language: ["english", "russian"].includes(parsed.best_language ?? "")
      ? (parsed.best_language as AIAnalysisResult["best_language"])
      : "english",

    summary: typeof parsed.summary === "string" ? parsed.summary : "",

    match_reasons: Array.isArray(parsed.match_reasons)
      ? parsed.match_reasons
      : [],

    missing_requirements: Array.isArray(parsed.missing_requirements)
      ? parsed.missing_requirements
      : [],

    red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],

    cover_letter:
      typeof parsed.cover_letter === "string" ? parsed.cover_letter : "",

    questions_to_recruiter: Array.isArray(parsed.questions_to_recruiter)
      ? parsed.questions_to_recruiter
      : [],

    confidence:
      typeof parsed.confidence === "number" ? parsed.confidence : 50,
  };

  // 5. Clamp numeric scores to valid range
  result.match_score = Math.max(0, Math.min(100, result.match_score));
  result.confidence = Math.max(0, Math.min(100, result.confidence));

  return result;
}

// ── Rule-Based Fallback ───────────────────────────────────────

/**
 * Generates a complete AIAnalysisResult using purely rule-based logic.
 * Called when all AI providers fail or return unparseable JSON.
 *
 * Uses calculateRuleScore() for the score and match/penalty breakdown,
 * and detectRedFlags() for the red flag list.
 * Generates a generic (but personalised) cover letter template.
 *
 * @param vacancy - Vacancy to evaluate
 * @returns Full AIAnalysisResult with rule-based data and a confidence of 40
 */
export function buildRuleBasedResult(vacancy: NormalizedVacancy): AIAnalysisResult {
  const { score, reasons, penalties } = calculateRuleScore(vacancy);

  const combinedText = [
    vacancy.title ?? "",
    vacancy.description ?? "",
    vacancy.snippet?.requirement ?? "",
  ].join(" ");

  const redFlags = detectRedFlags(combinedText);

  // Derive a recommendation from the numeric score and penalty count
  let recommendation: AIAnalysisResult["recommendation"] = "maybe";
  if (score >= 65 && penalties.length === 0) {
    recommendation = "apply";
  } else if (score < 40 || penalties.length >= 2) {
    recommendation = "skip";
  }

  // Generic cover letter template — better than nothing
  const coverLetter =
    `Dear Hiring Team,\n\n` +
    `I am Nanda Zhafran Mahendra, an Indonesian final-year Software Engineering ` +
    `student with strong experience in React, Next.js, TypeScript, and UI/UX design. ` +
    `I came across the "${vacancy.title}" position at ` +
    `${vacancy.company ?? "your company"} and believe my skill set aligns well ` +
    `with your requirements.\n\n` +
    `I am a fast learner who enjoys building clean, user-friendly web applications. ` +
    `My portfolio at https://nandaz-portofolio.vercel.app/ showcases several ` +
    `projects including AI chatbots, full-stack applications, and UI/UX designs.\n\n` +
    `I am available immediately for remote work and would love the opportunity ` +
    `to discuss how I can contribute to your team.\n\n` +
    `Best regards,\nNanda Zhafran Mahendra`;

  return {
    match_score: score,
    recommendation,
    best_language: "english",
    summary:
      `Rule-based score: ${score}/100. ` +
      `${reasons.slice(0, 2).join("; ")}. ` +
      (penalties.length > 0 ? `Penalties: ${penalties[0]}.` : ""),
    match_reasons: reasons,
    missing_requirements: [],
    red_flags: redFlags,
    cover_letter: coverLetter,
    questions_to_recruiter: [
      "Is this position fully remote?",
      "Is the company open to international applicants?",
      "What is the expected level of English proficiency?",
    ],
    confidence: 40, // Low confidence — rule-based only
  };
}

// ── Main Analyzer ─────────────────────────────────────────────

/**
 * Analyses a vacancy with the full AI pipeline, falling back to rule-based
 * scoring when AI is unavailable.
 *
 * Flow:
 *  1. Build the full prompt with buildAnalysisPrompt()
 *  2. Send to callAI() which tries Groq → Gemini → OpenRouter
 *  3. If all AI providers fail → rule-based fallback, aiStatus = "rule_based_only"
 *  4. Parse the AI JSON response with parseAIResponse()
 *  5. If parsing fails → rule-based fallback, aiStatus = "rule_based_only"
 *  6. On success → aiStatus = "completed"
 *
 * @param vacancy        - Normalized vacancy to analyse
 * @param similarFeedback - Optional past feedback for prompt personalisation
 * @returns Analysis result, provider/model metadata, and AI status code
 */
export async function analyzeVacancy(
  vacancy: NormalizedVacancy,
  similarFeedback: SimilarFeedbackExample[] = [],
  pref?: any
): Promise<{
  analysis: AIAnalysisResult;
  provider: string;
  model: string;
  aiStatus: AIStatus;
}> {
  const prompt = buildAnalysisPrompt(vacancy, similarFeedback, pref);

  // ── Step 1: Call AI provider chain ───────────────────────
  const aiResult = await callAI({
    prompt,
    requestType: "analyze",
    maxTokens: 2048,
  });

  // ── Step 2: Handle total AI failure ──────────────────────
  if (aiResult.isRateLimited || !aiResult.content.trim()) {
    console.warn(
      `[Analyzer] All AI providers unavailable for vacancy "${vacancy.title}". ` +
        "Falling back to rule-based analysis."
    );
    return {
      analysis: buildRuleBasedResult(vacancy) as AIAnalysisResult,
      provider: "rule_based",
      model: "none",
      aiStatus: "rule_based_only",
    };
  }

  // ── Step 3: Parse the AI JSON response ───────────────────
  try {
    const analysis = parseAIResponse(aiResult.content);
    console.log(
      `[Analyzer] AI analysis complete — score: ${analysis.match_score}, ` +
        `recommendation: ${analysis.recommendation}, ` +
        `provider: ${aiResult.provider}`
    );
    return {
      analysis,
      provider: aiResult.provider,
      model: aiResult.model,
      aiStatus: "completed",
    };
  } catch (parseError) {
    // AI responded but the JSON could not be extracted — fall back
    console.error(
      `[Analyzer] Failed to parse AI response for "${vacancy.title}":`,
      parseError
    );
    console.debug(
      "[Analyzer] Raw AI output (first 500 chars):",
      aiResult.content.slice(0, 500)
    );

    return {
      analysis: buildRuleBasedResult(vacancy) as AIAnalysisResult,
      provider: aiResult.provider,   // keep the provider that responded
      model: aiResult.model,
      aiStatus: "rule_based_only",
    };
  }
}
