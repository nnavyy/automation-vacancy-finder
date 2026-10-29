import { NextRequest, NextResponse, after } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import { createVerificationCode, sendVerificationEmail, isMailConfigured } from "@/lib/verificationCode";

interface OnboardingProfileInput {
  name?: string;
  targetRoles?: string[];
  searchKeywordsEn?: string[];
  searchKeywordsRu?: string[];
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  experience?: string[];
  workFormat?: string[];
  salaryMinimum?: number | null;
  salaryCurrency?: string;
  resumeText?: string;
}

function sanitizeStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return Array.from(
    new Set(
      val
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  ).slice(0, 30);
}

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

    const { name, email, password, onboardingProfile } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      onboardingProfile?: OnboardingProfileInput;
    };

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

    // Build profile fields from the pre-signup questionnaire answers
    const profileName = onboardingProfile?.name?.trim() || "Default";
    const targetRoles = sanitizeStringArray(onboardingProfile?.targetRoles);
    const searchKeywordsEn = sanitizeStringArray(onboardingProfile?.searchKeywordsEn);
    const searchKeywordsRu = sanitizeStringArray(onboardingProfile?.searchKeywordsRu);
    const requiredSkills = sanitizeStringArray(onboardingProfile?.requiredSkills);
    const niceToHaveSkills = sanitizeStringArray(onboardingProfile?.niceToHaveSkills);
    const experience = sanitizeStringArray(onboardingProfile?.experience);
    const workFormat = sanitizeStringArray(onboardingProfile?.workFormat);
    const salaryMinimum =
      typeof onboardingProfile?.salaryMinimum === "number" && onboardingProfile.salaryMinimum > 0
        ? onboardingProfile.salaryMinimum
        : null;
    const salaryCurrency =
      onboardingProfile?.salaryCurrency && ["RUR", "USD", "EUR"].includes(onboardingProfile.salaryCurrency)
        ? onboardingProfile.salaryCurrency
        : "RUR";
    const resumeText = typeof onboardingProfile?.resumeText === "string" ? onboardingProfile.resumeText.trim() : "";

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // If the user already submitted the form once and is retrying OTP verification with the same password,
      // update their profile with the latest questionnaire answers and issue a fresh OTP code.
      const samePassword = await bcrypt.compare(password, existing.passwordHash);
      if (!samePassword) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      if (targetRoles.length > 0 || searchKeywordsEn.length > 0) {
        await prisma.searchPreference.updateMany({
          where: { userId: existing.id, isActive: true },
          data: {
            name: profileName,
            targetRoles,
            searchKeywordsEn,
            searchKeywordsRu,
            requiredSkills,
            niceToHaveSkills,
            experience: experience.length > 0 ? experience : ["noExperience", "between1And3"],
            workFormat: workFormat.length > 0 ? workFormat : ["remote"],
            salaryMinimum,
            salaryCurrency,
            resumeText,
          },
        });
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

    // Create the user's SearchPreference pre-populated from their onboarding questionnaire answers
    await prisma.searchPreference.create({
      data: {
        userId:            user.id,
        name:              profileName,
        targetRoles,
        searchKeywordsEn,
        searchKeywordsRu,
        requiredSkills,
        niceToHaveSkills,
        experience:        experience.length > 0 ? experience : ["noExperience", "between1And3"],
        workFormat:        workFormat.length > 0 ? workFormat : ["remote"],
        salaryMinimum,
        salaryCurrency,
        resumeText,
        excludeKeywords:   [],
        redFlagKeywords:   ["паспорт", "залог", "unpaid"],
        aiProviderOrder:   ["groq", "gemini", "openrouter"],
        isActive:          true,
      },
    });

    // Provision an active Telegram sync token for the new user
    await prisma.telegramLink.create({
      data: {
        userId: user.id,
        token: crypto.randomBytes(3).toString("hex").toUpperCase(),
        isActive: true,
        language: "en",
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
