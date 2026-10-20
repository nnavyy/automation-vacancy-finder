// ============================================================
// Nanda AI Job Assistant — Telegram Bot Integration
// ============================================================
// Sends formatted vacancy notifications to Nanda's Telegram chat
// via the Telegram Bot API (using direct fetch — no long-polling,
// no webhook server required from this module).
//
// Required env vars:
//   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
//   TELEGRAM_CHAT_ID    — Nanda's personal chat / channel ID
// ============================================================

import type { AIAnalysisResult, HHSalary, NormalizedVacancy } from "@/types";

const TELEGRAM_API_BASE = "https://api.telegram.org";

// ── Utility Functions ─────────────────────────────────────────

/**
 * Escapes characters that have special meaning in Telegram's HTML parse mode.
 * Must be applied to every user-supplied string before embedding in a message.
 *
 * @param text - Raw string to escape
 * @returns HTML-safe string
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Truncates plain text strings before HTML escaping to avoid slicing inside tags or entities.
 */
export function truncateString(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str || "";
  return `${str.slice(0, Math.max(0, maxLen - 1))}…`;
}

/**
 * Formats an HHSalary object into a human-readable salary range string.
 *
 * Examples:
 *   { from: 50000, to: 80000, currency: "RUB" }  → "50,000–80,000 RUB"
 *   { from: 3000, currency: "USD", gross: true }  → "3,000 USD (gross)"
 *   undefined                                      → "Not specified"
 *
 * @param salary - Optional HH salary object
 * @returns Formatted salary string
 */
export function formatSalary(salary?: HHSalary, lang: string = "en"): string {
  const isRu = lang === "ru" || lang === "Russian";
  if (!salary || (!salary.from && !salary.to)) return isRu ? "Не указано" : "Not specified";

  const parts: string[] = [];
  if (salary.from) parts.push(salary.from.toLocaleString("en-US"));
  if (salary.to) parts.push(salary.to.toLocaleString("en-US"));

  const range = parts.join("–");
  const currency = salary.currency ?? "RUB";
  const grossTag = salary.gross ? (isRu ? " (до вычета)" : " (gross)") : "";

  return `${range} ${currency}${grossTag}`;
}

// ── Core Send Function ────────────────────────────────────────

/**
 * Sends a plain text (or HTML-formatted) message to the configured Telegram chat.
 * Uses parse_mode: "HTML" so callers can embed bold, italic, and links.
 *
 * Returns true on success, false on any failure (network, bad token, etc.).
 * All errors are logged but not re-thrown — Telegram failures must not crash
 * the main pipeline.
 *
 * @param text        - Message text (HTML-formatted)
 * @param replyMarkup - Optional inline keyboard or other Telegram reply_markup object
 * @returns true if the message was sent successfully
 */
export async function sendMessage(
  text: string,
  replyMarkup?: object,
  customChatId?: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // Multi-tenant protection: do not leak notifications to deployer's TELEGRAM_CHAT_ID
  // unless explicitly configured for single-user dev environments
  const allowDeployerFallback =
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_SINGLE_USER_TELEGRAM_FALLBACK === "true";
  const chatId = customChatId || (allowDeployerFallback ? process.env.TELEGRAM_CHAT_ID : undefined);

  if (!botToken || !chatId) {
    console.error(
      "[Telegram] TELEGRAM_BOT_TOKEN and/or recipient chatId are not available. " +
        "Cannot send message."
    );
    return false;
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(
      `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "(unreadable)");
      console.error(
        `[Telegram] sendMessage failed — HTTP ${response.status}: ${body}`
      );

      // If HTML parse fails, retry without parse_mode
      if (response.status === 400 && body.includes("can't parse")) {
        console.log("[Telegram] Retrying without HTML parse_mode...");
        const retryPayload = { ...payload, parse_mode: undefined };
        delete retryPayload.parse_mode;
        const retryRes = await fetch(
          `${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(retryPayload),
          }
        );
        if (retryRes.ok) {
          console.log("[Telegram] Retry without HTML succeeded");
          return true;
        }
      }

      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] sendMessage threw an unexpected error:", error);
    return false;
  }
}

// ── Vacancy Notification ──────────────────────────────────────

/**
 * Composes and sends a richly formatted vacancy notification to Telegram.
 *
 * Message layout:
 *   [Job Match] HeadHunter
 *   Role / Company / Location / Salary / Experience / Format
 *   Score / Recommendation / Confidence
 *   Why it matches / Missing / Red flags
 *   Suggested language / Cover letter preview (200 chars)
 *
 * Inline keyboard buttons (two rows + URL row):
 *   [Mark Applied]  [Skip]
 *   [Save]          [Edit Letter]
 *   [Open Vacancy]  <- url button, opens vacancy directly
 *
 * callback_data format: "<action>:<vacancyId>"
 *   approve:xyz | skip:xyz | save:xyz | edit:xyz
 *
 * @param vacancy   - Normalized vacancy data
 * @param analysis  - AI analysis result for this vacancy
 * @param vacancyId - Internal DB ID used in callback_data payloads
 * @returns true if the Telegram message was delivered successfully
 */
export function buildVacancyNotificationPayload(
  vacancy: NormalizedVacancy,
  rawAnalysis: AIAnalysisResult | Record<string, unknown> | null | undefined,
  vacancyId: string,
  lang: string = "en"
): { message: string; replyMarkup: object } {
  const isRu = lang === "ru" || lang === "Russian";
  const analysis = rawAnalysis || {};
  const recRaw = ((analysis as any).recommendation || "apply").toString().toLowerCase();
  const recTag: Record<string, string> = {
    apply: isRu ? "[ОТКЛИК]" : "[APPLY]",
    maybe: isRu ? "[ПОДУМАТЬ]" : "[MAYBE]",
    skip:  isRu ? "[ПРОПУСТИТЬ]" : "[SKIP]",
  };
  const recommendationIcon = recTag[recRaw] ?? `[${recRaw.toUpperCase()}]`;

  // ── Format match reasons (truncated individually before escaping) ────────
  const matchReasonsRaw =
    (analysis as any).match_reasons ?? (analysis as any).matchReasons;
  const matchReasonsList: string[] = Array.isArray(matchReasonsRaw)
    ? matchReasonsRaw.slice(0, 5).map((r) => truncateString(String(r).trim(), 120))
    : [];
  const matchReasonsText =
    matchReasonsList.length > 0
      ? matchReasonsList.map((r) => `  - ${r}`).join("\n")
      : (isRu ? "  (не выявлено)" : "  (none detected)");

  // ── Format missing requirements ───────────────────────────
  const missingRaw =
    (analysis as any).missing_requirements ?? (analysis as any).missingRequirements;
  const missingList: string[] = Array.isArray(missingRaw)
    ? missingRaw.slice(0, 5).map((m) => truncateString(String(m).trim(), 120))
    : [];
  const missingText =
    missingList.length > 0
      ? missingList.map((m) => `  - ${m}`).join("\n")
      : (isRu ? "  (нет)" : "  (none)");

  // ── Format red flags ──────────────────────────────────────
  const redFlagsRaw =
    (analysis as any).red_flags ?? (analysis as any).redFlags;
  const redFlagsList: any[] = Array.isArray(redFlagsRaw) ? redFlagsRaw.slice(0, 4) : [];
  const redFlagTag: Record<string, string> = {
    high: isRu ? "[ВЫСОКИЙ]" : "[HIGH]",
    medium: isRu ? "[СРЕДНИЙ]" : "[MEDIUM]",
    low: isRu ? "[НИЗКИЙ]" : "[LOW]",
  };
  const redFlagsText =
    redFlagsList.length > 0
      ? redFlagsList
          .map((f) => {
            const sev = (f.severity || "info").toString().toLowerCase();
            const tag = redFlagTag[sev] ?? "[ALERT]";
            const trigger = f.trigger_text ? `${truncateString(f.trigger_text, 40)}: ` : "";
            const reason = truncateString(f.reason || "", 120);
            return `  ${tag} ${trigger}${reason}`;
          })
          .join("\n")
      : (isRu ? "  Не обнаружено" : "  None detected");

  // ── Cover letter preview (pre-truncated to safe length) ────
  const coverLetterRaw =
    (analysis as any).cover_letter ?? (analysis as any).coverLetter;
  const coverLetterStr =
    typeof coverLetterRaw === "string" ? coverLetterRaw.trim() : "";
  const coverPreview = coverLetterStr
    ? truncateString(coverLetterStr, 220)
    : (isRu ? "Сопроводительное письмо в панели" : "Cover letter available in dashboard");

  const score =
    (analysis as any).match_score ?? (analysis as any).matchScore ?? 0;
  const confidence = (analysis as any).confidence ?? 100;
  const bestLang =
    (analysis as any).best_language ?? (analysis as any).bestLanguage ?? (isRu ? "Русский" : "Russian");

  // ── Pre-truncate headers and details before HTML escaping ───
  const cleanTitle = truncateString(vacancy.title || (isRu ? "Без названия" : "Untitled Vacancy"), 120);
  const cleanCompany = truncateString(vacancy.company ?? (isRu ? "Не указано" : "Not specified"), 80);
  const cleanArea = truncateString(vacancy.area ?? (isRu ? "Удалённо / Не указано" : "Remote / Not specified"), 80);
  const cleanSalary = formatSalary(vacancy.salary, lang);
  const cleanExp = truncateString(vacancy.experience ?? (isRu ? "Не указано" : "Not specified"), 50);
  const cleanSchedule = truncateString(vacancy.schedule ?? (isRu ? "Не указано" : "Not specified"), 50);

  // ── Compose the message from blocks ───────────────────────
  // Required blocks always stay. Optional blocks are dropped (last first) only if
  // the escaped message would exceed Telegram's 4096-char limit. We never slice
  // the final string, so tags and entities are never cut in half.
  const recUpper = escapeHtml(recRaw.toUpperCase());
  const requiredBlocks: string[] = [
    [
      `<b>${isRu ? "[Подходящая вакансия] HeadHunter" : "[Job Match] HeadHunter"}</b>`,
      ``,
      `<b>${isRu ? "Должность:" : "Role:"}</b> ${escapeHtml(cleanTitle)}`,
      `<b>${isRu ? "Компания:" : "Company:"}</b> ${escapeHtml(cleanCompany)}`,
      `<b>${isRu ? "Локация:" : "Location:"}</b> ${escapeHtml(cleanArea)}`,
      `<b>${isRu ? "Зарплата:" : "Salary:"}</b> ${escapeHtml(cleanSalary)}`,
      `<b>${isRu ? "Опыт:" : "Experience:"}</b> ${escapeHtml(cleanExp)}`,
      `<b>${isRu ? "Формат:" : "Format:"}</b> ${escapeHtml(cleanSchedule)}`,
    ].join("\n"),
    [
      `<b>${isRu ? "Совместимость:" : "Score:"}</b> ${score}/100  |  <b>${isRu ? "Уверенность:" : "Confidence:"}</b> ${confidence}%`,
      `<b>${isRu ? "Рекомендация:" : "Recommendation:"}</b> ${escapeHtml(recommendationIcon)} <b>${recUpper}</b>`,
    ].join("\n"),
    `<b>${isRu ? "Почему подходит:" : "Why it matches:"}</b>\n${escapeHtml(matchReasonsText)}`,
    `<b>${isRu ? "Редфлаги / Риски:" : "Red flags:"}</b>\n${escapeHtml(redFlagsText)}`,
  ];
  const optionalBlocks: string[] = [
    `<b>${isRu ? "Чего не хватает:" : "Missing requirements:"}</b>\n${escapeHtml(missingText)}`,
    `<b>${isRu ? "Язык отклика:" : "Suggested language:"}</b> ${escapeHtml(String(bestLang))}`,
    `<b>${isRu ? "Превью письма:" : "Cover letter preview:"}</b>\n<i>${escapeHtml(coverPreview)}</i>`,
  ];

  const MESSAGE_LIMIT = 4000;
  const build = () => [...requiredBlocks, ...optionalBlocks].join("\n\n");
  let message = build();
  while (message.length > MESSAGE_LIMIT && optionalBlocks.length > 0) {
    optionalBlocks.pop();
    message = build();
  }
  if (message.length > MESSAGE_LIMIT) {
    // Last resort (e.g. text full of "&" that expands to "&amp;"): shorten the two list blocks.
    // Truncate plain text first, then escape, so entities stay intact.
    requiredBlocks[2] = `<b>${isRu ? "Почему подходит:" : "Why it matches:"}</b>\n${escapeHtml(truncateString(matchReasonsText, 120))}`;
    requiredBlocks[3] = `<b>${isRu ? "Редфлаги / Риски:" : "Red flags:"}</b>\n${escapeHtml(truncateString(redFlagsText, 120))}`;
    message = build();
  }

  // ── Inline keyboard ───────────────────────────────────────
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: isRu ? "Откликнуться" : "Mark Applied", callback_data: `approve:${vacancyId}` },
        { text: isRu ? "Пропустить" : "Skip",         callback_data: `skip:${vacancyId}` },
      ],
      [
        { text: isRu ? "Сохранить" : "Save",         callback_data: `save:${vacancyId}` },
        { text: isRu ? "Пересоздать" : "Regenerate",   callback_data: `edit:${vacancyId}` },
      ],
      [
        { text: isRu ? "Написать вручную" : "Type Manual",  callback_data: `edit_man:${vacancyId}` },
      ],
      [
        {
          text: isRu ? "Открыть на HH.ru" : "Open Vacancy",
          url:
            vacancy.url && vacancy.url.startsWith("http")
              ? vacancy.url
              : `https://hh.ru/vacancy/${vacancy.hhId.replace(/\D/g, "")}`,
        },
      ],
    ],
  };

  return { message, replyMarkup };
}

/**
 * Composes and sends a richly formatted vacancy notification to Telegram.
 * Used for legacy single-tenant or default chat calls.
 */
export async function sendVacancyNotification(
  vacancy: NormalizedVacancy,
  analysis: AIAnalysisResult | any,
  vacancyId: string,
  lang: string = "en"
): Promise<boolean> {
  const { message, replyMarkup } = buildVacancyNotificationPayload(
    vacancy,
    analysis,
    vacancyId,
    lang
  );
  return sendMessage(message, replyMarkup);
}

/**
 * Sends a vacancy notification to a specific user's Telegram chatId.
 * Used by the multi-user pipeline where chatId comes from TelegramLink table.
 */
export async function sendVacancyNotificationToUser(
  vacancy: NormalizedVacancy,
  analysis: AIAnalysisResult | any,
  vacancyId: string,
  chatId: string,
  lang: string = "en"
): Promise<boolean> {
  const { message, replyMarkup } = buildVacancyNotificationPayload(
    vacancy,
    analysis,
    vacancyId,
    lang
  );
  return sendMessage(message, replyMarkup, chatId);
}


