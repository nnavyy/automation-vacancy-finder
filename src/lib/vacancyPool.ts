// ============================================================
// Shared Vacancy Pool & Load-Balanced Multi-User Fan-Out
// ============================================================
// One HH crawl per query is cached in PoolVacancy and shared across
// all users whose profile matches either the query or related keywords.
// Includes staleness-prioritized load balancing so no single user
// monopolizes HH.ru crawl bandwidth.
// ============================================================

import prisma from "@/lib/db";
import {
  collectAllVacancies,
  checkVacancyStillOpen,
  MAX_VACANCIES_PER_USER,
} from "@/lib/hhPublicVacancyClient";
import { buildProfileRelatedKeywords } from "@/lib/ruleFilter";
import type { HHSalary, NormalizedVacancy, SearchPreferenceData } from "@/types";

const POOL_TTL_MS = 4 * 60 * 60 * 1000;          // refresh a query every 4h
const POOL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // drop rows not seen for 7 days
const POOL_MAX_ROWS = 6000;
const POOL_READ_LIMIT = MAX_VACANCIES_PER_USER + 50; // 250 candidates for 200 per-profile cap
const OPEN_CHECK_BATCH = 40;

// Load-balancing charge limits per sync tick
const MAX_STALE_QUERIES_PER_TICK = 6;
const REFRESH_CONCURRENCY = 2;

const queryKey = (q: string) => `113|${q.trim().toLowerCase()}`;

async function refreshSingleQuery(pref: SearchPreferenceData, query: string): Promise<number> {
  const key = queryKey(query);
  const found = await collectAllVacancies({
    ...pref,
    targetRoles: [query],
    searchKeywordsEn: [],
    searchKeywordsRu: [],
  });
  const ids = found.map((v) => v.hhId);

  if (ids.length > 0) {
    await prisma.poolVacancy.createMany({
      data: found.map((v) => ({
        hhId: v.hhId,
        title: v.title,
        company: v.company ?? null,
        area: v.area ?? null,
        salary: (v.salary as object) ?? undefined,
        url: v.url ?? null,
        description: v.description ?? null,
        descriptionHash: v.descriptionHash ?? null,
        queries: [query],
      })),
      skipDuplicates: true,
    });
    await prisma.poolVacancy.updateMany({
      where: { hhId: { in: ids }, NOT: { queries: { has: query } } },
      data: { queries: { push: query } },
    });
    await prisma.poolVacancy.updateMany({
      where: { hhId: { in: ids } },
      data: { lastSeenAt: new Date() },
    });
  }

  await prisma.poolQuery.upsert({
    where: { key },
    create: { key, fetchedAt: new Date() },
    update: { fetchedAt: new Date() },
  });

  return ids.length;
}

/**
 * Load-balanced query refresher: checks all queries in a single batch query,
 * picks at most MAX_STALE_QUERIES_PER_TICK stalest/missing queries, and refreshes
 * them with controlled concurrency so HH.ru is never flooded.
 */
export async function refreshStalePoolQueries(
  pref: SearchPreferenceData,
  queries: string[],
  maxQueriesToCrawl = MAX_STALE_QUERIES_PER_TICK,
): Promise<number> {
  if (queries.length === 0) return 0;

  const uniqueQueries = Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean)));
  const keys = uniqueQueries.map(queryKey);

  const existingMarkers = await prisma.poolQuery.findMany({
    where: { key: { in: keys } },
  });
  const markerMap = new Map(existingMarkers.map((m) => [m.key, m.fetchedAt.getTime()]));
  const now = Date.now();

  // Sort queries: never-fetched first (0), then oldest fetchedAt first
  const staleQueries = uniqueQueries
    .filter((q) => {
      const lastFetched = markerMap.get(queryKey(q)) ?? 0;
      return now - lastFetched >= POOL_TTL_MS;
    })
    .sort((a, b) => {
      const timeA = markerMap.get(queryKey(a)) ?? 0;
      const timeB = markerMap.get(queryKey(b)) ?? 0;
      return timeA - timeB;
    })
    .slice(0, maxQueriesToCrawl);

  if (staleQueries.length === 0) return 0;

  let nextIdx = 0;
  let totalIngested = 0;
  const workers = Array.from(
    { length: Math.min(REFRESH_CONCURRENCY, staleQueries.length) },
    async () => {
      while (nextIdx < staleQueries.length) {
        const q = staleQueries[nextIdx++];
        try {
          totalIngested += await refreshSingleQuery(pref, q);
        } catch (err) {
          console.error(`[Pool] refresh failed for "${q}":`, err);
        }
      }
    },
  );

  await Promise.all(workers);
  return totalIngested;
}

/**
 * Returns up to POOL_READ_LIMIT vacancies for a profile from our central PoolVacancy vault.
 * Spreads vacancies across users by matching both exact `queries` tags AND profile-related
 * title keywords (including adjacent roles like Web Design, UI/UX, and Vibe Coding).
 */
export async function getPoolVacancies(
  pref: SearchPreferenceData,
  queries: string[],
): Promise<NormalizedVacancy[]> {
  await refreshStalePoolQueries(pref, queries);

  const relatedTerms = buildProfileRelatedKeywords(pref).slice(0, 25);

  const rows = await prisma.poolVacancy.findMany({
    where: {
      OR: [
        { queries: { hasSome: queries } },
        ...relatedTerms.map((term) => ({
          title: { contains: term, mode: "insensitive" as const },
        })),
      ],
    },
    orderBy: { lastSeenAt: "desc" },
    take: POOL_READ_LIMIT,
  });

  return rows.map((r) => ({
    hhId: r.hhId,
    title: r.title,
    company: r.company ?? undefined,
    area: r.area ?? undefined,
    salary: (r.salary as HHSalary | null) ?? undefined,
    url: r.url ?? undefined,
    applyUrl: r.url ?? undefined,
    apiUrl: `https://api.hh.ru/vacancies/${r.hhId}`,
    description: r.description ?? undefined,
    descriptionHash: r.descriptionHash ?? undefined,
    sourceKeyword: r.queries[0] ?? pref.targetRoles?.[0] ?? "pool",
    rawData: r.hasFullDescription ? ({ poolFull: true } as never) : undefined,
    snippet: { requirement: r.description ?? undefined },
  }));
}

/** Deletes stale/closed/over-cap pool rows and expired query markers. */
export async function purgePool() {
  const now = Date.now();
  const stale = await prisma.poolVacancy.deleteMany({
    where: { lastSeenAt: { lt: new Date(now - POOL_MAX_AGE_MS) } },
  });
  await prisma.poolQuery.deleteMany({
    where: { fetchedAt: { lt: new Date(now - POOL_MAX_AGE_MS) } },
  });

  // Probe the least recently checked rows; delete the ones HH no longer serves.
  const batch = await prisma.poolVacancy.findMany({
    orderBy: { checkedAt: "asc" },
    take: OPEN_CHECK_BATCH,
    select: { hhId: true },
  });
  const closedIds: string[] = [];
  const openIds: string[] = [];
  await Promise.all(
    batch.map(async ({ hhId }) =>
      ((await checkVacancyStillOpen(hhId)) ? openIds : closedIds).push(hhId),
    ),
  );
  if (closedIds.length) {
    await prisma.poolVacancy.deleteMany({ where: { hhId: { in: closedIds } } });
  }
  if (openIds.length) {
    await prisma.poolVacancy.updateMany({
      where: { hhId: { in: openIds } },
      data: { checkedAt: new Date() },
    });
  }

  // Hard size cap: drop the oldest rows beyond POOL_MAX_ROWS.
  let capped = 0;
  const total = await prisma.poolVacancy.count();
  if (total > POOL_MAX_ROWS) {
    const cutoff = await prisma.poolVacancy.findMany({
      orderBy: { lastSeenAt: "desc" },
      skip: POOL_MAX_ROWS,
      take: 1,
      select: { lastSeenAt: true },
    });
    if (cutoff[0]) {
      capped = (
        await prisma.poolVacancy.deleteMany({
          where: { lastSeenAt: { lte: cutoff[0].lastSeenAt } },
        })
      ).count;
    }
  }

  return { stale: stale.count, closed: closedIds.length, capped };
}
