// ============================================================
// Nanda AI Job Assistant — Vacancies Master-Detail Page
// Server component fetching initial dataset -> interactive split view
// ============================================================

import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import VacanciesSplitView, { VacancyItem } from "@/components/VacanciesSplitView";
import { calculateRuleScore } from "@/lib/scoring";
import { toSearchPrefData } from "@/lib/collectionPipeline";

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = (sp.status as string) ?? "";
  const page = Math.max(1, parseInt((sp.page as string) ?? "1", 10));
  const dateRange = ((sp.dateRange as string) ?? "7d").toLowerCase();
  const limit = 50;
  const skip = (page - 1) * limit;

  // Date cutoff: default last 7 days as requested
  let dateCutoff: Date | undefined = undefined;
  if (dateRange === "7d") {
    dateCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "14d") {
    dateCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "30d") {
    dateCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  // Base filter guarantees strictly genuine HH vacancies with valid working URLs
  const baseGenuineFilter = {
    userId: user.id,
    NOT: { hhId: { startsWith: "manual-" } },
    url: { startsWith: "http" },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { ...baseGenuineFilter };
  if (status === "applied_manual") {
    where.status = { in: ["applied_manual", "applied_hh"] };
  } else if (status === "skip" || status === "ignored") {
    where.status = { in: ["skipped", "ignored", "low_priority"] };
  } else if (status) {
    where.status = status;
  } else {
    // Default: prioritize active matching opportunities, exclude non-target/spam
    where.status = { notIn: ["ignored", "low_priority", "skipped"] };
  }

  if (dateCutoff) {
    where.createdAt = { gte: dateCutoff };
  }

  let vacancies: any[] = [];
  let total = 0;
  let totalActive = 0;
  let totalAll = 0;
  let totalSkipped = 0;
  let hasProfile = false;
  let minScoreThreshold = 70;
  let prefData: any = undefined;

  try {
    const profile =
      (await withRetry(() =>
        prisma.searchPreference.findFirst({ where: { userId: user.id, isActive: true } })
      )) ||
      (await withRetry(() =>
        prisma.searchPreference.findFirst({ where: { userId: user.id } })
      ));
    hasProfile = Boolean(profile);
    if (profile) {
      prefData = toSearchPrefData(profile);
    }
    if (profile?.minimumScoreToNotify) {
      minScoreThreshold = profile.minimumScoreToNotify;
    }

    [vacancies, total, totalActive, totalAll, totalSkipped] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where,
          skip,
          take: limit,
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
        prisma.vacancy.count({
          where: {
            ...baseGenuineFilter,
            status: { notIn: ["ignored", "low_priority", "skipped"] },
          },
        }),
        prisma.vacancy.count({ where: baseGenuineFilter }),
        prisma.vacancy.count({
          where: {
            ...baseGenuineFilter,
            status: { in: ["ignored", "low_priority", "skipped"] },
          },
        }),
      ])
    );
  } catch (err) {
    console.error("[Vacancies Page] Database error:", err);
    throw err;
  }

  // Format vacancies for split view with on-the-fly rule score fallback
  const formattedVacancies: VacancyItem[] = vacancies.map((v) => {
    const rawObj = typeof v.rawData === "object" && v.rawData !== null ? (v.rawData as any) : {};
    const normalizedVacancy = {
      hhId: v.hhId,
      title: v.title,
      company: v.company,
      area: v.area ?? undefined,
      description: v.description ?? rawObj.description,
      salary: v.salary as any,
      snippet: rawObj.snippet,
      experience: rawObj.experience?.id ?? rawObj.experience?.name ?? rawObj.experience,
      employment: rawObj.employment?.id ?? rawObj.employment?.name,
      schedule: rawObj.schedule?.id ?? rawObj.schedule?.name,
      workFormat: rawObj.work_format ?? rawObj.workFormat,
    };

    const needsFallback = !v.analysis || (v.analysis.matchScore === 0 && !v.analysis.ruleScore);
    const fallbackRule = needsFallback ? calculateRuleScore(normalizedVacancy, prefData) : null;

    // Asynchronously persist fallback score so DB records are updated permanently
    if (!v.analysis && fallbackRule) {
      withRetry(() =>
        prisma.vacancyAnalysis.upsert({
          where: { vacancyId: v.id },
          create: {
            vacancyId: v.id,
            matchScore: fallbackRule.score,
            ruleScore: fallbackRule.score,
            recommendation: fallbackRule.score >= 70 ? "apply" : fallbackRule.score >= 45 ? "maybe" : "skip",
            aiStatus: "rule_based_only",
            bestLanguage: prefData?.coverLetterLanguage || "ru",
            summary: `Rule-based evaluation: ${fallbackRule.score}/100.`,
            matchReasons: fallbackRule.reasons,
          },
          update: {
            ruleScore: fallbackRule.score,
          },
        })
      ).catch(() => {});
      withRetry(() =>
        prisma.vacancy.update({
          where: { id: v.id },
          data: { status: "analyzed" },
        })
      ).catch(() => {});
    }

    const calculatedScore = v.analysis?.matchScore || fallbackRule?.score || 0;
    const effectiveRuleScore = v.analysis?.ruleScore ?? fallbackRule?.score ?? calculatedScore;
    const finalScore = calculatedScore > 0 ? calculatedScore : effectiveRuleScore;

    const analysisObj = v.analysis
      ? {
          matchScore: finalScore,
          ruleScore: effectiveRuleScore,
          recommendation: v.analysis.recommendation || (finalScore >= 70 ? "apply" : finalScore >= 45 ? "maybe" : "skip"),
          aiStatus: v.analysis.aiStatus || "rule_based_only",
          summary: v.analysis.summary || (fallbackRule ? `Rule-based evaluation: ${finalScore}/100 based on title, skills, and experience criteria.` : undefined),
          matchReasons: Array.isArray(v.analysis.matchReasons) && v.analysis.matchReasons.length
            ? (v.analysis.matchReasons as string[])
            : fallbackRule?.reasons ?? [],
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
      : fallbackRule
      ? {
          matchScore: finalScore,
          ruleScore: finalScore,
          recommendation: finalScore >= 70 ? "apply" : finalScore >= 45 ? "maybe" : "skip",
          aiStatus: "rule_based_only",
          summary: `Rule-based evaluation: ${finalScore}/100 based on title, skills, and experience criteria.`,
          matchReasons: fallbackRule.reasons,
          missingRequirements: [],
          redFlags: [],
        }
      : undefined;

    return {
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
      analysis: analysisObj,
    };
  });

  // Sort strictly by highest match score first, then newest
  formattedVacancies.sort((a, b) => {
    const scoreA = Math.max(a.analysis?.matchScore ?? 0, a.analysis?.ruleScore ?? 0);
    const scoreB = Math.max(b.analysis?.matchScore ?? 0, b.analysis?.ruleScore ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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
        totalActive={totalActive}
        totalAll={totalAll}
        totalSkipped={totalSkipped}
        hasProfile={hasProfile}
        minScoreThreshold={minScoreThreshold}
        currentPage={page}
        pageSize={limit}
        currentDateRange={dateRange}
      />
    </div>
  );
}
