// ============================================================
// Pending AI retry sweep
// ============================================================
// Vacancies whose AI analysis failed (provider timeout / rate limit) are saved
// with aiStatus "pending_ai" and are NOT notified. This sweep re-runs the
// analysis for a bounded number of them per cron run so they eventually get
// a real score and a Telegram alert.
//
// Bounded by: per-run `limit`, the caller's `deadline`, and a 3-day age cut-off.
// Rows older than the cut-off are finalized as "rule_based_only" so they are
// never retried forever (no extra DB column needed).

import prisma from "@/lib/db";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import type { NormalizedVacancy, HHSalary } from "@/types";

export const PENDING_AI_STATUSES = ["pending_ai", "pending_limit"];
export const PENDING_AI_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export interface RetryResult {
  retried: number;
  completed: number;
  expired: number;
  errors: number;
}

function toNormalizedVacancy(v: {
  hhId: string; title: string; company: string | null; area: string | null;
  salary: unknown; url: string | null; applyUrl: string | null; apiUrl: string | null;
  experience: string | null; employment: string | null; schedule: string | null;
  workFormat: unknown; snippet: unknown; description: string | null;
  descriptionHash: string | null; sourceKeyword: string | null;
}): NormalizedVacancy {
  return {
    hhId: v.hhId, title: v.title,
    company: v.company ?? undefined, area: v.area ?? undefined,
    salary: (v.salary as HHSalary) ?? undefined,
    url: v.url ?? undefined, applyUrl: v.applyUrl ?? undefined, apiUrl: v.apiUrl ?? undefined,
    experience: v.experience ?? undefined, employment: v.employment ?? undefined,
    schedule: v.schedule ?? undefined,
    workFormat: (v.workFormat as { id: string; name: string }[]) ?? undefined,
    snippet: (v.snippet as { requirement?: string; responsibility?: string }) ?? undefined,
    description: v.description ?? undefined, descriptionHash: v.descriptionHash ?? undefined,
    sourceKeyword: v.sourceKeyword ?? undefined,
  };
}

export async function retryPendingAnalyses(opts: {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pref: any;
  deadline: number;
  limit?: number;
}): Promise<RetryResult> {
  const { userId, pref, deadline, limit = 5 } = opts;
  const result: RetryResult = { retried: 0, completed: 0, expired: 0, errors: 0 };
  const cutoff = new Date(Date.now() - PENDING_AI_MAX_AGE_MS);

  // 1. Finalize stale rows so they stop being retried.
  const expired = await prisma.vacancyAnalysis.updateMany({
    where: {
      aiStatus: { in: PENDING_AI_STATUSES },
      vacancy: { userId, createdAt: { lt: cutoff } },
    },
    data: { aiStatus: "rule_based_only" },
  });
  result.expired = expired.count;

  // 2. Retry the freshest pending rows first.
  const rows = await prisma.vacancy.findMany({
    where: {
      userId,
      status: "analyzed",
      createdAt: { gte: cutoff },
      analysis: { aiStatus: { in: PENDING_AI_STATUSES } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  for (const row of rows) {
    if (Date.now() > deadline) break;
    result.retried++;
    try {
      const vacancy = toNormalizedVacancy(row);
      const { positive, negative } = await getSimilarFeedbackExamples(vacancy, userId);
      const { analysis, provider, model, aiStatus } = await analyzeVacancy(
        vacancy,
        [...positive, ...negative],
        pref
      );

      // Still failing: leave as pending_ai for the next sweep.
      if (aiStatus !== "completed") continue;

      await prisma.vacancyAnalysis.update({
        where: { vacancyId: row.id },
        data: {
          matchScore: analysis.match_score,
          recommendation: analysis.recommendation,
          bestLanguage: analysis.best_language,
          summary: analysis.summary,
          matchReasons: analysis.match_reasons,
          missingRequirements: analysis.missing_requirements,
          redFlags: analysis.red_flags as object[],
          coverLetter: analysis.cover_letter,
          questions: analysis.questions_to_recruiter,
          confidence: analysis.confidence,
          aiStatus,
          providerUsed: provider,
          modelUsed: model,
        },
      });
      result.completed++;
    } catch (err) {
      console.error(`[PendingAiRetry] Failed for vacancy ${row.id}:`, err);
      result.errors++;
    }
  }

  return result;
}
