// ============================================================
// Nanda AI Job Assistant — Multi-Provider AI Router (BYOK & Task Routing)
// ============================================================
// Supports:
// - Groq (Ultra-fast inference)
// - Google Gemini (1M context)
// - OpenRouter (Universal gateway)
// - OpenAI (ChatGPT / GPT-4o)
// - DeepSeek (DeepSeek V3 / R1 reasoning)
// - Anthropic (Claude 3.5 Sonnet / Haiku)
// - Custom / Localhost (Ollama, vLLM, LM Studio, OpenAI-compatible proxy)
//
// Features:
// - Task-Specific Routing (e.g. DeepSeek for deep analysis, Claude for cover letters)
// - Bring Your Own Key (BYOK) per provider, with fallback to environment variables
// - Automatic Failover Chain on rate limit (429) or failure
// - AiUsageLog audit trail
// ============================================================

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProvider,
  CustomAiProviderConfig,
  AiPreferenceConfig,
} from "@/types";
import prisma from "@/lib/db";
import { BRAND_NAME } from "@/lib/brand";

// ── Model Defaults ──────────────────────────────────────────

export function getGroqModel(): string {
  const m = process.env.AI_MODEL_GROQ ?? process.env.GROQ_MODEL;
  if (m) return m.replace(/^"|"$/g, "");
  return "openai/gpt-oss-120b";
}

export function getGeminiModel(): string {
  const m = process.env.AI_MODEL_GEMINI ?? process.env.GEMINI_MODEL;
  if (!m) return "gemini-2.0-flash";
  return m.replace(/^"|"$/g, "");
}

export function getOpenRouterModel(): string {
  const m = process.env.AI_MODEL_OPENROUTER ?? process.env.OPENROUTER_MODEL;
  if (!m || m.includes(":free")) return "deepseek/deepseek-r1";
  return m.replace(/^"|"$/g, "");
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.replace(/^"|"$/g, "") || "gpt-4o-mini";
}

export function getDeepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.replace(/^"|"$/g, "") || "deepseek-chat";
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.replace(/^"|"$/g, "") || "claude-3-5-sonnet-20241022";
}

// ── Public Types ──────────────────────────────────────────────

export interface CallAIOptions {
  prompt: string;
  systemPrompt?: string;
  requestType: string;
  maxTokens?: number;
  providerOrder?: (AIProvider | string)[];
  customConfig?: AiPreferenceConfig;
}

export interface AICallResult {
  content: string;
  provider: AIProvider;
  model: string;
  isRateLimited: boolean;
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ── Provider Implementations ──────────────────────────────────

export async function callGroq(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key is not configured.");

  const client = new Groq({ apiKey, timeout: 25000 });
  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const primaryModel = customModel || getGroqModel();
  const candidates = [primaryModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const modelsToTry = Array.from(new Set(candidates));

  let lastErr: any = null;
  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
        max_tokens: Math.max(300, options.maxTokens ?? 2048),
        temperature: 0.3,
        stream: false,
      });

      const message = completion.choices[0]?.message;
      let content = message?.content?.trim() ?? "";
      if (!content && (message as any)?.reasoning) {
        content = (message as any).reasoning.trim();
      }
      if (content) return content;
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || "");
      if (msg.includes("does not exist") || msg.includes("model_not_found") || err?.status === 404) {
        console.warn(`[Groq] Model "${model}" not available, trying next fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error("Groq failed with all models.");
}

export async function callGemini(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = customModel || getGeminiModel();
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: Math.max(300, options.maxTokens ?? 2048),
    },
  });

  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${options.prompt}`
    : options.prompt;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

export async function callOpenRouter(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key is not configured.");

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const model = customModel || getOpenRouterModel();
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": BRAND_NAME,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.max(300, options.maxTokens ?? 2048),
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable body)");
    throw new Error(`OpenRouter HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as any;
  const choice = data.choices?.[0]?.message;
  let content = choice?.content?.trim() ?? "";
  if (!content && choice?.reasoning) {
    content = choice.reasoning.trim();
  }
  return content;
}

export async function callOpenAI(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key is not configured.");

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const model = customModel || getOpenAIModel();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.max(300, options.maxTokens ?? 2048),
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`OpenAI HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function callDeepSeek(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek API key is not configured.");

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const model = customModel || getDeepSeekModel();
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.max(300, options.maxTokens ?? 2048),
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`DeepSeek HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as any;
  const choice = data.choices?.[0]?.message;
  let content = choice?.content?.trim() ?? "";
  if (!content && choice?.reasoning_content) {
    content = choice.reasoning_content.trim();
  }
  return content;
}

export async function callAnthropic(
  options: CallAIOptions,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const apiKey = customKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key is not configured.");

  const model = customModel || getAnthropicModel();
  const bodyPayload: any = {
    model,
    max_tokens: Math.max(300, options.maxTokens ?? 2048),
    messages: [{ role: "user", content: options.prompt }],
  };
  if (options.systemPrompt) {
    bodyPayload.system = options.systemPrompt;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`Anthropic HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as any;
  let text = "";
  if (Array.isArray(data.content)) {
    for (const b of data.content) {
      if (b.type === "text") text += b.text;
    }
  }
  return text.trim();
}

export async function callCustomEndpoint(
  options: CallAIOptions,
  baseUrl?: string,
  customKey?: string,
  customModel?: string
): Promise<string> {
  const url = baseUrl ? baseUrl.replace(/\/+$/, "") : "http://localhost:11434/v1";
  const apiKey = customKey || "dummy";
  const model = customModel || "llama3.3";

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const endpoint = url.endsWith("/chat/completions") ? url : `${url}/chat/completions`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.max(300, options.maxTokens ?? 2048),
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`Custom endpoint HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as any;
  const choice = data.choices?.[0]?.message;
  return choice?.content?.trim() ?? "";
}

// ── Usage Logging ─────────────────────────────────────────────

export async function logAIUsage(
  provider: string,
  model: string,
  requestType: string,
  status: "success" | "rate_limited" | "error",
  errorMsg?: string
): Promise<void> {
  try {
    if (prisma && (prisma as any).aiUsageLog) {
      await (prisma as any).aiUsageLog.create({
        data: {
          provider,
          model,
          requestType,
          status,
          errorMessage: errorMsg,
        },
      });
    }
  } catch (err) {
    console.error("[AI Router] Failed to write AiUsageLog entry:", err);
  }
}

// ── Main Router with BYOK & Task Routing ──────────────────────

export async function callAI(options: CallAIOptions): Promise<AICallResult> {
  const customConfig = options.customConfig;
  const taskRouting = customConfig?.taskRouting;
  const customProviders = customConfig?.customProviders || {};

  // 1. Resolve preferred provider based on specific task
  let taskPrimaryProvider: string | undefined;
  if (options.requestType === "analyze" && taskRouting?.deepAnalysis) {
    taskPrimaryProvider = taskRouting.deepAnalysis;
  } else if (options.requestType === "cover_letter" && taskRouting?.coverLetter) {
    taskPrimaryProvider = taskRouting.coverLetter;
  }

  // 2. Resolve complete fallback chain
  const baseOrder: string[] = [
    taskPrimaryProvider,
    ...(customConfig?.order || []),
    ...(Array.isArray(options.providerOrder) ? options.providerOrder : []),
    (process.env.AI_PROVIDER_PRIMARY as string) || "deepseek",
    (process.env.AI_PROVIDER_FALLBACK_1 as string) || "groq",
    (process.env.AI_PROVIDER_FALLBACK_2 as string) || "gemini",
    "openrouter",
    "openai",
  ].filter(Boolean) as string[];

  // Deduplicate while preserving priority order
  const providerChain: string[] = Array.from(new Set(baseOrder.map((p) => p.toLowerCase().trim())));

  // Registry of supported providers
  const getCaller = (provider: string) => {
    const cfg = customProviders[provider] || {};
    switch (provider) {
      case "groq":
        return {
          fn: () => callGroq(options, cfg.apiKey, cfg.model),
          model: cfg.model || getGroqModel(),
        };
      case "gemini":
        return {
          fn: () => callGemini(options, cfg.apiKey, cfg.model),
          model: cfg.model || getGeminiModel(),
        };
      case "openrouter":
        return {
          fn: () => callOpenRouter(options, cfg.apiKey, cfg.model),
          model: cfg.model || getOpenRouterModel(),
        };
      case "openai":
        return {
          fn: () => callOpenAI(options, cfg.apiKey, cfg.model),
          model: cfg.model || getOpenAIModel(),
        };
      case "deepseek":
        return {
          fn: () => callDeepSeek(options, cfg.apiKey, cfg.model),
          model: cfg.model || getDeepSeekModel(),
        };
      case "anthropic":
      case "claude":
        return {
          fn: () => callAnthropic(options, cfg.apiKey, cfg.model),
          model: cfg.model || getAnthropicModel(),
        };
      case "custom":
      case "ollama":
        return {
          fn: () => callCustomEndpoint(options, cfg.baseUrl, cfg.apiKey, cfg.model),
          model: cfg.model || "custom-model",
        };
      default:
        return null;
    }
  };

  for (const provider of providerChain) {
    const handler = getCaller(provider);
    if (!handler) {
      continue;
    }

    const model = handler.model;

    try {
      console.log(`[AI Router] Attempting provider "${provider}" (model: ${model}) for [${options.requestType}]…`);
      const timeoutMs = 25000;
      const rawContent = await Promise.race([
        handler.fn(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout (${timeoutMs}ms) exceeded for provider "${provider}"`)), timeoutMs)
        ),
      ]);
      const content = rawContent?.trim() ?? "";

      if (!content) {
        throw new Error(`Provider "${provider}" returned empty text response.`);
      }

      await logAIUsage(provider, model, options.requestType, "success");
      console.log(`[AI Router] Success from provider "${provider}".`);

      return {
        content,
        provider: provider as AIProvider,
        model,
        isRateLimited: false,
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("rate limit") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("resource_exhausted") ||
        errMsg.toLowerCase().includes("too many requests");

      console.warn(
        `[AI Router] Provider "${provider}" failed (${isRateLimit ? "rate limited" : "error"}): ${errMsg.slice(0, 140)}`
      );

      await logAIUsage(
        provider,
        model,
        options.requestType,
        isRateLimit ? "rate_limited" : "error",
        errMsg.slice(0, 500)
      );
    }
  }

  // All providers failed
  console.error("[AI Router] All providers exhausted. Returning empty result for rule-based fallback.");
  return {
    content: "",
    provider: "rule_based",
    model: "none",
    isRateLimited: true,
  };
}

// ── Test Connection Helper ────────────────────────────────────

export async function testAiProviderConnection(
  provider: string,
  config?: CustomAiProviderConfig
): Promise<{ success: boolean; latencyMs: number; model: string; reply?: string; error?: string; message?: string }> {
  const start = Date.now();
  const testOptions: CallAIOptions = {
    prompt: "Respond with exactly: OK",
    requestType: "connection_test",
    maxTokens: 16,
  };

  try {
    let reply = "";
    let model = config?.model || "";

    switch (provider) {
      case "deepseek":
        model = model || getDeepSeekModel();
        reply = await callDeepSeek(testOptions, config?.apiKey, model);
        break;
      case "openai":
        model = model || getOpenAIModel();
        reply = await callOpenAI(testOptions, config?.apiKey, model);
        break;
      case "anthropic":
      case "claude":
        model = model || getAnthropicModel();
        reply = await callAnthropic(testOptions, config?.apiKey, model);
        break;
      case "groq":
        model = model || getGroqModel();
        reply = await callGroq(testOptions, config?.apiKey, model);
        break;
      case "gemini":
        model = model || getGeminiModel();
        reply = await callGemini(testOptions, config?.apiKey, model);
        break;
      case "openrouter":
        model = model || getOpenRouterModel();
        reply = await callOpenRouter(testOptions, config?.apiKey, model);
        break;
      case "custom":
      case "ollama":
        model = model || "custom-model";
        reply = await callCustomEndpoint(testOptions, config?.baseUrl, config?.apiKey, model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      model,
      reply: reply.slice(0, 80),
      message: `Active (${latencyMs}ms) - responding OK`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      latencyMs,
      model: config?.model || "unknown",
      error: err.message || "Failed to reach provider.",
      message: err.message || "Failed to reach provider.",
    };
  }
}
