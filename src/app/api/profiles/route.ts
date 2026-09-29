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

      const target = await prisma.searchPreference.findFirst({
        where: { id, userId: user.id },
      });

      if (!target) {
        return NextResponse.json({ success: false, error: "Profile not found or access denied." }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.searchPreference.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        }),
        prisma.searchPreference.update({
          where: { id: target.id },
          data: { isActive: true },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    if (action === "create") {
      const trimmedName = (name || "New Profile").trim();
      const newProfile = await prisma.$transaction(async (tx) => {
        await tx.searchPreference.updateMany({
          where: { userId: user.id, isActive: true },
          data: { isActive: false },
        });

        return tx.searchPreference.create({
          data: {
            ...PREF_DEFAULTS,
            userId: user.id,
            name: trimmedName,
            isActive: true,
          },
        });
      });

      return NextResponse.json({ success: true, data: newProfile });
    }

    if (action === "rename") {
      if (!id || !name?.trim()) {
        return NextResponse.json({ success: false, error: "ID and name are required." }, { status: 400 });
      }

      const target = await prisma.searchPreference.findFirst({
        where: { id, userId: user.id },
      });

      if (!target) {
        return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
      }

      const updated = await prisma.searchPreference.update({
        where: { id: target.id },
        data: { name: name.trim() },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "delete") {
      if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

      const totalProfiles = await prisma.searchPreference.count({
        where: { userId: user.id },
      });

      if (totalProfiles <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the only profile. An account must have at least one profile." },
          { status: 400 }
        );
      }

      const target = await prisma.searchPreference.findFirst({
        where: { id, userId: user.id },
      });

      if (!target) {
        return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.searchPreference.delete({ where: { id: target.id } });

        if (target.isActive) {
          const nextActive = await tx.searchPreference.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: "desc" },
          });

          if (nextActive) {
            await tx.searchPreference.update({
              where: { id: nextActive.id },
              data: { isActive: true },
            });
          }
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
