// ============================================================
// POST /api/company-intel/search
// Deep crawl company intelligence, leadership contacts, and crawled sources
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getApiUser } from "@/lib/auth-helpers";
import { hasCompanyIntelAccess } from "@/lib/entitlements";
import { isSafePublicUrl } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";
import { crawlDeepCompanyIntel } from "@/lib/companyIntel";

function isSearchBody(value: unknown): value is { companyName?: string; domain?: string; vacancyId?: string; intelId?: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, field]) =>
    !["companyName", "domain", "vacancyId", "intelId"].includes(key)
    || (typeof field === "string" && field.length <= 500));
}

export async function POST(req: NextRequest) {
  const user = await getApiUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!hasCompanyIntelAccess(user.id)) {
    return NextResponse.json({ success: false, code: "COMPANY_INTEL_REQUIRED", error: "Company Intel requires paid access." }, { status: 403 });
  }

  try {
    const body: unknown = await req.json().catch(() => null);
    if (!isSearchBody(body)) {
      return NextResponse.json({ success: false, error: "Invalid company search parameters" }, { status: 400 });
    }
    const { companyName, domain: providedDomain, vacancyId, intelId } = body;
    if (providedDomain && !isSafePublicUrl(providedDomain.includes("://") ? providedDomain : `https://${providedDomain}`)) {
      return NextResponse.json({ success: false, error: "Company domain must be a public website" }, { status: 400 });
    }
    if (!rateLimit(`company-intel:${user.id}`, 10, 60 * 60 * 1000).success) {
      return NextResponse.json({ success: false, error: "Company search limit reached. Please try again later." }, { status: 429 });
    }
    if (vacancyId && !await prisma.vacancy.findFirst({ where: { id: vacancyId, userId: user.id }, select: { id: true } })) {
      return NextResponse.json({ success: false, error: "Vacancy not found" }, { status: 404 });
    }

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
      if (!existing) return NextResponse.json({ success: false, error: "Company Intel not found" }, { status: 404 });
      targetName = existing.companyName;
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
      // Update company intel and populate newly crawled contacts
      savedIntel = await prisma.companyIntel.update({
        where: { id: existingRecord.id },
        data: {
          domain: intelResult.domain ?? existingRecord.domain,
          linkedinUrl: intelResult.linkedinUrl ?? null,
          description: intelResult.description,
          vacancyId: vacancyId ?? existingRecord.vacancyId,
          contacts: {
            deleteMany: {},
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
