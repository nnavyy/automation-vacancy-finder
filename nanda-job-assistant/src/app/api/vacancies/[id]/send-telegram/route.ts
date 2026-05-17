import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendVacancyNotification } from "@/lib/telegram";
import type { AIAnalysisResult, NormalizedVacancy, HHSalary } from "@/types";
import { buildRuleBasedResult } from "@/lib/aiAnalyzer";

function toNormalizedVacancy(v: any): NormalizedVacancy {
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
    workFormat: v.workFormat ?? undefined,
    snippet: v.snippet ?? undefined,
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
    const { id } = await params;

    const dbVacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: { analysis: true },
    });

    if (!dbVacancy) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 });
    }

    const a = dbVacancy.analysis;
    
    let aiAnalysis: AIAnalysisResult;

    if (a && a.summary !== "Generated on demand") {
      aiAnalysis = {
        match_score: a.matchScore,
        confidence: a.confidence ?? 100,
        recommendation: (a.recommendation as "apply" | "maybe" | "skip"),
        match_reasons: (a.matchReasons as string[]) ?? [],
        missing_requirements: (a.missingRequirements as string[]) ?? [],
        red_flags: (a.redFlags as any[]) ?? [],
        best_language: (a.bestLanguage as "english" | "russian"),
        cover_letter: a.coverLetter ?? "",
        summary: a.summary ?? "",
        questions_to_recruiter: [],
      };
    } else {
      // Use rule-based fallback if no analysis exists
      const fallback = buildRuleBasedResult(toNormalizedVacancy(dbVacancy));
      aiAnalysis = fallback as AIAnalysisResult;
      
      // If we have a cover letter (e.g. from the old bug), preserve it
      if (a?.coverLetter) {
        aiAnalysis.cover_letter = a.coverLetter;
      }
    }

    const success = await sendVacancyNotification(
      toNormalizedVacancy(dbVacancy),
      aiAnalysis,
      id
    );

    if (success) {
      // Mark as notified so we know it was sent
      if (dbVacancy.status !== "applied_manual" && dbVacancy.status !== "applied_auto") {
        await prisma.vacancy.update({
          where: { id },
          data: { status: "notified" },
        });
      }

      await prisma.applicationLog.create({
        data: {
          vacancyId: id,
          action: "sent_to_telegram",
          notes: "Manually sent to Telegram via Dashboard",
        },
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: "Telegram API failed to send" }, { status: 500 });
    }
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/send-telegram]", err);
    return NextResponse.json(
      { success: false, error: "Failed to send to Telegram" },
      { status: 500 }
    );
  }
}
