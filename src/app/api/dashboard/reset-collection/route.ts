// ============================================================
// POST /api/dashboard/reset-collection
// Force-resets a stuck collectionStatus (running: false)
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function POST() {
  const user = await requireUser();
  try {
    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (!pref) {
      return NextResponse.json({ success: false, error: "No active preference" }, { status: 404 });
    }

    await prisma.searchPreference.update({
      where: { id: pref.id },
      data: {
        collectionStatus: {
          running: false,
          analyzed: 0,
          total: 0,
          startedAt: null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/dashboard/reset-collection]", err);
    return NextResponse.json({ success: false, error: "Failed to reset" }, { status: 500 });
  }
}
