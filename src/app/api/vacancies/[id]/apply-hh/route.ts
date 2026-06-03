import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { applyToVacancy } from "@/lib/hhPrivateClient";
import { saveFeedback } from "@/lib/feedbackLearning";

/**
 * POST /api/vacancies/[id]/apply-hh
 * 
 * Submits an application directly to HH.ru using the stored session token,
 * resume, and AI-generated cover letter.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // 1. Fetch the vacancy and its analysis (for the cover letter)
    const vacancy = await prisma.vacancy.findUnique({
      where: { id, userId: user.id },
      include: { analysis: true },
    });

    if (!vacancy) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 });
    }

    if (!vacancy.analysis?.coverLetter) {
      return NextResponse.json({ success: false, error: "No AI cover letter generated yet. Please generate one first." }, { status: 400 });
    }

    // 2. Fetch user's settings to get HH credentials
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!pref?.hhToken || !pref?.hhResumeId) {
      return NextResponse.json(
        { success: false, error: "HH.ru integration is incomplete. Please configure your token and resume in Settings." },
        { status: 400 }
      );
    }

    // 3. Make the API call to HH.ru
    const coverLetterText = vacancy.analysis.coverLetter;
    const hhVacancyId = vacancy.hhId;
    
    await applyToVacancy(pref.hhToken, pref.hhResumeId, hhVacancyId, coverLetterText);

    // 4. Update local state using saveFeedback (treat as applied_hh)
    // We will map it to "applied_hh" to distinguish from "apply" (manual)
    // But since "apply" maps to applied_manual in ruleFilters... actually let's just use "apply" but add a note.
    await saveFeedback(id, "apply", "Automated apply via HH.ru with AI Cover Letter");
    
    // We can manually update the status to "applied_hh" if we want to differentiate
    await prisma.vacancy.update({
      where: { id },
      data: { status: "applied_hh" }
    });

    // Return the updated vacancy
    const updated = await prisma.vacancy.findUnique({
      where: { id },
      include: { analysis: true, logs: true },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully applied via HH.ru!",
      data: updated,
    });

  } catch (error: any) {
    console.error(`[POST /api/vacancies/[id]/apply-hh]`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply via HH.ru" },
      { status: 500 }
    );
  }
}
