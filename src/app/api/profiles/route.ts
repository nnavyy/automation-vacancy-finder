import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

const PREF_DEFAULTS = {
  name:                  "New Profile",
  targetRoles:           ["Frontend Developer"],
  searchKeywordsEn:      ["frontend developer"],
  searchKeywordsRu:      ["фронтенд разработчик"],
  requiredSkills:        ["React", "JavaScript"],
  niceToHaveSkills:      [],
  experience:            ["noExperience"],
  workFormat:            ["remote"],
  salaryMinimum:         null,
  excludeKeywords:       [],
  redFlagKeywords:       ["паспорт", "залог"],
  minimumScoreToNotify:  70,
  maxNotificationsPerDay: 20,
  aiProviderOrder:       ["groq", "gemini", "openrouter"],
  coverLetterLanguage:   "English",
  resumeText:            "",
  isActive:              true,
};

export async function GET() {
  const user = await requireUser();
  try {
    const profiles = await prisma.searchPreference.findMany({
      where:   { userId: user.id },
      select:  { id: true, name: true, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, data: profiles });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  try {
    const body = await req.json();
    const { action, id, name } = body;

    if (action === "switch") {
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
      await prisma.searchPreference.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });
      await prisma.searchPreference.update({ where: { id }, data: { isActive: true } });
      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      await prisma.searchPreference.updateMany({ where: { userId: user.id, isActive: true }, data: { isActive: false } });
      const newProfile = await prisma.searchPreference.create({
        data: { ...PREF_DEFAULTS, userId: user.id, name: name || "New Profile" },
      });
      return NextResponse.json({ success: true, data: newProfile });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
      const target = await prisma.searchPreference.findFirst({ where: { id, userId: user.id } });
      if (!target) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

      await prisma.searchPreference.delete({ where: { id } });

      if (target.isActive) {
        const first = await prisma.searchPreference.findFirst({ where: { userId: user.id } });
        if (first) await prisma.searchPreference.update({ where: { id: first.id }, data: { isActive: true } });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
