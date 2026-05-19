// ============================================================
// Nanda AI Job Assistant — Telegram Link Token API
// ============================================================
// POST /api/telegram/link — Generate a new link token
// GET  /api/telegram/link — Get current link status
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

/**
 * Generate a 6-character alphanumeric token
 */
function generateToken(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F1B2"
}

// ── GET: Check current link status ────────────────────────────

export async function GET() {
  try {
    const link = await prisma.telegramLink.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!link) {
      return NextResponse.json({
        success: true,
        data: { linked: false, token: null, chatId: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        linked: !!link.telegramChatId,
        token: link.token,
        chatId: link.telegramChatId,
        username: link.telegramUsername,
        linkedAt: link.linkedAt,
      },
    });
  } catch (error) {
    console.error("[GET /api/telegram/link]", error);
    return NextResponse.json(
      { success: false, error: "Failed to get link status" },
      { status: 500 }
    );
  }
}

// ── POST: Generate new link token ─────────────────────────────

export async function POST() {
  try {
    // Deactivate all previous tokens
    await prisma.telegramLink.updateMany({
      data: { isActive: false },
    });

    // Create new token
    const token = generateToken();
    const link = await prisma.telegramLink.create({
      data: { token, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        token: link.token,
        instructions:
          `Send this to your Telegram bot: /link ${link.token}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/telegram/link]", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
