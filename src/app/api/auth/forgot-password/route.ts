// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createVerificationCode, sendVerificationEmail, isMailConfigured } from "@/lib/verificationCode";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`forgot-pwd:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15m
    if (!limitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests. Please wait ${limitResult.retryAfter}s before trying again.`,
        },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    if (!isMailConfigured() && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { success: false, error: "Email service is not configured on the server." },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Return success even if user not found for security (prevent email enumeration)
      return NextResponse.json({ success: true, message: "If an account exists, a code has been sent." });
    }

    // 1. Generate 6-digit OTP code
    const code = await createVerificationCode(normalizedEmail, "reset_password", 15);

    // 2. Also generate hex token for fallback direct link
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    // 3. Dispatch email with 6-digit OTP in background for instant UI response
    after(async () => {
      await sendVerificationEmail({
        email: normalizedEmail,
        code,
        purpose: "reset_password",
        name: user.name,
      });
    });

    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
