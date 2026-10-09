import { NextRequest, NextResponse } from "next/server";
import prisma, { withRetry } from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { performBrowserLogin } from "@/lib/hhBrowserLogin";
import { encrypt } from "@/lib/crypto";

export const maxDuration = 120; // 2 minutes max

/**
 * POST /api/settings/hh-browser-login
 * 
 * Launches a real browser window on the server/desktop for the user to log in.
 * Only applicable in self-hosted environments with desktop GUI.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Cloud environment guard: cloud containers have no desktop display
    const isCloud = Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      (process.platform === "linux" && !process.env.DISPLAY)
    );
    if (isCloud) {
      return NextResponse.json(
        {
          success: false,
          error: "Automatic browser launch is only supported in self-hosted environments (localhost/Docker). For cloud hosting, use the Console F12 method.",
        },
        { status: 400 }
      );
    }

    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Launch automated browser login (90 seconds timeout, avoids prolonged idle timeouts)
    const result = await performBrowserLogin(90000);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Login timed out or browser window was closed." },
        { status: 400 }
      );
    }

    // 3. Connect to DB fresh with automatic retry to prevent closed NeonDB connections
    const updated = await withRetry(async () => {
      const pref = await prisma.searchPreference.findFirst({
        where: { userId: user.id, isActive: true },
      });
      if (!pref) return null;

      return await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhToken: encrypt(result.cookieString),
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date(),
          hhExpiresAt: result.expiresAt,
          hhProfileName: result.profile.name,
          hhProfileAvatar: result.profile.avatar,
          hhTotalApplications: result.profile.totalApplications,
          ...(result.resumes.length > 0 && !pref.hhResumeId
            ? { hhResumeId: result.resumes[0].id, hhResumeTitle: result.resumes[0].title }
            : {}),
        },
      });
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "No active search preference found." }, { status: 404 });
    }

    // Sanitized response without raw cookie string
    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt,
      resumes: result.resumes,
      profile: result.profile,
      hasHhToken: true,
    });
  } catch (error: any) {
    console.error("[POST /api/settings/hh-browser-login]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to launch browser login" },
      { status: 500 }
    );
  }
}
