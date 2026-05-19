import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required." },
        { status: 400 }
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
