import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await requireUser();
  try {
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
      select: { collectionStatus: true },
    });

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active preference" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pref.collectionStatus || null });
  } catch (err) {
    console.error("[GET /api/dashboard/collect-status]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch status" }, { status: 500 });
  }
}
