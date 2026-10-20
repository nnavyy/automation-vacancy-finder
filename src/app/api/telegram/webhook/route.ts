// ============================================================
// wingkiiy Job AI — Telegram Bot Webhook (Vercel Serverless)
// ============================================================
// POST /api/telegram/webhook  — receives Telegram updates
// GET  /api/telegram/webhook  — health check + debug info
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";
import { generateCoverLetter } from "@/lib/aiAnalyzer";
import { escapeHtml, truncateString } from "@/lib/telegram";
import { BRAND_NAME } from "@/lib/brand";
import { safeEqual } from "@/lib/timingSafe";
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
    from?: { id: number; username?: string; language_code?: string };
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
    };
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string; language_code?: string };
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

async function handleLinkAccount(tokenCandidate: string, chatId: string, username: string): Promise<boolean> {
  const token = tokenCandidate.trim().toUpperCase();
  if (!token || token.length < 4) {
    return false;
  }
  try {
    const link = await prisma.telegramLink.findFirst({
      where: { token, isActive: true },
    });
    if (!link) {
      return false;
    }

    // Determine user language preference
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: link.userId, isActive: true },
      select: { language: true, coverLetterLanguage: true },
    });
    const isRu = (pref as any)?.language === "ru" || pref?.coverLetterLanguage === "Russian" || link.language === "ru";
    const userLang = isRu ? "ru" : "en";

    await prisma.telegramLink.update({
      where: { id: link.id },
      data: {
        telegramChatId: chatId,
        telegramUsername: username,
        linkedAt: new Date(),
        language: userLang,
      },
    });

    if (isRu) {
      await tgSend(
        chatId,
        `<b>[Успешно подключено]</b>\n\n` +
        `Ваш Telegram-аккаунт успешно привязан к панели управления <b>${BRAND_NAME}</b>.\n` +
        `Теперь вы будете получать уведомления о подходящих вакансиях с интерактивными кнопками прямо здесь!\n\n` +
        `Используйте команду /profiles для выбора поискового профиля или /help для списка команд.`
      );
    } else {
      await tgSend(
        chatId,
        `<b>[Successfully Linked]</b>\n\n` +
        `Your Telegram account is now connected to the <b>${BRAND_NAME}</b> dashboard.\n` +
        `You will receive real-time vacancy alerts with instant Action buttons here!\n\n` +
        `Try /profiles to inspect or switch your active search profile or /help for commands.`
      );
    }
    return true;
  } catch (err) {
    console.error("[Webhook] handleLinkAccount DB error:", err);
    await tgSend(chatId, "[Error] Failed to link account. Please try again.");
    return true;
  }
}

async function handleApprove(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const v = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId } });
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "apply");
  if (isRu) {
    return `<b>[Отклик зарегистрирован]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}\n\nУдачи на собеседовании!`;
  }
  return `<b>[Marked as Applied]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}\n\nGood luck!`;
}

async function handleSkip(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const v = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId } });
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "skip");
  if (isRu) {
    return `<b>[Вакансия пропущена]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}\n\nОбратная связь учтена в обучении модели.`;
  }
  return `<b>[Vacancy Skipped]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}\n\nFeedback saved.`;
}

async function handleSave(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const v = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId } });
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "save");
  if (isRu) {
    return `<b>[Сохранено в избранное]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}`;
  }
  return `<b>[Saved for Later]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}`;
}

async function handleEdit(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const dbVac = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId }, include: { analysis: true } });
  if (!dbVac) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  if (!dbVac.analysis) {
    return isRu ? "[Ошибка] Сначала нужно проанализировать вакансию." : "[Error] Analyze this vacancy first.";
  }
  const pref = await prisma.searchPreference.findFirst({ where: { userId, isActive: true } });
  if (!pref) {
    return isRu ? "[Ошибка] Нет активного профиля поиска." : "[Error] No active search profile.";
  }

  const coverLetter = await generateCoverLetter(
    toNormalizedVacancy(dbVac),
    {
      best_language: (dbVac.analysis.bestLanguage as "english" | "russian" | undefined) ?? undefined,
      match_reasons: (dbVac.analysis.matchReasons as string[]) ?? [],
    },
    pref
  );

  await prisma.vacancyAnalysis.update({ where: { vacancyId }, data: { coverLetter } });
  await prisma.applicationLog.create({
    data: { vacancyId, action: "regenerate_letter", notes: "Regenerated from Telegram" },
  });

  // Truncate plain text first, then escape, so entities are never cut in half.
  const shown = escapeHtml(truncateString(coverLetter, 3500));
  const title = escapeHtml(dbVac.title);
  if (isRu) {
    return `<b>[Новое сопроводительное письмо] "${title}"</b>\n\n<i>${shown}</i>`;
  }
  return `<b>[New Cover Letter] "${title}"</b>\n\n<i>${shown}</i>`;
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

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Webhook Dev] Warning: TELEGRAM_WEBHOOK_SECRET is not set. Allowing request in development mode.");
    } else {
      console.error("[Webhook] TELEGRAM_WEBHOOK_SECRET is not configured on the server. Rejecting request.");
      return NextResponse.json({ ok: false, error: "Webhook secret is not configured" }, { status: 503 });
    }
  } else {
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token") || "";
    if (!safeEqual(secretHeader, webhookSecret)) {
      console.warn("[Webhook] Invalid secret token header");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.text();
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

      // Detect user link & active language
      const linked = await prisma.telegramLink.findFirst({
        where: { telegramChatId: chatId, isActive: true },
      });

      const lang: string = linked?.language === "ru"
        ? "ru"
        : update.message.from?.language_code?.toLowerCase().startsWith("ru")
        ? "ru"
        : "en";
      const isRu = lang === "ru";

      console.log(`[Webhook] Text: "${text}" chatId: ${chatId} user: ${username} lang: ${lang}`);

      // ── Handle Manual Cover Letter Reply ─────────────────────
      if (update.message.reply_to_message) {
        const rText = update.message.reply_to_message.text || "";
        if (
          rText.includes("edit cover letter for Vacancy ID:\n") ||
          rText.includes("изменить сопроводительное письмо для ID:\n")
        ) {
          const vacancyId = rText.split("\n").pop()?.trim();
          if (vacancyId) {
            try {
              if (!linked) {
                await tgSend(chatId, isRu ? "[Ошибка] Аккаунт не привязан. Используйте /link." : "[Error] Account not linked. Use /link first.");
                return NextResponse.json({ ok: true });
              }
              const dbVac = await prisma.vacancy.findFirst({ where: { id: vacancyId, userId: linked.userId }, include: { analysis: true } });
              if (dbVac && dbVac.analysis) {
                await prisma.vacancyAnalysis.update({
                  where: { vacancyId },
                  data: { coverLetter: text },
                });
                await tgSend(
                  chatId,
                  isRu
                    ? `<b>[Сопроводительное письмо сохранено]</b>\nВаш отредактированный текст для «${escapeHtml(dbVac.title)}» успешно сохранён.`
                    : `<b>[Cover Letter Saved]</b>\nYour manual edit for "${escapeHtml(dbVac.title)}" has been saved successfully.`
                );
                return NextResponse.json({ ok: true });
              }
            } catch (err) {
              console.error("[Webhook] Manual edit error:", err);
            }
          }
        }
      }

      // ── /start [TOKEN] ─────────────────────────────────────
      if (text.startsWith("/start")) {
        const parts = text.split(/\s+/);
        if (parts.length > 1 && parts[1]) {
          const linkedSuccess = await handleLinkAccount(parts[1], chatId, username);
          if (linkedSuccess) return NextResponse.json({ ok: true });
        }

        if (linked) {
          // Already linked user greeting
          if (isRu) {
            await tgSend(
              chatId,
              `<b>Добро пожаловать в ${BRAND_NAME}!</b>\n\n` +
              `Ваш аккаунт уже подключен к веб-панели управления.\n` +
              `Вы будете получать мгновенные уведомления о найденных вакансиях прямо сюда.\n\n` +
              `<b>Команды бота:</b>\n` +
              `/profiles — Выбрать активный поисковый профиль\n` +
              `/saved — Просмотреть сохранённые вакансии\n` +
              `/applied — Просмотреть отправленные отклики\n` +
              `/lang &lt;ru|en&gt; — Переключить язык бота\n` +
              `/help — Показать список команд`
            );
          } else {
            await tgSend(
              chatId,
              `<b>Welcome to ${BRAND_NAME}!</b>\n\n` +
              `Your account is connected to the dashboard.\n` +
              `You will receive real-time vacancy alerts with instant Action buttons here.\n\n` +
              `<b>Commands:</b>\n` +
              `/profiles — Switch active search profile\n` +
              `/saved — View saved vacancies\n` +
              `/applied — View applied vacancies\n` +
              `/lang &lt;ru|en&gt; — Switch bot language\n` +
              `/help — Show all commands`
            );
          }
        } else {
          // Unlinked user welcome instructions
          if (isRu) {
            await tgSend(
              chatId,
              `<b>Добро пожаловать в ${BRAND_NAME}!</b>\n\n` +
              `Чтобы подключить этого бота к вашей веб-панели:\n` +
              `1. Откройте вкладку <b>Настройки</b> в вашей панели управления\n` +
              `2. В блоке <b>Telegram</b> нажмите кнопку <b>Создать</b>\n` +
              `3. Отправьте ваш токен сюда или напишите: <code>/link ВАШ_ТОКЕН</code>\n\n` +
              `Пример: <code>/link YOUR_TOKEN</code> или просто вставьте <code>YOUR_TOKEN</code>\n\n` +
              `<b>Команды:</b>\n` +
              `/link &lt;ТОКЕН&gt; — Подключить аккаунт\n` +
              `/lang &lt;ru|en&gt; — Переключить язык`
            );
          } else {
            await tgSend(
              chatId,
              `<b>Welcome to ${BRAND_NAME}!</b>\n\n` +
              `To connect this bot with your dashboard:\n` +
              `1. Go to <b>Settings</b> in your dashboard\n` +
              `2. Under <b>Telegram Bot Notifications</b>, click <b>Generate</b>\n` +
              `3. Send your token here or send: <code>/link YOUR_TOKEN</code>\n\n` +
              `Example: <code>/link YOUR_TOKEN</code> or simply paste <code>YOUR_TOKEN</code>\n\n` +
              `<b>Commands:</b>\n` +
              `/link &lt;TOKEN&gt; — Connect to dashboard\n` +
              `/profiles — Switch active profile\n` +
              `/saved — View saved vacancies\n` +
              `/applied — View applied vacancies\n` +
              `/lang &lt;ru|en&gt; — Switch bot language`
            );
          }
        }
        return NextResponse.json({ ok: true });
      }

      // ── /link <TOKEN> ──────────────────────────────────────
      if (text.startsWith("/link ")) {
        const token = text.slice(6).trim();
        const linkedSuccess = await handleLinkAccount(token, chatId, username);
        if (!linkedSuccess) {
          await tgSend(
            chatId,
            isRu
              ? "[Ошибка] Токен не найден или устарел.\nСгенерируйте новый токен синхронизации в Настройках веб-панели."
              : "[Error] Token not found or expired.\nGenerate a new token from your dashboard Settings."
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── /lang <ru|en> ───────────────────────────────────────
      if (text.startsWith("/lang")) {
        const parts = text.split(/\s+/);
        const targetLang = parts[1]?.toLowerCase();
        if (targetLang === "ru" || targetLang === "en") {
          if (linked) {
            await prisma.telegramLink.update({
              where: { id: linked.id },
              data: { language: targetLang },
            });
            await prisma.searchPreference.updateMany({
              where: { userId: linked.userId, isActive: true },
              data: { language: targetLang },
            });
          }
          if (targetLang === "ru") {
            await tgSend(chatId, "<b>[Язык обновлён]</b> Язык бота успешно установлен на русский.");
          } else {
            await tgSend(chatId, "<b>[Language Updated]</b> Bot language successfully set to English.");
          }
        } else {
          await tgSend(
            chatId,
            isRu
              ? "Использование: <code>/lang ru</code> или <code>/lang en</code>"
              : "Usage: <code>/lang ru</code> or <code>/lang en</code>"
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── Direct Token Submission (e.g. user just pastes token code) ──
      if (/^[a-zA-Z0-9]{4,32}$/.test(text) && !text.startsWith("/")) {
        const linkedSuccess = await handleLinkAccount(text, chatId, username);
        if (linkedSuccess) {
          return NextResponse.json({ ok: true });
        }
      }

      // ── /profiles ──────────────────────────────────────────
      if (text === "/profiles") {
        try {
          if (!linked) {
            await tgSend(
              chatId,
              isRu
                ? "[Ошибка] Аккаунт не привязан. Используйте команду <code>/link ВАШ_ТОКЕН</code>."
                : "[Error] Not linked yet. Use <code>/link YOUR_TOKEN</code> first."
            );
            return NextResponse.json({ ok: true });
          }
          const profiles = await prisma.searchPreference.findMany({
            where: { userId: linked.userId },
            select: { id: true, name: true, isActive: true },
          });
          if (profiles.length === 0) {
            await tgSend(
              chatId,
              isRu
                ? "Профили поиска не найдены. Создайте профиль в веб-панели управления."
                : "No profiles found. Create one in the dashboard first."
            );
          } else {
            const kb = profiles.map((p) => [
              {
                text: `${p.isActive ? (isRu ? "[Активен] " : "[Active] ") : ""}${p.name}`,
                callback_data: `profile:${p.id}`,
              },
            ]);
            await tgSend(
              chatId,
              isRu ? "Выберите активный профиль поиска:" : "Select your active profile:",
              { inline_keyboard: kb }
            );
          }
        } catch (err) {
          console.error("[Webhook] /profiles error:", err);
          await tgSend(chatId, isRu ? "[Ошибка] Ошибка загрузки профилей." : "[Error] Error loading profiles.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /saved ─────────────────────────────────────────────
      if (text === "/saved") {
        try {
          if (!linked) {
            await tgSend(chatId, isRu ? "[Ошибка] Аккаунт не привязан. Используйте /link." : "[Error] Not linked. Use /link first.");
            return NextResponse.json({ ok: true });
          }
          const saved = await prisma.vacancy.findMany({
            where: { userId: linked.userId, status: "saved" },
            orderBy: { updatedAt: "desc" },
            take: 10,
            include: { analysis: { select: { matchScore: true, recommendation: true } } },
          });
          if (saved.length === 0) {
            await tgSend(chatId, isRu ? "У вас пока нет сохранённых вакансий." : "No saved vacancies yet.");
          } else {
            const lines = saved.map((v, i) => {
              const score = v.analysis?.matchScore ?? "—";
              const url = v.url && v.url.startsWith("http") ? v.url : `https://hh.ru/vacancy/${v.hhId.replace(/\D/g, "")}`;
              return `${i + 1}. <b>${escapeHtml(v.title)}</b>\n   ${escapeHtml(v.company ?? "—")} • ${isRu ? "Оценка" : "Score"}: ${score}\n   ${url}`;
            });
            await tgSend(chatId, `<b>[${isRu ? "Сохранённые вакансии" : "Saved"}]</b> (${saved.length})\n\n${lines.join("\n\n")}`);
          }
        } catch (err) {
          console.error("[Webhook] /saved error:", err);
          await tgSend(chatId, isRu ? "[Ошибка] Ошибка загрузки сохранённых вакансий." : "[Error] Error loading saved vacancies.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /applied ───────────────────────────────────────────
      if (text === "/applied") {
        try {
          if (!linked) {
            await tgSend(chatId, isRu ? "[Ошибка] Аккаунт не привязан. Используйте /link." : "[Error] Not linked. Use /link first.");
            return NextResponse.json({ ok: true });
          }
          const applied = await prisma.vacancy.findMany({
            where: { userId: linked.userId, status: "applied_manual" },
            orderBy: { updatedAt: "desc" },
            take: 10,
            include: { analysis: { select: { matchScore: true } } },
          });
          if (applied.length === 0) {
            await tgSend(chatId, isRu ? "У вас пока нет вакансий с откликами." : "No applied vacancies yet.");
          } else {
            const lines = applied.map((v, i) => {
              const score = v.analysis?.matchScore ?? "—";
              const url = v.url && v.url.startsWith("http") ? v.url : `https://hh.ru/vacancy/${v.hhId.replace(/\D/g, "")}`;
              return `${i + 1}. <b>${escapeHtml(v.title)}</b>\n   ${escapeHtml(v.company ?? "—")} • ${isRu ? "Оценка" : "Score"}: ${score}\n   ${url}`;
            });
            await tgSend(chatId, `<b>[${isRu ? "Отправленные отклики" : "Applied"}]</b> (${applied.length})\n\n${lines.join("\n\n")}`);
          }
        } catch (err) {
          console.error("[Webhook] /applied error:", err);
          await tgSend(chatId, isRu ? "[Ошибка] Ошибка загрузки откликов." : "[Error] Error loading applied vacancies.");
        }
        return NextResponse.json({ ok: true });
      }

      // ── /help or unknown command ────────────────────────────
      if (text.startsWith("/")) {
        if (isRu) {
          await tgSend(
            chatId,
            `<b>Команды бота ${BRAND_NAME}:</b>\n\n` +
            `/start — Приветствие и статус подключения\n` +
            `/link &lt;ТОКЕН&gt; — Подключить аккаунт к панели\n` +
            `/profiles — Выбрать активный поисковый профиль\n` +
            `/saved — Просмотреть сохранённые вакансии\n` +
            `/applied — Вакансии, на которые вы откликнулись\n` +
            `/lang &lt;ru|en&gt; — Переключить язык бота`
          );
        } else {
          await tgSend(
            chatId,
            `<b>Commands for ${BRAND_NAME}:</b>\n\n` +
            `/start — Welcome & connection status\n` +
            `/link &lt;TOKEN&gt; — Connect to dashboard\n` +
            `/profiles — Switch search profile\n` +
            `/saved — Saved vacancies\n` +
            `/applied — Applied vacancies\n` +
            `/lang &lt;ru|en&gt; — Switch bot language`
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    // ═══════════════════════════════════════════════════════════
    // CALLBACK QUERIES (inline keyboard buttons)
    // ═══════════════════════════════════════════════════════════
    const cb = update.callback_query;
    if (!cb) return NextResponse.json({ ok: true });

    const cbData = cb.data ?? "";
    const cbChatId = cb.message?.chat?.id?.toString() || cb.from?.id?.toString();
    const colonIdx = cbData.indexOf(":");
    if (colonIdx === -1) {
      await tgAnswerCallback(cb.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    const action = cbData.slice(0, colonIdx);
    const targetId = cbData.slice(colonIdx + 1);
    if (!targetId || !cbChatId) {
      await tgAnswerCallback(cb.id, "Invalid action request");
      return NextResponse.json({ ok: true });
    }

    const linked = await prisma.telegramLink.findFirst({
      where: { telegramChatId: cbChatId, isActive: true },
    });
    if (!linked) {
      await tgAnswerCallback(cb.id, "Not linked");
      await tgSend(cbChatId, "[Error] Account not linked. Use /link with your token from Settings first.");
      return NextResponse.json({ ok: true });
    }

    const lang: string = linked.language === "ru" ? "ru" : "en";
    const isRu = lang === "ru";

    console.log(`[Webhook] Callback: action="${action}" id="${targetId}" user="${linked.userId}" lang="${lang}"`);

    let reply: string;
    let toast: string;

    switch (action) {
      case "approve":
        reply = await handleApprove(targetId, linked.userId, lang);
        toast = isRu ? "Отклик отправлен!" : "Applied!";
        break;

      case "profile": {
        const pref = await prisma.searchPreference.findFirst({
          where: { id: targetId, userId: linked.userId },
        });
        if (pref) {
          await prisma.searchPreference.updateMany({ where: { userId: linked.userId }, data: { isActive: false } });
          await prisma.searchPreference.update({ where: { id: targetId, userId: linked.userId }, data: { isActive: true } });
          reply = isRu ? `[Активен] Профиль: ${pref.name}` : `[Active] Profile: ${pref.name}`;
          toast = isRu ? "Профиль обновлен" : "Profile updated";
        } else {
          reply = isRu ? "[Ошибка] Профиль не найден." : "[Error] Profile not found.";
          toast = isRu ? "Профиль не найден" : "Profile not found";
        }
        break;
      }

      case "skip":
        reply = await handleSkip(targetId, linked.userId, lang);
        toast = isRu ? "Пропущено" : "Skipped";
        break;

      case "save":
        reply = await handleSave(targetId, linked.userId, lang);
        toast = isRu ? "Сохранено" : "Saved";
        break;

      case "edit":
        await tgAnswerCallback(cb.id, isRu ? "Генерация нового письма..." : "Regenerating...");
        reply = await handleEdit(targetId, linked.userId, lang);
        if (cbChatId) await tgSend(cbChatId, reply);
        return NextResponse.json({ ok: true });

      case "edit_man":
        await tgAnswerCallback(cb.id, isRu ? "Введите текст письма..." : "Please type your cover letter...");
        if (cbChatId) {
          const forceReplyMarkup = { force_reply: true, selective: true };
          await tgSend(
            cbChatId,
            isRu
              ? `Ответьте на это сообщение, чтобы вручную изменить сопроводительное письмо для ID:\n${targetId}`
              : `Reply to this message to manually edit cover letter for Vacancy ID:\n${targetId}`,
            { reply_markup: forceReplyMarkup }
          );
        }
        return NextResponse.json({ ok: true });

      default:
        await tgAnswerCallback(cb.id, "Unknown");
        return NextResponse.json({ ok: true });
    }

    await tgAnswerCallback(cb.id, toast);
    if (cbChatId && reply) await tgSend(cbChatId, reply);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Unhandled error:", err);
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }
}
