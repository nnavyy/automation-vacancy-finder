// ============================================================
// Dashboard Collect — /api/dashboard/collect
// Called by the "Run Collection" button on the dashboard.
// ============================================================

import { NextResponse } from "next/server";
import { runCollectionPipeline } from "@/lib/collectionPipeline";
import { requireUser } from "@/lib/auth-helpers";

export const maxDuration = 300;

export async function GET() {
  const user = await requireUser();
  try {
    console.log(`[Dashboard Collect] Starting collection for user ${user.id}...`);
    const result = await runCollectionPipeline(user.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Dashboard Collect] Pipeline error:", err);
    return NextResponse.json({ success: false, error: `Pipeline error: ${message}` }, { status: 500 });
  }
}
