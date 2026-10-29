// ============================================================
// Nanda AI Job Assistant — Dashboard Overview Page
// Fast, executive intelligence overview with live metrics and top matches
// ============================================================

import DashboardOverview from "@/components/DashboardOverview";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { buildProfileVacancyWhere } from "@/lib/ruleFilter";
import { MAX_VACANCIES_PER_USER } from "@/lib/hhPublicVacancyClient";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let topMatches: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userPref: any = null;
  let threshold = 65;

  try {
    const pref = await withRetry(() =>
      prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
      })
    );
    userPref = pref;
    threshold = pref?.minimumScoreToNotify ?? 65;

    // Profile-aware filter: matches target roles + adjacent domains (Web Design, Vibe Coding, etc.)
    // and excludes irrelevant noise (e.g. Media Buyer, Sales, Call Center)
    const baseGenuineFilter = buildProfileVacancyWhere(user.id, pref);

    // 5-day maximum window for Overview Top Matches
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const [
      allCount,
      statusGroups,
      scoreAgg,
      pendingCount,
      highScoreCount,
      maybeScoreCount,
      lowScoreCount,
      latestVacancy,
      filteredTopVacancies,
    ] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.count({ where: baseGenuineFilter }),
        prisma.vacancy.groupBy({
          by: ["status"],
          where: baseGenuineFilter,
          _count: { _all: true },
        }),
        prisma.vacancyAnalysis.aggregate({
          where: { vacancy: baseGenuineFilter },
          _avg: { matchScore: true },
          _count: { matchScore: true },
        }),
        prisma.vacancyAnalysis.count({
          where: { vacancy: baseGenuineFilter, aiStatus: { in: ["pending_limit", "pending_ai"] } },
        }),
        prisma.vacancyAnalysis.count({
          where: { vacancy: baseGenuineFilter, matchScore: { gte: 75 } },
        }),
        prisma.vacancyAnalysis.count({
          where: { vacancy: baseGenuineFilter, matchScore: { gte: 50, lt: 75 } },
        }),
        prisma.vacancyAnalysis.count({
          where: { vacancy: baseGenuineFilter, matchScore: { lt: 50 } },
        }),
        prisma.vacancy.findFirst({
          where: baseGenuineFilter,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        prisma.vacancy.findMany({
          where: {
            ...baseGenuineFilter,
            createdAt: { gte: fiveDaysAgo },
            status: { notIn: ["ignored", "low_priority", "skipped"] },
            analysis: {
              matchScore: { gte: threshold },
              recommendation: { not: "skip" },
            },
          },
          take: 6,
          orderBy: [
            { analysis: { matchScore: "desc" } },
            { createdAt: "desc" },
          ],
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
      ])
    );

    let finalTopMatches = filteredTopVacancies;
    if (finalTopMatches.length === 0) {
      // Fallback: Still strictly within the 5-day max window, show highest-scoring profile-related roles
      finalTopMatches = await withRetry(() =>
        prisma.vacancy.findMany({
          where: {
            ...baseGenuineFilter,
            createdAt: { gte: fiveDaysAgo },
            status: { notIn: ["ignored", "low_priority", "skipped"] },
            analysis: {
              matchScore: { gte: 45 },
              recommendation: { not: "skip" },
            },
          },
          take: 6,
          orderBy: [
            { analysis: { matchScore: "desc" } },
            { createdAt: "desc" },
          ],
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
        })
      );
    }

    total = Math.min(allCount, MAX_VACANCIES_PER_USER);
    topMatches = finalTopMatches;
    aiPending = pendingCount;
    avgScore = scoreAgg._avg.matchScore ? Math.round(scoreAgg._avg.matchScore) : 0;
    analyzedCount = Math.min(scoreAgg._count.matchScore ?? 0, MAX_VACANCIES_PER_USER);
    highCount = highScoreCount;
    maybeCount = maybeScoreCount;
    lowCount = lowScoreCount;
    lastSyncIso = latestVacancy?.createdAt ? latestVacancy.createdAt.toISOString() : undefined;

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
    url: v.hhId && /^\d+$/.test(v.hhId) ? `https://hh.ru/vacancy/${v.hhId}` : (v.url ?? undefined),
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
      matchThreshold={threshold}
    />
  );
}
