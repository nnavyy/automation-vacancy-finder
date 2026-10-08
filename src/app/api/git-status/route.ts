// ============================================================
// Nanda AI Job Assistant — Git Status & Telemetry API
// Endpoint for real-time repository diagnostics and zone inspection
// Strict rule: Zero emojis in error messages and API responses
// ============================================================

import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { getGitRepositoryStatus } from "@/lib/gitStatusService";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const status = await getGitRepositoryStatus();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (err: any) {
    console.error("[GET /api/git-status]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to read git repository diagnostics",
      },
      { status: 500 }
    );
  }
}
