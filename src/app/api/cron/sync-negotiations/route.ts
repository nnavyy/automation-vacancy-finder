import { NextResponse } from "next/server";
import { syncHHHistory } from "@/lib/hhPrivateClient";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/crypto";

// GET /api/cron/sync-negotiations
// This endpoint is meant to be called periodically (e.g. by n8n or Vercel Cron)
export async function GET(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
      
      const rawToken = decrypt(pref.hhToken);
      const result = await syncHHHistory(rawToken);
      if (result.success) {
        await prisma.searchPreference.update({
          where: { id: pref.id },
          data: { hhSessionStatus: "active", hhLastVerifiedAt: new Date() },
        });

        if (result.history.length > 0) {
          for (const item of result.history) {
            let vacancyIdMatch = item.url.match(/vacancy\/(\d+)/);
            let vacancyId = vacancyIdMatch ? vacancyIdMatch[1] : `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            
            const exists = await prisma.vacancy.findFirst({
              where: { hhId: vacancyId, userId: pref.userId }
            });
            
            if (!exists) {
              const created = await prisma.vacancy.create({
                data: {
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
                  vacancyId: created.id,
                  action: "HH.ru Cron Sync",
                  notes: `Status on HH: ${item.status}`
                }
              });
              totalSynced++;
            }
          }
        }
      } else {
        // Failed / 403
        if (pref.hhSessionStatus === "active") {
          await prisma.searchPreference.update({
            where: { id: pref.id },
            data: { hhSessionStatus: "expired", hhLastVerifiedAt: new Date() },
          });

          // Notify via Telegram
          const tgLink = await prisma.telegramLink.findFirst({
            where: { userId: pref.userId, isActive: true },
          });
          if (tgLink?.telegramChatId) {
            const { sendMessage } = await import("@/lib/telegram");
            await sendMessage(
              `<b>[HH.ru Session Alert]</b>\n\nYour HeadHunter session has <b>expired or logged out</b>!\n\nApplication history sync and auto-apply have been paused. Please open Dashboard Settings to reconnect via Browser Login.`,
              undefined,
              tgLink.telegramChatId
            ).catch(() => {});
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
