import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const PREF_DEFAULTS = {
  name: "New Profile",
  targetRoles: ["Frontend Developer"],
  searchKeywordsEn: ["frontend developer"],
  searchKeywordsRu: ["фронтенд разработчик"],
  requiredSkills: ["React", "JavaScript"],
  niceToHaveSkills: [],
  experience: ["noExperience"],
  workFormat: ["remote"],
  salaryMinimum: null,
  excludeKeywords: [],
  redFlagKeywords: ["паспорт", "залог"],
  minimumScoreToNotify: 70,
  maxNotificationsPerDay: 20,
  aiProviderOrder: ["groq", "gemini", "openrouter"],
  coverLetterLanguage: "English",
  resumeText: "",
  isActive: true,
};

export async function GET() {
  try {
    const profiles = await prisma.searchPreference.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, data: profiles });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profiles" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, name } = body;

    if (action === "switch") {
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
      
      // Make all inactive
      await prisma.searchPreference.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      // Make selected active
      await prisma.searchPreference.update({
        where: { id },
        data: { isActive: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      // Make all inactive first
      await prisma.searchPreference.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      // Create new
      const newProfile = await prisma.searchPreference.create({
        data: {
          ...PREF_DEFAULTS,
          name: name || "New Profile",
        },
      });
      return NextResponse.json({ success: true, data: newProfile });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
      const target = await prisma.searchPreference.findUnique({ where: { id } });
      if (!target) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      
      await prisma.searchPreference.delete({ where: { id } });
      
      // If deleted was active, make the first one active
      if (target.isActive) {
        const first = await prisma.searchPreference.findFirst();
        if (first) {
          await prisma.searchPreference.update({
            where: { id: first.id },
            data: { isActive: true },
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
