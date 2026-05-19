// ============================================================
// Nanda AI Job Assistant — Vacancies List
// ============================================================
// GET /api/vacancies
//
// Returns a paginated, filterable list of vacancies.
// Each item includes a lightweight inline analysis summary.
//
// Query parameters:
//   status    — filter by vacancy status (optional)
//   minScore  — minimum AI match score (optional, 0–100)
//   page      — current page number (default: 1)
//   limit     — items per page (default: 20)
//   sortBy    — "createdAt" | "matchScore" (default: "createdAt")
//   order     — "asc" | "desc" (default: "desc")
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import type { VacancyStatus } from "@/types";

/**
 * GET /api/vacancies
 *
 * List vacancies with optional filtering and pagination.
 *
 * Returns:
 *   200 {
 *     success: true,
 *     data: { vacancies: [...], total: number, page: number, totalPages: number }
 *   }
 *   500 { success: false, error: string }
 */
export async function GET(req: NextRequest) {
  const user = await requireUser();
  try {
    const { searchParams } = new URL(req.url);

    // ── Parse query params ────────────────────────────────
    const status = searchParams.get("status") as VacancyStatus | null;
    const minScoreRaw = searchParams.get("minScore");
    const minScore =
      minScoreRaw !== null ? parseInt(minScoreRaw, 10) : undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const orderRaw = searchParams.get("order") ?? "desc";
    const order: "asc" | "desc" = orderRaw === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // ── Build Prisma where clause ─────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { userId: user.id };

    if (status) {
      where.status = status;
    }

    // Filtering by minScore requires filtering through the analysis relation.
    // Vacancies without an analysis record will be excluded when minScore is set.
    if (minScore !== undefined && !isNaN(minScore)) {
      where.analysis = { matchScore: { gte: minScore } };
    }

    // ── Build orderBy clause ──────────────────────────────
    // Prisma v5 supports ordering by one-to-one relation fields.
    // Vacancies without an analysis are sorted with nulls last (DB default).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: Record<string, any> =
      sortBy === "matchScore"
        ? { analysis: { matchScore: order } }
        : { createdAt: order };

    // ── Execute queries in parallel ───────────────────────
    const [vacancies, total] = await Promise.all([
      prisma.vacancy.findMany({
        where,
        skip,
        take: limit,
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
          // Lightweight analysis summary — avoids loading cover letter / full text
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
      }),
      prisma.vacancy.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vacancies,
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
