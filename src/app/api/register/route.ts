import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000); // 5 attempts per 15m
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

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(email)) {
      return NextResponse.json(
        { success: false, error: "Registration is currently restricted to whitelisted accounts (Private Beta)." },
        { status: 403 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/register]", error);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
