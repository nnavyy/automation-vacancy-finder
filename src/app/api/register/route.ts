import { NextRequest, NextResponse, after } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import { createVerificationCode, sendVerificationEmail, isMailConfigured } from "@/lib/verificationCode";
import {
  expandBilingualKeywords,
  parseMultilingualOnboardingText,
  synthesizeCandidateResume,
} from "@/lib/onboardingProfile";

interface OnboardingProfileInput {
  name?: string;
  selectedTracks?: string[];
  yearsBracketId?: string;
  exactYears?: string;
  customWhatIDoText?: string;
  targetRoles?: string[];
  searchKeywordsEn?: string[];
  searchKeywordsRu?: string[];
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  experience?: string[];
  workFormat?: string[];
  excludeKeywords?: string[];
  redFlagKeywords?: string[];
  salaryMinimum?: number | null;
  salaryCurrency?: string;
  minimumScoreToNotify?: number;
  maxNotificationsPerDay?: number;
  coverLetterLanguage?: string;
  portfolioUrl?: string;
  resumeText?: string;
  userNotes?: string;
  uiLanguage?: string;
}

function sanitizeStringArray(val: unknown, max = 35): string[] {
  if (!Array.isArray(val)) return [];
  return Array.from(
    new Set(
      val
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  ).slice(0, max);
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

    // Parse any multilingual free-text answers (EN, RU, UK, UZ, KK, etc.)
    const combinedFreeText = [
      onboardingProfile?.customWhatIDoText ?? "",
      onboardingProfile?.userNotes ?? "",
      onboardingProfile?.resumeText ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    const parsedMultilingual = parseMultilingualOnboardingText(combinedFreeText);

    const selectedTracks = sanitizeStringArray([
      ...(onboardingProfile?.selectedTracks ?? []),
      ...parsedMultilingual.matchedTrackIds,
    ]);

    const targetRoles = sanitizeStringArray([
      ...(onboardingProfile?.targetRoles ?? []),
      ...parsedMultilingual.roles,
    ]);

    const requiredSkills = sanitizeStringArray([
      ...(onboardingProfile?.requiredSkills ?? []),
      ...parsedMultilingual.skills,
    ]);

    const niceToHaveSkills = sanitizeStringArray(onboardingProfile?.niceToHaveSkills);

    const { searchKeywordsEn, searchKeywordsRu } = expandBilingualKeywords({
      selectedTrackIds: selectedTracks,
      targetRoles,
      customKeywordsEn: sanitizeStringArray(onboardingProfile?.searchKeywordsEn),
      customKeywordsRu: sanitizeStringArray(onboardingProfile?.searchKeywordsRu),
      freeTextBio: combinedFreeText,
    });

    const experience = sanitizeStringArray(onboardingProfile?.experience);
    const workFormat = sanitizeStringArray([
      ...(onboardingProfile?.workFormat ?? []),
      ...parsedMultilingual.detectedWorkFormats,
    ]);
    const excludeKeywords = sanitizeStringArray(onboardingProfile?.excludeKeywords);
    const redFlagKeywords = sanitizeStringArray(onboardingProfile?.redFlagKeywords);

    const salaryMinimum =
      typeof onboardingProfile?.salaryMinimum === "number" && onboardingProfile.salaryMinimum > 0
        ? onboardingProfile.salaryMinimum
        : null;

    const validCurrencies = ["RUR", "USD", "EUR", "KZT", "UZS", "UAH"];
    const salaryCurrency =
      onboardingProfile?.salaryCurrency && validCurrencies.includes(onboardingProfile.salaryCurrency)
        ? onboardingProfile.salaryCurrency
        : "RUR";

    const minimumScoreToNotify =
      typeof onboardingProfile?.minimumScoreToNotify === "number" &&
      onboardingProfile.minimumScoreToNotify >= 50 &&
      onboardingProfile.minimumScoreToNotify <= 95
        ? onboardingProfile.minimumScoreToNotify
        : 70;

    const maxNotificationsPerDay =
      typeof onboardingProfile?.maxNotificationsPerDay === "number" &&
      onboardingProfile.maxNotificationsPerDay >= 1 &&
      onboardingProfile.maxNotificationsPerDay <= 100
        ? onboardingProfile.maxNotificationsPerDay
        : 20;

    const coverLetterLanguage =
      typeof onboardingProfile?.coverLetterLanguage === "string" && onboardingProfile.coverLetterLanguage.trim()
        ? onboardingProfile.coverLetterLanguage.trim()
        : "Auto (Match Vacancy Language)";

    const portfolioUrl =
      typeof onboardingProfile?.portfolioUrl === "string" && onboardingProfile.portfolioUrl.trim()
        ? onboardingProfile.portfolioUrl.trim()
        : null;

    const profileName = onboardingProfile?.name?.trim() || targetRoles[0] || "Default";

    // Build comprehensive candidate resume text combining structured profile + user notes
    const resumeText =
      typeof onboardingProfile?.resumeText === "string" && onboardingProfile.resumeText.trim()
        ? onboardingProfile.resumeText.trim()
        : synthesizeCandidateResume({
            name: cleanName,
            selectedTrackIds: selectedTracks,
            yearsBracketId: onboardingProfile?.yearsBracketId || parsedMultilingual.detectedYearsBracketId || "1-3",
            exactYears: onboardingProfile?.exactYears,
            targetRoles,
            requiredSkills,
            niceToHaveSkills,
            workFormat: workFormat.length > 0 ? workFormat : ["remote"],
            salaryMinimum,
            salaryCurrency,
            portfolioUrl: portfolioUrl ?? undefined,
            userNotes: onboardingProfile?.userNotes || onboardingProfile?.customWhatIDoText,
          });

    const preferredAppLang =
      onboardingProfile?.uiLanguage && ["ru", "uk", "uz"].includes(onboardingProfile.uiLanguage)
        ? "ru"
        : "en";

    const profileData = {
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
      excludeKeywords,
      redFlagKeywords: redFlagKeywords.length > 0 ? redFlagKeywords : ["паспорт", "залог", "unpaid"],
      minimumScoreToNotify,
      maxNotificationsPerDay,
      coverLetterLanguage,
      language: preferredAppLang,
      portfolioUrl,
      resumeText,
    };

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
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
          data: profileData,
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

    await prisma.searchPreference.create({
      data: {
        userId: user.id,
        ...profileData,
        aiProviderOrder: ["groq", "gemini", "openrouter"],
        isActive: true,
      },
    });

    await prisma.telegramLink.create({
      data: {
        userId: user.id,
        token: crypto.randomBytes(3).toString("hex").toUpperCase(),
        isActive: true,
        language: preferredAppLang,
      },
    });

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
