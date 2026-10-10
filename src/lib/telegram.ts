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
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
export function formatSalary(salary?: HHSalary): string {
  if (!salary || (!salary.from && !salary.to)) return "Not specified";

  const parts: string[] = [];
  if (salary.from) parts.push(salary.from.toLocaleString("en-US"));
  if (salary.to) parts.push(salary.to.toLocaleString("en-US"));

  const range = parts.join("–");
  const currency = salary.currency ?? "RUB";
  const grossTag = salary.gross ? " (gross)" : "";

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
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error(
      "[Telegram] TELEGRAM_BOT_TOKEN and/or TELEGRAM_CHAT_ID are not set. " +
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
function buildVacancyNotificationPayload(
  vacancy: NormalizedVacancy,
  rawAnalysis: AIAnalysisResult | Record<string, unknown> | null | undefined,
  vacancyId: string
): { message: string; replyMarkup: object } {
  const analysis = rawAnalysis || {};
  const recRaw = ((analysis as any).recommendation || "apply").toString().toLowerCase();
  const recTag: Record<string, string> = {
    apply: "[APPLY]",
    maybe: "[MAYBE]",
    skip: "[SKIP]",
  };
  const recommendationIcon = recTag[recRaw] ?? `[${recRaw.toUpperCase()}]`;

  // ── Format match reasons ──────────────────────────────────
  const matchReasonsRaw =
    (analysis as any).match_reasons ?? (analysis as any).matchReasons;
  const matchReasonsList: string[] = Array.isArray(matchReasonsRaw)
    ? matchReasonsRaw.map((r) => String(r))
    : [];
  const matchReasonsText =
    matchReasonsList.length > 0
      ? matchReasonsList.map((r) => `  - ${r}`).join("\n")
      : "  (none detected)";

  // ── Format missing requirements ───────────────────────────
  const missingRaw =
    (analysis as any).missing_requirements ?? (analysis as any).missingRequirements;
  const missingList: string[] = Array.isArray(missingRaw)
    ? missingRaw.map((m) => String(m))
    : [];
  const missingText =
    missingList.length > 0
      ? missingList.map((m) => `  - ${m}`).join("\n")
      : "  (none)";

  // ── Format red flags ──────────────────────────────────────
  const redFlagsRaw =
    (analysis as any).red_flags ?? (analysis as any).redFlags;
  const redFlagsList: any[] = Array.isArray(redFlagsRaw) ? redFlagsRaw : [];
  const redFlagTag: Record<string, string> = {
    high: "[HIGH]",
    medium: "[MEDIUM]",
    low: "[LOW]",
  };
  const redFlagsText =
    redFlagsList.length > 0
      ? redFlagsList
          .map((f) => {
            const sev = (f.severity || "info").toString().toLowerCase();
            const tag = redFlagTag[sev] ?? "[ALERT]";
            const trigger = f.trigger_text ? `${f.trigger_text}: ` : "";
            const reason = f.reason || "";
            return `  ${tag} [${sev.toUpperCase()}] ${trigger}${reason}`;
          })
          .join("\n")
      : "  None detected";

  // ── Cover letter preview (max 200 chars) ─────────────────
  const coverLetterRaw =
    (analysis as any).cover_letter ?? (analysis as any).coverLetter;
  const coverLetterStr =
    typeof coverLetterRaw === "string" ? coverLetterRaw.trim() : "";
  const coverPreview =
    coverLetterStr.length > 200
      ? `${coverLetterStr.slice(0, 200)}…`
      : coverLetterStr || "Cover letter available in dashboard";

  const score =
    (analysis as any).match_score ?? (analysis as any).matchScore ?? 0;
  const confidence = (analysis as any).confidence ?? 100;
  const bestLang =
    (analysis as any).best_language ?? (analysis as any).bestLanguage ?? "Russian";

  // ── Compose the full message ──────────────────────────────
  let message = [
    `<b>[Job Match] HeadHunter</b>`,
    ``,
    `<b>Role:</b> ${escapeHtml(vacancy.title || "Untitled Vacancy")}`,
    `<b>Company:</b> ${escapeHtml(vacancy.company ?? "Not specified")}`,
    `<b>Location:</b> ${escapeHtml(vacancy.area ?? "Remote / Not specified")}`,
    `<b>Salary:</b> ${formatSalary(vacancy.salary)}`,
    `<b>Experience:</b> ${escapeHtml(vacancy.experience ?? "Not specified")}`,
    `<b>Format:</b> ${escapeHtml(vacancy.schedule ?? "Not specified")}`,
    ``,
    `<b>Score:</b> ${score}/100  |  <b>Confidence:</b> ${confidence}%`,
    `<b>Recommendation:</b> ${recommendationIcon} <b>${recRaw.toUpperCase()}</b>`,
    ``,
    `<b>Why it matches:</b>`,
    escapeHtml(matchReasonsText),
    ``,
    `<b>Missing requirements:</b>`,
    escapeHtml(missingText),
    ``,
    `<b>Red flags:</b>`,
    escapeHtml(redFlagsText),
    ``,
    `<b>Suggested language:</b> ${escapeHtml(bestLang)}`,
    ``,
    `<b>Cover letter preview:</b>`,
    `<i>${escapeHtml(coverPreview)}</i>`,
  ].join("\n");

  // Enforce Telegram 4096 character safety limit
  if (message.length > 4000) {
    message = `${message.slice(0, 3950)}…\n<i>(truncated)</i>`;
  }

  // ── Inline keyboard ───────────────────────────────────────
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "Mark Applied", callback_data: `approve:${vacancyId}` },
        { text: "Skip",         callback_data: `skip:${vacancyId}` },
      ],
      [
        { text: "Save",         callback_data: `save:${vacancyId}` },
        { text: "Regenerate",   callback_data: `edit:${vacancyId}` },
      ],
      [
        { text: "Type Manual",  callback_data: `edit_man:${vacancyId}` },
      ],
      [
        {
          text: "Open Vacancy",
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
  vacancyId: string
): Promise<boolean> {
  const { message, replyMarkup } = buildVacancyNotificationPayload(
    vacancy,
    analysis,
    vacancyId
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
  chatId: string
): Promise<boolean> {
  const { message, replyMarkup } = buildVacancyNotificationPayload(
    vacancy,
    analysis,
    vacancyId
  );
  return sendMessage(message, replyMarkup, chatId);
}


