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
 *   🔥 New HH Job Match
 *   Role / Company / Location / Salary / Experience / Format
 *   Score / Recommendation / Confidence
 *   Why it matches / Missing / Red flags
 *   Suggested language / Cover letter preview (200 chars)
 *
 * Inline keyboard buttons (two rows + URL row):
 *   [✅ Mark Applied]  [❌ Skip]
 *   [💾 Save]          [✍️ Edit Letter]
 *   [🔗 Open Vacancy]  ← url button, opens vacancy directly
 *
 * callback_data format: "<action>:<vacancyId>"
 *   approve:xyz | skip:xyz | save:xyz | edit:xyz
 *
 * @param vacancy   - Normalized vacancy data
 * @param analysis  - AI analysis result for this vacancy
 * @param vacancyId - Internal DB ID used in callback_data payloads
 * @returns true if the Telegram message was delivered successfully
 */
export async function sendVacancyNotification(
  vacancy: NormalizedVacancy,
  analysis: AIAnalysisResult,
  vacancyId: string
): Promise<boolean> {
  // ── Emoji for recommendation ──────────────────────────────
  const recEmoji: Record<string, string> = {
    apply: "✅",
    maybe: "🤔",
    skip: "❌",
  };
  const recommendationIcon = recEmoji[analysis.recommendation] ?? "❓";

  // ── Format match reasons ──────────────────────────────────
  const matchReasonsText =
    analysis.match_reasons.length > 0
      ? analysis.match_reasons.map((r) => `  ✓ ${r}`).join("\n")
      : "  (none detected)";

  // ── Format missing requirements ───────────────────────────
  const missingText =
    analysis.missing_requirements.length > 0
      ? analysis.missing_requirements.map((r) => `  • ${r}`).join("\n")
      : "  (none)";

  // ── Format red flags ──────────────────────────────────────
  const redFlagEmoji: Record<string, string> = {
    high: "🚨",
    medium: "⚠️",
    low: "💡",
  };
  const redFlagsText =
    analysis.red_flags.length > 0
      ? analysis.red_flags
          .map(
            (f) =>
              `  ${redFlagEmoji[f.severity] ?? "⚠️"} [${f.severity.toUpperCase()}] ` +
              `${f.trigger_text}: ${f.reason}`
          )
          .join("\n")
      : "  None detected ✅";

  // ── Cover letter preview (max 200 chars) ─────────────────
  const coverPreview =
    analysis.cover_letter.length > 200
      ? `${analysis.cover_letter.slice(0, 200)}…`
      : analysis.cover_letter;

  // ── Compose the full message ──────────────────────────────
  // All dynamic strings are HTML-escaped before insertion
  const message = [
    `🔥 <b>New HH Job Match</b>`,
    ``,
    `<b>Role:</b> ${escapeHtml(vacancy.title)}`,
    `<b>Company:</b> ${escapeHtml(vacancy.company ?? "Not specified")}`,
    `<b>Location:</b> ${escapeHtml(vacancy.area ?? "Remote / Not specified")}`,
    `<b>Salary:</b> ${formatSalary(vacancy.salary)}`,
    `<b>Experience:</b> ${escapeHtml(vacancy.experience ?? "Not specified")}`,
    `<b>Format:</b> ${escapeHtml(vacancy.schedule ?? "Not specified")}`,
    ``,
    `<b>Score:</b> ${analysis.match_score}/100  |  <b>Confidence:</b> ${analysis.confidence}%`,
    `<b>Recommendation:</b> ${recommendationIcon} <b>${analysis.recommendation.toUpperCase()}</b>`,
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
    `<b>Suggested language:</b> ${escapeHtml(analysis.best_language)}`,
    ``,
    `<b>Cover letter preview:</b>`,
    `<i>${escapeHtml(coverPreview)}</i>`,
  ].join("\n");

  // ── Inline keyboard ───────────────────────────────────────
  const replyMarkup = {
    inline_keyboard: [
      [
        // Row 1: primary actions
        { text: "✅ Mark Applied", callback_data: `approve:${vacancyId}` },
        { text: "❌ Skip",         callback_data: `skip:${vacancyId}` },
      ],
      [
        // Row 2: secondary actions
        { text: "💾 Save",         callback_data: `save:${vacancyId}` },
        { text: "✍️ Edit Letter",  callback_data: `edit:${vacancyId}` },
      ],
      [
        // Row 3: direct link to vacancy on HH
        {
          text: "🔗 Open Vacancy",
          url: vacancy.url ?? `https://hh.ru/vacancy/${vacancy.hhId}`,
        },
      ],
    ],
  };

  return sendMessage(message, replyMarkup);
}
