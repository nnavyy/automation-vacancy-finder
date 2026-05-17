// ============================================================
// Nanda AI Job Assistant — Collection Pipeline (Shared Logic)
// ============================================================
// Extracted from the cron route so both:
//   - GET /api/cron/collect-vacancies  (external trigger)
//   - GET /api/dashboard/collect       (dashboard button)
// can run the same pipeline without HTTP self-fetch.
// ============================================================

import prisma from "@/lib/db";
import { collectAllVacancies, fetchVacancyJsonLd } from "@/lib/hhPublicVacancyClient";
import { passesBasicFilter } from "@/lib/ruleFilter";
import { calculateRuleScore } from "@/lib/scoring";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { sendVacancyNotification } from "@/lib/telegram";
import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

// ── Type Helpers ──────────────────────────────────────────────

type PrismaSearchPreference = {
  id: string;
  name: string;
  targetRoles: unknown;
  searchKeywordsEn: unknown;
  searchKeywordsRu: unknown;
  requiredSkills: unknown;
  niceToHaveSkills: unknown;
  experience: unknown;
  workFormat: unknown;
  salaryMinimum: number | null;
  salaryCurrency: string;
  excludeKeywords: unknown;
  redFlagKeywords: unknown;
  minimumScoreToNotify: number;
  maxNotificationsPerDay: number;
  aiProviderOrder: unknown;
  coverLetterLanguage: string;
  resumeText: string | null;
  isActive: boolean;
};

/**
 * Converts a raw Prisma SearchPreference record to the typed SearchPreferenceData
 * interface used by filter/query builder functions. JSON fields are safely cast.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSearchPrefData(p: any): SearchPreferenceData {
  return {
    id: p.id,
    name: p.name,
    targetRoles: (p.targetRoles as string[]) ?? [],
    searchKeywordsEn: (p.searchKeywordsEn as string[]) ?? [],
    searchKeywordsRu: (p.searchKeywordsRu as string[]) ?? [],
    requiredSkills: (p.requiredSkills as string[]) ?? [],
    niceToHaveSkills: (p.niceToHaveSkills as string[]) ?? [],
    experience: (p.experience as string[]) ?? [],
    workFormat: (p.workFormat as string[]) ?? [],
    salaryMinimum: p.salaryMinimum ?? undefined,
    salaryCurrency: p.salaryCurrency ?? "RUR",
    excludeKeywords: (p.excludeKeywords as string[]) ?? [],
    redFlagKeywords: (p.redFlagKeywords as string[]) ?? [],
    minimumScoreToNotify: p.minimumScoreToNotify,
    maxNotificationsPerDay: p.maxNotificationsPerDay,
    aiProviderOrder: (p.aiProviderOrder as string[]) ?? [],
    coverLetterLanguage: p.coverLetterLanguage,
    resumeText: p.resumeText,
    isActive: p.isActive,
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
 * Runs the full vacancy collection + analysis pipeline.
 *
 * This is the core function that:
 *   1. Loads active SearchPreference
 *   2. Collects vacancies from HH API
 *   3. Deduplicates, filters, scores, and analyzes each vacancy
 *   4. Sends Telegram notifications for top matches
 *
 * @returns PipelineResult with summary stats or error
 */
export async function runCollectionPipeline(): Promise<PipelineResult> {
  // ── Step 1: Load active SearchPreference ─────────────────
  const prefRaw = await prisma.searchPreference.findFirst({
    where: { isActive: true },
  });

  if (!prefRaw) {
    return {
      success: false,
      error:
        "No active SearchPreference found. Please configure one via POST /api/settings or run npm run db:seed.",
    };
  }

  const pref = toSearchPrefData(prefRaw);

  // Running summary returned at the end
  const summary = {
    processed: 0,
    saved: 0,
    ignored: 0,
    analyzed: 0,
    notified: 0,
    errors: 0,
  };

  // ── Step 2: Collect vacancies from HH API ─────────────────
  let vacancies: NormalizedVacancy[];
  try {
    vacancies = await collectAllVacancies(pref);
  } catch (err) {
    console.error("[Pipeline] collectAllVacancies failed:", err);
    return {
      success: false,
      error: `Failed to collect vacancies from the HH API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  console.log(
    `[Pipeline] Collected ${vacancies.length} unique vacancies. Starting pipeline...`
  );

  // Pre-count how many notifications were already sent today so we can
  // respect pref.maxNotificationsPerDay without an additional query per vacancy.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let todayNotifiedCount = await prisma.vacancy.count({
    where: {
      status: "notified",
      updatedAt: { gte: todayStart },
    },
  });

  // ── Step 3: Per-vacancy pipeline ──────────────────────────
  for (const vacancy of vacancies) {
    summary.processed++;

    try {
      // ── 3a–3c: Deduplication & DB persistence ────────────
      let dbVacancyId: string;

      const existing = await prisma.vacancy.findUnique({
        where: { hhId: vacancy.hhId },
      });

      if (existing) {
        // Exact same content — nothing changed, skip entirely
        if (existing.descriptionHash === vacancy.descriptionHash) {
          summary.processed--; // don't count unchanged duplicates
          continue;
        }

        // Description or metadata changed — update and re-run pipeline
        console.log(
          `[Pipeline] Description changed for "${vacancy.title}". Updating...`
        );
        const updated = await prisma.vacancy.update({
          where: { id: existing.id },
          data: {
            title: vacancy.title,
            company: vacancy.company ?? null,
            area: vacancy.area ?? null,
            salary: (vacancy.salary as object) ?? null,
            url: vacancy.url ?? null,
            applyUrl: vacancy.applyUrl ?? null,
            apiUrl: vacancy.apiUrl ?? null,
            experience: vacancy.experience ?? null,
            employment: vacancy.employment ?? null,
            schedule: vacancy.schedule ?? null,
            workFormat: (vacancy.workFormat as object[]) ?? null,
            snippet: (vacancy.snippet as object) ?? null,
            description: vacancy.description ?? null,
            descriptionHash: vacancy.descriptionHash ?? null,
            rawData: (vacancy.rawData as object) ?? null,
            sourceKeyword: vacancy.sourceKeyword ?? null,
            // Reset to "new" so the full pipeline re-runs for this vacancy
            status: "new",
          },
        });
        dbVacancyId = updated.id;
      } else {
        // Brand-new vacancy — create it
        const created = await prisma.vacancy.create({
          data: {
            hhId: vacancy.hhId,
            title: vacancy.title,
            company: vacancy.company ?? null,
            area: vacancy.area ?? null,
            salary: (vacancy.salary as object) ?? null,
            url: vacancy.url ?? null,
            applyUrl: vacancy.applyUrl ?? null,
            apiUrl: vacancy.apiUrl ?? null,
            experience: vacancy.experience ?? null,
            employment: vacancy.employment ?? null,
            schedule: vacancy.schedule ?? null,
            workFormat: (vacancy.workFormat as object[]) ?? null,
            snippet: (vacancy.snippet as object) ?? null,
            description: vacancy.description ?? null,
            descriptionHash: vacancy.descriptionHash ?? null,
            rawData: (vacancy.rawData as object) ?? null,
            sourceKeyword: vacancy.sourceKeyword ?? null,
            status: "new",
          },
        });
        dbVacancyId = created.id;
        summary.saved++;
      }

      // ── 3d: Basic rule filter ─────────────────────────────
      const filterResult = passesBasicFilter(vacancy, pref);
      if (!filterResult.passes) {
        console.log(
          `[Pipeline] Ignored "${vacancy.title}": ${filterResult.reason}`
        );
        await prisma.vacancy.update({
          where: { id: dbVacancyId },
          data: { status: "ignored" },
        });
        summary.ignored++;
        continue;
      }

      // ── 3e: Enrich with full description from the actual page before scoring
      const fullDesc = await fetchVacancyJsonLd(vacancy.url!);
      if (fullDesc && fullDesc.length > (vacancy.description?.length || 0)) {
        vacancy.description = fullDesc;
        const crypto = require("crypto");
        vacancy.descriptionHash = crypto.createHash("md5").update(fullDesc).digest("hex");
        
        await prisma.vacancy.update({
          where: { id: dbVacancyId },
          data: { 
            description: vacancy.description,
            descriptionHash: vacancy.descriptionHash
          },
        });
      }

      // ── 3f: Rule-based score pre-check ────────────────────
      const ruleScore = calculateRuleScore(vacancy);
      if (ruleScore.score < 30) {
        console.log(
          `[Pipeline] Low priority "${vacancy.title}" — rule score: ${ruleScore.score}`
        );
        await prisma.vacancy.update({
          where: { id: dbVacancyId },
          data: { status: "low_priority" },
        });
        continue;
      }

      // ── 3g: Retrieve similar feedback for AI personalisation
      const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
      const similarFeedback = [...positive, ...negative];

      // ── 3g: AI analysis ───────────────────────────────────
      const { analysis, provider, model, aiStatus } = await analyzeVacancy(
        vacancy,
        similarFeedback,
        pref
      );

      // ── 3h: Upsert VacancyAnalysis ────────────────────────
      const analysisData = {
        matchScore: analysis.match_score,
        ruleScore: ruleScore.score,
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
      };

      await prisma.vacancyAnalysis.upsert({
        where: { vacancyId: dbVacancyId },
        create: { vacancyId: dbVacancyId, ...analysisData },
        update: analysisData,
      });

      // ── 3i: Mark vacancy as analyzed ──────────────────────
      await prisma.vacancy.update({
        where: { id: dbVacancyId },
        data: { status: "analyzed" },
      });
      summary.analyzed++;

      // ── 3j: Telegram notification ─────────────────────────
      const shouldNotify =
        analysis.match_score >= pref.minimumScoreToNotify &&
        todayNotifiedCount < pref.maxNotificationsPerDay;

      if (shouldNotify) {
        const sent = await sendVacancyNotification(
          vacancy,
          analysis,
          dbVacancyId
        );

        if (sent) {
          await prisma.vacancy.update({
            where: { id: dbVacancyId },
            data: { status: "notified" },
          });

          await prisma.applicationLog.create({
            data: {
              vacancyId: dbVacancyId,
              action: "notified",
              notes: `Telegram notification sent. Score: ${analysis.match_score}/100, Provider: ${provider} (${model}), AI status: ${aiStatus}`,
            },
          });

          todayNotifiedCount++;
          summary.notified++;

          console.log(
            `[Pipeline] Notified: "${vacancy.title}" — ` +
              `score: ${analysis.match_score}, recommendation: ${analysis.recommendation}`
          );
        }
      }
    } catch (err) {
      console.error(
        `[Pipeline] Error processing vacancy "${vacancy.title}":`,
        err
      );
      summary.errors++;
    }
  }

  console.log("[Pipeline] Pipeline complete —", summary);

  return { success: true, data: summary };
}
