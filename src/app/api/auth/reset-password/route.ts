// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifySubmittedCode } from "@/lib/verificationCode";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`reset-pwd-attempt:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset attempts. Please wait ${limit.retryAfter}s before trying again.`,
        },
        { status: 429 }
      );
    }

    const { email, code, token, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Method A: Reset with 6-digit verification code
    if (email && code) {
      const normalizedEmail = (email as string).trim().toLowerCase();
      const verifyResult = await verifySubmittedCode(normalizedEmail, code, "reset_password");
      if (!verifyResult.success) {
        return NextResponse.json(
          { success: false, error: verifyResult.error || "Invalid verification code." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      // Invalidate any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({ success: true, message: "Password updated successfully." });
    }

    // Method B: Reset with link token (legacy fallback)
    if (token) {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetToken || resetToken.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: "Reset token is invalid or has expired." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      });

      await prisma.passwordResetToken.delete({ where: { token } });

      return NextResponse.json({ success: true, message: "Password updated successfully." });
    }

    return NextResponse.json(
      { success: false, error: "Either a verification code or reset token is required." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ success: false, error: "Failed to reset password." }, { status: 500 });
  }
}
