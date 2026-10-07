// ============================================================
// Nanda AI Job Assistant — Regenerate Cover Letter
// ============================================================
// POST /api/vacancies/[id]/regenerate-letter

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/aiAnalyzer";
import { callAI } from "@/lib/aiProviderRouter";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { getApiUser, getOwnedVacancy } from "@/lib/auth-helpers";
import type { NormalizedVacancy, HHSalary } from "@/types";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({})) as {
      instruction?: string;
    };
    const { instruction } = body;

    const dbVacancy = await getOwnedVacancy(id, user.id);
    if (!dbVacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Fetch user's active search preference
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    }) || await prisma.searchPreference.findFirst({
      where: { isActive: true },
    });

    const vacancy = toNormalizedVacancy(dbVacancy);

    // Retrieve personalised feedback context isolated to this user
    const { positive, negative } = await getSimilarFeedbackExamples(vacancy, user.id);
    const similarFeedback = [...positive, ...negative];

    let prompt = await buildAnalysisPrompt(vacancy, similarFeedback, pref);

    if (instruction && instruction.trim()) {
      prompt +=
        `\n\n---\nAdditional instruction for the cover letter: ` +
        `${instruction.trim()}\n` +
        `Please update the "cover_letter" field in your JSON response ` +
        `to reflect this instruction while keeping all other fields accurate.`;
    }

    const aiResult = await callAI({
      prompt,
      requestType: "cover_letter",
      maxTokens: 2048,
      providerOrder: (pref?.aiProviderOrder as string[]) ?? undefined,
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
    } else if (dbVacancy.analysis) {
      await prisma.vacancyAnalysis.update({
        where: { vacancyId: id },
        data: { coverLetter: newCoverLetter },
      });
    }

    await prisma.applicationLog.create({
      data: {
        vacancyId: id,
        action: "regenerate_letter",
        notes: instruction
          ? `Cover letter regenerated with custom instruction: "${instruction}". Provider: ${aiResult.provider}`
          : `Cover letter regenerated. Provider: ${aiResult.provider}`,
      },
    });

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
