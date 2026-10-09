import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const [
      pref,
      latestVacancy,
      totalVacancies,
      statusGroups,
      scoreAgg,
      pendingCount,
      highScoreCount,
      maybeScoreCount,
      lowScoreCount,
    ] = await Promise.all([
      prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
        select: { collectionStatus: true, updatedAt: true },
      }),
      prisma.vacancy.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.vacancy.count({ where: { userId: user.id } }),
      prisma.vacancy.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: { _all: true },
      }),
      prisma.vacancyAnalysis.aggregate({
        where: { vacancy: { userId: user.id } },
        _avg: { matchScore: true },
        _count: { matchScore: true },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: { userId: user.id }, aiStatus: "pending_limit" },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: { userId: user.id }, matchScore: { gte: 75 } },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: { userId: user.id }, matchScore: { gte: 50, lt: 75 } },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: { userId: user.id }, matchScore: { lt: 50 } },
      }),
    ]);

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active preference" }, { status: 404 });
    }

    let applied = 0;
    let skipped = 0;
    let saved = 0;
    for (const group of statusGroups) {
      const count = group._count._all;
      if (group.status === "applied_manual" || group.status === "applied_hh" || group.status === "applied_auto") {
        applied += count;
      } else if (group.status === "skipped" || group.status === "ignored") {
        skipped += count;
      } else if (group.status === "saved") {
        saved += count;
      }
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
      liveStats: {
        total: totalVacancies,
        applied,
        skipped,
        saved,
        aiPending: pendingCount,
        avgScore: scoreAgg._avg.matchScore ? Math.round(scoreAgg._avg.matchScore) : 0,
        highCount: highScoreCount,
        maybeCount: maybeScoreCount,
        lowCount: lowScoreCount,
        analyzedCount: scoreAgg._count.matchScore ?? 0,
      },
    });
  } catch (err) {
    console.error("[GET /api/dashboard/collect-status]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500 });
  }
}
