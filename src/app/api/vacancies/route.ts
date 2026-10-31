import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { buildProfileVacancyWhere } from "@/lib/ruleFilter";
import { MAX_VACANCIES_PER_USER } from "@/lib/hhPublicVacancyClient";
import type { VacancyStatus } from "@/types";

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") as VacancyStatus | null;
    const minScoreRaw = searchParams.get("minScore");
    const minScore =
      minScoreRaw !== null ? parseInt(minScoreRaw, 10) : undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );
    if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit)) {
      return NextResponse.json({ success: false, error: "Invalid pagination parameters" }, { status: 400 });
    }
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const orderRaw = searchParams.get("order") ?? "desc";
    const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = buildProfileVacancyWhere(user.id, pref);

    if (status) {
      where.status = status;
    }

    if (minScore !== undefined && !isNaN(minScore)) {
      where.analysis = { matchScore: { gte: minScore } };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: Record<string, any> =
      sortBy === "matchScore"
        ? { analysis: { matchScore: order } }
        : { createdAt: order };

    const remainingQuota = Math.max(0, MAX_VACANCIES_PER_USER - skip);
    const effectiveTake = Math.min(limit, remainingQuota);

    const [vacancies, rawTotal] = await Promise.all([
      effectiveTake > 0
        ? prisma.vacancy.findMany({
            where,
            skip,
            take: effectiveTake,
            orderBy,
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
              updatedAt: true,
              analysis: {
                select: {
                  matchScore: true,
                  recommendation: true,
                  aiStatus: true,
                  redFlags: true,
                  bestLanguage: true,
                  confidence: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.vacancy.count({ where }),
    ]);

    const total = Math.min(rawTotal, MAX_VACANCIES_PER_USER);
    const mappedVacancies = vacancies.map((v) => ({
      ...v,
      url: v.hhId && /^\d+$/.test(v.hhId) ? `https://hh.ru/vacancy/${v.hhId}` : v.url,
    }));

    return NextResponse.json({
      success: true,
      data: {
        vacancies: mappedVacancies,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/vacancies]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vacancies" },
      { status: 500 }
    );
  }
}
