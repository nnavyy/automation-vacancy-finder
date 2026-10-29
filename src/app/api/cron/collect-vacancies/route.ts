// ============================================================
// wingkiiy Job AI — Cron: Collect & Analyze Vacancies (Multi-User Load-Balanced)
// ============================================================
// GET /api/cron/collect-vacancies
// Protected by Authorization: Bearer {CRON_SECRET}
// Prioritizes least-recently-synced users first (fair round-robin)
// and allocates balanced AI & time charge budgets per user.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runCollectionPipeline } from "@/lib/collectionPipeline";
import prisma from "@/lib/db";
import { purgePool } from "@/lib/vacancyPool";
import { safeEqual } from "@/lib/timingSafe";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";

  if (!cronSecret || !safeEqual(authHeader, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activePrefs = await prisma.searchPreference.findMany({
      where: { isActive: true },
      select: { userId: true, collectionStatus: true, updatedAt: true },
      distinct: ["userId"],
    });

    if (activePrefs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active users with search preferences." },
        { status: 400 }
      );
    }

    // Fair Load Balancer: sort users so least-recently-synced profiles run first
    activePrefs.sort((a, b) => {
      const statusA = a.collectionStatus as { finishedAt?: string } | null;
      const statusB = b.collectionStatus as { finishedAt?: string } | null;
      const timeA = statusA?.finishedAt ? new Date(statusA.finishedAt).getTime() : 0;
      const timeB = statusB?.finishedAt ? new Date(statusB.finishedAt).getTime() : 0;
      return timeA - timeB;
    });

    const purged = await purgePool().catch((e) => {
      console.error("[Cron] purgePool failed:", e);
      return null;
    });

    // Allocate fair AI charge per user so no single user exhausts the shared LLM quota
    const aiChargePerUser = Math.max(15, Math.min(40, Math.floor(80 / activePrefs.length)));

    const results: Record<string, unknown> = { pool: purged, aiChargePerUser };
    const cronDeadline = Date.now() + 250_000;

    for (let i = 0; i < activePrefs.length; i++) {
      const { userId } = activePrefs[i];
      const remainingTime = cronDeadline - Date.now();
      if (remainingTime < 15_000) {
        console.warn(
          `[Cron] Approaching cron timeout. Scheduled remaining ${activePrefs.length - i} users for next run.`
        );
        results[userId] = { skipped: true, reason: "cron_timeout_budget" };
        break;
      }

      const usersLeft = activePrefs.length - i;
      const budgetForUser = Math.min(180_000, Math.max(30_000, Math.floor(remainingTime / usersLeft)));

      console.log(
        `[Cron] Running pipeline for user ${userId} (time=${budgetForUser}ms, aiCharge=${aiChargePerUser})...`
      );
      const result = await runCollectionPipeline(userId, {
        maxDurationMs: budgetForUser,
        maxAiCalls: aiChargePerUser,
      });
      results[userId] = result;
    }

    return NextResponse.json({ success: true, users: activePrefs.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
