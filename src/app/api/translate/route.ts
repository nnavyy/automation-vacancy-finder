import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const { text, mode = "text" } = await req.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY is missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    const systemPrompt = mode === "json"
      ? "You are a professional Russian to English translator. Translate the string values in the provided JSON to English. DO NOT change the JSON keys or structure. Return ONLY valid JSON, no markdown formatting."
      : "You are a professional Russian to English translator. Translate the provided text exactly as it is, maintaining formatting and tone. Do not add any extra comments.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });

    const translated = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, text: translated });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ success: false, error: "Translation failed" }, { status: 500 });
  }
}
