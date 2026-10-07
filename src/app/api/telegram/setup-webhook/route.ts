// ============================================================
// GET /api/telegram/setup-webhook
// Hit this URL in your browser to register the Telegram webhook.
// e.g. https://your-app.vercel.app/api/telegram/setup-webhook
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getApiUser();
  const authHeader = req.headers.get("authorization");
  const secretParam = req.nextUrl.searchParams.get("secret");

  const isAuthorized =
    Boolean(user?.id) ||
    (Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
    (Boolean(process.env.TELEGRAM_WEBHOOK_SECRET) && secretParam === process.env.TELEGRAM_WEBHOOK_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  // Auto-detect the domain from the request
  const host = req.headers.get("host") ?? req.nextUrl.host;
  const protocol = host.includes("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });

    const body = await res.json();
    console.log("[Setup] Telegram response:", body);

    // Set bot menu commands
    const cmdsRes = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: "POST",
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
    const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
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
