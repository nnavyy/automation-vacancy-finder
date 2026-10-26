import { describe, it, expect, vi, beforeEach } from "vitest";
import { callAI, testAiProviderConnection } from "@/lib/aiProviderRouter";
import type { AiPreferenceConfig } from "@/types";

describe("aiProviderRouter & BYOK Routing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles testAiProviderConnection when no API key is provided and no env var exists", async () => {
    const res = await testAiProviderConnection("openai", {});
    expect(res.success).toBe(false);
    expect(res.message || (res as any).error).toMatch(/API key/i);
  });

  it("handles testAiProviderConnection for custom provider with invalid URL", async () => {
    const res = await testAiProviderConnection("custom", {
      baseUrl: "http://invalid-localhost-url-that-does-not-exist:9999/v1",
      model: "llama3",
    });
    expect(res.success).toBe(false);
  }, 15000);

  it("falls back through provider cascade if primary fails", async () => {
    const spyError = vi.spyOn(console, "error").mockImplementation(() => {});
    const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spyLog = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      const config: AiPreferenceConfig = {
        order: ["deepseek", "groq", "gemini"],
        taskRouting: {
          deepAnalysis: "deepseek",
          coverLetter: "gemini",
        },
        customProviders: {
          deepseek: { apiKey: "mock-deepseek-invalid-key" },
        },
      };

      // Since mock key will fail network call, callAI should handle errors gracefully
      const result = await callAI({
        prompt: "Test prompt",
        requestType: "deep_analysis",
        customConfig: config,
      });

      // Expect either content or graceful error message, no unhandled exceptions
      expect(result).toHaveProperty("content");
      expect(result).toHaveProperty("provider");
    } finally {
      spyError.mockRestore();
      spyWarn.mockRestore();
      spyLog.mockRestore();
    }
  }, 15000);
});
