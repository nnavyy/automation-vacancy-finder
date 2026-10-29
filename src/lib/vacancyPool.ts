// ============================================================
// Shared Vacancy Pool
// ============================================================
// One HH crawl per (query) is cached in PoolVacancy and reused by every
// user whose profile has the same query, so users never hit HH one by one.
// purgePool() keeps the table small: stale, closed and over-cap rows are deleted.
// ============================================================

import prisma from "@/lib/db";
import { collectAllVacancies, checkVacancyStillOpen } from "@/lib/hhPublicVacancyClient";
import type { HHSalary, NormalizedVacancy, SearchPreferenceData } from "@/types";

const POOL_TTL_MS = 6 * 60 * 60 * 1000;        // re-crawl a query at most every 6h
const POOL_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // drop rows not seen for 7 days
const POOL_MAX_ROWS = 5000;
const POOL_READ_LIMIT = 150;                    // a bit above the ~100 per-user cap
const OPEN_CHECK_BATCH = 40;

const queryKey = (q: string) => `113|${q.trim().toLowerCase()}`;

async function refreshQuery(pref: SearchPreferenceData, query: string) {
  const key = queryKey(query);
  const fresh = await prisma.poolQuery.findUnique({ where: { key } });
  if (fresh && Date.now() - fresh.fetchedAt.getTime() < POOL_TTL_MS) return;

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
    create: { key },
    update: { fetchedAt: new Date() },
  });
}

/**
 * Returns vacancies for a profile from the shared pool, crawling HH only
 * for queries that nobody refreshed recently.
 */
export async function getPoolVacancies(
  pref: SearchPreferenceData,
  queries: string[]
): Promise<NormalizedVacancy[]> {
  for (const q of queries) {
    try {
      await refreshQuery(pref, q);
    } catch (err) {
      console.error(`[Pool] refresh failed for "${q}":`, err);
    }
  }

  const rows = await prisma.poolVacancy.findMany({
    where: { queries: { hasSome: queries } },
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
    sourceKeyword: r.queries[0],
    snippet: { requirement: r.description ?? undefined },
  }));
}

/** Deletes stale/closed/over-cap pool rows and expired query markers. */
export async function purgePool() {
  const now = Date.now();
  const stale = await prisma.poolVacancy.deleteMany({
    where: { lastSeenAt: { lt: new Date(now - POOL_MAX_AGE_MS) } },
  });
  await prisma.poolQuery.deleteMany({ where: { fetchedAt: { lt: new Date(now - POOL_MAX_AGE_MS) } } });

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
      ((await checkVacancyStillOpen(hhId)) ? openIds : closedIds).push(hhId)
    )
  );
  if (closedIds.length) await prisma.poolVacancy.deleteMany({ where: { hhId: { in: closedIds } } });
  if (openIds.length) {
    await prisma.poolVacancy.updateMany({ where: { hhId: { in: openIds } }, data: { checkedAt: new Date() } });
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
      capped = (await prisma.poolVacancy.deleteMany({ where: { lastSeenAt: { lte: cutoff[0].lastSeenAt } } })).count;
    }
  }

  return { stale: stale.count, closed: closedIds.length, capped };
}

