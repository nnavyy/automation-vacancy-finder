// ============================================================
// Nanda AI Job Assistant — AI Provider Router
// ============================================================
// Abstracts all AI providers behind a single callAI() interface
// with automatic fallback: Groq → Gemini → OpenRouter → rule-based
//
// Provider order is controlled by environment variables:
//   AI_PROVIDER_PRIMARY    (default: "groq")
//   AI_PROVIDER_FALLBACK_1 (default: "gemini")
//   AI_PROVIDER_FALLBACK_2 (default: "openrouter")
//
// Each call is logged to AiUsageLog for quota monitoring.
// ============================================================

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "@/types";
import prisma from "@/lib/db";

// ── Model Defaults (overridable via env) ─────────────────────

const GROQ_MODEL =
  process.env.AI_MODEL_GROQ ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const GEMINI_MODEL =
  process.env.AI_MODEL_GEMINI ?? process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

const OPENROUTER_MODEL =
  process.env.AI_MODEL_OPENROUTER ?? process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";

// ── Public Types ──────────────────────────────────────────────

export interface CallAIOptions {
  /** The main user-facing prompt content */
  prompt: string;
  /** Optional system-level instructions sent before the user prompt */
  systemPrompt?: string;
  /** Categorises the call for usage logging: "analyze" | "cover_letter" | "fallback" */
  requestType: string;
  /** Maximum tokens in the completion (default: 2000) */
  maxTokens?: number;
}

export interface AICallResult {
  /** Raw text response from the AI */
  content: string;
  /** Which provider actually responded */
  provider: AIProvider;
  /** Exact model identifier used */
  model: string;
  /**
   * true only when ALL configured providers were rate-limited / failed.
   * When true, content will be empty and the caller should use rule-based fallback.
   */
  isRateLimited: boolean;
}

// ── Chat message type compatible with all providers ───────────
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ── Provider Implementations ──────────────────────────────────

/**
 * Calls the Groq API using the official groq-sdk.
 * Throws on HTTP error (including 429 rate limit).
 *
 * @param options - Prompt options
 * @returns Raw text response
 */
export async function callGroq(options: CallAIOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY environment variable is not set");

  const client = new Groq({ apiKey });

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    // The Groq SDK accepts the same message shape as OpenAI
    messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
    max_tokens: options.maxTokens ?? 2000,
    temperature: 0.3,       // Lower temperature for more deterministic JSON output
    stream: false,
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Calls Google Gemini via the @google/generative-ai SDK.
 * Merges system prompt into the user message because Gemini Flash
 * does not have a dedicated system-instruction field in v0.21.
 * Throws on API error.
 *
 * @param options - Prompt options
 * @returns Raw text response
 */
export async function callGemini(options: CallAIOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: options.maxTokens ?? 2000,
    },
  });

  // Prepend the system prompt as a leading paragraph in the user message
  const fullPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${options.prompt}`
    : options.prompt;

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}

/**
 * Calls OpenRouter via the fetch API (no SDK required).
 * OpenRouter is OpenAI-compatible so uses the same message format.
 * Throws on non-2xx HTTP response.
 *
 * @param options - Prompt options
 * @returns Raw text response
 */
export async function callOpenRouter(options: CallAIOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    throw new Error("OPENROUTER_API_KEY environment variable is not set");

  const messages: ChatMessage[] = [];
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt });
  }
  messages.push({ role: "user", content: options.prompt });

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter requires these headers for attribution / rate-limit buckets
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Nanda AI Job Assistant",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: options.maxTokens ?? 2000,
        temperature: 0.3,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable body)");
    throw new Error(
      `OpenRouter returned HTTP ${response.status}: ${body}`
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return data.choices?.[0]?.message?.content ?? "";
}

// ── Usage Logging ─────────────────────────────────────────────

/**
 * Persists one AI call record to the AiUsageLog table.
 * Fails silently — a logging error must never crash the main pipeline.
 *
 * @param provider    - Provider identifier string
 * @param model       - Model identifier string
 * @param requestType - Call category (analyze / cover_letter / fallback)
 * @param status      - Outcome (success / rate_limited / error)
 * @param errorMsg    - Optional error message for failed calls
 */
export async function logAIUsage(
  provider: string,
  model: string,
  requestType: string,
  status: "success" | "rate_limited" | "error",
  errorMsg?: string
): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        provider,
        model,
        requestType,
        status,
        errorMessage: errorMsg,
      },
    });
  } catch (err) {
    // Swallow — logging failures should never block the main flow
    console.error("[AI Router] Failed to write AiUsageLog entry:", err);
  }
}

// ── Main Router ───────────────────────────────────────────────

/**
 * Calls AI providers in priority order, falling back automatically on
 * rate-limit (429) or any other error.
 *
 * Provider selection order (all overridable via env):
 *   1. AI_PROVIDER_PRIMARY    → default "groq"
 *   2. AI_PROVIDER_FALLBACK_1 → default "gemini"
 *   3. AI_PROVIDER_FALLBACK_2 → default "openrouter"
 *
 * Every attempt (success or failure) is logged to AiUsageLog.
 *
 * Returns isRateLimited: true only if every provider in the chain
 * was exhausted without a successful response. In that case the
 * caller should apply rule-based fallback logic.
 *
 * @param options - Prompt content and call metadata
 * @returns AICallResult — content, provider, model, and rate-limit flag
 */
export async function callAI(options: CallAIOptions): Promise<AICallResult> {
  // Build the ordered provider list from environment variables
  const providerOrder: AIProvider[] = [
    (process.env.AI_PROVIDER_PRIMARY as AIProvider | undefined) ?? "groq",
    (process.env.AI_PROVIDER_FALLBACK_1 as AIProvider | undefined) ?? "gemini",
    (process.env.AI_PROVIDER_FALLBACK_2 as AIProvider | undefined) ?? "openrouter",
  ];

  // Map each provider name to its caller function and model string
  const providerRegistry: Record<
    string,
    { call: (opts: CallAIOptions) => Promise<string>; model: string }
  > = {
    groq:        { call: callGroq,        model: GROQ_MODEL },
    gemini:      { call: callGemini,      model: GEMINI_MODEL },
    openrouter:  { call: callOpenRouter,  model: OPENROUTER_MODEL },
  };

  for (const provider of providerOrder) {
    const entry = providerRegistry[provider];

    if (!entry) {
      console.warn(`[AI Router] Unknown provider "${provider}" — skipping.`);
      continue;
    }

    try {
      console.log(
        `[AI Router] Attempting provider "${provider}" (model: ${entry.model})…`
      );

      const content = await entry.call(options);

      // Log successful call
      await logAIUsage(provider, entry.model, options.requestType, "success");

      console.log(`[AI Router] Success from provider "${provider}".`);
      return {
        content,
        provider,
        model: entry.model,
        isRateLimited: false,
      };
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : String(error);

      // Detect rate-limit signals across providers
      const isRateLimit =
        errMsg.includes("429") ||
        errMsg.toLowerCase().includes("rate limit") ||
        errMsg.toLowerCase().includes("rate_limit") ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("too many requests") ||
        errMsg.toLowerCase().includes("resource_exhausted");

      console.warn(
        `[AI Router] Provider "${provider}" failed ` +
          `(${isRateLimit ? "rate limited" : "error"}): ${errMsg.slice(0, 120)}`
      );

      // Log the failure
      await logAIUsage(
        provider,
        entry.model,
        options.requestType,
        isRateLimit ? "rate_limited" : "error",
        errMsg.slice(0, 500)
      );

      // Continue to the next provider in the chain
    }
  }

  // All providers exhausted
  console.error(
    "[AI Router] All configured AI providers failed or were rate-limited. " +
      "Returning empty result — caller should apply rule-based fallback."
  );

  return {
    content: "",
    provider: "rule_based",
    model: "none",
    isRateLimited: true,
  };
}
