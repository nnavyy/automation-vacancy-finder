import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/aiProviderRouter";

export async function POST(req: NextRequest) {
  try {
    const { text, mode = "text" } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const systemPrompt =
      mode === "json"
        ? "You are a professional Russian to English translator. Translate the string values in the provided JSON to English. DO NOT change JSON keys or schema. Return strictly valid JSON."
        : "You are a professional technical Russian to English translator. Translate the provided job vacancy text accurately into fluent, professional English. Preserve paragraphs, bullet points, and key technical terminology. Do not add conversational commentary.";

    const aiRes = await callAI({
      prompt: text.slice(0, 12000),
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

    return NextResponse.json({ success: true, text: aiRes.content.trim() });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ success: false, error: "Translation failed" }, { status: 500 });
  }
}
