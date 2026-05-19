// ============================================================
// wingkiiy Job AI — Collection Pipeline (Multi-User)
// ============================================================
// Runs for a specific userId's active SearchPreference.
// All vacancies are stored with userId for data isolation.
// ============================================================

import prisma from "@/lib/db";
import { collectAllVacancies, fetchVacancyJsonLd } from "@/lib/hhPublicVacancyClient";
import { passesBasicFilter } from "@/lib/ruleFilter";
import { calculateRuleScore } from "@/lib/scoring";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import { analyzeVacancy } from "@/lib/aiAnalyzer";
import { sendVacancyNotificationToUser } from "@/lib/telegram";
import type { NormalizedVacancy, SearchPreferenceData } from "@/types";

// ── Type Helpers ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSearchPrefData(p: any): SearchPreferenceData {
  return {
    id: p.id,
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
 */
export async function runCollectionPipeline(userId: string): Promise<PipelineResult> {
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

  const pref = toSearchPrefData(prefRaw);

  // Get user's linked Telegram chatId for notifications
  const telegramLink = await prisma.telegramLink.findFirst({
    where: { userId, isActive: true, telegramChatId: { not: null } },
  });
  const chatId = telegramLink?.telegramChatId ?? undefined;

  const summary = { processed: 0, saved: 0, ignored: 0, analyzed: 0, notified: 0, errors: 0 };

  // ── Step 2: Collect vacancies from HH API ─────────────────
  let vacancies: NormalizedVacancy[];
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let todayNotifiedCount = await prisma.vacancy.count({
    where: { userId, status: "notified", updatedAt: { gte: todayStart } },
  });

  // ── Step 3: Per-vacancy pipeline ──────────────────────────
  for (const vacancy of vacancies) {
    summary.processed++;

    try {
      let dbVacancyId: string;

      const existing = await prisma.vacancy.findFirst({
        where: { hhId: vacancy.hhId, userId },
      });

      if (existing) {
        if (existing.descriptionHash === vacancy.descriptionHash) {
          summary.processed--;
          continue;
        }
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

      // ── Basic rule filter ──────────────────────────────────
      const filterResult = passesBasicFilter(vacancy, pref);
      if (!filterResult.passes) {
        await prisma.vacancy.update({ where: { id: dbVacancyId }, data: { status: "ignored" } });
        summary.ignored++;
        continue;
      }

      // ── Enrich with full description ───────────────────────
      const fullDesc = await fetchVacancyJsonLd(vacancy.url!);
      if (fullDesc && fullDesc.length > (vacancy.description?.length || 0)) {
        vacancy.description = fullDesc;
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const crypto = require("crypto");
        vacancy.descriptionHash = crypto.createHash("md5").update(fullDesc).digest("hex");
        await prisma.vacancy.update({
          where: { id: dbVacancyId },
          data: { description: vacancy.description, descriptionHash: vacancy.descriptionHash },
        });
      }

      // ── Rule score pre-check ───────────────────────────────
      const ruleScore = calculateRuleScore(vacancy);
      if (ruleScore.score < 30) {
        await prisma.vacancy.update({ where: { id: dbVacancyId }, data: { status: "low_priority" } });
        continue;
      }

      // ── AI analysis ────────────────────────────────────────
      const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
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
  }

  console.log("[Pipeline] Done —", summary);
  return { success: true, data: summary };
}
