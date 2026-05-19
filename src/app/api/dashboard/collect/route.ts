// ============================================================
// Dashboard Collect — /api/dashboard/collect
// ============================================================
// Called by the dashboard "Run Collection" button.
// Calls the collection pipeline directly (no HTTP self-fetch)
// so there are no port mismatch or self-referencing issues.
// ============================================================

import { NextResponse } from "next/server";
import { runCollectionPipeline } from "@/lib/collectionPipeline";

export const maxDuration = 300; // Allow up to 5 minutes for collection

export async function GET() {
  try {
    console.log("[Dashboard Collect] Starting collection pipeline...");
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
    console.error("[Dashboard Collect] Pipeline threw an error:", err);
    return NextResponse.json(
      { success: false, error: `Pipeline error: ${message}` },
      { status: 500 }
    );
  }
}
