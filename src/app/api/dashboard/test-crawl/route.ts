import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-helpers";
import { isSafePublicUrl } from "@/lib/security";

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

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully crawled! Found ${text.length} characters of content.` 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Failed to crawl: ${err.message || "Unknown error"}` 
    });
  }
}
