import { NextRequest, NextResponse } from "next/server";
import { fetchMyResumes, fetchHHProfile } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

/**
 * POST /api/settings/validate-hh
 * 
 * Validates the provided hhtoken and returns the user's resumes.
 * Does NOT save to database automatically, only tests the token.
 */
export async function POST(req: NextRequest) {
  try {
    // Ensure the user is logged into our dashboard
    await requireUser();

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Try fetching resumes using the token
    const resumes = await fetchMyResumes(token);
    
    // Also fetch HH profile and analytics
    const profile = await fetchHHProfile(token);
    
    // Update preferences in DB so we don't have to fetch it every time
    const userId = (await requireUser()).id;
    const pref = await prisma.searchPreference.findFirst({ where: { userId } });
    
    if (pref) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhToken: token,
          hhProfileName: profile.name,
          hhProfileAvatar: profile.avatar,
          hhTotalApplications: profile.totalApplications,
        }
      });
    }

    return NextResponse.json({
      success: true,
      resumes,
      profile
    });
  } catch (error: any) {
    console.error("[POST /api/settings/validate-hh]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate token" },
      { status: 401 }
    );
  }
}

// touch

// trigger cache invalidation
