import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            vacancies: true,
            searchPreferences: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt,
        totalVacancies: account._count.vacancies,
        totalProfiles: account._count.searchPreferences,
      },
    });
  } catch (error) {
    console.error("[GET /api/account]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch account info." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const { name, currentPassword, newPassword } = body;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const updateData: { name?: string; passwordHash?: string } = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const match = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Account profile updated successfully.",
    });
  } catch (error) {
    console.error("[PATCH /api/account]", error);
    return NextResponse.json({ success: false, error: "Failed to update account." }, { status: 500 });
  }
}
