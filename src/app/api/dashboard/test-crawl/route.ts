import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { isSafePublicUrl } from "@/lib/security";
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

  // Cap extracted content to 2500 meaningful chars (plenty for portfolio context & key highlights)
  return lines.join("\n").slice(0, 2500).trim();
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
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
    const extractedText = extractCleanPortfolioText(html);

    if (!extractedText || extractedText.length < 15) {
      return NextResponse.json({
        success: false,
        error: "Crawl bot reached the URL, but could not find readable textual content.",
      }, { status: 400 });
    }

    const contentHash = crypto.createHash("md5").update(extractedText).digest("hex");

    return NextResponse.json({
      success: true,
      extractedText,
      contentHash,
      charCount: extractedText.length,
      message: `Successfully crawled portfolio! Found ${extractedText.length} characters of structured content.`,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: `Failed to crawl: ${err.message || "Network timeout or unreachable host"}`,
    });
  }
}
