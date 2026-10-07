// ============================================================
// POST /api/company-intel/search
// Deep crawl company intelligence, leadership contacts, and crawled sources
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { crawlDeepCompanyIntel } from "@/lib/companyIntel";

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { companyName, domain: providedDomain, vacancyId, intelId } = body as {
      companyName?: string;
      domain?: string;
      vacancyId?: string;
      intelId?: string;
    };

    if (!companyName?.trim() && !intelId) {
      return NextResponse.json(
        { success: false, error: "Company name or intel ID is required" },
        { status: 400 }
      );
    }

    let targetName = companyName?.trim() || "";

    // If intelId is provided, find existing company name
    if (intelId) {
      const existing = await prisma.companyIntel.findFirst({
        where: { id: intelId, userId: user.id },
      });
      if (existing) {
        targetName = existing.companyName;
      }
    }

    // Step 1: Deep crawl multi-engine intelligence
    const intelResult = await crawlDeepCompanyIntel(targetName, providedDomain);

    // Step 2: Check if record already exists for this user
    const existingRecord = await prisma.companyIntel.findFirst({
      where: {
        userId: user.id,
        OR: [
          ...(intelId ? [{ id: intelId }] : []),
          { companyName: targetName },
          { companyName: { equals: targetName, mode: "insensitive" as const } },
        ],
      },
    });

    let savedIntel;

    if (existingRecord) {
      // Clear old contacts
      await prisma.companyContact.deleteMany({
        where: { companyIntelId: existingRecord.id },
      });

      // Update company intel and populate newly crawled contacts
      savedIntel = await prisma.companyIntel.update({
        where: { id: existingRecord.id },
        data: {
          domain: intelResult.domain ?? existingRecord.domain,
          linkedinUrl: intelResult.linkedinUrl ?? existingRecord.linkedinUrl,
          description: intelResult.description,
          vacancyId: vacancyId ?? existingRecord.vacancyId,
          contacts: {
            create: intelResult.contacts.map((c) => ({
              name: c.name,
              firstName: c.firstName ?? null,
              lastName: c.lastName ?? null,
              role: c.role,
              department: c.department ?? null,
              seniority: c.seniority ?? null,
              email: c.email ?? null,
              emailVerified: c.emailVerified,
              linkedinUrl: c.linkedinUrl ?? null,
            })),
          },
        },
        include: { contacts: true },
      });
    } else {
      // Create fresh company intel
      savedIntel = await prisma.companyIntel.create({
        data: {
          userId: user.id,
          companyName: targetName,
          domain: intelResult.domain ?? null,
          linkedinUrl: intelResult.linkedinUrl ?? null,
          description: intelResult.description,
          vacancyId: vacancyId ?? null,
          contacts: {
            create: intelResult.contacts.map((c) => ({
              name: c.name,
              firstName: c.firstName ?? null,
              lastName: c.lastName ?? null,
              role: c.role,
              department: c.department ?? null,
              seniority: c.seniority ?? null,
              email: c.email ?? null,
              emailVerified: c.emailVerified,
              linkedinUrl: c.linkedinUrl ?? null,
            })),
          },
        },
        include: { contacts: true },
      });
    }

    return NextResponse.json({ success: true, data: savedIntel });
  } catch (err) {
    console.error("[POST /api/company-intel/search]", err);
    return NextResponse.json(
      { success: false, error: "Failed to search company contacts" },
      { status: 500 }
    );
  }
}
