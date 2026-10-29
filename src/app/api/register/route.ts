import { NextRequest, NextResponse, after } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import { createVerificationCode, sendVerificationEmail, isMailConfigured } from "@/lib/verificationCode";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Registration is currently unavailable." },
        { status: 403 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!isMailConfigured() && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { success: false, error: "Email service is not configured on the server." },
        { status: 500 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // If the user already submitted the form once and is retrying OTP verification with the same password,
      // issue a fresh OTP code so they can complete verification seamlessly.
      const samePassword = await bcrypt.compare(password, existing.passwordHash);
      if (!samePassword) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const code = await createVerificationCode(normalizedEmail, "sign_in", 10);
      after(async () => {
        await sendVerificationEmail({
          email: normalizedEmail,
          code,
          purpose: "sign_in",
          name: existing.name,
        });
      });

      return NextResponse.json({
        success: true,
        otpSent: true,
        message: "Verification code sent to your email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name: cleanName, email: normalizedEmail, passwordHash },
    });

    // Create an unconfigured default search profile so the user must set their own
    // roles and keywords in Settings before collection can run.
    await prisma.searchPreference.create({
      data: {
        userId:            user.id,
        name:              "Default",
        targetRoles:       [],
        searchKeywordsEn:  [],
        searchKeywordsRu:  [],
        requiredSkills:    [],
        niceToHaveSkills:  [],
        experience:        ["noExperience", "between1And3"],
        workFormat:        ["remote"],
        excludeKeywords:   [],
        redFlagKeywords:   ["паспорт", "залог"],
        aiProviderOrder:   ["groq", "gemini", "openrouter"],
        isActive:          true,
      },
    });

    // Generate 6-digit OTP code and dispatch email asynchronously via after() for instant UI response
    const code = await createVerificationCode(normalizedEmail, "sign_in", 10);
    after(async () => {
      await sendVerificationEmail({
        email: normalizedEmail,
        code,
        purpose: "sign_in",
        name: cleanName,
      });
    });

    return NextResponse.json({
      success: true,
      otpSent: true,
      message: "Account created. A 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("[POST /api/register]", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
