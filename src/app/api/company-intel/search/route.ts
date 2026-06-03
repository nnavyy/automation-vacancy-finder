// ============================================================
// POST /api/company-intel/search
// Searches for company contacts and saves to DB
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import {
  findCompanyDomain,
  findEmailsHunter,
  findContactsApollo,
  findContactsDDG,
  mergeContacts,
} from "@/lib/companyIntel";

export async function POST(req: NextRequest) {
  const user = await requireUser();

  try {
    const body = await req.json().catch(() => ({}));
    const { companyName, domain: providedDomain, vacancyId } = body as {
      companyName?: string;
      domain?: string;
      vacancyId?: string;
    };

    if (!companyName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 }
      );
    }

    const name = companyName.trim();

    // Step 1: Use provided domain or find via Clearbit
    let domain = providedDomain?.trim();
    if (!domain) {
      const clearbitResult = await findCompanyDomain(name);
      domain = clearbitResult?.domain;
    }

    // Step 2: Fetch contacts in parallel from Hunter + Apollo + DDG OSINT
    const [hunterContacts, apolloContacts, ddgContacts] = await Promise.all([
      domain ? findEmailsHunter(domain) : Promise.resolve([]),
      domain ? findContactsApollo(domain) : Promise.resolve([]),
      findContactsDDG(name)
    ]);

    // Step 3: Merge and deduplicate
    const mergedContacts = mergeContacts(hunterContacts, apolloContacts, ddgContacts);

    // Step 4: Save to DB
    const intel = await prisma.companyIntel.create({
      data: {
        userId: user.id,
        companyName: name,
        domain: domain ?? null,
        vacancyId: vacancyId ?? null,
        contacts: {
          create: mergedContacts.map((c) => ({
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

    return NextResponse.json({ success: true, data: intel });
  } catch (err) {
    console.error("[POST /api/company-intel/search]", err);
    return NextResponse.json(
      { success: false, error: "Failed to search company contacts" },
      { status: 500 }
    );
  }
}
