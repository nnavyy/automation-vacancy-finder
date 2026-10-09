// ============================================================
// Nanda AI Job Assistant — Manual Vacancy Analysis
// ============================================================
// POST /api/vacancies/analyze

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { calculateRuleScore } from "@/lib/scoring";
import { getApiUser, getOwnedVacancy } from "@/lib/auth-helpers";
import { toSearchPrefData } from "@/lib/collectionPipeline";
import { sendVacancyNotificationToUser } from "@/lib/telegram";
import type { NormalizedVacancy, HHSalary } from "@/types";

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

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { vacancyId?: string };
    const { vacancyId } = body;

    if (!vacancyId || typeof vacancyId !== "string") {
      return NextResponse.json(
        { success: false, error: "vacancyId is required and must be a string" },
        { status: 400 }
      );
    }

    const dbVacancy = await getOwnedVacancy(vacancyId, user.id);
    if (!dbVacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    const vacancy = toNormalizedVacancy(
      dbVacancy as Parameters<typeof toNormalizedVacancy>[0]
    );

    // Retrieve feedback context isolated to current user
    const { positive, negative } = await getSimilarFeedbackExamples(vacancy, user.id);
    const similarFeedback = [...positive, ...negative];

    // Fetch user's active search preference
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    }) || await prisma.searchPreference.findFirst({
      where: { isActive: true },
    });

    const prefData = pref ? toSearchPrefData(pref) : undefined;

    // Run AI analysis
    const { analysis, provider, model, aiStatus } = await analyzeVacancy(
      vacancy,
      similarFeedback,
      prefData
    );

    // Compute rule-based score
    const ruleScore = calculateRuleScore(vacancy, prefData);

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

    let finalStatus = "analyzed";

    // ── Dispatch Telegram notification if score meets threshold ──
    const minScoreToNotify = pref?.minimumScoreToNotify ?? 75;
    if (analysis.match_score >= minScoreToNotify) {
      const link = await prisma.telegramLink.findFirst({
        where: { userId: user.id, isActive: true },
      });
      const chatId = link?.telegramChatId || process.env.TELEGRAM_CHAT_ID;
      if (chatId) {
        const sent = await sendVacancyNotificationToUser(
          vacancy,
          analysis,
          vacancyId,
          chatId
        );
        if (sent) {
          finalStatus = "notified";
          await prisma.applicationLog.create({
            data: {
              vacancyId,
              action: "notified",
              notes: `Score: ${analysis.match_score}/100, Provider: ${provider} (${model}) [Manual Analysis]`,
            },
          });
        }
      }
    }

    await prisma.vacancy.update({
      where: { id: vacancyId },
      data: { status: finalStatus },
    });

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
