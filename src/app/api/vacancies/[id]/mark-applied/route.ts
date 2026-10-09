// ============================================================
// Nanda AI Job Assistant — Mark Vacancy as Applied
// ============================================================
// POST /api/vacancies/[id]/mark-applied

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
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

    await saveFeedback(id, "apply", notes);

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
