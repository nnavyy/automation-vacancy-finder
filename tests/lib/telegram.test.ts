import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeHtml,
  truncateString,
  formatSalary,
  buildVacancyNotificationPayload,
  sendMessage,
} from "@/lib/telegram";
import type { NormalizedVacancy, AIAnalysisResult } from "@/types";

describe("telegram.ts - Entity Safety & Formatting", () => {
  it("escapeHtml correctly sanitizes Telegram HTML special characters", () => {
    expect(escapeHtml("Senior <C++> & Go Developer")).toBe(
      "Senior &lt;C++&gt; &amp; Go Developer"
    );
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  it("truncateString truncates strings and appends ellipsis gracefully", () => {
    expect(truncateString("short", 10)).toBe("short");
    expect(truncateString("This is a very long text that exceeds limit", 15)).toBe(
      "This is a very…"
    );
    expect(truncateString("", 5)).toBe("");
  });

  it("formatSalary correctly formats various salary configurations", () => {
    expect(formatSalary(undefined)).toBe("Not specified");
    expect(formatSalary(undefined, "ru")).toBe("Не указано");

    expect(
      formatSalary({ from: 150000, to: 250000, currency: "RUR", gross: false }, "ru")
    ).toBe("150,000–250,000 RUR");

    expect(
      formatSalary({ from: 5000, currency: "USD", gross: true }, "en")
    ).toBe("5,000 USD (gross)");
  });

  it("buildVacancyNotificationPayload generates safe, valid HTML without unclosed tags", () => {
    const mockVacancy: NormalizedVacancy = {
      hhId: "12345678",
      title: "Senior Fullstack Engineer <React & Node.js>",
      company: "Innovations <Tech> & Co",
      area: "Moscow & Remote",
      salary: { from: 200000, to: 300000, currency: "RUR" },
      experience: "Between 3 and 6 years",
      schedule: "Remote / Full day",
      url: "https://hh.ru/vacancy/12345678",
    };

    const mockAnalysis: Partial<AIAnalysisResult> = {
      match_score: 88,
      confidence: 90,
      recommendation: "apply",
      best_language: "russian",
      match_reasons: [
        "Strong TypeScript & Next.js background <verified>",
        "Experience in high-throughput APIs",
      ],
      missing_requirements: ["GraphQL experience <minor>"],
      red_flags: [
        {
          trigger_text: "Unpaid test task <3 days>",
          reason: "Suspiciously long test without compensation",
          severity: "high",
        },
      ],
      cover_letter: "Здравствуйте! Меня зовут Кандидат & я рад откликнуться на вашу вакансию <Tech Lead>.",
    };

    const { message, replyMarkup } = buildVacancyNotificationPayload(
      mockVacancy,
      mockAnalysis as AIAnalysisResult,
      "db-vacancy-123",
      "en"
    );

    // Verify all special characters are escaped in output HTML
    expect(message).not.toContain("<React & Node.js>");
    expect(message).toContain("&lt;React &amp; Node.js&gt;");
    expect(message).not.toContain("<Tech> & Co");
    expect(message).toContain("&lt;Tech&gt; &amp; Co");
    expect(message).toContain("&lt;verified&gt;");
    expect(message).toContain("&lt;minor&gt;");
    expect(message).toContain("&lt;Tech Lead&gt;");

    // Check inline keyboard actions
    const keyboard = (replyMarkup as any).inline_keyboard;
    expect(keyboard[0][0].callback_data).toBe("approve:db-vacancy-123");
    expect(keyboard[0][1].callback_data).toBe("skip:db-vacancy-123");
    expect(keyboard[1][0].callback_data).toBe("save:db-vacancy-123");
    expect(keyboard[3][0].url).toBe("https://hh.ru/vacancy/12345678");
  });
});

describe("telegram.ts - Multi-Tenant Isolation in sendMessage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("fails closed when customChatId is omitted in production (no leak to deployer)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    process.env.TELEGRAM_CHAT_ID = "deployer-private-chat-id";

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Call sendMessage without customChatId in production
    const success = await sendMessage("<b>Test Notification</b>");

    expect(success).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends message to customChatId when provided", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
    process.env.TELEGRAM_CHAT_ID = "deployer-private-chat-id";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as any);

    const success = await sendMessage("<b>Test Notification</b>", undefined, "user-specific-chat-id");

    expect(success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/bottest-bot-token/sendMessage"),
      expect.objectContaining({
        body: expect.stringContaining('"chat_id":"user-specific-chat-id"'),
      })
    );
  });
});
