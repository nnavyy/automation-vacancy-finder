// GET /api/vacancies/recommended
// AI-scored best matches for the user's profile. Each candidate is probed on
// HH first; vacancies that were taken down are deleted (saved/applied ones are kept).

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { checkVacancyStillOpen } from "@/lib/hhPublicVacancyClient";
import { PENDING_AI_STATUSES } from "@/lib/pendingAiRetry";

const LIMIT = 10;
const KEEP_STATUSES = ["saved", "applied_manual", "applied_hh", "applied_auto"];

export async function GET() {
  const user = await getApiUser();
  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
      select: { minimumScoreToNotify: true },
    });

    const candidates = await prisma.vacancy.findMany({
      where: {
        userId: user.id,
        status: { in: ["analyzed", "notified", "saved"] },
        NOT: { hhId: { startsWith: "manual-" } },
        analysis: {
          matchScore: { gte: pref?.minimumScoreToNotify ?? 70 },
          aiStatus: { notIn: PENDING_AI_STATUSES },
        },
      },
      orderBy: { analysis: { matchScore: "desc" } },
      take: LIMIT + 2, // each candidate costs one live HH probe
      select: {
        id: true, hhId: true, title: true, company: true, area: true, salary: true, url: true, status: true,
        analysis: { select: { matchScore: true, recommendation: true, summary: true, matchReasons: true } },
      },
    });

    const open = await Promise.all(candidates.map((v) => checkVacancyStillOpen(v.hhId)));
    const closed = candidates.filter((v, i) => !open[i]);
    const deletable = closed.filter((v) => !KEEP_STATUSES.includes(v.status)).map((v) => v.id);
    if (deletable.length) {
      await prisma.vacancy.deleteMany({ where: { id: { in: deletable }, userId: user.id } });
    }
    const closedIds = new Set(closed.map((v) => v.id));

    return NextResponse.json({
      success: true,
      data: candidates.filter((v) => !closedIds.has(v.id)).slice(0, LIMIT),
    });
  } catch (err) {
    console.error("[GET /api/vacancies/recommended]", err);
    return NextResponse.json({ success: false, error: "Failed to load recommendations" }, { status: 500 });
  }
}

