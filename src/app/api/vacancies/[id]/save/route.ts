// ============================================================
// Nanda AI Job Assistant — Save Vacancy for Later
// ============================================================
// POST /api/vacancies/[id]/save
//
// Saves a vacancy for later review without committing to apply.
// Useful for bookmarking interesting roles found during a session.
//
// Body: { notes?: string }
//
// Actions performed:
//   1. Verify vacancy exists
//   2. Save VacancyFeedback (userAction: "save")
//      + saveFeedback() also updates vacancy status → "saved"
//      + saveFeedback() also writes an ApplicationLog entry
//   3. Return success
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { saveFeedback } from "@/lib/feedbackLearning";
import { getApiUser, getOwnedVacancy } from "@/lib/auth-helpers";

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
    const vacancy = await getOwnedVacancy(id, user.id);
    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({})) as { notes?: string };
    const { notes } = body;

    await saveFeedback(id, "save", notes);

    return NextResponse.json({
      success: true,
      message: "Vacancy saved for later",
    });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/save]", err);
    return NextResponse.json(
      { success: false, error: "Failed to save vacancy" },
      { status: 500 }
    );
  }
}

