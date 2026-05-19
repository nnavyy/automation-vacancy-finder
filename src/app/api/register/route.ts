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

    // Create a default search preference for the new user
    await prisma.searchPreference.create({
      data: {
        userId:            user.id,
        name:              "Default",
        targetRoles:       ["Frontend Developer"],
        searchKeywordsEn:  ["frontend developer"],
        searchKeywordsRu:  ["фронтенд разработчик"],
        requiredSkills:    ["React", "JavaScript"],
        niceToHaveSkills:  [],
        experience:        ["noExperience"],
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
