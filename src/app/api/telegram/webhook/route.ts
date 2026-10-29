// ============================================================
// HH Job Copilot — Telegram Bot Webhook (Vercel Serverless)
// ============================================================
// POST /api/telegram/webhook  — receives Telegram updates
// GET  /api/telegram/webhook  — health check + debug info
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/db";
import { saveFeedback } from "@/lib/feedbackLearning";
import { generateCoverLetter } from "@/lib/aiAnalyzer";
import { escapeHtml, truncateString } from "@/lib/telegram";
import { BRAND_NAME } from "@/lib/brand";
import { safeEqual } from "@/lib/timingSafe";
import type { NormalizedVacancy, HHSalary } from "@/types";

// ── Direct Telegram API call (no external deps) ──────────────

async function tgSend(
  chatId: string,
  text: string,
  replyMarkup?: object
): Promise<{ ok: boolean; status: number; body: string }> {
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

async function tgAnswerCallback(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text ?? "",
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error("[TG] answerCallbackQuery error:", err);
  }
}

async function sendDisconnectedNotice(chatId: string, isRu: boolean): Promise<void> {
  if (isRu) {
    await tgSend(
      chatId,
      `<b>[Бот отключён — Требуется подключение]</b>\n\n` +
        `Ваш Telegram-чат сейчас <b>не подключён</b> к аккаунту <b>${BRAND_NAME}</b>.\n` +
        `Вы не можете нажимать кнопки действий или выбирать команды меню, пока не привяжете свой аккаунт.\n\n` +
        `<b>Как подключить бота:</b>\n` +
        `1. Откройте раздел <b>Настройки → Уведомления через Telegram-бота</b> в веб-панели\n` +
        `2. Нажмите <b>Открыть бота</b> или скопируйте ваш <b>Токен синхронизации</b>\n` +
        `3. Отправьте сюда <code>/link ВАШ_ТОКЕН</code> (или просто вставьте 6-значный токен в чат).`
    );
  } else {
    await tgSend(
      chatId,
      `<b>[Bot Disconnected — Connection Required]</b>\n\n` +
        `Your Telegram chat is currently <b>not connected</b> to a <b>${BRAND_NAME}</b> account.\n` +
        `You cannot click any buttons or use any menu commands until you connect your account first.\n\n` +
        `<b>How to connect:</b>\n` +
        `1. Go to <b>Settings → Telegram Bot Notifications</b> in your dashboard\n` +
        `2. Click <b>Connect in Telegram</b> or copy your <b>Profile Sync Token</b>\n` +
        `3. Send <code>/link YOUR_TOKEN</code> (or simply paste your 6-character token here in chat).`
    );
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
    workFormat: (v.workFormat as { id: string; name: string }[]) ?? undefined,
    snippet: (v.snippet as { requirement?: string; responsibility?: string }) ?? undefined,
    description: v.description ?? undefined,
    descriptionHash: v.descriptionHash ?? undefined,
    sourceKeyword: v.sourceKeyword ?? undefined,
  };
}

// ── Action Handlers ───────────────────────────────────────────

async function handleLinkAccount(
  tokenCandidate: string,
  chatId: string,
  username: string
): Promise<boolean> {
  const token = tokenCandidate.trim().toUpperCase();
  if (!token || token.length < 4) {
    return false;
  }
  try {
    const link = await withRetry(() =>
      prisma.telegramLink.findFirst({
        where: { token, isActive: true },
      })
    );
    if (!link) {
      return false;
    }

    // Determine user language preference
    const pref = await withRetry(() =>
      prisma.searchPreference.findFirst({
        where: { userId: link.userId, isActive: true },
        select: { language: true, coverLetterLanguage: true },
      })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isRu =
      (pref as any)?.language === "ru" ||
      pref?.coverLetterLanguage === "Russian" ||
      link.language === "ru";
    const userLang = isRu ? "ru" : "en";

    // 1. Release this telegramChatId if it was bound to an older token
    await withRetry(() =>
      prisma.telegramLink.updateMany({
        where: {
          telegramChatId: chatId,
          id: { not: link.id },
        },
        data: {
          telegramChatId: null,
        },
      })
    );

    // 2. Deactivate any previous tokens belonging to this user
    await withRetry(() =>
      prisma.telegramLink.updateMany({
        where: {
          userId: link.userId,
          id: { not: link.id },
        },
        data: {
          telegramChatId: null,
          isActive: false,
        },
      })
    );

    // 3. Atomically bind current token to this telegram user
    await withRetry(() =>
      prisma.telegramLink.update({
        where: { id: link.id },
        data: {
          telegramChatId: chatId,
          telegramUsername: username,
          linkedAt: new Date(),
          language: userLang,
          isActive: true,
        },
      })
    );

    if (isRu) {
      await tgSend(
        chatId,
        `<b>[Успешно подключено]</b>\n\n` +
          `Ваш Telegram-аккаунт успешно привязан к панели управления <b>${BRAND_NAME}</b>.\n` +
          `Все кнопки действий и команды меню теперь разблокированы.\n\n` +
          `<b>Доступные команды:</b>\n` +
          `/profiles — Выбрать поисковый профиль\n` +
          `/saved — Сохранённые вакансии\n` +
          `/applied — Отправленные отклики\n` +
          `/lang &lt;ru|en&gt; — Переключить язык\n` +
          `/help — Справка по командам`
      );
    } else {
      await tgSend(
        chatId,
        `<b>[Successfully Connected]</b>\n\n` +
          `Your Telegram account is now linked to the <b>${BRAND_NAME}</b> dashboard.\n` +
          `All inline action buttons and menu commands are now unlocked!\n\n` +
          `<b>Available commands:</b>\n` +
          `/profiles — Switch active search profile\n` +
          `/saved — View saved vacancies\n` +
          `/applied — View applied vacancies\n` +
          `/lang &lt;ru|en&gt; — Switch bot language\n` +
          `/help — Show all commands`
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
  const v = await withRetry(() => prisma.vacancy.findFirst({ where: { id: vacancyId, userId } }));
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "apply");
  if (isRu) {
    return `<b>[Отклик зарегистрирован]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}\n\nУдачи на собеседовании!`;
  }
  return `<b>[Marked as Applied]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}\n\nGood luck!`;
}

async function handleSkip(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const v = await withRetry(() => prisma.vacancy.findFirst({ where: { id: vacancyId, userId } }));
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "skip");
  if (isRu) {
    return `<b>[Вакансия пропущена]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}\n\nОбратная связь учтена в обучении модели.`;
  }
  return `<b>[Vacancy Skipped]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}\n\nFeedback saved.`;
}

async function handleSave(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const v = await withRetry(() => prisma.vacancy.findFirst({ where: { id: vacancyId, userId } }));
  if (!v) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  await saveFeedback(vacancyId, "save");
  if (isRu) {
    return `<b>[Сохранено в избранное]</b>\n\n<b>Вакансия:</b> ${escapeHtml(v.title)}\n<b>Компания:</b> ${escapeHtml(v.company ?? "Не указана")}`;
  }
  return `<b>[Saved for Later]</b>\n\n<b>Role:</b> ${escapeHtml(v.title)}\n<b>Company:</b> ${escapeHtml(v.company ?? "N/A")}`;
}

async function handleEdit(vacancyId: string, userId: string, lang: string = "en"): Promise<string> {
  const isRu = lang === "ru";
  const dbVac = await withRetry(() =>
    prisma.vacancy.findFirst({ where: { id: vacancyId, userId }, include: { analysis: true } })
  );
  if (!dbVac) return isRu ? "[Ошибка] Вакансия не найдена или доступ ограничен." : "[Error] Vacancy not found or access denied.";
  if (!dbVac.analysis) {
    return isRu ? "[Ошибка] Сначала нужно проанализировать вакансию." : "[Error] Analyze this vacancy first.";
  }
  const pref = await withRetry(() =>
    prisma.searchPreference.findFirst({ where: { userId, isActive: true } })
  );
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

  await withRetry(() =>
    prisma.vacancyAnalysis.update({ where: { vacancyId }, data: { coverLetter } })
  );
  await withRetry(() =>
    prisma.applicationLog.create({
      data: { vacancyId, action: "regenerate_letter", notes: "Regenerated from Telegram" },
    })
  );

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

  // Only enforce secret token check if both server env and Telegram header are configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token") || "";
  if (webhookSecret && secretHeader && !safeEqual(secretHeader, webhookSecret)) {
    console.warn("[Webhook] Invalid secret token header");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
    // TEXT MESSAGES & MENU COMMANDS
    // ═══════════════════════════════════════════════════════════
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id.toString();
      const username = update.message.from?.username ?? "unknown";

      // Detect user link & active language
      const linked = await withRetry(() =>
        prisma.telegramLink.findFirst({
          where: { telegramChatId: chatId, isActive: true },
        })
      );

      const lang: string =
        linked?.language === "ru"
          ? "ru"
          : update.message.from?.language_code?.toLowerCase().startsWith("ru")
          ? "ru"
          : "en";
      const isRu = lang === "ru";

      console.log(`[Webhook] Text: "${text}" chatId: ${chatId} user: ${username} linked: ${Boolean(linked)}`);

      // ── 1. Always allow connection commands (/start <TOKEN>, /link <TOKEN>, or raw token) ──
      if (text.startsWith("/start")) {
        const parts = text.split(/\s+/);
        if (parts.length > 1 && parts[1]) {
          const linkedSuccess = await handleLinkAccount(parts[1], chatId, username);
          if (linkedSuccess) return NextResponse.json({ ok: true });
          await tgSend(
            chatId,
            isRu
              ? "<b>[Ошибка подключения]</b> Токен не найден или устарел. Сгенерируйте или скопируйте актуальный токен в <b>Настройках</b> веб-панели."
              : "<b>[Connection Failed]</b> Token not found or expired. Please copy your active token from <b>Settings → Telegram Bot Notifications</b>."
          );
          return NextResponse.json({ ok: true });
        }

        if (!linked) {
          await sendDisconnectedNotice(chatId, isRu);
          return NextResponse.json({ ok: true });
        }

        // Connected user /start greeting
        if (isRu) {
          await tgSend(
            chatId,
            `<b>Добро пожаловать в ${BRAND_NAME}!</b>\n\n` +
              `Статус бота: <b>Подключён (@${escapeHtml(linked.telegramUsername || username)})</b>\n` +
              `Вы будете получать мгновенные уведомления о найденных вакансиях прямо сюда.\n\n` +
              `<b>Команды меню:</b>\n` +
              `/profiles — Выбрать активный поисковый профиль\n` +
              `/saved — Просмотреть сохранённые вакансии\n` +
              `/applied — Просмотреть отправленные отклики\n` +
              `/lang &lt;ru|en&gt; — Переключить язык бота\n` +
              `/disconnect — Отключить бота от аккаунта\n` +
              `/help — Показать список команд`
          );
        } else {
          await tgSend(
            chatId,
            `<b>Welcome to ${BRAND_NAME}!</b>\n\n` +
              `Bot Status: <b>Connected (@${escapeHtml(linked.telegramUsername || username)})</b>\n` +
              `You will receive real-time vacancy alerts with instant Action buttons here.\n\n` +
              `<b>Menu Commands:</b>\n` +
              `/profiles — Switch active search profile\n` +
              `/saved — View saved vacancies\n` +
              `/applied — View applied vacancies\n` +
              `/lang &lt;ru|en&gt; — Switch bot language\n` +
              `/disconnect — Disconnect bot from account\n` +
              `/help — Show all commands`
          );
        }
        return NextResponse.json({ ok: true });
      }

      if (text.startsWith("/link")) {
        const token = text.replace(/^\/link\s*/i, "").trim();
        if (!token) {
          await sendDisconnectedNotice(chatId, isRu);
          return NextResponse.json({ ok: true });
        }
        const linkedSuccess = await handleLinkAccount(token, chatId, username);
        if (!linkedSuccess) {
          await tgSend(
            chatId,
            isRu
              ? "<b>[Ошибка]</b> Токен не найден или устарел.\nОткройте <b>Настройки → Telegram</b> в веб-панели и скопируйте актуальный токен."
              : "<b>[Error]</b> Token not found or expired.\nOpen <b>Settings → Telegram Bot Notifications</b> in your dashboard and copy your active token."
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Direct Token Submission (e.g. user pastes 6-char hex token directly)
      if (/^[a-zA-Z0-9]{4,32}$/.test(text) && !text.startsWith("/")) {
        const linkedSuccess = await handleLinkAccount(text, chatId, username);
        if (linkedSuccess) {
          return NextResponse.json({ ok: true });
        }
      }

      // ── 2. STRICT DISCONNECTED GUARD: Block all menus, replies & chat when not connected ──
      if (!linked) {
        await sendDisconnectedNotice(chatId, isRu);
        return NextResponse.json({ ok: true });
      }

      // ── 3. Connected-only commands & actions ──────────────────
      if (text === "/disconnect" || text === "/unlink") {
        await withRetry(() =>
          prisma.telegramLink.update({
            where: { id: linked.id },
            data: { telegramChatId: null },
          })
        );
        await sendDisconnectedNotice(chatId, isRu);
        return NextResponse.json({ ok: true });
      }

      // Handle Manual Cover Letter Reply
      if (update.message.reply_to_message) {
        const rText = update.message.reply_to_message.text || "";
        if (
          rText.includes("edit cover letter for Vacancy ID:\n") ||
          rText.includes("изменить сопроводительное письмо для ID:\n")
        ) {
          const vacancyId = rText.split("\n").pop()?.trim();
          if (vacancyId) {
            try {
              const dbVac = await withRetry(() =>
                prisma.vacancy.findFirst({
                  where: { id: vacancyId, userId: linked.userId },
                  include: { analysis: true },
                })
              );
              if (dbVac && dbVac.analysis) {
                await withRetry(() =>
                  prisma.vacancyAnalysis.update({
                    where: { vacancyId },
                    data: { coverLetter: text },
                  })
                );
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

      // /lang <ru|en>
      if (text.startsWith("/lang")) {
        const parts = text.split(/\s+/);
        const targetLang = parts[1]?.toLowerCase();
        if (targetLang === "ru" || targetLang === "en") {
          await withRetry(() =>
            prisma.telegramLink.update({
              where: { id: linked.id },
              data: { language: targetLang },
            })
          );
          await withRetry(() =>
            prisma.searchPreference.updateMany({
              where: { userId: linked.userId, isActive: true },
              data: { language: targetLang },
            })
          );
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

      // /profiles
      if (text === "/profiles") {
        try {
          const profiles = await withRetry(() =>
            prisma.searchPreference.findMany({
              where: { userId: linked.userId },
              select: { id: true, name: true, isActive: true },
            })
          );
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

      // /saved
      if (text === "/saved") {
        try {
          const saved = await withRetry(() =>
            prisma.vacancy.findMany({
              where: { userId: linked.userId, status: "saved" },
              orderBy: { updatedAt: "desc" },
              take: 10,
              include: { analysis: { select: { matchScore: true, recommendation: true } } },
            })
          );
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

      // /applied
      if (text === "/applied") {
        try {
          const applied = await withRetry(() =>
            prisma.vacancy.findMany({
              where: { userId: linked.userId, status: { in: ["applied_manual", "applied_hh", "applied_auto"] } },
              orderBy: { updatedAt: "desc" },
              take: 10,
              include: { analysis: { select: { matchScore: true } } },
            })
          );
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

      // /help or any other command/text while connected
      if (isRu) {
        await tgSend(
          chatId,
          `<b>Команды бота ${BRAND_NAME}:</b>\n\n` +
            `/start — Статус подключения\n` +
            `/profiles — Выбрать активный поисковый профиль\n` +
            `/saved — Просмотреть сохранённые вакансии\n` +
            `/applied — Вакансии, на которые вы откликнулись\n` +
            `/lang &lt;ru|en&gt; — Переключить язык бота\n` +
            `/disconnect — Отключить бота`
        );
      } else {
        await tgSend(
          chatId,
          `<b>Commands for ${BRAND_NAME}:</b>\n\n` +
            `/start — Connection status\n` +
            `/profiles — Switch search profile\n` +
            `/saved — Saved vacancies\n` +
            `/applied — Applied vacancies\n` +
            `/lang &lt;ru|en&gt; — Switch bot language\n` +
            `/disconnect — Disconnect bot`
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
    const cbChatId = cb.message?.chat?.id?.toString() || cb.from?.id?.toString();
    const isRuFallback = Boolean(cb.from?.language_code?.toLowerCase().startsWith("ru"));

    if (!cbChatId) {
      await tgAnswerCallback(cb.id, "Invalid request", true);
      return NextResponse.json({ ok: true });
    }

    const linked = await withRetry(() =>
      prisma.telegramLink.findFirst({
        where: { telegramChatId: cbChatId, isActive: true },
      })
    );

    // STRICT DISCONNECTED GUARD FOR ALL BUTTON CLICKS
    if (!linked) {
      await tgAnswerCallback(
        cb.id,
        isRuFallback
          ? "Бот отключён! Сначала подключите аккаунт через /link."
          : "Bot disconnected! Please connect your account first via /link.",
        true
      );
      await sendDisconnectedNotice(cbChatId, isRuFallback);
      return NextResponse.json({ ok: true });
    }

    const colonIdx = cbData.indexOf(":");
    if (colonIdx === -1) {
      await tgAnswerCallback(cb.id, "Unknown action");
      return NextResponse.json({ ok: true });
    }

    const action = cbData.slice(0, colonIdx);
    const targetId = cbData.slice(colonIdx + 1);
    if (!targetId) {
      await tgAnswerCallback(cb.id, "Invalid action request");
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
        const pref = await withRetry(() =>
          prisma.searchPreference.findFirst({
            where: { id: targetId, userId: linked.userId },
          })
        );
        if (pref) {
          await withRetry(() =>
            prisma.searchPreference.updateMany({ where: { userId: linked.userId }, data: { isActive: false } })
          );
          await withRetry(() =>
            prisma.searchPreference.update({ where: { id: targetId, userId: linked.userId }, data: { isActive: true } })
          );
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
