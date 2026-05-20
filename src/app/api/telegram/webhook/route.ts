// ============================================================
// wingkiiy Job AI — Telegram Bot Webhook (Vercel Serverless)
// ============================================================
// POST /api/telegram/webhook  — receives Telegram updates
// GET  /api/telegram/webhook  — health check + debug info
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/aiAnalyzer";
import { callAI } from "@/lib/aiProviderRouter";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import type { NormalizedVacancy, HHSalary } from "@/types";

// ── Direct Telegram API call (no external deps) ──────────────

async function tgSend(chatId: string, text: string, replyMarkup?: object): Promise<{ ok: boolean; status: number; body: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[TG] No TELEGRAM_BOT_TOKEN env var!");
    return { ok: false, status: 0, body: "TELEGRAM_BOT_TOKEN not set" };
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    console.log(`[TG] sendMessage status=${res.status} body=${body.slice(0, 300)}`);

    // If HTML parsing fails, retry without parse_mode
    if (!res.ok && res.status === 400 && body.includes("can't parse")) {
      console.log("[TG] Retrying without HTML...");
      delete payload.parse_mode;
      const retry = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const retryBody = await retry.text();
      return { ok: retry.ok, status: retry.status, body: retryBody };
    }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("[TG] fetch error:", err);
    return { ok: false, status: 0, body: String(err) };
  }
}

async function tgAnswerCallback(callbackQueryId: string, text?: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: text ?? "", show_alert: false }),
    });
  } catch (err) {
    console.error("[TG] answerCallbackQuery error:", err);
  }
}

// ── Types ─────────────────────────────────────────────────────

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────

function toNormalizedVacancy(v: {
  hhId: string; title: string; company: string | null; area: string | null;
  salary: unknown; url: string | null; applyUrl: string | null; apiUrl: string | null;
  experience: string | null; employment: string | null; schedule: string | null;
  workFormat: unknown; snippet: unknown; description: string | null;
  descriptionHash: string | null; sourceKeyword: string | null;
}): NormalizedVacancy {
  return {
    hhId: v.hhId, title: v.title,
    company: v.company ?? undefined, area: v.area ?? undefined,
    salary: (v.salary as HHSalary) ?? undefined,
    url: v.url ?? undefined, applyUrl: v.applyUrl ?? undefined, apiUrl: v.apiUrl ?? undefined,
    experience: v.experience ?? undefined, employment: v.employment ?? undefined,
    schedule: v.schedule ?? undefined,
    workFormat: (v.workFormat as { id: string; name: string }[]) ?? undefined,
    snippet: (v.snippet as { requirement?: string; responsibility?: string }) ?? undefined,
    description: v.description ?? undefined, descriptionHash: v.descriptionHash ?? undefined,
    sourceKeyword: v.sourceKeyword ?? undefined,
  };
}

// ── Action Handlers ───────────────────────────────────────────

async function handleApprove(vacancyId: string): Promise<string> {
  const v = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
  if (!v) return "❌ Vacancy not found.";
  await saveFeedback(vacancyId, "apply");
  return `✅ <b>Marked as Applied!</b>\n\n<b>Role:</b> ${v.title}\n<b>Company:</b> ${v.company ?? "N/A"}\n\nGood luck! 🍀`;
}

async function handleSkip(vacancyId: string): Promise<string> {
  const v = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
  if (!v) return "❌ Vacancy not found.";
  await saveFeedback(vacancyId, "skip");
  return `🚫 <b>Vacancy Skipped</b>\n\n<b>Role:</b> ${v.title}\n<b>Company:</b> ${v.company ?? "N/A"}\n\nFeedback saved.`;
}

async function handleSave(vacancyId: string): Promise<string> {
  const v = await prisma.vacancy.findUnique({ where: { id: vacancyId } });
  if (!v) return "❌ Vacancy not found.";
  await saveFeedback(vacancyId, "save");
  return `💾 <b>Saved for Later</b>\n\n<b>Role:</b> ${v.title}\n<b>Company:</b> ${v.company ?? "N/A"}`;
}

async function handleEdit(vacancyId: string): Promise<string> {
  const dbVac = await prisma.vacancy.findUnique({ where: { id: vacancyId }, include: { analysis: true } });
  if (!dbVac) return "❌ Vacancy not found.";
  const vacancy = toNormalizedVacancy(dbVac);
  const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
  const prompt = buildAnalysisPrompt(vacancy, [...positive, ...negative]);
  const aiResult = await callAI({ prompt, requestType: "cover_letter", maxTokens: 2048 });

  let coverLetter: string;
  if (aiResult.isRateLimited || !aiResult.content.trim()) {
    coverLetter = dbVac.analysis?.coverLetter ?? "Cover letter not available.";
  } else {
    try {
      const parsed = parseAIResponse(aiResult.content);
      coverLetter = parsed.cover_letter || aiResult.content.trim();
    } catch {
      coverLetter = aiResult.content.trim();
    }

    if (dbVac.analysis) {
      await prisma.vacancyAnalysis.update({ where: { vacancyId }, data: { coverLetter } });
    }
  }

  await prisma.applicationLog.create({
    data: { vacancyId, action: "regenerate_letter", notes: `Provider: ${aiResult.provider}` },
  });

  const truncated = coverLetter.length > 3500 ? `${coverLetter.slice(0, 3500)}…\n\n<i>(truncated)</i>` : coverLetter;
  return `✍️ <b>New Cover Letter for "${dbVac.title}"</b>\n\n<i>${truncated}</i>\n\n<b>Provider:</b> ${aiResult.provider}`;
}

// ── GET: Health check ─────────────────────────────────────────

export async function GET() {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasChatId = !!process.env.TELEGRAM_CHAT_ID;
  return NextResponse.json({
    ok: true,
    webhook: "active",
    hasToken,
    hasChatId,
    timestamp: new Date().toISOString(),
  });
}

// ── POST: Handle Telegram updates ─────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[Webhook] ── Incoming POST ──");
  console.log("[Webhook] TELEGRAM_BOT_TOKEN exists:", !!process.env.TELEGRAM_BOT_TOKEN);

  try {
    const body = await req.text();
    console.log("[Webhook] Raw body:", body.slice(0, 500));

    let update: TelegramUpdate;
    try {
      update = JSON.parse(body);
    } catch {
      console.error("[Webhook] Invalid JSON body");
      return NextResponse.json({ ok: true });
    }

    // ═══════════════════════════════════════════════════════════
    // TEXT MESSAGES
    // ═══════════════════════════════════════════════════════════
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id.toString();
      const username = update.message.from?.username ?? "unknown";

      console.log(`[Webhook] Command: "${text}" chatId: ${chatId} user: ${username}`);

      // ── /start ─────────────────────────────────────────────
      if (text === "/start") {
        console.log("[Webhook] Handling /start...");
        const result = await tgSend(chatId,
          `👋 <b>Welcome to wingkiiy Job AI!</b>\n\n` +
          `To connect this bot with your dashboard:\n` +
          `1. Go to Settings in your dashboard\n` +
          `2. Click "Generate Telegram Token"\n` +
          `3. Send: /link &lt;YOUR_TOKEN&gt;\n\n` +
          `Example: <code>/link A3F1B2</code>\n\n` +
          `<b>Commands:</b>\n` +
          `/link &lt;TOKEN&gt; — Connect to dashboard\n` +
          `/profiles — Switch active profile\n` +
          `/saved — View saved vacancies\n` +
          `/applied — View applied vacancies`
        );
        console.log("[Webhook] /start result:", JSON.stringify(result));
        return NextResponse.json({ ok: true });
      }

      // ── /link <TOKEN> ──────────────────────────────────────
      if (text.startsWith("/link ")) {
        const token = text.slice(6).trim().toUpperCase();
        if (!token || token.length < 4) {
          await tgSend(chatId, "❌ Invalid token. Please check and try again.");
          return NextResponse.json({ ok: true });
        }

        try {
          const link = await prisma.telegramLink.findFirst({ where: { token, isActive: true } });
          if (!link) {
            await tgSend(chatId, "❌ Token not found or expired.\nGenerate a new one from the dashboard Settings.");
            return NextResponse.json({ ok: true });
          }
          await prisma.telegramLink.update({
            where: { id: link.id },
            data: { telegramChatId: chatId, telegramUsername: username, linkedAt: new Date() },
          });
          await tgSend(chatId,
            `✅ <b>Successfully linked!</b>\n\n` +
            `Your Telegram is now connected to the dashboard.\n` +
            `You will receive vacancy notifications here.\n\n` +
            `Try /profiles to switch your active profile.`
          );
        } catch (err) {
          console.error("[Webhook] /link DB error:", err);
          await tgSend(chatId, "⚠️ Error linking account. Please try again.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /profiles ──────────────────────────────────────────
      if (text === "/profiles") {
        try {
          const linked = await prisma.telegramLink.findFirst({ where: { telegramChatId: chatId, isActive: true } });
          if (!linked) {
            await tgSend(chatId, "❌ Not linked yet. Use /link &lt;TOKEN&gt; first.");
            return NextResponse.json({ ok: true });
          }
          const profiles = await prisma.searchPreference.findMany({
            where: { userId: linked.userId },
            select: { id: true, name: true, isActive: true },
          });
          if (profiles.length === 0) {
            await tgSend(chatId, "No profiles found. Create one in the dashboard first.");
          } else {
            const kb = profiles.map((p) => [{ text: `${p.isActive ? "✅" : "⚪"} ${p.name}`, callback_data: `profile:${p.id}` }]);
            await tgSend(chatId, "Select your active profile:", { inline_keyboard: kb });
          }
        } catch (err) {
          console.error("[Webhook] /profiles error:", err);
          await tgSend(chatId, "⚠️ Error loading profiles.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /saved ─────────────────────────────────────────────
      if (text === "/saved") {
        try {
          const linked = await prisma.telegramLink.findFirst({ where: { telegramChatId: chatId, isActive: true } });
          if (!linked) { await tgSend(chatId, "❌ Not linked. Use /link first."); return NextResponse.json({ ok: true }); }
          const saved = await prisma.vacancy.findMany({
            where: { userId: linked.userId, status: "saved" },
            orderBy: { updatedAt: "desc" }, take: 10,
            include: { analysis: { select: { matchScore: true, recommendation: true } } },
          });
          if (saved.length === 0) {
            await tgSend(chatId, "📌 No saved vacancies yet.");
          } else {
            const lines = saved.map((v, i) => {
              const score = v.analysis?.matchScore ?? "—";
              return `${i + 1}. <b>${v.title}</b>\n   ${v.company ?? "—"} • Score: ${score}\n   🔗 ${v.url ?? `https://hh.ru/vacancy/${v.hhId}`}`;
            });
            await tgSend(chatId, `📌 <b>Saved</b> (${saved.length})\n\n${lines.join("\n\n")}`);
          }
        } catch (err) {
          console.error("[Webhook] /saved error:", err);
          await tgSend(chatId, "⚠️ Error loading saved vacancies.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /applied ───────────────────────────────────────────
      if (text === "/applied") {
        try {
          const linked = await prisma.telegramLink.findFirst({ where: { telegramChatId: chatId, isActive: true } });
          if (!linked) { await tgSend(chatId, "❌ Not linked. Use /link first."); return NextResponse.json({ ok: true }); }
          const applied = await prisma.vacancy.findMany({
            where: { userId: linked.userId, status: "applied_manual" },
            orderBy: { updatedAt: "desc" }, take: 10,
            include: { analysis: { select: { matchScore: true } } },
          });
          if (applied.length === 0) {
            await tgSend(chatId, "📋 No applied vacancies yet.");
          } else {
            const lines = applied.map((v, i) => {
              const score = v.analysis?.matchScore ?? "—";
              return `${i + 1}. <b>${v.title}</b>\n   ${v.company ?? "—"} • Score: ${score}\n   🔗 ${v.url ?? `https://hh.ru/vacancy/${v.hhId}`}`;
            });
            await tgSend(chatId, `📋 <b>Applied</b> (${applied.length})\n\n${lines.join("\n\n")}`);
          }
        } catch (err) {
          console.error("[Webhook] /applied error:", err);
          await tgSend(chatId, "⚠️ Error loading applied vacancies.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── Unknown command ────────────────────────────────────
      if (text.startsWith("/")) {
        await tgSend(chatId,
          `<b>Commands:</b>\n` +
          `/start — Welcome\n` +
          `/link &lt;TOKEN&gt; — Connect to dashboard\n` +
          `/profiles — Switch profile\n` +
          `/saved — Saved vacancies\n` +
          `/applied — Applied vacancies`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // ═══════════════════════════════════════════════════════════
    // CALLBACK QUERIES (inline keyboard buttons)
    // ═══════════════════════════════════════════════════════════
    const cb = update.callback_query;
    if (!cb) return NextResponse.json({ ok: true });

    const cbData = cb.data ?? "";
    const cbChatId = cb.message?.chat?.id?.toString();
    const colonIdx = cbData.indexOf(":");
    if (colonIdx === -1) {
      await tgAnswerCallback(cb.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    const action = cbData.slice(0, colonIdx);
    const targetId = cbData.slice(colonIdx + 1);
    if (!targetId) {
      await tgAnswerCallback(cb.id, "Missing ID");
      return NextResponse.json({ ok: true });
    }

    console.log(`[Webhook] Callback: action="${action}" id="${targetId}"`);

    let reply: string;
    let toast: string;

    switch (action) {
      case "approve":
        reply = await handleApprove(targetId);
        toast = "✅ Applied!";
        break;

      case "profile": {
        const pref = await prisma.searchPreference.findUnique({ where: { id: targetId } });
        if (pref) {
          await prisma.searchPreference.updateMany({ where: { userId: pref.userId }, data: { isActive: false } });
          await prisma.searchPreference.update({ where: { id: targetId }, data: { isActive: true } });
        }
        reply = `✅ Active profile: ${pref?.name ?? "unknown"}`;
        toast = "Profile updated";
        break;
      }

      case "skip":
        reply = await handleSkip(targetId);
        toast = "🚫 Skipped";
        break;

      case "save":
        reply = await handleSave(targetId);
        toast = "💾 Saved";
        break;

      case "edit":
        await tgAnswerCallback(cb.id, "✍️ Generating...");
        reply = await handleEdit(targetId);
        if (cbChatId) await tgSend(cbChatId, reply);
        return NextResponse.json({ ok: true });

      default:
        await tgAnswerCallback(cb.id, "Unknown");
        return NextResponse.json({ ok: true });
    }

    await tgAnswerCallback(cb.id, toast);
    if (cbChatId) await tgSend(cbChatId, reply);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Unhandled error:", err);
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }
}
