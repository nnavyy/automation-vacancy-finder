// ============================================================
// Nanda AI Job Assistant — Dashboard Overview Page
// Fast, executive intelligence overview with live metrics and top matches
// ============================================================

import DashboardOverview from "@/components/DashboardOverview";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const user = await requireUser();
  let total = 0;
  let applied = 0;
  let skipped = 0;
  let saved = 0;
  let aiPending = 0;
  let avgScore = 0;
  let highCount = 0;
  let maybeCount = 0;
  let lowCount = 0;
  let analyzedCount = 0;
  let lastSyncIso: string | undefined;
  let topMatches: any[] = [];
  let userPref: any = null;

  try {
    const [
      allCount,
      statusGroups,
      scoreAgg,
      pendingCount,
      highScoreCount,
      maybeScoreCount,
      lowScoreCount,
      latestVacancy,
      topVacancies,
      pref,
    ] = await withRetry(() =>
      Promise.all([
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
        prisma.vacancy.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.vacancy.findMany({
          where: {
            userId: user.id,
            analysis: { isNot: null },
          },
          take: 5,
          orderBy: { analysis: { matchScore: "desc" } },
          select: {
            id: true,
            hhId: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            url: true,
            status: true,
            createdAt: true,
            analysis: {
              select: {
                matchScore: true,
                recommendation: true,
                summary: true,
                matchReasons: true,
              },
            },
          },
        }),
        prisma.searchPreference.findFirst({
          where: { userId: user.id, isActive: true },
        }),
      ])
    );

    total = allCount;
    topMatches = topVacancies;
    userPref = pref;
    aiPending = pendingCount;
    avgScore = scoreAgg._avg.matchScore ? Math.round(scoreAgg._avg.matchScore) : 0;
    analyzedCount = scoreAgg._count.matchScore ?? 0;
    highCount = highScoreCount;
    maybeCount = maybeScoreCount;
    lowCount = lowScoreCount;
    lastSyncIso = latestVacancy?.createdAt ? latestVacancy.createdAt.toISOString() : undefined;

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
  } catch (err) {
    console.error("[Dashboard] Failed to fetch data:", err);
    throw err;
  }

  const targetRoles = userPref?.targetRoles ?? ["Frontend Developer", "Full Stack", "AI Engineer"];

  const formattedTopMatches = topMatches.map((v) => ({
    id: v.id,
    hhId: v.hhId,
    title: v.title,
    company: v.company,
    area: v.area ?? undefined,
    salary: v.salary,
    url: v.url ?? undefined,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    analysis: v.analysis
      ? {
          matchScore: v.analysis.matchScore,
          recommendation: v.analysis.recommendation,
          summary: v.analysis.summary ?? undefined,
          matchReasons: Array.isArray(v.analysis.matchReasons)
            ? (v.analysis.matchReasons as string[])
            : undefined,
        }
      : undefined,
  }));

  return (
    <DashboardOverview
      total={total}
      applied={applied}
      skipped={skipped}
      saved={saved}
      aiPending={aiPending}
      avgScore={avgScore}
      highCount={highCount}
      maybeCount={maybeCount}
      lowCount={lowCount}
      analyzedCount={analyzedCount}
      lastSyncIso={lastSyncIso}
      topMatches={formattedTopMatches}
      targetRoles={targetRoles}
    />
  );
}
