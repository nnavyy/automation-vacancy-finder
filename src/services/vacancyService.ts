// ============================================================
// Vacancy Service Layer
// ============================================================
// Encapsulates data access and domain operations for vacancies.
// Decouples API routes, server actions, and pipelines from raw Prisma queries.
// ============================================================

import prisma, { withRetry } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface VacancyQueryOptions {
  userId: string;
  status?: string | string[];
  page?: number;
  limit?: number;
  orderBy?: "desc" | "asc";
}

export interface VacancyMetrics {
  total: number;
  applied: number;
  skipped: number;
  saved: number;
  pendingAi: number;
  averageScore: number;
}

export const VacancyService = {
  /**
   * Retrieves paginated vacancies for a specific user with filter isolation.
   */
  async findUserVacancies(options: VacancyQueryOptions) {
    const { userId, status, page = 1, limit = 20, orderBy = "desc" } = options;
    const skip = Math.max(0, (page - 1) * limit);

    const where: Prisma.VacancyWhereInput = {
      userId,
      NOT: { hhId: { startsWith: "manual-" } },
      url: { startsWith: "http" },
    };
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else if (status) {
      where.status = status;
    }

    return withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: orderBy },
          select: {
            id: true,
            hhId: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            url: true,
            status: true,
            rawData: true,
            createdAt: true,
            updatedAt: true,
            analysis: {
              select: {
                matchScore: true,
                recommendation: true,
                aiStatus: true,
                redFlags: true,
              },
            },
          },
        }),
        prisma.vacancy.count({ where }),
      ])
    );
  },

  /**
   * Finds a single vacancy by ID ensuring multi-tenant user ownership.
   */
  async findUserVacancyById(userId: string, id: string) {
    return withRetry(() =>
      prisma.vacancy.findFirst({
        where: { id, userId },
        include: {
          analysis: true,
          logs: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          feedbacks: true,
        },
      })
    );
  },

  /**
   * Updates vacancy status safely with ownership validation.
   */
  async updateStatus(userId: string, id: string, status: string, notes?: string) {
    return withRetry(async () => {
      const existing = await prisma.vacancy.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new Error("Vacancy not found or access denied.");
      }

      const updated = await prisma.vacancy.update({
        where: { id },
        data: { status },
      });

      if (notes) {
        await prisma.applicationLog.create({
          data: {
            vacancyId: id,
            action: status,
            notes,
          },
        });
      }

      return updated;
    });
  },

  /**
   * Calculates dashboard summary metrics for a user.
   */
  async getMetrics(userId: string): Promise<VacancyMetrics> {
    return withRetry(async () => {
      const all = await prisma.vacancy.findMany({
        where: { userId },
        select: {
          status: true,
          analysis: { select: { matchScore: true, aiStatus: true } },
        },
      });

      const total = all.length;
      const applied = all.filter((v) => v.status === "applied_manual" || v.status === "applied_hh").length;
      const skipped = all.filter((v) => v.status === "skipped").length;
      const saved = all.filter((v) => v.status === "saved").length;
      const pendingAi = all.filter((v) => v.analysis?.aiStatus === "pending_limit").length;

      const scores = all
        .filter((v) => v.analysis?.matchScore !== undefined && v.analysis.matchScore !== null)
        .map((v) => v.analysis!.matchScore);

      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      return { total, applied, skipped, saved, pendingAi, averageScore };
    });
  },
};

export default VacancyService;
