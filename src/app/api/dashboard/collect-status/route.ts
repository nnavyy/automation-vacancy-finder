import { NextResponse, after } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { buildProfileVacancyWhere, isProfileConfigured } from "@/lib/ruleFilter";
import { MAX_VACANCIES_PER_USER } from "@/lib/hhPublicVacancyClient";
import { runCollectionPipeline, getActivePipelineLoad } from "@/lib/collectionPipeline";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000; // Auto-trigger background sync if > 15m stale

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active preference" }, { status: 404 });
    }

    const profileConfigured = isProfileConfigured(pref);
    const genuine = buildProfileVacancyWhere(user.id, pref);

    const [
      latestVacancy,
      totalVacancies,
      statusGroups,
      scoreAgg,
      pendingCount,
      highScoreCount,
      maybeScoreCount,
      lowScoreCount,
    ] = await Promise.all([
      prisma.vacancy.findFirst({
        where: genuine,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.vacancy.count({ where: genuine }),
      prisma.vacancy.groupBy({
        by: ["status"],
        where: genuine,
        _count: { _all: true },
      }),
      prisma.vacancyAnalysis.aggregate({
        where: { vacancy: genuine },
        _avg: { matchScore: true },
        _count: { matchScore: true },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: genuine, aiStatus: { in: ["pending_limit", "pending_ai"] } },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: genuine, matchScore: { gte: 75 } },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: genuine, matchScore: { gte: 50, lt: 75 } },
      }),
      prisma.vacancyAnalysis.count({
        where: { vacancy: genuine, matchScore: { lt: 50 } },
      }),
    ]);

    let applied = 0;
    let skipped = 0;
    let saved = 0;
    for (const group of statusGroups) {
      const count = group._count._all;
      if (group.status === "applied_manual" || group.status === "applied_hh" || group.status === "applied_auto") {
        applied += count;
      } else if (group.status === "skipped" || group.status === "ignored" || group.status === "low_priority") {
        skipped += count;
      } else if (group.status === "saved") {
        saved += count;
      }
    }

    const statusObj = (pref.collectionStatus as {
      running?: boolean;
      startedAt?: string;
      finishedAt?: string;
    } | null) ?? null;

    const lastSyncedAt =
      statusObj?.finishedAt ??
      latestVacancy?.createdAt?.toISOString() ??
      pref.updatedAt?.toISOString() ??
      new Date().toISOString();

    // ── Continuous Auto-Sync Trigger (Load-Balanced) ───────────
    // Only auto-refresh in the background AFTER the user has configured their profile
    // AND has run collection at least once (`statusObj?.finishedAt` exists).
    // Never auto-start collection on an unconfigured or brand-new profile.
    const hasCompletedInitialRun = Boolean(statusObj?.finishedAt);
    const lastSyncMs = statusObj?.finishedAt ? new Date(statusObj.finishedAt).getTime() : 0;
    const isStale = hasCompletedInitialRun && Date.now() - lastSyncMs > AUTO_SYNC_INTERVAL_MS;
    const load = getActivePipelineLoad();

    if (profileConfigured && !statusObj?.running && isStale && load.canAcceptAuto) {
      after(async () => {
        try {
          await runCollectionPipeline(user.id, { maxDurationMs: 120_000, maxAiCalls: 25 });
        } catch (err) {
          console.error("[AutoSync] Background pipeline error:", err);
        }
      });
    }

    return NextResponse.json({
      success: true,
      profileConfigured,
      data: pref.collectionStatus || null,
      lastSyncedAt,
      syncIntervalMinutes: 15,
      loadBalancer: load,
      liveStats: {
        total: Math.min(totalVacancies, MAX_VACANCIES_PER_USER),
        applied,
        skipped,
        saved,
        aiPending: pendingCount,
        avgScore: scoreAgg._avg.matchScore ? Math.round(scoreAgg._avg.matchScore) : 0,
        highCount: highScoreCount,
        maybeCount: maybeScoreCount,
        lowCount: lowScoreCount,
        analyzedCount: Math.min(scoreAgg._count.matchScore ?? 0, MAX_VACANCIES_PER_USER),
      },
    });
  } catch (err) {
    console.error("[GET /api/dashboard/collect-status]", err);
    return NextResponse.json({ success: false, error: "Failed to check status" }, { status: 500 });
  }
}
