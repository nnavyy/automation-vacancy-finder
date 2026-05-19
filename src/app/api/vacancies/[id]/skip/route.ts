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
import { saveFeedback } from "@/lib/feedbackLearning";

/**
 * POST /api/vacancies/[id]/skip
 *
 * Skips a vacancy and optionally records the reason.
 *
 * Body:  { reason?: string }
 *
 * Returns:
 *   200 { success: true, message: string }
 *   404 { success: false, error: "Vacancy not found" }
 *   500 { success: false, error: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── Validate vacancy exists ───────────────────────────
    const vacancy = await prisma.vacancy.findUnique({ where: { id } });
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
