import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { testAiProviderConnection } from "@/lib/aiProviderRouter";

/**
 * POST /api/settings/test-ai
 * Tests connection to any AI provider (DeepSeek, OpenAI, Anthropic, Gemini, Groq, OpenRouter, Custom)
 * with the supplied API key, model, and base URL.
 */
export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { provider, apiKey, model, baseUrl } = body;

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { success: false, error: "Provider parameter is required." },
        { status: 400 }
      );
    }

    const result = await testAiProviderConnection(provider, {
      apiKey: typeof apiKey === "string" ? apiKey.trim() : undefined,
      model: typeof model === "string" ? model.trim() : undefined,
      baseUrl: typeof baseUrl === "string" ? baseUrl.trim() : undefined,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[POST /api/settings/test-ai]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test AI provider connection." },
      { status: 500 }
    );
  }
}
