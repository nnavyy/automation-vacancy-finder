// ============================================================
// Telegram Link API — per-user token generation
// ============================================================
// POST /api/telegram/link — Generate a new link token
// GET  /api/telegram/link — Get current link status
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// ── GET: Check current link status ────────────────────────────

export async function GET() {
  const user = await requireUser();
  try {
    const link = await prisma.telegramLink.findFirst({
      where:   { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!link) {
      return NextResponse.json({ success: true, data: { linked: false, token: null } });
    }

    return NextResponse.json({
      success: true,
      data: {
        linked:   !!link.telegramChatId,
        token:    link.token,
        chatId:   link.telegramChatId,
        username: link.telegramUsername,
        linkedAt: link.linkedAt,
      },
    });
  } catch (error) {
    console.error("[GET /api/telegram/link]", error);
    return NextResponse.json({ success: false, error: "Failed to get link status" }, { status: 500 });
  }
}

// ── POST: Generate new link token ─────────────────────────────

export async function POST() {
  const user = await requireUser();
  try {
    // Deactivate previous tokens for this user
    await prisma.telegramLink.updateMany({
      where: { userId: user.id },
      data:  { isActive: false },
    });

    const token = generateToken();
    const link  = await prisma.telegramLink.create({
      data: { userId: user.id, token, isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        token:        link.token,
        instructions: `Send this to your Telegram bot: /link ${link.token}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/telegram/link]", error);
    return NextResponse.json({ success: false, error: "Failed to generate token" }, { status: 500 });
  }
}
