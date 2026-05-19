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
import prisma from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";

/**
 * POST /api/vacancies/[id]/save
 *
 * Bookmarks a vacancy for later review.
 *
 * Body:  { notes?: string }
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

    // ── Parse optional notes from body ────────────────────
    const body = await req.json().catch(() => ({})) as { notes?: string };
    const { notes } = body;

    // ── Save feedback + status update + log ───────────────
    // saveFeedback("save") → status: "saved", creates VacancyFeedback,
    // and creates ApplicationLog — all in one call.
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
