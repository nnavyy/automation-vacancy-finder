import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { callAI } from "@/lib/aiProviderRouter";
import { getApiUser } from "@/lib/auth-helpers";

// In-memory translation cache to make repeated calls 0ms
const translationCache = new Map<string, string>();

async function fastTranslateRussianToEnglish(text: string): Promise<string> {
  // Split into chunks by paragraph/newlines or sentence boundaries to respect URL limits
  const chunks = text.match(/[\s\S]{1,1200}(?:\n\n|\n|\.|\?|!|$)/g) || [text];

  const translatedChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return chunk;

      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=" +
        encodeURIComponent(trimmed);

      const res = await fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`Fast translate error HTTP ${res.status}`);
      }

      const json = await res.json();
      if (Array.isArray(json) && Array.isArray(json[0])) {
        return json[0].map((item: any) => item[0] || "").join("");
      }
      return trimmed;
    })
  );

  return translatedChunks.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { text, mode = "text" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const cacheKey = createHash("md5").update(`${mode}:${text}`).digest("hex");
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, text: cached, fromCache: true });
    }

    // For standard text (job descriptions), try sub-second fast engine first
    if (mode !== "json") {
      try {
        const fastResult = await fastTranslateRussianToEnglish(text.slice(0, 8000));
        if (fastResult && fastResult.trim().length > 0) {
          const resultText = fastResult.trim();
          translationCache.set(cacheKey, resultText);
          if (translationCache.size > 500) {
            const firstKey = translationCache.keys().next().value;
            if (firstKey) translationCache.delete(firstKey);
          }
          return NextResponse.json({ success: true, text: resultText });
        }
      } catch (fastErr) {
        console.warn("[Translate] Fast engine failed, falling back to LLM:", fastErr);
      }
    }

    // Fallback: AI model translation
    const systemPrompt =
      mode === "json"
        ? "You are a professional Russian to English translator. Translate the string values in the provided JSON to English. DO NOT change JSON keys or schema. Return strictly valid JSON."
        : "You are a professional technical Russian to English translator. Translate the provided job vacancy text accurately into fluent, professional English. Preserve paragraphs, bullet points, and key technical terminology. Do not add conversational commentary.";

    const aiRes = await callAI({
      prompt: text.slice(0, 10000),
      systemPrompt,
      requestType: "translation",
      maxTokens: 2500,
    });

    if (aiRes.isRateLimited || !aiRes.content) {
      return NextResponse.json(
        { success: false, error: "Translation service temporarily unavailable" },
        { status: 503 }
      );
    }

    const output = aiRes.content.trim();
    translationCache.set(cacheKey, output);
    return NextResponse.json({ success: true, text: output });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ success: false, error: "Translation failed" }, { status: 500 });
  }
}
