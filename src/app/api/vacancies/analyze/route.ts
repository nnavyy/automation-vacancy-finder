// ============================================================
// Nanda AI Job Assistant — Manual Vacancy Analysis
// ============================================================
// POST /api/vacancies/analyze
//
// Manually triggers (or re-runs) AI analysis for a specific vacancy.
// Useful for:
//   - Vacancies that were saved with status "low_priority" or "new"
//   - Re-analyzing after a profile change
//   - Testing the AI pipeline
//
// Body: { vacancyId: string }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { calculateRuleScore } from "@/lib/scoring";
import type { NormalizedVacancy, HHSalary } from "@/types";

// ── Helper ────────────────────────────────────────────────────

/**
 * Converts a Prisma Vacancy record to the NormalizedVacancy shape expected
 * by the analysis, filter, and scoring functions.
 * JSON fields (salary, workFormat, snippet) are safely cast.
 */
function toNormalizedVacancy(
  v: Awaited<ReturnType<typeof prisma.vacancy.findUnique>> & object
): NormalizedVacancy {
  return {
    hhId: (v as { hhId: string }).hhId,
    title: (v as { title: string }).title,
    company: (v as { company: string | null }).company ?? undefined,
    area: (v as { area: string | null }).area ?? undefined,
    salary: ((v as { salary: unknown }).salary as HHSalary) ?? undefined,
    url: (v as { url: string | null }).url ?? undefined,
    applyUrl: (v as { applyUrl: string | null }).applyUrl ?? undefined,
    apiUrl: (v as { apiUrl: string | null }).apiUrl ?? undefined,
    experience: (v as { experience: string | null }).experience ?? undefined,
    employment: (v as { employment: string | null }).employment ?? undefined,
    schedule: (v as { schedule: string | null }).schedule ?? undefined,
    workFormat:
      ((v as { workFormat: unknown }).workFormat as {
        id: string;
        name: string;
      }[]) ?? undefined,
    snippet: ((v as { snippet: unknown }).snippet as {
      requirement?: string;
      responsibility?: string;
    }) ?? undefined,
    description:
      (v as { description: string | null }).description ?? undefined,
    descriptionHash:
      (v as { descriptionHash: string | null }).descriptionHash ?? undefined,
    sourceKeyword:
      (v as { sourceKeyword: string | null }).sourceKeyword ?? undefined,
  };
}

// ── Route Handler ─────────────────────────────────────────────

/**
 * POST /api/vacancies/analyze
 *
 * Manually triggers or re-runs AI analysis for a specific vacancy.
 *
 * Body:  { vacancyId: string }
 *
 * Returns:
 *   200 { success: true, data: { analysis, provider, model, aiStatus } }
 *   400 { success: false, error: "vacancyId is required" }
 *   404 { success: false, error: "Vacancy not found" }
 *   500 { success: false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    // ── Parse and validate request body ──────────────────
    const body = await req.json().catch(() => ({})) as { vacancyId?: string };
    const { vacancyId } = body;

    if (!vacancyId || typeof vacancyId !== "string") {
      return NextResponse.json(
        { success: false, error: "vacancyId is required and must be a string" },
        { status: 400 }
      );
    }

    // ── Fetch vacancy from DB ─────────────────────────────
    const dbVacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!dbVacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // ── Convert to NormalizedVacancy for analysis functions
    const vacancy = toNormalizedVacancy(
      dbVacancy as Parameters<typeof toNormalizedVacancy>[0]
    );

    // ── Retrieve personalised feedback context ─────────────
    const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
    const similarFeedback = [...positive, ...negative];

    // ── Run AI analysis ───────────────────────────────────
    const { analysis, provider, model, aiStatus } = await analyzeVacancy(
      vacancy,
      similarFeedback
    );

    // ── Compute rule-based score for storage ─────────────
    const ruleScore = calculateRuleScore(vacancy);

    // ── Upsert VacancyAnalysis ────────────────────────────
    const analysisData = {
      matchScore: analysis.match_score,
      ruleScore: ruleScore.score,
      recommendation: analysis.recommendation,
      bestLanguage: analysis.best_language,
      summary: analysis.summary,
      matchReasons: analysis.match_reasons,
      missingRequirements: analysis.missing_requirements,
      redFlags: analysis.red_flags as object[],
      coverLetter: analysis.cover_letter,
      questions: analysis.questions_to_recruiter,
      confidence: analysis.confidence,
      aiStatus,
      providerUsed: provider,
      modelUsed: model,
    };

    await prisma.vacancyAnalysis.upsert({
      where: { vacancyId },
      create: { vacancyId, ...analysisData },
      update: analysisData,
    });

    // ── Update vacancy status ─────────────────────────────
    await prisma.vacancy.update({
      where: { id: vacancyId },
      data: { status: "analyzed" },
    });

    console.log(
      `[Analyze] Completed analysis for vacancy ${vacancyId} — ` +
        `score: ${analysis.match_score}, provider: ${provider}`
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        provider,
        model,
        aiStatus,
        ruleScore: ruleScore.score,
      },
    });
  } catch (err) {
    console.error("[POST /api/vacancies/analyze]", err);
    return NextResponse.json(
      { success: false, error: "Failed to analyze vacancy" },
      { status: 500 }
    );
  }
}
