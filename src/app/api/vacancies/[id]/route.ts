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
import { getApiUser } from "@/lib/auth-helpers";
import { fetchVacancyJsonLd } from "@/lib/hhPublicVacancyClient";

/**
 * GET /api/vacancies/[id]
 *
 * Fetch a single vacancy belonging to the authenticated user.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const vacancy = await prisma.vacancy.findFirst({
      where: { id, userId: user.id },
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
