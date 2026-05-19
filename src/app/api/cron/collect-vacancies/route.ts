// ============================================================
// Nanda AI Job Assistant — Cron: Collect & Analyze Vacancies
// ============================================================
// GET /api/cron/collect-vacancies
//
// Triggered by n8n scheduler or a manual HTTP call.
// Protected by Authorization: Bearer {CRON_SECRET}.
//
// Uses the shared runCollectionPipeline() function which handles
// all the logic (collection, filtering, AI analysis, notification).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runCollectionPipeline } from "@/lib/collectionPipeline";

export const maxDuration = 300; // Allow up to 5 minutes for collection

/**
 * GET /api/cron/collect-vacancies
 *
 * Main collection + analysis pipeline. Intended to be called by n8n on a
 * schedule (e.g. every 4 hours). Can also be triggered manually for testing.
 *
 * Requires:  Authorization: Bearer <CRON_SECRET>
 *
 * Returns:
 *   200 { success: true, data: { processed, saved, ignored, analyzed, notified, errors } }
 *   401 { success: false, error: "Unauthorized" }
 *   400 { success: false, error: "No active SearchPreference found..." }
 *   500 { success: false, error: "..." }
 */
export async function GET(req: NextRequest) {
  // ── Step 1: Verify Authorization ─────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // ── Step 2: Run the shared pipeline ──────────────────────
  try {
    console.log("[Cron] Starting collection pipeline...");
    const result = await runCollectionPipeline();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Cron] Pipeline threw an error:", err);
    return NextResponse.json(
      { success: false, error: `Pipeline error: ${message}` },
      { status: 500 }
    );
  }
}
