import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * Direct file download endpoint for self-hosted releases and setup bundles.
 * Prevents external GitHub redirects by streaming project assets directly
 * to the client with authenticated or public attachment headers.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("type") || "source";

    // Strict whitelist map to prevent path traversal (Alibaba OCR standard)
    const allowedDownloads: Record<string, { filename: string; mime: string; downloadName: string }> = {
      source: {
        filename: "hh-job-copilot-source.zip",
        mime: "application/zip",
        downloadName: "hh-job-copilot-v1.0.0-source.zip",
      },
      compose: {
        filename: "hh-job-copilot-source.zip",
        mime: "application/zip",
        downloadName: "hh-job-copilot-docker-release.zip",
      },
    };

    const target = allowedDownloads[targetType] || allowedDownloads.source;
    const filePath = path.join(process.cwd(), "public", "downloads", target.filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Release package not found on server." },
        { status: 404 }
      );
    }

    const fileStat = await fs.promises.stat(filePath);
    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": target.mime,
        "Content-Length": fileStat.size.toString(),
        "Content-Disposition": `attachment; filename="${target.downloadName}"`,
        "Cache-Control": "public, max-age=1800, immutable",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "Download failed", details: message }, { status: 500 });
  }
}
