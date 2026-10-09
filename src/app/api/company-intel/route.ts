// ============================================================
// GET  /api/company-intel        — list all intel for current user
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const intels = await prisma.companyIntel.findMany({
      where: { userId: user.id },
      include: { contacts: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: intels });
  } catch (err) {
    console.error("[GET /api/company-intel]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company intel" },
      { status: 500 }
    );
  }
}
