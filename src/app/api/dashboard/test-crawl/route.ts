import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" });
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
