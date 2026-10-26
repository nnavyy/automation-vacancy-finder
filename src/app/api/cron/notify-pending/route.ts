// ============================================================
// HH Job Copilot -- Cron: Notify Pending Vacancies
// ============================================================
// GET /api/cron/notify-pending
// Protected by Authorization: Bearer {CRON_SECRET}
//
// Runs INDEPENDENTLY of the collection pipeline.
// Two responsibilities:
//   1. Alert users on Telegram for vacancies that were analyzed
//      (score >= threshold) but never notified -- e.g. because
//      Telegram wasn't linked at collection time, or the daily
//      notification cap was hit on a previous run.
//   2. Probe HH.ru to check if vacancies older than 3 days are
//      still open; marks 404s as "closed" to keep the vault fresh.
//
// Runs every 2 hours via vercel.json cron schedule.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendVacancyNotificationToUser } from "@/lib/telegram";
import { checkVacancyStillOpen } from "@/lib/hhPublicVacancyClient";
import { safeEqual } from "@/lib/timingSafe";
import { retryPendingAnalyses, PENDING_AI_STATUSES } from "@/lib/pendingAiRetry";
import { toSearchPrefData } from "@/lib/collectionPipeline";
import type { NormalizedVacancy, HHSalary, AIAnalysisResult } from "@/types";

export const maxDuration = 120;

// -- Helpers --

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

// -- Route --

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";

  if (!cronSecret || !safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = {
    usersProcessed: 0,
    notificationsSent: 0,
    vacanciesMarkedClosed: 0,
    aiRetried: 0,
    aiCompleted: 0,
    aiExpired: 0,
    errors: 0,
  };

  const deadline = Date.now() + 110_000;

  try {
    const telegramLinks = await prisma.telegramLink.findMany({
      where: { isActive: true, telegramChatId: { not: null } },
      select: { userId: true, telegramChatId: true, language: true },
    });

    if (telegramLinks.length === 0) {
      return NextResponse.json({ success: true, message: "No linked Telegram users.", summary });
    }

    for (const link of telegramLinks) {
      if (Date.now() > deadline) {
        console.warn("[NotifyCron] Approaching deadline, stopping early.");
        break;
      }

      const { userId, telegramChatId, language } = link;
      if (!telegramChatId) continue;

      summary.usersProcessed++;

      try {
        const pref = await prisma.searchPreference.findFirst({
          where: { userId, isActive: true },
        });

        if (!pref) continue;

        // Re-run AI for vacancies that hit a provider failure earlier, so they can be notified below.
        const retry = await retryPendingAnalyses({
          userId,
          pref: toSearchPrefData(pref),
          deadline,
        });
        summary.aiRetried += retry.retried;
        summary.aiCompleted += retry.completed;
        summary.aiExpired += retry.expired;
        summary.errors += retry.errors;

        const scoreThreshold = pref.minimumScoreToNotify ?? 70;
        const maxPerDay = pref.maxNotificationsPerDay ?? 20;
        const lang = language ?? (pref.language as string) ?? "en";

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        let todayNotifiedCount = await prisma.vacancy.count({
          where: { userId, status: "notified", updatedAt: { gte: todayStart } },
        });

        if (todayNotifiedCount >= maxPerDay) continue;

        const pendingVacancies = await prisma.vacancy.findMany({
          where: {
            userId,
            status: "analyzed",
            NOT: { hhId: { startsWith: "manual-" } },
            analysis: {
              matchScore: { gte: scoreThreshold },
              // Rows still waiting for AI keep a provisional rule score; never alert on those.
              aiStatus: { notIn: PENDING_AI_STATUSES },
            },
          },
          orderBy: { createdAt: "desc" },
          take: maxPerDay - todayNotifiedCount,
          include: {
            analysis: {
              select: {
                matchScore: true, recommendation: true, bestLanguage: true, summary: true,
                matchReasons: true, missingRequirements: true, redFlags: true,
                coverLetter: true, questions: true, confidence: true, aiStatus: true,
              },
            },
          },
        });

        console.log(`[NotifyCron] User ${userId}: ${pendingVacancies.length} pending vacancies to notify`);

        for (const dbVac of pendingVacancies) {
          if (Date.now() > deadline) break;
          if (todayNotifiedCount >= maxPerDay) break;

          // Validity check for vacancies older than 3 days
          const ageMs = Date.now() - dbVac.createdAt.getTime();
          const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

          if (ageMs > THREE_DAYS_MS) {
            const isOpen = await checkVacancyStillOpen(dbVac.hhId);
            if (!isOpen) {
              await prisma.vacancy.update({ where: { id: dbVac.id }, data: { status: "closed" } });
              summary.vacanciesMarkedClosed++;
              continue;
            }
          }

          const vacancy = toNormalizedVacancy(dbVac);
          const analysis: AIAnalysisResult = {
            match_score: dbVac.analysis?.matchScore ?? 0,
            recommendation: (dbVac.analysis?.recommendation as "apply" | "maybe" | "skip") ?? "maybe",
            best_language: ((dbVac.analysis?.bestLanguage ?? "english") as "english" | "russian"),
            summary: dbVac.analysis?.summary ?? "",
            match_reasons: (dbVac.analysis?.matchReasons as string[]) ?? [],
            missing_requirements: (dbVac.analysis?.missingRequirements as string[]) ?? [],
            red_flags: (dbVac.analysis?.redFlags as any[]) ?? [],
            cover_letter: dbVac.analysis?.coverLetter ?? "",
            questions_to_recruiter: (dbVac.analysis?.questions as string[]) ?? [],
            confidence: dbVac.analysis?.confidence ?? 100,
          };

          try {
            const sent = await sendVacancyNotificationToUser(vacancy, analysis, dbVac.id, telegramChatId, lang);
            if (sent) {
              await prisma.vacancy.update({ where: { id: dbVac.id }, data: { status: "notified" } });
              await prisma.applicationLog.create({
                data: { vacancyId: dbVac.id, action: "notified", notes: `[NotifyCron] Score: ${dbVac.analysis?.matchScore ?? 0}/100` },
              });
              todayNotifiedCount++;
              summary.notificationsSent++;
            }
          } catch (notifyErr) {
            console.error(`[NotifyCron] Failed to notify vacancy ${dbVac.id}:`, notifyErr);
            summary.errors++;
          }
        }
      } catch (userErr) {
        console.error(`[NotifyCron] Error processing user ${userId}:`, userErr);
        summary.errors++;
      }
    }

    console.log("[NotifyCron] Done --", summary);
    return NextResponse.json({ success: true, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message, summary }, { status: 500 });
  }
}
