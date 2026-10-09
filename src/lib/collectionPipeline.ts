// ============================================================
// HH Job Copilot — Collection Pipeline (Multi-User)
// ============================================================
// Runs for a specific userId's active SearchPreference.
// All vacancies are stored with userId for data isolation.
// ============================================================

import crypto from "crypto";
import prisma from "@/lib/db";
import { collectAllVacancies, fetchVacancyJsonLd } from "@/lib/hhPublicVacancyClient";
import { passesBasicFilter } from "@/lib/ruleFilter";
import { calculateRuleScore } from "@/lib/scoring";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { sendVacancyNotificationToUser } from "@/lib/telegram";
import { isSafePublicUrl } from "@/lib/security";
import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

// ── Type Helpers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSearchPrefData(p: any): SearchPreferenceData {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    targetRoles:           (p.targetRoles as string[])           ?? [],
    searchKeywordsEn:      (p.searchKeywordsEn as string[])      ?? [],
    searchKeywordsRu:      (p.searchKeywordsRu as string[])      ?? [],
    requiredSkills:        (p.requiredSkills as string[])         ?? [],
    niceToHaveSkills:      (p.niceToHaveSkills as string[])       ?? [],
    experience:            (p.experience as string[])             ?? [],
    workFormat:            (p.workFormat as string[])             ?? [],
    salaryMinimum:         p.salaryMinimum ?? undefined,
    salaryCurrency:        p.salaryCurrency ?? "RUR",
    excludeKeywords:       (p.excludeKeywords as string[])        ?? [],
    redFlagKeywords:       (p.redFlagKeywords as string[])        ?? [],
    minimumScoreToNotify:  p.minimumScoreToNotify,
    maxNotificationsPerDay: p.maxNotificationsPerDay,
    aiProviderOrder:       (p.aiProviderOrder as string[])        ?? [],
    coverLetterLanguage:   p.coverLetterLanguage,
    resumeText:            p.resumeText,
    portfolioUrl:          p.portfolioUrl ?? undefined,
    isActive:              p.isActive,
  };
}

// ── Pipeline Result Type ──────────────────────────────────────

export interface PipelineResult {
  success: boolean;
  error?: string;
  data?: {
    processed: number;
    saved: number;
    ignored: number;
    analyzed: number;
    notified: number;
    errors: number;
  };
}

// ── Main Pipeline ─────────────────────────────────────────────

/**
 * Runs the full vacancy collection + analysis pipeline for a specific user.
 * Includes time-budget guard to prevent serverless execution timeouts.
 */
export async function runCollectionPipeline(
  userId: string,
  options?: { maxDurationMs?: number }
): Promise<PipelineResult> {
  const maxDurationMs = options?.maxDurationMs ?? 240_000;
  const deadline = Date.now() + maxDurationMs;

  // ── Step 1: Load user's active SearchPreference ───────────
  const prefRaw = await prisma.searchPreference.findFirst({
    where: { userId, isActive: true },
  });

  if (!prefRaw) {
    return {
      success: false,
      error: "No active search profile found. Please configure one in Settings.",
    };
  }

  // Concurrency guard: prevent multiple concurrent crawls on the same profile
  const currentStatus = prefRaw.collectionStatus as {
    running?: boolean;
    startedAt?: string | null;
  } | null;

  if (currentStatus?.running && currentStatus.startedAt) {
    const elapsedMs = Date.now() - new Date(currentStatus.startedAt).getTime();
    const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes stale lock breaker
    if (!isNaN(elapsedMs) && elapsedMs < STALE_LOCK_TIMEOUT_MS) {
      return {
        success: false,
        error: "A collection run is already in progress for this profile. Please wait for it to finish.",
      };
    }
    console.warn(`[Pipeline] Stale collection lock detected (${Math.round(elapsedMs / 1000)}s old), resetting.`);
  }

  const pref = toSearchPrefData(prefRaw);

  // Pre-fetch candidate's portfolio text once for the entire batch (SSRF protected)
  if (pref.portfolioUrl && isSafePublicUrl(pref.portfolioUrl)) {
    try {
      const res = await fetch(pref.portfolioUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const html = await res.text();
        (pref as any).cachedPortfolioContent = html
          .replace(/<[^>]*>?/gm, " ")
          .replace(/\s\s+/g, " ")
          .trim()
          .slice(0, 1500);
      }
    } catch (err) {
      console.warn("[Pipeline] Failed to pre-fetch portfolio URL:", err);
    }
  }

  // Get user's linked Telegram chatId for notifications
  const telegramLink = await prisma.telegramLink.findFirst({
    where: { userId, isActive: true, telegramChatId: { not: null } },
  });
  const chatId = telegramLink?.telegramChatId ?? undefined;

  const summary = { processed: 0, saved: 0, ignored: 0, analyzed: 0, notified: 0, errors: 0 };
  const startedAt = new Date().toISOString();

  // Mark status as running
  await prisma.searchPreference.update({
    where: { id: prefRaw.id },
    data: { collectionStatus: { running: true, analyzed: 0, total: 0, startedAt } },
  });

  let vacancies: NormalizedVacancy[] = [];

  try {
    // ── Step 2: Collect vacancies from HH API ─────────────────
    try {
      vacancies = await collectAllVacancies(pref);
    } catch (err) {
      console.error("[Pipeline] collectAllVacancies failed:", err);
      return {
        success: false,
        error: `Failed to collect vacancies: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    console.log(`[Pipeline] Collected ${vacancies.length} vacancies for user ${userId}`);

    // Update total count
    await prisma.searchPreference.update({
      where: { id: prefRaw.id },
      data: { collectionStatus: { running: true, analyzed: 0, total: vacancies.length, startedAt } },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let todayNotifiedCount = await prisma.vacancy.count({
      where: { userId, status: "notified", updatedAt: { gte: todayStart } },
    });

    // ── Step 3: Per-vacancy concurrent pipeline ─────────────────
    const CONCURRENCY = 5;
    let lastDbStatusUpdate = Date.now();

    const reportProgress = async (force = false) => {
      const now = Date.now();
      if (force || now - lastDbStatusUpdate > 2500) {
        lastDbStatusUpdate = now;
        try {
          await prisma.searchPreference.update({
            where: { id: prefRaw.id },
            data: {
              collectionStatus: {
                running: true,
                analyzed: summary.analyzed,
                total: vacancies.length,
                startedAt,
              },
            },
          });
        } catch {
          // Ignore transient status reporting errors
        }
      }
    };

    const processSingleVacancy = async (vacancy: NormalizedVacancy) => {
      if (Date.now() > deadline) return;

      try {
        let dbVacancyId: string;

        const existing = await prisma.vacancy.findFirst({
          where: { hhId: vacancy.hhId, userId },
        });

        if (existing) {
          if (existing.status !== "new") return;
          if (existing.descriptionHash === vacancy.descriptionHash) return;

          const updated = await prisma.vacancy.update({
            where: { id: existing.id },
            data: {
              title:           vacancy.title,
              company:         vacancy.company          ?? null,
              area:            vacancy.area             ?? null,
              salary:          (vacancy.salary as object) ?? null,
              url:             vacancy.url              ?? null,
              applyUrl:        vacancy.applyUrl         ?? null,
              apiUrl:          vacancy.apiUrl           ?? null,
              experience:      vacancy.experience       ?? null,
              employment:      vacancy.employment       ?? null,
              schedule:        vacancy.schedule         ?? null,
              workFormat:      (vacancy.workFormat as object[]) ?? null,
              snippet:         (vacancy.snippet as object)      ?? null,
              description:     vacancy.description      ?? null,
              descriptionHash: vacancy.descriptionHash  ?? null,
              rawData:         (vacancy.rawData as object)      ?? null,
              sourceKeyword:   vacancy.sourceKeyword    ?? null,
              status:          "new",
            },
          });
          dbVacancyId = updated.id;
        } else {
          const created = await prisma.vacancy.create({
            data: {
              userId,
              hhId:            vacancy.hhId,
              title:           vacancy.title,
              company:         vacancy.company          ?? null,
              area:            vacancy.area             ?? null,
              salary:          (vacancy.salary as object) ?? null,
              url:             vacancy.url              ?? null,
              applyUrl:        vacancy.applyUrl         ?? null,
              apiUrl:          vacancy.apiUrl           ?? null,
              experience:      vacancy.experience       ?? null,
              employment:      vacancy.employment       ?? null,
              schedule:        vacancy.schedule         ?? null,
              workFormat:      (vacancy.workFormat as object[]) ?? null,
              snippet:         (vacancy.snippet as object)      ?? null,
              description:     vacancy.description      ?? null,
              descriptionHash: vacancy.descriptionHash  ?? null,
              rawData:         (vacancy.rawData as object)      ?? null,
              sourceKeyword:   vacancy.sourceKeyword    ?? null,
              status:          "new",
            },
          });
          dbVacancyId = created.id;
          summary.saved++;
        }

        summary.processed++;

        // ── Basic rule filter ──────────────────────────────────
        const filterResult = passesBasicFilter(vacancy, pref);
        if (!filterResult.passes) {
          await prisma.vacancy.update({
            where: { id: dbVacancyId },
            data: {
              status: "ignored",
              filterReason: filterResult.reason ?? null,
            },
          });
          summary.ignored++;
          return;
        }

        // ── Rule score pre-check on basic snippet/title ────────
        const preScore = calculateRuleScore(vacancy, pref);
        if (preScore.score < 25) {
          await prisma.vacancy.update({
            where: { id: dbVacancyId },
            data: { status: "low_priority" },
          });
          return;
        }

        // ── Enrich with full description if available ──────────
        if (vacancy.url) {
          const fullDesc = await fetchVacancyJsonLd(vacancy.url);
          if (fullDesc && fullDesc.length > (vacancy.description?.length || 0)) {
            vacancy.description = fullDesc;
            vacancy.descriptionHash = crypto.createHash("md5").update(fullDesc).digest("hex");
            await prisma.vacancy.update({
              where: { id: dbVacancyId },
              data: { description: vacancy.description, descriptionHash: vacancy.descriptionHash },
            });
          }
        }

        // ── Rule score check ───────────────────────────────────
        const ruleScore = calculateRuleScore(vacancy, pref);
        if (ruleScore.score < 30) {
          await prisma.vacancy.update({ where: { id: dbVacancyId }, data: { status: "low_priority" } });
          return;
        }

        // ── AI analysis ────────────────────────────────────────
        const { positive, negative } = await getSimilarFeedbackExamples(vacancy, pref.userId);
        const { analysis, provider, model, aiStatus } = await analyzeVacancy(vacancy, [...positive, ...negative], pref);

        const analysisData = {
          matchScore:          analysis.match_score,
          ruleScore:           ruleScore.score,
          recommendation:      analysis.recommendation,
          bestLanguage:        analysis.best_language,
          summary:             analysis.summary,
          matchReasons:        analysis.match_reasons,
          missingRequirements: analysis.missing_requirements,
          redFlags:            analysis.red_flags as object[],
          coverLetter:         analysis.cover_letter,
          questions:           analysis.questions_to_recruiter,
          confidence:          analysis.confidence,
          aiStatus,
          providerUsed:        provider,
          modelUsed:           model,
        };

        await prisma.vacancyAnalysis.upsert({
          where:  { vacancyId: dbVacancyId },
          create: { vacancyId: dbVacancyId, ...analysisData },
          update: analysisData,
        });

        await prisma.vacancy.update({ where: { id: dbVacancyId }, data: { status: "analyzed" } });
        summary.analyzed++;
        await reportProgress();

        // ── Telegram notification ──────────────────────────────
        const shouldNotify =
          analysis.match_score >= pref.minimumScoreToNotify &&
          todayNotifiedCount < pref.maxNotificationsPerDay;

        if (shouldNotify && chatId) {
          const sent = await sendVacancyNotificationToUser(vacancy, analysis, dbVacancyId, chatId);
          if (sent) {
            await prisma.vacancy.update({ where: { id: dbVacancyId }, data: { status: "notified" } });
            await prisma.applicationLog.create({
              data: {
                vacancyId: dbVacancyId,
                action: "notified",
                notes: `Score: ${analysis.match_score}/100, Provider: ${provider} (${model})`,
              },
            });
            todayNotifiedCount++;
            summary.notified++;
          }
        }
      } catch (err) {
        console.error(`[Pipeline] Error processing "${vacancy.title}":`, err);
        summary.errors++;
      }
    };

    // Worker pool execution
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(CONCURRENCY, vacancies.length) }, async () => {
      while (nextIndex < vacancies.length) {
        if (Date.now() > deadline) {
          console.warn(`[Pipeline] Time budget reached (${maxDurationMs}ms). Worker exiting.`);
          break;
        }
        const itemIdx = nextIndex++;
        await processSingleVacancy(vacancies[itemIdx]);
      }
    });

    await Promise.all(workers);
    await reportProgress(true);

    console.log("[Pipeline] Done —", summary);
    return { success: true, data: summary };
  } finally {
    try {
      await prisma.searchPreference.update({
        where: { id: prefRaw.id },
        data: {
          collectionStatus: {
            running: false,
            analyzed: summary.analyzed,
            total: vacancies.length,
            startedAt,
            finishedAt: new Date().toISOString(),
          },
        },
      });
    } catch (cleanupErr) {
      console.error("[Pipeline] Failed to update final collectionStatus:", cleanupErr);
    }
  }
}
