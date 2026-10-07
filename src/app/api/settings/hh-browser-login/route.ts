import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { performBrowserLogin } from "@/lib/hhBrowserLogin";
import { encrypt } from "@/lib/crypto";

export const maxDuration = 300; // allow up to 5 minutes for user login

/**
 * POST /api/settings/hh-browser-login
 * 
 * Launches a real browser window on the server/desktop for the user to log in.
 * Captures all cookies, expiration timestamp, resumes, and profile,
 * and saves them directly to the database.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active search preference found." }, { status: 404 });
    }

    // Launch automated browser login
    const result = await performBrowserLogin(240000); // 4 minutes timeout

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to complete browser login." },
        { status: 400 }
      );
    }

    // Update DB with encrypted cookies
    const updated = await prisma.searchPreference.update({
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
