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

    for (const { userId } of activePrefs) {
      console.log(`[Cron] Running pipeline for user ${userId}...`);
      const result = await runCollectionPipeline(userId);
      results[userId] = result;
    }

    return NextResponse.json({ success: true, users: activePrefs.length, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron] Error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
