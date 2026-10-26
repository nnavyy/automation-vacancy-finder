import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser, getOwnedVacancy } from "@/lib/auth-helpers";

const ALLOWED_STATUSES = new Set([
  "new",
  "analyzed",
  "saved",
  "applied_manual",
  "applied_auto",
  "applied_hh",
  "skipped",
  "ignored",
  "interview",
  "rejected",
  "offer",
  "notified",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!vacancy || vacancy.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { status, notes } = body;

    if (!status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.vacancy.update({
      where: { id },
      data: { status },
      select: { id: true, status: true, updatedAt: true },
    });

    // Non-blocking application log write
    prisma.applicationLog.create({
      data: {
        vacancyId: id,
        action: `status_change_to_${status}`,
        notes: notes || `Status updated to ${status} via API`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      vacancy: updated,
    });
  } catch (err: any) {
    console.error("[PATCH /api/vacancies/[id]/status]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update vacancy status" },
      { status: 500 }
    );
  }
}
