// ============================================================
// Nanda AI Job Assistant — Mark Vacancy as Applied
// ============================================================
// POST /api/vacancies/[id]/mark-applied
//
// Records that Nanda manually applied to this vacancy outside
// the automated pipeline (e.g. directly on HH.ru or via email).
//
// Body: { notes?: string }
//
// Actions performed:
//   1. Verify vacancy exists
//   2. Save VacancyFeedback (userAction: "apply")
//      + saveFeedback() also updates vacancy status → "applied_manual"
//      + saveFeedback() also writes an ApplicationLog entry
//   3. Return the updated vacancy with its analysis
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";

/**
 * POST /api/vacancies/[id]/mark-applied
 *
 * Marks the vacancy as manually applied.
 *
 * Body:  { notes?: string }
 *
 * Returns:
 *   200 { success: true, message: string, data: { ...vacancy, analysis } }
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

    // ── Save feedback + status update + log (via feedbackLearning) ──
    // saveFeedback("apply") → status: "applied_manual", creates VacancyFeedback,
    // creates ApplicationLog — all in one call.
    await saveFeedback(id, "apply", notes);

    // ── Return the refreshed vacancy with analysis ─────────
    const updated = await prisma.vacancy.findUnique({
      where: { id },
      include: { analysis: true },
    });

    return NextResponse.json({
      success: true,
      message: "Vacancy marked as applied",
      data: updated,
    });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/mark-applied]", err);
    return NextResponse.json(
      { success: false, error: "Failed to mark vacancy as applied" },
      { status: 500 }
    );
  }
}
