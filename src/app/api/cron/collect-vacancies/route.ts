// ============================================================
// wingkiiy Job AI — Cron: Collect & Analyze Vacancies (Multi-User)
// ============================================================
// GET /api/cron/collect-vacancies
// Protected by Authorization: Bearer {CRON_SECRET}
// Loops through ALL users with an active SearchPreference
// and runs the collection pipeline for each.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runCollectionPipeline } from "@/lib/collectionPipeline";
import prisma from "@/lib/db";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── Find all users with an active preference ──────────────
  try {
    const activePrefs = await prisma.searchPreference.findMany({
      where:  { isActive: true },
      select: { userId: true },
      distinct: ["userId"],
    });

    if (activePrefs.length === 0) {
      return NextResponse.json({ success: false, error: "No active users with search preferences." }, { status: 400 });
    }

    const results: Record<string, unknown> = {};
    const cronDeadline = Date.now() + 250_000; // 250s max to safely return before 300s gateway timeout

    for (let i = 0; i < activePrefs.length; i++) {
      const { userId } = activePrefs[i];
      const remainingTime = cronDeadline - Date.now();
      if (remainingTime < 15_000) {
        console.warn(`[Cron] Approaching cron timeout. Scheduled remaining ${activePrefs.length - i} users for next run.`);
        results[userId] = { skipped: true, reason: "cron_timeout_budget" };
        break;
      }

      const usersLeft = activePrefs.length - i;
      const budgetForUser = Math.min(180_000, Math.max(30_000, Math.floor(remainingTime / usersLeft)));

      console.log(`[Cron] Running pipeline for user ${userId} with budget ${budgetForUser}ms...`);
      const result = await runCollectionPipeline(userId, { maxDurationMs: budgetForUser });
      results[userId] = result;
    }

    return NextResponse.json({ success: true, users: activePrefs.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
