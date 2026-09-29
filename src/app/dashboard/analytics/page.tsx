// ============================================================
// Nanda AI Job Assistant — Analytics & Pipeline Intelligence
// Visual pipeline attrition funnel, score spectrum, and skill correlation
// ============================================================

import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const user = await requireUser();

  let vacancies: any[] = [];
  let total = 0;

  try {
    [vacancies, total] = await Promise.all([
      prisma.vacancy.findMany({
        where: { userId: user.id },
        take: 1000,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          company: true,
          status: true,
          createdAt: true,
          analysis: {
            select: {
              matchScore: true,
              recommendation: true,
              aiStatus: true,
              missingRequirements: true,
              redFlags: true,
            },
          },
        },
      }),
      prisma.vacancy.count({ where: { userId: user.id } }),
    ]);
  } catch (err) {
    console.error("[Analytics Page] Error:", err);
  }

  const formattedVacancies = vacancies.map((v) => ({
    id: v.id,
    title: v.title,
    company: v.company,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    analysis: v.analysis
      ? {
          matchScore: v.analysis.matchScore,
          recommendation: v.analysis.recommendation,
          aiStatus: v.analysis.aiStatus,
          missingRequirements: v.analysis.missingRequirements,
          redFlags: v.analysis.redFlags,
        }
      : null,
  }));

  return (
    <AnalyticsDashboard
      initialVacancies={formattedVacancies}
      totalCount={total}
    />
  );
}
