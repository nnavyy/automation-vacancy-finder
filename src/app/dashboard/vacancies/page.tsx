// ============================================================
// Nanda AI Job Assistant — Vacancies Master-Detail Page
// Server component fetching initial dataset -> interactive split view
// ============================================================

import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import VacanciesSplitView, { VacancyItem } from "@/components/VacanciesSplitView";

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = (sp.status as string) ?? "";
  const page = Math.max(1, parseInt((sp.page as string) ?? "1", 10));
  const limit = 50; // Increased limit so user has plenty of items to browse quickly
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId: user.id };
  if (status === "applied_manual") {
    where.status = { in: ["applied_manual", "applied_hh"] };
  } else if (status) {
    where.status = status;
  }

  let vacancies: any[] = [];
  let total = 0;
  let hasProfile = false;

  try {
    const profileCount = await withRetry(() =>
      prisma.searchPreference.count({ where: { userId: user.id } })
    );
    hasProfile = profileCount > 0;

    [vacancies, total] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            hhId: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            url: true,
            status: true,
            description: true,
            createdAt: true,
            rawData: true,
            analysis: {
              select: {
                matchScore: true,
                ruleScore: true,
                recommendation: true,
                aiStatus: true,
                summary: true,
                matchReasons: true,
                missingRequirements: true,
                redFlags: true,
                coverLetter: true,
                questions: true,
                modelUsed: true,
                bestLanguage: true,
              },
            },
          },
        }),
        prisma.vacancy.count({ where }),
      ])
    );
  } catch (err) {
    console.error("[Vacancies Page] Database error:", err);
    throw err;
  }

  // Format vacancies for split view
  const formattedVacancies: VacancyItem[] = vacancies.map((v) => ({
    id: v.id,
    hhId: v.hhId,
    title: v.title,
    company: v.company,
    area: v.area ?? undefined,
    salary: v.salary,
    url: v.url ?? undefined,
    status: v.status,
    description: v.description ?? undefined,
    createdAt: v.createdAt.toISOString(),
    rawData: v.rawData,
    analysis: v.analysis
      ? {
          matchScore: v.analysis.matchScore,
          ruleScore: v.analysis.ruleScore ?? undefined,
          recommendation: v.analysis.recommendation,
          aiStatus: v.analysis.aiStatus,
          summary: v.analysis.summary ?? undefined,
          matchReasons: Array.isArray(v.analysis.matchReasons)
            ? (v.analysis.matchReasons as string[])
            : undefined,
          missingRequirements: Array.isArray(v.analysis.missingRequirements)
            ? (v.analysis.missingRequirements as string[])
            : undefined,
          redFlags: Array.isArray(v.analysis.redFlags)
            ? (v.analysis.redFlags as any[])
            : undefined,
          coverLetter: v.analysis.coverLetter ?? undefined,
          questions: Array.isArray(v.analysis.questions)
            ? (v.analysis.questions as string[])
            : undefined,
          modelUsed: v.analysis.modelUsed ?? undefined,
          bestLanguage: v.analysis.bestLanguage ?? undefined,
        }
      : undefined,
  }));

  return (
    <div className="max-w-7xl space-y-5 pb-12">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
          Vacancies
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          AI-evaluated job opportunities synchronized from HeadHunter matching your target profile
        </p>
      </div>

      {/* ── Split Master-Detail View ── */}
      <VacanciesSplitView
        initialVacancies={formattedVacancies}
        totalCount={total}
        hasProfile={hasProfile}
      />
    </div>
  );
}
