// ============================================================
// Nanda AI Job Assistant — Single Vacancy Detail
// ============================================================
// GET /api/vacancies/[id]
//
// Returns a single vacancy with its full analysis, feedback history,
// and application log entries.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fetchVacancyJsonLd } from "@/lib/hhPublicVacancyClient";

/**
 * GET /api/vacancies/[id]
 *
 * Fetch a single vacancy by its internal Prisma ID, along with:
 *  - Full VacancyAnalysis record (matchScore, recommendation, coverLetter, etc.)
 *  - All VacancyFeedback entries sorted newest-first
 *  - All ApplicationLog entries sorted newest-first
 *
 * Returns:
 *   200 { success: true, data: { ...vacancy, analysis, feedbacks, logs } }
 *   404 { success: false, error: "Vacancy not found" }
 *   500 { success: false, error: string }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      include: {
        // Full analysis — all fields including cover letter, questions, red flags
        analysis: true,
        // Feedback history — newest first
        feedbacks: {
          orderBy: { createdAt: "desc" },
        },
        // Application log — newest first
        logs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    // Auto-enrich description if it seems short (e.g., just the snippet)
    if (vacancy.url && (!vacancy.description || vacancy.description.length < 500)) {
      try {
        const fullDesc = await fetchVacancyJsonLd(vacancy.url);
        if (fullDesc && fullDesc.length > (vacancy.description?.length || 0)) {
          vacancy.description = fullDesc;
          // Update it in the background to avoid blocking
          prisma.vacancy.update({
            where: { id: vacancy.id },
            data: { description: fullDesc },
          }).catch(console.error);
        }
      } catch (err) {
        console.warn(`[GET /api/vacancies/[id]] Failed to enrich description for ${id}`, err);
      }
    }

    return NextResponse.json({ success: true, data: vacancy });
  } catch (err) {
    console.error("[GET /api/vacancies/[id]]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vacancy" },
      { status: 500 }
    );
  }
}
