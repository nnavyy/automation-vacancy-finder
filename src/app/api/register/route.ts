import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import { createVerificationCode, sendVerificationEmail } from "@/lib/verificationCode";

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
      const emailResult = await sendVerificationEmail({
        email: normalizedEmail,
        code,
        purpose: "sign_in",
        name: existing.name,
      });

      if (!emailResult.success) {
        return NextResponse.json(
          { success: false, error: emailResult.error || "Failed to send verification email." },
          { status: 500 }
        );
      }

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

    // Create a default search preference matching user's profile
    await prisma.searchPreference.create({
      data: {
        userId:            user.id,
        name:              "Default",
        targetRoles:       ["Full Stack Developer", "Frontend Developer", "UI/UX Designer", "Web Developer", "WordPress Developer"],
        searchKeywordsEn:  ["full stack developer", "frontend developer", "react developer", "next.js developer", "UI/UX designer", "web developer intern", "wordpress developer"],
        searchKeywordsRu:  ["фулл стек разработчик", "фронтенд разработчик", "веб разработчик", "react разработчик", "стажёр разработчик", "UI/UX дизайнер"],
        requiredSkills:    ["React", "TypeScript", "JavaScript", "Next.js"],
        niceToHaveSkills:  ["Figma", "Node.js", "Tailwind CSS", "Prisma", "WordPress", "PostgreSQL", "REST API", "JWT Auth"],
        experience:        ["noExperience", "between1And3"],
        workFormat:        ["remote"],
        excludeKeywords:   [],
        redFlagKeywords:   ["паспорт", "залог"],
        aiProviderOrder:   ["groq", "gemini", "openrouter"],
        isActive:          true,
      },
    });

    // Generate and send 6-digit OTP code immediately so the user verifies their email on /register
    const code = await createVerificationCode(normalizedEmail, "sign_in", 10);
    const emailResult = await sendVerificationEmail({
      email: normalizedEmail,
      code,
      purpose: "sign_in",
      name: cleanName,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || "Account created, but failed to send verification email. Please try resending.",
        },
        { status: 500 }
      );
    }

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
