import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callAI } from "@/lib/aiProviderRouter";
vi.mock("@/lib/db", () => ({ default: { aiUsageLog: { create: vi.fn() } } }));

beforeEach(() => {
  for (const name of ["GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "ANTHROPIC_API_KEY"]) vi.stubEnv(name, "");
  vi.stubEnv("AI_PROVIDER_PRIMARY", "openai");
  vi.stubEnv("AI_PROVIDER_FALLBACK_1", "deepseek");
  vi.stubEnv("AI_PROVIDER_FALLBACK_2", "gemini");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("service-managed AI routing", () => {
  it.each(["groq", "gemini", "openrouter", "openai", "deepseek", "anthropic"])("supports the server-configured %s protocol", async (provider) => {
    vi.stubEnv("AI_PROVIDER_PRIMARY", provider);
    vi.stubEnv(`${provider.toUpperCase()}_API_KEY`, "server-key");
    const response = provider === "gemini"
      ? { candidates: [{ content: { parts: [{ thought: true, text: "Internal reasoning" }, { text: "OK" }] } }] }
      : provider === "anthropic" ? { content: [{ type: "text", text: "OK" }] }
      : { choices: [{ message: { content: "OK" } }] };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(response));
    vi.stubGlobal("fetch", fetchMock);
    const result = await callAI({ prompt: "Test", systemPrompt: "System", requestType: "analyze", maxTokens: 500 });
    expect(result.content).toBe("OK");
    expect(result.provider).toBe(provider);
    const options: RequestInit = fetchMock.mock.calls[0][1];
    const body: unknown = JSON.parse(String(options.body));
    expect(body).toEqual(expect.objectContaining(provider === "gemini"
      ? { generationConfig: { temperature: 0.3, maxOutputTokens: 500 } }
      : { max_tokens: 500 }));
  });

  it("aborts timed-out upstream requests and clears timers", async () => {
    vi.useFakeTimers();
    vi.stubEnv("OPENAI_API_KEY", "server-key");
    let signal: AbortSignal | null | undefined;
    vi.stubGlobal("fetch", vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal;
      return new Promise<Response>((_resolve, reject) => signal?.addEventListener("abort", () => reject(new Error("Aborted")), { once: true }));
    }));
    const pending = callAI({ prompt: "Test", requestType: "analyze" });
    await vi.advanceTimersByTimeAsync(25_001);
    expect((await pending).isRateLimited).toBe(true);
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ignores legacy customer keys, models, endpoints, and routing", async () => {
    vi.stubEnv("OPENAI_API_KEY", "server-key");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: "OK" } }] }));
    vi.stubGlobal("fetch", fetchMock);
    const legacyOptions = {
      prompt: "Test", requestType: "analyze", providerOrder: ["custom"],
      customConfig: { order: ["custom"], taskRouting: { deepAnalysis: "custom" }, customProviders: { custom: { apiKey: "user-key", baseUrl: "http://127.0.0.1", model: "untrusted-model" } } },
    };
    const result = await callAI(legacyOptions);
    expect(result.provider).toBe("openai");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://api.openai.com/v1/chat/completions", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer server-key" }), signal: expect.any(AbortSignal) }));
  });

  it("uses only a final answer, never private reasoning as a cover letter", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "server-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: "", reasoning_content: "private chain of thought" } }] })));
    const result = await callAI({ prompt: "Test", requestType: "cover_letter" });
    expect(result.content).toBe("");
    expect(result.isRateLimited).toBe(true);
  });

  it("falls back after a failed provider and validates the response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "server-key");
    vi.stubEnv("DEEPSEEK_API_KEY", "server-key");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "down" }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ choices: [{ message: { content: "Recovered" } }] })));
    const result = await callAI({ prompt: "Test", requestType: "analyze" });
    expect(result.content).toBe("Recovered");
    expect(result.provider).toBe("deepseek");
  });

  it("does not schedule timeout timers when all providers are unconfigured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await callAI({ prompt: "Test", requestType: "analyze" });
    expect(result.isRateLimited).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
