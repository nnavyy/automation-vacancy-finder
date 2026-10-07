import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { checkHHSession } from "@/lib/hhPrivateClient";
import { sendMessage } from "@/lib/telegram";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!pref?.hhToken) {
      return NextResponse.json({
        success: true,
        status: "unconfigured",
        message: "No HeadHunter token/cookie configured.",
      });
    }

    const rawToken = decrypt(pref.hhToken);
    const check = await checkHHSession(rawToken);
    const now = new Date();

    if (check.active) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhSessionStatus: "active",
          hhLastVerifiedAt: now,
          ...(check.profile?.name ? { hhProfileName: check.profile.name } : {}),
          ...(check.profile?.avatar ? { hhProfileAvatar: check.profile.avatar } : {}),
          ...(typeof check.profile?.totalApplications === "number" && check.profile.totalApplications > 0
            ? { hhTotalApplications: check.profile.totalApplications }
            : {}),
          ...(check.resumes && check.resumes.length > 0 && !pref.hhResumeId
            ? { hhResumeId: check.resumes[0].id, hhResumeTitle: check.resumes[0].title }
            : {}),
        },
      });

      return NextResponse.json({
        success: true,
        status: "active",
        lastVerifiedAt: now,
        expiresAt: pref.hhExpiresAt,
        profile: check.profile,
        resumes: check.resumes,
      });
    } else {
      // Mark as expired
      const wasActive = pref.hhSessionStatus === "active";
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhSessionStatus: "expired",
          hhLastVerifiedAt: now,
        },
      });

      // Notify Telegram if was previously active
      if (wasActive) {
        const tgLink = await prisma.telegramLink.findFirst({
          where: { userId: user.id, isActive: true },
        });
        if (tgLink?.telegramChatId) {
          await sendMessage(
            `<b>[HH.ru Session Alert]</b>\n\nYour HeadHunter session has <b>expired or logged out</b>!\n\nAuto-apply and vacancy synchronization have been paused. Please open Dashboard Settings to reconnect via Browser Login.`,
            undefined,
            tgLink.telegramChatId
          ).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        status: "expired",
        lastVerifiedAt: now,
        expiresAt: pref.hhExpiresAt,
        error: check.error,
      });
    }
  } catch (error: any) {
    console.error("[POST /api/settings/check-hh-session]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check session" },
      { status: 500 }
    );
  }
}
