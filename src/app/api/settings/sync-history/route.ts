import { NextRequest, NextResponse } from "next/server";
import { syncHHHistory } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const result = await syncHHHistory(token);
    
    if (result.success && result.history.length > 0) {
      // Upsert into Vacancy database
      let newAdded = 0;
      for (const item of result.history) {
        // Extract ID from URL (e.g. /vacancy/123456)
        let vacancyIdMatch = item.url.match(/vacancy\/(\d+)/);
        let vacancyId = vacancyIdMatch ? vacancyIdMatch[1] : `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Skip if already in DB
        const exists = await prisma.vacancy.findUnique({
          where: { id: vacancyId }
        });
        
        if (!exists) {
          await prisma.vacancy.create({
            data: {
              id: vacancyId,
              userId: user.id, // Required by schema
              hhId: vacancyId, // Required by schema
              title: item.title,
              company: item.company,
              url: item.url ? (item.url.startsWith('http') ? item.url : `https://hh.ru${item.url}`) : "",
              status: "applied_manual", // matches the status used in the Applied tab
              sourceKeyword: "HH.ru Sync",
              createdAt: item.appliedAt,
              updatedAt: item.appliedAt,
            }
          });
          
          await prisma.applicationLog.create({
            data: {
              vacancyId: vacancyId,
              action: "HH.ru Sync",
              notes: `Status on HH: ${item.status}`
            }
          });
          newAdded++;
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Successfully synchronized ${result.history.length} items. ${newAdded} new items added to your Applied dashboard.` 
      });
    }

    return NextResponse.json({ success: false, error: "No history found or failed to fetch." }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/settings/sync-history]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync history" },
      { status: 500 }
    );
  }
}

// force reload

// force reload 2
