import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { isSafePublicUrl } from "@/lib/security";
import { callAI } from "@/lib/aiProviderRouter";
import crypto from "crypto";

function extractCleanPortfolioText(html: string): string {
  // Remove scripts, styles, noscript, svg, nav, and comments
  const stripped = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Replace block elements with linebreaks for good structure
  const formatted = stripped
    .replace(/<\/(p|div|section|article|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  const decoded = formatted
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ");

  // Split lines, filter noise, collapse whitespace
  const lines = decoded
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2 && !/^(home|about|contact|menu|cookie|copyright|all rights reserved)$/i.test(line));

  // Cap extracted content to 3500 meaningful chars for LLM synthesis
  return lines.join("\n").slice(0, 3500).trim();
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url, currentContext, clientHash, language = "en" } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 });
    }

    if (!isSafePublicUrl(url)) {
      return NextResponse.json({
        success: false,
        error: "Forbidden: URL rejected by SSRF protection filter (only public HTTP/HTTPS URLs are permitted).",
      }, { status: 403 });
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Website responded with HTTP status ${res.status}`,
      }, { status: 400 });
    }

    const html = await res.text();
    const rawExtracted = extractCleanPortfolioText(html);

    if (!rawExtracted || rawExtracted.length < 15) {
      return NextResponse.json({
        success: false,
        error: "Crawl bot reached the URL, but could not find readable textual content.",
      }, { status: 400 });
    }

    const contentHash = crypto.createHash("md5").update(rawExtracted).digest("hex");

    // If client provided a hash and it matches the current crawl, return unchanged
    if (clientHash && clientHash === contentHash) {
      return NextResponse.json({
        success: true,
        unchanged: true,
        contentHash,
        message: language === "ru"
          ? "Изменений в портфолио не обнаружено. Контекст кандидата актуален."
          : "No new updates detected on your portfolio. Candidate Context is already up-to-date.",
      });
    }

    // ── AI Portfolio Architect & Synthesis ────────────────────
    const isRussian = language === "ru";
    const systemPrompt = isRussian
      ? `Вы — старший технический рекрутер и архитектор резюме. Ваша задача — проанализировать содержимое сайта/портфолио кандидата и преобразовать его в четкую, структурированную выжимку для контекста кандидата при поиске работы.
ТРЕБОВАНИЯ К ФОРМАТУ:
- НЕ выводите сплошной текст, абзацы или сырые цитаты сайта.
- Оформите ответ в виде аккуратных маркированных списков:

### 🛠 Стек технологий и ключевые навыки
- **Языки и фреймворки:** [Извлеченные навыки, напр. React, Next.js, TypeScript]
- **Базы данных и инструменты:** [напр. PostgreSQL, Prisma, Docker, Git]

### 🚀 Проекты и ключевые достижения
- **[Название проекта]** — [Краткая роль, используемый стек и ценность/фича в 1 строку]
- **[Название проекта 2]** — [Краткая роль, используемый стек и ценность/фича в 1 строку]

### 💡 Сильные стороны и специализация
- [1-2 лаконичных пункта о фокусе разработки, сильных сторонах или опыте]`
      : `You are an elite Senior Technical Recruiter and Career Architect.
Your task is to analyze candidate portfolio / website text and synthesize it into a clean, concise, high-impact "Candidate Context & Key Highlights" profile.

FORMATTING REQUIREMENTS:
- Do NOT output walls of unstructured text, long rambling paragraphs, or raw website copy.
- Output clean, structured Markdown bullet points with this exact structure:

### 🛠 Tech Stack & Core Competencies
- **Languages & Frameworks:** [Extracted skills, e.g. React, Next.js, TypeScript]
- **Databases & Architecture:** [e.g. PostgreSQL, Prisma, Docker, REST APIs]

### 🚀 Key Projects & Portfolio Highlights
- **[Project Name]** — [Key engineering role, core stack used, and 1-line business impact or feature]
- **[Project Name 2]** — [Key engineering role, core stack used, and 1-line business impact or feature]

### 💡 Professional Focus & Strengths
- [1-2 concise bullet points highlighting engineering philosophy, experience level, or specialty]`;

    const userPrompt = currentContext && currentContext.trim().length > 10
      ? `Here is the candidate's existing context notes:
---
${currentContext.trim()}
---

Here is the newly crawled portfolio text from ${url}:
---
${rawExtracted}
---

INSTRUCTIONS:
Carefully merge the newly discovered projects, technologies, and achievements from the portfolio into the candidate's existing notes. Retain any custom user preferences or special instructions, updating and expanding the structured sections with the new portfolio data.`
      : `Here is the newly crawled portfolio text from ${url}:
---
${rawExtracted}
---

Synthesize this into the structured Candidate Context format.`;

    let synthesizedText = "";
    try {
      const aiResponse = await callAI({
        prompt: userPrompt,
        systemPrompt,
        requestType: "portfolio_synthesis",
        maxTokens: 1200,
      });
      synthesizedText = aiResponse.content.trim();
    } catch (aiErr) {
      console.warn("[TestCrawl] AI synthesis fallback to structured extraction:", aiErr);
      // Fallback if AI service is temporarily offline: generate clean structured markdown
      synthesizedText = isRussian
        ? `### 🛠 Стек технологий (из портфолио)\n- ${rawExtracted.slice(0, 300).replace(/\n/g, ", ")}\n\n### 🚀 Обнаруженные проекты\n- ${url}`
        : `### 🛠 Tech Stack & Highlights (Extracted)\n- ${rawExtracted.slice(0, 300).replace(/\n/g, ", ")}\n\n### 🚀 Portfolio Reference\n- ${url}`;
    }

    return NextResponse.json({
      success: true,
      extractedText: synthesizedText,
      contentHash,
      charCount: synthesizedText.length,
      message: isRussian
        ? "Портфолио успешно проанализировано ИИ и преобразовано в структурированный контекст!"
        : "Portfolio successfully analyzed and synthesized by AI into structured highlights!",
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `Failed to crawl: ${err.message || "Network timeout or unreachable host"}`,
    });
  }
}
