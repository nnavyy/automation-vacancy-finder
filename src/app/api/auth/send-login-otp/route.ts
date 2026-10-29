// src/app/api/auth/send-login-otp/route.ts
import { NextRequest, NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createVerificationCode, sendVerificationEmail, isMailConfigured } from "@/lib/verificationCode";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit: 5 OTP requests per 10 minutes per IP
    const limit = rateLimit(`send-otp:${ip}`, 5, 10 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please wait ${limit.retryAfter}s before requesting another code.`,
        },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    // Maintenance check
    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Access is restricted during private testing." },
        { status: 403 }
      );
    }

    if (!isMailConfigured() && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { success: false, error: "Email service is not configured on the server." },
        { status: 500 }
      );
    }

    // Verify credentials first before sending OTP
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Generate 6-digit OTP (10 minutes validity)
    const code = await createVerificationCode(normalizedEmail, "sign_in", 10);

    // Dispatch email via after() so the OTP UI step opens immediately
    after(async () => {
      await sendVerificationEmail({
        email: normalizedEmail,
        code,
        purpose: "sign_in",
        name: user.name,
      });
    });

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (err: any) {
    console.error("[send-login-otp] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
