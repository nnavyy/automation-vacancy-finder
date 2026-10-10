import { NextRequest, NextResponse } from "next/server";
import { fetchMyResumes, fetchHHProfile, syncHHHistory } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { encrypt } from "@/lib/crypto";

/**
 * POST /api/settings/validate-hh
 * 
 * Validates the provided hhtoken or cookie string and returns the user's resumes and profile.
 * Automatically synchronizes applied vacancies to the local database.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
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
          hhToken: encrypt(cleanToken),
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

    // Automatically synchronize previous application history so /dashboard/applied updates immediately
    let syncedApplications = 0;
    try {
      const historyResult = await syncHHHistory(cleanToken);
      if (historyResult.success && historyResult.history.length > 0) {
        syncedApplications = historyResult.history.length;
        for (const item of historyResult.history) {
          const vacancyIdMatch = item.url ? item.url.match(/vacancy\/(\d+)/) : null;
          // Skip negotiation threads that do not point to a genuine vacancy to avoid mock/dead entries
          if (!vacancyIdMatch) continue;
          const vacancyId = vacancyIdMatch[1];
          const canonicalUrl = `https://hh.ru/vacancy/${vacancyId}`;

          const exists = await prisma.vacancy.findFirst({
            where: { hhId: vacancyId, userId: user.id },
          });

          if (!exists) {
            const created = await prisma.vacancy.create({
              data: {
                userId: user.id,
                hhId: vacancyId,
                title: item.title,
                company: item.company,
                url: canonicalUrl,
                status: "applied_manual",
                sourceKeyword: "HH.ru Sync",
                createdAt: item.appliedAt,
                updatedAt: item.appliedAt,
              },
            });

            await prisma.applicationLog.create({
              data: {
                vacancyId: created.id,
                action: "HH.ru Sync",
                notes: `Status on HH: ${item.status}`,
              },
            });
          }
        }
      }
    } catch (syncErr) {
      console.warn("[validate-hh] Auto-sync history warning:", syncErr);
    }

    return NextResponse.json({
      success: true,
      resumes,
      profile,
      syncedApplications,
    });
  } catch (error: any) {
    console.error("[POST /api/settings/validate-hh]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate HH.ru token" },
      { status: 400 }
    );
  }
}
