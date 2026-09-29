import { NextRequest, NextResponse } from "next/server";
import { fetchMyResumes, fetchHHProfile } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

/**
 * POST /api/settings/validate-hh
 * 
 * Validates the provided hhtoken or cookie string and returns the user's resumes and profile.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { success: false, error: "Token or cookie string is required" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // Fetch resumes using token/cookie
    const resumes = await fetchMyResumes(cleanToken);
    
    // Fetch HH profile and analytics
    const profile = await fetchHHProfile(cleanToken);
    
    // Update preferences in DB
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });
    
    if (pref) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhToken: cleanToken,
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date(),
          hhProfileName: profile.name,
          hhProfileAvatar: profile.avatar,
          hhTotalApplications: profile.totalApplications,
          ...(resumes.length > 0 && !pref.hhResumeId
            ? { hhResumeId: resumes[0].id, hhResumeTitle: resumes[0].title }
            : {}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      resumes,
      profile,
    });
  } catch (error: any) {
    console.error("[POST /api/settings/validate-hh]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate HH.ru token" },
      { status: 400 }
    );
  }
}
