import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      select: { company: true },
    });

    if (!vacancy) {
      return NextResponse.json(
        { success: false, error: "Vacancy not found" },
        { status: 404 }
      );
    }

    if (!vacancy.company) {
      return NextResponse.json(
        { success: false, error: "Company name is empty for this vacancy" },
        { status: 400 }
      );
    }

    // Get the active search preference (since there's currently only one active at a time)
    const pref = await prisma.searchPreference.findFirst({
      where: { isActive: true },
    });

    if (pref) {
      // Add company to excludeKeywords if not already there
      const currentExclude = (pref.excludeKeywords as string[]) || [];
      if (!currentExclude.includes(vacancy.company)) {
        await prisma.searchPreference.update({
          where: { id: pref.id },
          data: {
            excludeKeywords: [...currentExclude, vacancy.company],
          },
        });
      }
    }

    // Update vacancy status to "ignored"
    await prisma.vacancy.update({
      where: { id },
      data: { status: "ignored" },
    });

    // Log the action
    await prisma.applicationLog.create({
      data: {
        vacancyId: id,
        action: "block_company",
        notes: `Blocked company: ${vacancy.company}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/vacancies/[id]/block-company]", err);
    return NextResponse.json(
      { success: false, error: "Failed to block company" },
      { status: 500 }
    );
  }
}
