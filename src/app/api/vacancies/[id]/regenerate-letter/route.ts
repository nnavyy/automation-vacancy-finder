// ============================================================
// Nanda AI Job Assistant — Regenerate Cover Letter
// ============================================================
// POST /api/vacancies/[id]/regenerate-letter
//
// Stage 2 only: regenerates the letter text for an already analyzed vacancy.
// Scoring is not touched. Uses the caller's own active profile only.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateCoverLetter } from "@/lib/aiAnalyzer";
import { getApiUser, getOwnedVacancy } from "@/lib/auth-helpers";
import type { NormalizedVacancy, HHSalary, AIAnalysisResult } from "@/types";

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
    const body = await req.json().catch(() => ({})) as { instruction?: string };
    const instruction = body.instruction?.trim() || undefined;

    const dbVacancy = await getOwnedVacancy(id, user.id);
    if (!dbVacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Tenant isolation: only the caller's own active profile, never another user's.
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!pref) {
      return NextResponse.json(
        { success: false, error: "No active search profile. Create one in Settings first." },
        { status: 400 }
      );
    }

    if (!dbVacancy.analysis) {
      return NextResponse.json(
        { success: false, error: "Analyze this vacancy first, then regenerate the letter." },
        { status: 409 }
      );
    }

    const vacancy = toNormalizedVacancy(dbVacancy);
    const stored: Partial<AIAnalysisResult> = {
      best_language: (dbVacancy.analysis.bestLanguage as "english" | "russian" | undefined) ?? undefined,
      match_reasons: (dbVacancy.analysis.matchReasons as string[]) ?? [],
    };

    const coverLetter = await generateCoverLetter(vacancy, stored, pref, { instruction });

    await prisma.vacancyAnalysis.update({
      where: { vacancyId: id },
      data: { coverLetter },
    });

    await prisma.applicationLog.create({
      data: {
        vacancyId: id,
        action: "regenerate_letter",
        notes: instruction
          ? `Cover letter regenerated with custom instruction: "${instruction}"`
          : "Cover letter regenerated.",
      },
    });

    return NextResponse.json({ success: true, data: { coverLetter } });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/regenerate-letter]", err);
    return NextResponse.json(
      { success: false, error: "Failed to regenerate cover letter" },
      { status: 500 }
    );
  }
}
