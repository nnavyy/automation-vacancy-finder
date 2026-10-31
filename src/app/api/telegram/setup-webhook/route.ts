// ============================================================
// GET /api/telegram/setup-webhook
// Hit this URL in your browser to register the Telegram webhook.
// e.g. https://your-app.vercel.app/api/telegram/setup-webhook
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/timingSafe";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const isAuthorized = Boolean(process.env.CRON_SECRET) && safeEqual(authHeader, `Bearer ${process.env.CRON_SECRET}`);

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "APP_BASE_URL and TELEGRAM_WEBHOOK_SECRET are required." }, { status: 503 });
  }
  const webhookUrl = new URL("/api/telegram/webhook", baseUrl).toString();

  console.log(`[Setup] Setting webhook to: ${webhookUrl}`);

  try {
    const webhookPayload: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    };
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      webhookPayload.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const body = await res.json();
    console.log("[Setup] Telegram response:", body);

    // Set bot menu commands
    const cmdsRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "start", description: "Show welcome and status" },
          { command: "profiles", description: "Switch active profile" },
          { command: "saved", description: "View saved vacancies" },
          { command: "applied", description: "View applied vacancies" }
        ]
      }),
    });
    const cmdsBody = await cmdsRes.json();
    console.log("[Setup] Set commands response:", cmdsBody);

    // Also get current webhook info
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`, { signal: AbortSignal.timeout(10_000) });
    const info = await infoRes.json();

    return NextResponse.json({
      ok: body.ok,
      webhookUrl,
      telegramResponse: body,
      currentWebhookInfo: info.result,
    });
  } catch (err) {
    console.error("[Setup] Error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
