// ============================================================
// Nanda AI Job Assistant — Skip Vacancy
// ============================================================
// POST /api/vacancies/[id]/skip
//
// Marks a vacancy as skipped and records the optional reason.
// This feedback is used by the AI to personalise future scoring.
//
// Body: { reason?: string }
//
// Actions performed:
//   1. Verify vacancy exists
//   2. Save VacancyFeedback (userAction: "skip", userReason: reason)
//      + saveFeedback() also updates vacancy status → "skipped"
//      + saveFeedback() also writes an ApplicationLog entry
//   3. Return success
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { saveFeedback } from "@/lib/feedbackLearning";

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

    // ── Validate vacancy belongs to authenticated user ────
    const vacancy = await prisma.vacancy.findFirst({ where: { id, userId: user.id } });
    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // ── Parse optional skip reason from body ──────────────
    const body = await req.json().catch(() => ({})) as { reason?: string };
    const { reason } = body;

    // ── Save feedback + status update + log ───────────────
    // saveFeedback("skip") → status: "skipped", creates VacancyFeedback
    // with userReason, and creates ApplicationLog — all in one call.
    await saveFeedback(id, "skip", reason);

    return NextResponse.json({
      success: true,
      message: "Vacancy skipped",
    });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/skip]", err);
    return NextResponse.json(
      { success: false, error: "Failed to skip vacancy" },
      { status: 500 }
    );
  }
}
