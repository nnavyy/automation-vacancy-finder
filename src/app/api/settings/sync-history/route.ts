import { NextRequest, NextResponse } from "next/server";
import { syncHHHistory } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    let token = typeof body?.token === "string" ? body.token.trim() : "";

    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    const dbToken = pref?.hhToken ? decrypt(pref.hhToken).trim() : "";

    // Prefer DB token if available and client token is absent or shorter/truncated
    if (dbToken && (!token || (dbToken.length > token.length && !token.includes("hhuid=")))) {
      token = dbToken;
    } else if (!token && dbToken) {
      token = dbToken;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "No HeadHunter session found. Please connect your HeadHunter account first." },
        { status: 400 }
      );
    }

    const result = await syncHHHistory(token);
    
    if (!result.success) {
      if (result.sessionExpired) {
        if (pref) {
          await prisma.searchPreference.update({
            where: { id: pref.id },
            data: {
              hhSessionStatus: "expired",
              hhLastVerifiedAt: new Date(),
            },
          });
        }
        return NextResponse.json(
          {
            success: false,
            sessionExpired: true,
            error:
              "HeadHunter session is expired or logged out (403). Please click 'Reconnect HeadHunter Session' or paste your cookie in the fallback section.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: result.error || "Failed to fetch application history from HeadHunter." },
        { status: 400 }
      );
    }

    if (result.history.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "HeadHunter session is active. No previous job applications were found on this account yet.",
      });
    }

    // Upsert into Vacancy database
    let newAdded = 0;
    for (const item of result.history) {
      // Extract ID from URL (e.g. /vacancy/123456)
      let vacancyIdMatch = item.url.match(/vacancy\/(\d+)/);
      let vacancyId = vacancyIdMatch ? vacancyIdMatch[1] : `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Check if already in DB for this user
      const exists = await prisma.vacancy.findFirst({
        where: { hhId: vacancyId, userId: user.id }
      });
      
      if (!exists) {
        const created = await prisma.vacancy.create({
          data: {
            userId: user.id,
            hhId: vacancyId,
            title: item.title,
            company: item.company,
            url: item.url ? (item.url.startsWith('http') ? item.url : `https://hh.ru${item.url}`) : "",
            status: "applied_manual",
            sourceKeyword: "HH.ru Sync",
            createdAt: item.appliedAt,
            updatedAt: item.appliedAt,
          }
        });
        
        await prisma.applicationLog.create({
          data: {
            vacancyId: created.id,
            action: "HH.ru Sync",
            notes: `Status on HH: ${item.status}`
          }
        });
        newAdded++;
      }
    }
    
    if (pref) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date(),
          hhTotalApplications: Math.max(pref.hhTotalApplications || 0, result.history.length),
        },
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      count: result.history.length,
      newAdded,
      message: `Successfully synchronized ${result.history.length} items. ${newAdded} new items added to your Applied dashboard.` 
    });
  } catch (error: any) {
    console.error("[POST /api/settings/sync-history]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync history" },
      { status: 500 }
    );
  }
}
