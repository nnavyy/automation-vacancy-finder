import { NextResponse } from "next/server";
import { syncHHHistory } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";

// GET /api/cron/sync-negotiations
// This endpoint is meant to be called periodically (e.g. by n8n or Vercel Cron)
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await prisma.searchPreference.findMany({
      where: {
        isActive: true,
        hhToken: { not: null }
      }
    });

    let totalSynced = 0;

    for (const pref of preferences) {
      if (!pref.hhToken) continue;
      
      const result = await syncHHHistory(pref.hhToken);
      if (result.success && result.history.length > 0) {
        for (const item of result.history) {
          let vacancyIdMatch = item.url.match(/vacancy\/(\d+)/);
          let vacancyId = vacancyIdMatch ? vacancyIdMatch[1] : `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          const exists = await prisma.vacancy.findUnique({
            where: { id: vacancyId }
          });
          
          if (!exists) {
            await prisma.vacancy.create({
              data: {
                id: vacancyId,
                userId: pref.userId,
                hhId: vacancyId,
                title: item.title,
                company: item.company,
                url: item.url ? (item.url.startsWith('http') ? item.url : `https://hh.ru${item.url}`) : "",
                status: "applied_manual",
                sourceKeyword: "HH.ru Cron Sync",
                createdAt: item.appliedAt,
                updatedAt: item.appliedAt,
              }
            });
            
            await prisma.applicationLog.create({
              data: {
                vacancyId: vacancyId,
                action: "HH.ru Cron Sync",
                notes: `Status on HH: ${item.status}`
              }
            });
            totalSynced++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, totalSynced });
  } catch (error: any) {
    console.error("[GET /api/cron/sync-negotiations]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
