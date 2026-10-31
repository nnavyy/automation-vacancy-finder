// AI credentials, models, and routing belong to the service operator.
import type { AIProvider } from "@/types";
import prisma from "@/lib/db";
import { BRAND_NAME } from "@/lib/brand";

export interface CallAIOptions {
  prompt: string;
  systemPrompt?: string;
  requestType: string;
  maxTokens?: number;
}

export interface AICallResult {
  content: string;
  provider: AIProvider;
  model: string;
  isRateLimited: boolean;
}

const PROVIDERS = ["groq", "gemini", "openrouter", "openai", "deepseek", "anthropic"] as const;
type Provider = typeof PROVIDERS[number];

function isProvider(value: string): value is Provider {
  return PROVIDERS.some((provider) => provider === value);
}

function modelSetting(primary: string, legacy: string, fallback: string): string {
  return (process.env[primary] || process.env[legacy] || fallback).replace(/^"|"$/g, "").trim();
}

export function getGroqModel(): string { return modelSetting("AI_MODEL_GROQ", "GROQ_MODEL", "openai/gpt-oss-120b"); }
export function getGeminiModel(): string { return modelSetting("AI_MODEL_GEMINI", "GEMINI_MODEL", "gemini-2.0-flash"); }
export function getOpenRouterModel(): string { return modelSetting("AI_MODEL_OPENROUTER", "OPENROUTER_MODEL", "deepseek/deepseek-r1"); }
export function getOpenAIModel(): string { return modelSetting("AI_MODEL_OPENAI", "OPENAI_MODEL", "gpt-4o-mini"); }
export function getDeepSeekModel(): string { return modelSetting("AI_MODEL_DEEPSEEK", "DEEPSEEK_MODEL", "deepseek-chat"); }
export function getAnthropicModel(): string { return modelSetting("AI_MODEL_ANTHROPIC", "ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"); }

const modelGetters = {
  groq: getGroqModel, gemini: getGeminiModel, openrouter: getOpenRouterModel,
  openai: getOpenAIModel, deepseek: getDeepSeekModel, anthropic: getAnthropicModel,
} satisfies Record<Provider, () => string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTextParts(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.flatMap((part: unknown) => isRecord(part) && part.thought !== true && (!part.type || part.type === "text") && typeof part.text === "string" ? [part.text] : []).join("");
}

function readReply(data: unknown, provider: Provider): string {
  if (!isRecord(data)) throw new Error("Invalid AI response");
  if (provider === "anthropic") return readTextParts(data.content).trim();
  if (provider === "gemini") {
    const candidate: unknown = Array.isArray(data.candidates) ? data.candidates[0] : undefined;
    return isRecord(candidate) && isRecord(candidate.content) ? readTextParts(candidate.content.parts).trim() : "";
  }
  const choice: unknown = Array.isArray(data.choices) ? data.choices[0] : undefined;
  // Reasoning fields are internal model output, never a substitute for the final answer.
  return isRecord(choice) && isRecord(choice.message) && typeof choice.message.content === "string"
    ? choice.message.content.trim() : "";
}

export async function logAIUsage(
  provider: string, model: string, requestType: string,
  status: "success" | "rate_limited" | "error", errorMsg?: string,
): Promise<void> {
  try {
    await prisma.aiUsageLog.create({ data: { provider, model, requestType, status, errorMessage: errorMsg } });
  } catch {
    console.error("[AI Router] Failed to write AI usage log.");
  }
}

async function callProvider(provider: Provider, model: string, apiKey: string, options: CallAIOptions, signal: AbortSignal): Promise<string> {
  const maxTokens = Math.max(1, Math.min(4096, options.maxTokens ?? 2048));
  const messages = [
    ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
    { role: "user", content: options.prompt },
  ];
  const endpoints = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    openai: "https://api.openai.com/v1/chat/completions",
    deepseek: "https://api.deepseek.com/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    gemini: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  } satisfies Record<Provider, string>;
  let headers: Record<string, string> = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  let body: Record<string, unknown> = { model, messages, max_tokens: maxTokens, temperature: 0.3 };
  if (provider === "gemini") {
    headers = { "x-goog-api-key": apiKey, "Content-Type": "application/json" };
    body = {
      contents: [{ role: "user", parts: [{ text: options.prompt }] }],
      ...(options.systemPrompt ? { systemInstruction: { parts: [{ text: options.systemPrompt }] } } : {}),
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    };
  } else if (provider === "anthropic") {
    headers = { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" };
    body = { model, max_tokens: maxTokens, messages: [{ role: "user", content: options.prompt }], ...(options.systemPrompt ? { system: options.systemPrompt } : {}) };
  } else if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    headers["X-Title"] = BRAND_NAME;
  }
  const response = await fetch(endpoints[provider], { method: "POST", headers, body: JSON.stringify(body), signal });
  // Do not log upstream bodies: they can echo credentials or candidate data.
  if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
  const data: unknown = await response.json();
  const content = readReply(data, provider);
  if (!content) throw new Error("AI provider returned no final answer");
  return content;
}

export async function callAI(options: CallAIOptions): Promise<AICallResult> {
  // Legacy per-user configuration is deliberately ignored, including stored BYOK endpoints.
  const chain = Array.from(new Set([
    process.env.AI_PROVIDER_PRIMARY || "deepseek",
    process.env.AI_PROVIDER_FALLBACK_1 || "groq",
    process.env.AI_PROVIDER_FALLBACK_2 || "gemini",
    ...PROVIDERS,
  ].map((provider) => provider.toLowerCase().trim()))).filter(isProvider);
  const deadline = Date.now() + 45_000;
  for (const provider of chain) {
    const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`]?.trim();
    if (!apiKey || apiKey.includes("...") || apiKey.startsWith("your-") || Date.now() >= deadline) continue;
    const model = modelGetters[provider]();
    const controller = new AbortController();
    const timeoutMs = Math.min(25_000, deadline - Date.now());
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const content = await callProvider(provider, model, apiKey, options, controller.signal);
      await logAIUsage(provider, model, options.requestType, "success");
      return { content, provider, model, isRateLimited: false };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "AI request failed";
      const rateLimited = /429|quota|rate.limit/i.test(message);
      await logAIUsage(provider, model, options.requestType, rateLimited ? "rate_limited" : "error", controller.signal.aborted ? "Request timed out" : "Upstream request failed");
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }
  return { content: "", provider: "rule_based", model: "none", isRateLimited: true };
}
