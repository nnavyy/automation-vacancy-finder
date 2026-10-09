// ============================================================
// Telegram Link API — per-user token generation
// ============================================================
// POST /api/telegram/link — Generate a new link token
// GET  /api/telegram/link — Get current link status
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import crypto from "crypto";

function generateToken(): string {
  // Generate friendly 6-character uppercase token (e.g. 7AF044)
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function getBotUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME || "Wongkiisbot";
}

// ── GET: Check current link status ────────────────────────────

export async function GET() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const link = await prisma.telegramLink.findFirst({
      where:   { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const botUsername = getBotUsername();

    if (!link) {
      return NextResponse.json({
        success: true,
        data: {
          linked: false,
          token: null,
          botUsername,
          deepLink: null,
        },
      });
    }

    const deepLink = link.token ? `https://t.me/${botUsername}?start=${link.token}` : null;

    return NextResponse.json({
      success: true,
      data: {
        linked:   !!link.telegramChatId,
        token:    link.token,
        chatId:   link.telegramChatId,
        username: link.telegramUsername,
        linkedAt: link.linkedAt,
        botUsername,
        deepLink,
      },
    });
  } catch (error) {
    console.error("[GET /api/telegram/link]", error);
    return NextResponse.json({ success: false, error: "Failed to get link status" }, { status: 500 });
  }
}

// ── POST: Generate new link token ─────────────────────────────

export async function POST() {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
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

    const botUsername = getBotUsername();
    const deepLink = `https://t.me/${botUsername}?start=${link.token}`;

    return NextResponse.json({
      success: true,
      data: {
        token:        link.token,
        botUsername,
        deepLink,
        instructions: `Send this to your Telegram bot: /start ${link.token}`,
      },
    });
  } catch (error) {
    console.error("[POST /api/telegram/link]", error);
    return NextResponse.json({ success: false, error: "Failed to generate token" }, { status: 500 });
  }
}

