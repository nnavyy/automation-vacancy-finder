// ============================================================
// DB Keepalive Ping — GET /api/cron/db-ping
// ============================================================
// Sends a minimal SELECT 1 query to NeonDB to prevent the
// compute from going idle (free tier sleeps after ~5 min).
//
// Scheduled by Vercel Cron every 4 minutes via vercel.json.
// Protected by the CRON_SECRET env var.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── Minimal ping ──────────────────────────────────────────
  try {
    const start = Date.now();
    // Count users — lightest possible real query, touches index only
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    console.log(`[DB Ping] OK — ${latencyMs}ms`);
    return NextResponse.json({
      success: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DB Ping] Failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
