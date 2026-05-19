// ============================================================
// Nanda AI Job Assistant — Regenerate Cover Letter
// ============================================================
// POST /api/vacancies/[id]/regenerate-letter
//
// Re-generates the cover letter for a vacancy, optionally with a
// custom instruction (e.g. "make it shorter", "emphasise Figma skills").
//
// The custom instruction is appended to the standard analysis prompt
// before being sent to the AI provider chain.
//
// Body: { instruction?: string }
//
// Actions performed:
//   1. Load vacancy with its current analysis
//   2. Build the AI prompt (using buildAnalysisPrompt)
//   3. Append custom instruction if provided
//   4. Call AI provider chain (callAI)
//   5. Parse the JSON response (parseAIResponse)
//   6. Update VacancyAnalysis.coverLetter in DB
//   7. Log the regeneration to ApplicationLog
//   8. Return the new cover letter
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/aiAnalyzer";
import { callAI } from "@/lib/aiProviderRouter";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import type { NormalizedVacancy, HHSalary } from "@/types";

// ── Helper ────────────────────────────────────────────────────

/**
 * Converts a Prisma Vacancy DB record to the NormalizedVacancy shape
 * expected by buildAnalysisPrompt and getSimilarFeedbackExamples.
 */
function toNormalizedVacancy(v: {
  hhId: string;
  title: string;
  company: string | null;
  area: string | null;
  salary: unknown;
  url: string | null;
  applyUrl: string | null;
  apiUrl: string | null;
  experience: string | null;
  employment: string | null;
  schedule: string | null;
  workFormat: unknown;
  snippet: unknown;
  description: string | null;
  descriptionHash: string | null;
  sourceKeyword: string | null;
}): NormalizedVacancy {
  return {
    hhId: v.hhId,
    title: v.title,
    company: v.company ?? undefined,
    area: v.area ?? undefined,
    salary: (v.salary as HHSalary) ?? undefined,
    url: v.url ?? undefined,
    applyUrl: v.applyUrl ?? undefined,
    apiUrl: v.apiUrl ?? undefined,
    experience: v.experience ?? undefined,
    employment: v.employment ?? undefined,
    schedule: v.schedule ?? undefined,
    workFormat:
      (v.workFormat as { id: string; name: string }[]) ?? undefined,
    snippet:
      (v.snippet as { requirement?: string; responsibility?: string }) ??
      undefined,
    description: v.description ?? undefined,
    descriptionHash: v.descriptionHash ?? undefined,
    sourceKeyword: v.sourceKeyword ?? undefined,
  };
}

// ── Route Handler ─────────────────────────────────────────────

/**
 * POST /api/vacancies/[id]/regenerate-letter
 *
 * Re-generates the cover letter for a vacancy with an optional
 * custom instruction appended to the AI prompt.
 *
 * Body:  { instruction?: string }
 *
 * Returns:
 *   200 { success: true, data: { coverLetter: string, provider: string, model: string } }
 *   404 { success: false, error: "Vacancy not found" }
 *   500 { success: false, error: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Parse optional instruction ────────────────────────
    const body = await req.json().catch(() => ({})) as {
      instruction?: string;
    };
    const { instruction } = body;

    // ── Fetch vacancy ─────────────────────────────────────
    const dbVacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: { analysis: true },
    });

    if (!dbVacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // ── Fetch active preference ─────────────────────────────
    const pref = await prisma.searchPreference.findFirst({
      where: { isActive: true },
    });

    // ── Build NormalizedVacancy for prompt builder ─────────
    const vacancy = toNormalizedVacancy(dbVacancy);

    // ── Retrieve personalised feedback context ─────────────
    const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
    const similarFeedback = [...positive, ...negative];

    // ── Build the AI prompt ───────────────────────────────
    let prompt = buildAnalysisPrompt(vacancy, similarFeedback, pref);

    // Append custom instruction when provided so the AI tailors the letter
    if (instruction && instruction.trim()) {
      prompt +=
        `\n\n---\nAdditional instruction for the cover letter: ` +
        `${instruction.trim()}\n` +
        `Please update the "cover_letter" field in your JSON response ` +
        `to reflect this instruction while keeping all other fields accurate.`;
    }

    // ── Call AI provider chain ─────────────────────────────
    const aiResult = await callAI({
      prompt,
      requestType: "cover_letter",
      maxTokens: 2048,
    });

    let newCoverLetter = "";
    let fullAnalysis: any = null;

    if (aiResult.isRateLimited || !aiResult.content.trim()) {
      newCoverLetter = dbVacancy.analysis?.coverLetter ?? "";
      console.warn(`[RegenerateLetter] AI unavailable, keeping existing cover letter.`);
    } else {
      try {
        fullAnalysis = parseAIResponse(aiResult.content);
        newCoverLetter = fullAnalysis.cover_letter;
      } catch (parseErr) {
        console.error(`[RegenerateLetter] Parse failed:`, parseErr);
        newCoverLetter = dbVacancy.analysis?.coverLetter ?? "";
      }
    }

    // ── Update or Create VacancyAnalysis ────────────────
    if (fullAnalysis) {
      await prisma.vacancyAnalysis.upsert({
        where: { vacancyId: id },
        update: { coverLetter: newCoverLetter },
        create: {
          vacancyId: id,
          coverLetter: newCoverLetter,
          matchScore: fullAnalysis.match_score,
          recommendation: fullAnalysis.recommendation,
          bestLanguage: fullAnalysis.best_language,
          aiStatus: "completed",
          summary: fullAnalysis.summary,
          matchReasons: fullAnalysis.match_reasons,
          missingRequirements: fullAnalysis.missing_requirements,
          redFlags: fullAnalysis.red_flags,
          questions: fullAnalysis.questions_to_recruiter,
          confidence: fullAnalysis.confidence,
          providerUsed: aiResult.provider,
          modelUsed: aiResult.model,
        },
      });
    } else {
      // Just update cover letter if parsing failed but we still have an analysis record
      if (dbVacancy.analysis) {
        await prisma.vacancyAnalysis.update({
          where: { vacancyId: id },
          data: { coverLetter: newCoverLetter },
        });
      }
    }

    // ── Log the regeneration ──────────────────────────────
    await prisma.applicationLog.create({
      data: {
        vacancyId: id,
        action: "regenerate_letter",
        notes: instruction
          ? `Cover letter regenerated with custom instruction: "${instruction}". Provider: ${aiResult.provider}`
          : `Cover letter regenerated. Provider: ${aiResult.provider}`,
      },
    });

    console.log(
      `[RegenerateLetter] Cover letter regenerated for vacancy ${id} ` +
        `via ${aiResult.provider}/${aiResult.model}.`
    );

    return NextResponse.json({
      success: true,
      data: {
        coverLetter: newCoverLetter,
        provider: aiResult.provider,
        model: aiResult.model,
      },
    });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/regenerate-letter]", err);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate cover letter" },
      { status: 500 }
    );
  }
}
