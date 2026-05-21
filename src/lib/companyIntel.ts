// ============================================================
// Company Intel Service
// Clearbit autocomplete → Hunter.io email finder → Apollo enrichment
// ============================================================

export interface ContactResult {
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  department?: string;
  seniority?: string;
  email?: string;
  emailVerified: boolean;
  linkedinUrl?: string;
}

export interface CompanyResult {
  companyName: string;
  domain?: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  description?: string;
  contacts: ContactResult[];
}

// ── Clearbit Autocomplete (no key needed) ─────────────────────

export async function findCompanyDomain(companyName: string): Promise<{
  domain?: string;
  name?: string;
} | null> {
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const top = data[0] as { domain?: string; name?: string };
    return { domain: top.domain, name: top.name };
  } catch {
    return null;
  }
}

// ── Hunter.io — find emails from domain ──────────────────────

export async function findEmailsHunter(
  domain: string,
  limit = 10
): Promise<ContactResult[]> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=${limit}&api_key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const json = await res.json();
    const emails: Array<{
      value?: string;
      first_name?: string;
      last_name?: string;
      position?: string;
      department?: string;
      seniority?: string;
      confidence?: number;
      linkedin?: string;
    }> = json?.data?.emails ?? [];

    return emails
      .filter((e) => e.value)
      .map((e) => ({
        name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "Unknown",
        firstName: e.first_name,
        lastName: e.last_name,
        role: e.position || classifySeniority(e.seniority ?? ""),
        department: e.department,
        seniority: normalizeSeniority(e.seniority ?? ""),
        email: e.value,
        emailVerified: (e.confidence ?? 0) >= 70,
        linkedinUrl: e.linkedin,
      }));
  } catch {
    return [];
  }
}

// ── Apollo.io — people search by domain ──────────────────────

export async function findContactsApollo(
  domain: string,
  limit = 10
): Promise<ContactResult[]> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        q_organization_domains: domain,
        page: 1,
        per_page: limit,
        person_titles: [
          "CEO",
          "CTO",
          "COO",
          "VP",
          "Director",
          "Head of",
          "Hiring Manager",
          "Recruiter",
          "HR",
          "Talent",
          "Engineering Manager",
        ],
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return [];
    const json = await res.json();

    const people: Array<{
      name?: string;
      first_name?: string;
      last_name?: string;
      title?: string;
      department?: string;
      seniority?: string;
      email?: string;
      email_status?: string;
      linkedin_url?: string;
    }> = json?.people ?? [];

    return people.map((p) => ({
      name: p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unknown",
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.title || "",
      department: p.department,
      seniority: normalizeSeniority(p.seniority ?? ""),
      email: p.email,
      emailVerified: p.email_status === "verified",
      linkedinUrl: p.linkedin_url,
    }));
  } catch {
    return [];
  }
}

// ── Merge & Deduplicate Contacts ─────────────────────────────

export function mergeContacts(
  hunterContacts: ContactResult[],
  apolloContacts: ContactResult[]
): ContactResult[] {
  const map = new Map<string, ContactResult>();

  // Apollo contacts first (more enriched)
  for (const c of apolloContacts) {
    const key = c.email ?? c.name.toLowerCase();
    map.set(key, c);
  }

  // Hunter fills gaps
  for (const c of hunterContacts) {
    const key = c.email ?? c.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      // Merge: add email from Hunter if Apollo didn't have it
      const existing = map.get(key)!;
      if (!existing.email && c.email) {
        map.set(key, { ...existing, email: c.email, emailVerified: c.emailVerified });
      }
    }
  }

  return Array.from(map.values()).sort(senioritySort);
}

// ── Seniority Helpers ─────────────────────────────────────────

const SENIORITY_ORDER: Record<string, number> = {
  "C-Level": 0,
  "VP": 1,
  "Director": 2,
  "Manager": 3,
  "IC": 4,
  "Other": 5,
};

function senioritySort(a: ContactResult, b: ContactResult): number {
  const aScore = SENIORITY_ORDER[a.seniority ?? "Other"] ?? 5;
  const bScore = SENIORITY_ORDER[b.seniority ?? "Other"] ?? 5;
  return aScore - bScore;
}

function normalizeSeniority(raw: string): string {
  const lower = raw.toLowerCase();
  if (["c_suite", "c-level", "ceo", "cto", "coo", "cfo", "founder", "owner"].some(s => lower.includes(s))) return "C-Level";
  if (["vp", "vice president"].some(s => lower.includes(s))) return "VP";
  if (["director", "head of"].some(s => lower.includes(s))) return "Director";
  if (["manager", "lead", "principal"].some(s => lower.includes(s))) return "Manager";
  if (["engineer", "developer", "designer", "analyst", "specialist"].some(s => lower.includes(s))) return "IC";
  return "Other";
}

function classifySeniority(seniority: string): string {
  const map: Record<string, string> = {
    "executive": "C-Level Executive",
    "director": "Director",
    "manager": "Manager",
    "senior": "Senior",
    "junior": "Junior",
    "entry": "Entry Level",
  };
  return (map[seniority.toLowerCase()] ?? seniority) || "Professional";
}
