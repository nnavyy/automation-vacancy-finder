// ============================================================
// Nanda AI Job Assistant — Telegram Bot Webhook
// ============================================================
// POST /api/telegram/webhook
//
// Receives Telegram Bot API Update objects and handles inline
// keyboard button callbacks from vacancy notification messages.
//
// callback_data format:  "<action>:<vacancyId>"
//   approve:<id>  — mark as applied_manual + send confirmation
//   skip:<id>     — mark as skipped + send confirmation
//   save:<id>     — bookmark for later + send confirmation
//   edit:<id>     — regenerate cover letter + send it to Telegram
//
// Telegram requirements:
//   - answerCallbackQuery() MUST be called to remove the spinner
//   - sendMessage() sends the confirmation / new letter to the chat
//
// Required env vars:
//   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
//   TELEGRAM_CHAT_ID    — Nanda's personal Telegram chat ID
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";
import { sendMessage } from "@/lib/telegram";
import { buildAnalysisPrompt, parseAIResponse } from "@/lib/aiAnalyzer";
import { callAI } from "@/lib/aiProviderRouter";
import { getSimilarFeedbackExamples } from "@/lib/feedbackLearning";
import type { NormalizedVacancy, HHSalary } from "@/types";

// ── Telegram API Types ────────────────────────────────────────

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
  message?: TelegramMessage;
}

// ── Telegram API Helpers ──────────────────────────────────────

const TG_API_BASE = "https://api.telegram.org";

/**
 * Answers a Telegram callback_query to remove the loading spinner.
 * MUST be called within 10 seconds of receiving the callback_query.
 *
 * @param callbackQueryId - The id from the callback_query object
 * @param text            - Optional short text shown as a toast notification
 */
async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`${TG_API_BASE}/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text ?? "",
        show_alert: false,
      }),
    });
  } catch (err) {
    console.error("[Webhook] answerCallbackQuery failed:", err);
  }
}

// ── DB → NormalizedVacancy converter ─────────────────────────

/**
 * Converts a raw Prisma Vacancy row to NormalizedVacancy so it can be
 * passed to buildAnalysisPrompt / getSimilarFeedbackExamples.
 */
function toNormalizedVacancy(v: {
  hhId: string;
  title: string;
  company: string | null;
  area: string | null;
  salary: unknown;
  url: string | null;
  applyUrl: string | null;
  apiUrl: string | null;
  experience: string | null;
  employment: string | null;
  schedule: string | null;
  workFormat: unknown;
  snippet: unknown;
  description: string | null;
  descriptionHash: string | null;
  sourceKeyword: string | null;
}): NormalizedVacancy {
  return {
    hhId: v.hhId,
    title: v.title,
    company: v.company ?? undefined,
    area: v.area ?? undefined,
    salary: (v.salary as HHSalary) ?? undefined,
    url: v.url ?? undefined,
    applyUrl: v.applyUrl ?? undefined,
    apiUrl: v.apiUrl ?? undefined,
    experience: v.experience ?? undefined,
    employment: v.employment ?? undefined,
    schedule: v.schedule ?? undefined,
    workFormat:
      (v.workFormat as { id: string; name: string }[]) ?? undefined,
    snippet:
      (v.snippet as { requirement?: string; responsibility?: string }) ??
      undefined,
    description: v.description ?? undefined,
    descriptionHash: v.descriptionHash ?? undefined,
    sourceKeyword: v.sourceKeyword ?? undefined,
  };
}

// ── Action Handlers ───────────────────────────────────────────

/**
 * Handles "approve" callback — marks vacancy as applied and confirms via Telegram.
 */
async function handleApprove(vacancyId: string): Promise<string> {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
  });
  if (!vacancy) return "❌ Vacancy not found.";

  await saveFeedback(vacancyId, "apply");

  return (
    `✅ <b>Marked as Applied!</b>\n\n` +
    `<b>Role:</b> ${vacancy.title}\n` +
    `<b>Company:</b> ${vacancy.company ?? "N/A"}\n\n` +
    `Good luck with your application, Nanda! 🍀`
  );
}

/**
 * Handles "skip" callback — marks vacancy as skipped and confirms via Telegram.
 */
async function handleSkip(vacancyId: string): Promise<string> {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
  });
  if (!vacancy) return "❌ Vacancy not found.";

  await saveFeedback(vacancyId, "skip");

  return (
    `🚫 <b>Vacancy Skipped</b>\n\n` +
    `<b>Role:</b> ${vacancy.title}\n` +
    `<b>Company:</b> ${vacancy.company ?? "N/A"}\n\n` +
    `Skipped — this feedback helps the AI learn your preferences.`
  );
}

/**
 * Handles "save" callback — bookmarks vacancy and confirms via Telegram.
 */
async function handleSave(vacancyId: string): Promise<string> {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
  });
  if (!vacancy) return "❌ Vacancy not found.";

  await saveFeedback(vacancyId, "save");

  return (
    `💾 <b>Saved for Later</b>\n\n` +
    `<b>Role:</b> ${vacancy.title}\n` +
    `<b>Company:</b> ${vacancy.company ?? "N/A"}\n\n` +
    `You can review this vacancy in the dashboard when you're ready.`
  );
}

/**
 * Handles "edit" callback — regenerates the cover letter and sends it via Telegram.
 * On AI failure, sends the existing cover letter with a warning note.
 */
async function handleEdit(vacancyId: string): Promise<string> {
  const dbVacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
    include: { analysis: true },
  });

  if (!dbVacancy) return "❌ Vacancy not found.";

  const vacancy = toNormalizedVacancy(dbVacancy);

  // Get feedback context
  const { positive, negative } = await getSimilarFeedbackExamples(vacancy);
  const similarFeedback = [...positive, ...negative];

  // Build prompt and call AI
  const prompt = buildAnalysisPrompt(vacancy, similarFeedback);
  const aiResult = await callAI({
    prompt,
    requestType: "cover_letter",
    maxTokens: 2048,
  });

  let coverLetter: string;

  if (aiResult.isRateLimited || !aiResult.content.trim()) {
    // Keep existing letter when AI is unavailable
    coverLetter =
      dbVacancy.analysis?.coverLetter ??
      "Cover letter not available. Please try again later.";
    console.warn(
      `[Webhook/edit] AI unavailable for vacancy ${vacancyId}. Using existing letter.`
    );
  } else {
    try {
      const parsed = parseAIResponse(aiResult.content);
      coverLetter = parsed.cover_letter;

      // Persist the updated cover letter
      if (dbVacancy.analysis) {
        await prisma.vacancyAnalysis.update({
          where: { vacancyId },
          data: { coverLetter },
        });
      }
    } catch {
      coverLetter =
        dbVacancy.analysis?.coverLetter ??
        "Cover letter not available. Please try again later.";
    }
  }

  // Log the regeneration
  await prisma.applicationLog.create({
    data: {
      vacancyId,
      action: "regenerate_letter",
      notes: `Cover letter regenerated via Telegram. Provider: ${aiResult.provider}`,
    },
  });

  // Telegram messages have a 4096 char limit — truncate if needed
  const truncatedLetter =
    coverLetter.length > 3500
      ? `${coverLetter.slice(0, 3500)}…\n\n<i>(truncated — see full letter in dashboard)</i>`
      : coverLetter;

  return (
    `✍️ <b>New Cover Letter for "${dbVacancy.title}"</b>\n\n` +
    `<i>${truncatedLetter}</i>\n\n` +
    `<b>Provider:</b> ${aiResult.provider}`
  );
}

// ── Route Handler ─────────────────────────────────────────────

/**
 * POST /api/telegram/webhook
 *
 * Handles Telegram Bot API Update objects delivered by the webhook.
 * Only callback_query updates are processed; all others are silently ignored.
 *
 * callback_data format:  "<action>:<vacancyId>"
 *
 * Always returns 200 { ok: true } — Telegram requires a 2xx response within
 * 10 seconds, otherwise it will retry the delivery.
 */
export async function POST(req: NextRequest) {
  try {
    const update = (await req.json().catch(() => ({}))) as TelegramUpdate;
    console.log("[Webhook] Received update type:", Object.keys(update));

    // ── Handle incoming text messages ───────────────────────
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id.toString();
      const username = (update.message as any).from?.username ?? undefined;

      // ── /start — Welcome message ──────────────────────────
      if (text === "/start") {
        let isLinked = false;

        try {
          const link = await prisma.telegramLink.findFirst({
            where: { telegramChatId: chatId, isActive: true },
          });
          isLinked = Boolean(link);
        } catch (dbErr) {
          console.error("[Webhook /start] DB lookup failed:", dbErr);
        }

        if (isLinked) {
          await sendMessage(
            `✅ <b>Welcome back!</b>\n\n` +
            `Your Telegram is linked to the dashboard.\n\n` +
            `<b>Available commands:</b>\n` +
            `/profiles — Switch active profile\n` +
            `/saved — View saved vacancies\n` +
            `/applied — View applied vacancies\n` +
            `/link &lt;TOKEN&gt; — Re-link with a new token`,
            undefined, chatId
          );
        } else {
          await sendMessage(
            `👋 <b>Welcome to Nanda AI Job Assistant!</b>\n\n` +
            `To connect this bot with your dashboard:\n` +
            `1. Go to Settings in your dashboard\n` +
            `2. Click "Generate Telegram Token"\n` +
            `3. Send: /link &lt;YOUR_TOKEN&gt;\n\n` +
            `Example: <code>/link A3F1B2</code>`,
            undefined, chatId
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── /link <TOKEN> — Link Telegram to dashboard ────────
      if (text.startsWith("/link ")) {
        const token = text.slice(6).trim().toUpperCase();
        if (!token || token.length < 4) {
          await sendMessage("❌ Invalid token. Please check and try again.", undefined, chatId);
          return NextResponse.json({ ok: true });
        }

        const link = await prisma.telegramLink.findFirst({
          where: { token, isActive: true },
        });

        if (!link) {
          await sendMessage(
            "❌ Token not found or expired.\nGenerate a new one from the dashboard Settings.",
            undefined, chatId
          );
          return NextResponse.json({ ok: true });
        }

        // Update the link with chatId
        await prisma.telegramLink.update({
          where: { id: link.id },
          data: {
            telegramChatId: chatId,
            telegramUsername: username,
            linkedAt: new Date(),
          },
        });

        // Also update TELEGRAM_CHAT_ID env-style by storing it
        await sendMessage(
          `✅ <b>Successfully linked!</b>\n\n` +
          `Your Telegram is now connected to the dashboard.\n` +
          `You will receive vacancy notifications here.\n\n` +
          `Try /profiles to switch your active profile.`,
          undefined, chatId
        );
        return NextResponse.json({ ok: true });
      }

      // ── /profiles — List & switch profiles ────────────────
      if (text === "/profiles") {
        const profiles = await prisma.searchPreference.findMany({
          select: { id: true, name: true, isActive: true },
        });

        if (profiles.length === 0) {
          await sendMessage("No profiles found. Create one in the dashboard first.", undefined, chatId);
        } else {
          const inlineKeyboard = profiles.map((p) => [
            {
              text: `${p.isActive ? "✅" : "⚪"} ${p.name}`,
              callback_data: `profile:${p.id}`,
            },
          ]);
          await sendMessage("Select your active profile:", { inline_keyboard: inlineKeyboard }, chatId);
        }
        return NextResponse.json({ ok: true });
      }

      // ── /saved — List saved vacancies ─────────────────────
      if (text === "/saved") {
        const saved = await prisma.vacancy.findMany({
          where: { status: "saved" },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: { analysis: { select: { matchScore: true, recommendation: true } } },
        });

        if (saved.length === 0) {
          await sendMessage("📌 No saved vacancies yet.", undefined, chatId);
        } else {
          const lines = saved.map((v, i) => {
            const score = v.analysis?.matchScore ?? "—";
            const rec = v.analysis?.recommendation ?? "—";
            return `${i + 1}. <b>${v.title}</b>\n   ${v.company ?? "—"} • Score: ${score} • ${rec}\n   🔗 ${v.url ?? `https://hh.ru/vacancy/${v.hhId}`}`;
          });
          await sendMessage(
            `📌 <b>Saved Vacancies</b> (${saved.length})\n\n${lines.join("\n\n")}`,
            undefined, chatId
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── /applied — List applied vacancies ─────────────────
      if (text === "/applied") {
        const applied = await prisma.vacancy.findMany({
          where: { status: "applied_manual" },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: { analysis: { select: { matchScore: true, recommendation: true } } },
        });

        if (applied.length === 0) {
          await sendMessage("📋 No applied vacancies yet.", undefined, chatId);
        } else {
          const lines = applied.map((v, i) => {
            const score = v.analysis?.matchScore ?? "—";
            return `${i + 1}. <b>${v.title}</b>\n   ${v.company ?? "—"} • Score: ${score}\n   🔗 ${v.url ?? `https://hh.ru/vacancy/${v.hhId}`}`;
          });
          await sendMessage(
            `📋 <b>Applied Vacancies</b> (${applied.length})\n\n${lines.join("\n\n")}`,
            undefined, chatId
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── Unknown command — show help ───────────────────────
      if (text.startsWith("/")) {
        await sendMessage(
          `<b>Available commands:</b>\n` +
          `/start — Welcome & status\n` +
          `/link &lt;TOKEN&gt; — Connect to dashboard\n` +
          `/profiles — Switch active profile\n` +
          `/saved — View saved vacancies\n` +
          `/applied — View applied vacancies`,
          undefined, chatId
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ── Handle callback queries (inline keyboard button presses)
    const callbackQuery = update.callback_query;
    if (!callbackQuery) {
      return NextResponse.json({ ok: true });
    }

    const callbackData = callbackQuery.data ?? "";

    // ── Parse callback_data: "<action>:<vacancyId>" ───────
    const colonIndex = callbackData.indexOf(":");
    if (colonIndex === -1) {
      console.warn(`[Webhook] Malformed callback_data: "${callbackData}"`);
      await answerCallbackQuery(callbackQuery.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    const action = callbackData.slice(0, colonIndex);
    const vacancyId = callbackData.slice(colonIndex + 1);

    if (!vacancyId) {
      console.warn(`[Webhook] Missing vacancyId in callback_data: "${callbackData}"`);
      await answerCallbackQuery(callbackQuery.id, "Missing vacancy ID");
      return NextResponse.json({ ok: true });
    }

    console.log(`[Webhook] Action="${action}" for vacancy="${vacancyId}"`);

    // ── Dispatch to action handler ────────────────────────
    let replyText: string;
    let toastText: string;

    switch (action) {
      case "approve":
        replyText = await handleApprove(vacancyId);
        toastText = "✅ Marked as applied!";
        break;

      case "profile":
        // Sequential queries instead of $transaction (NeonDB HTTP doesn't support it)
        await prisma.searchPreference.updateMany({ data: { isActive: false } });
        await prisma.searchPreference.update({ where: { id: vacancyId }, data: { isActive: true } });
        const activated = await prisma.searchPreference.findUnique({ where: { id: vacancyId } });
        replyText = `✅ Active profile changed to: ${activated?.name}`;
        toastText = "Profile updated";
        break;

      case "skip":
        replyText = await handleSkip(vacancyId);
        toastText = "🚫 Vacancy skipped";
        break;

      case "save":
        replyText = await handleSave(vacancyId);
        toastText = "💾 Saved for later";
        break;

      case "edit":
        // "edit" takes longer — answer immediately so the spinner disappears
        await answerCallbackQuery(callbackQuery.id, "✍️ Generating new letter...");
        const chatId = callbackQuery.message?.chat?.id?.toString();
        replyText = await handleEdit(vacancyId);
        // Don't answer again below — already answered above
        await sendMessage(replyText, undefined, chatId);
        return NextResponse.json({ ok: true });

      default:
        console.warn(`[Webhook] Unknown action: "${action}"`);
        await answerCallbackQuery(callbackQuery.id, "Unknown action");
        return NextResponse.json({ ok: true });
    }

    // ── Answer callback_query (removes the spinner on the button) ──
    await answerCallbackQuery(callbackQuery.id, toastText);

    // ── Send confirmation / result message to Telegram ────
    const chatId = callbackQuery.message?.chat?.id?.toString();
    await sendMessage(replyText, undefined, chatId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/telegram/webhook]", err);
    // Always return 200 — a 5xx response causes Telegram to re-deliver
    // the same update for up to 3 retries.
    return NextResponse.json({ ok: true });
  }
}
