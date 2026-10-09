import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [pref, latestVacancy] = await Promise.all([
      prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
        select: { collectionStatus: true, updatedAt: true },
      }),
      prisma.vacancy.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active preference" }, { status: 404 });
    }

    const lastSyncedAt =
      latestVacancy?.createdAt?.toISOString() ??
      pref.updatedAt?.toISOString() ??
      new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: pref.collectionStatus || null,
      lastSyncedAt,
      syncIntervalMinutes: 30,
    });
  } catch (err) {
    console.error("[GET /api/dashboard/collect-status]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500 });
  }
}
