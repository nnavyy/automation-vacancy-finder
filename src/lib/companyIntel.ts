// ============================================================
// Company Intel & OSINT Intelligence Service
// Search Engine Web Crawl -> Domain Resolution -> Site Extraction -> LinkedIn OSINT
// ============================================================

import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';

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

export interface CrawledSource {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface CompanyMetadata {
  summary?: string;
  website?: string;
  careersUrl?: string;
  linkedinUrl?: string;
  generalEmails?: string[];
  crawledSources?: CrawledSource[];
}

export interface DeepCompanyIntelResult {
  companyName: string;
  domain?: string;
  website?: string;
  careersUrl?: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  description?: string;
  metadata: CompanyMetadata;
  contacts: ContactResult[];
}

// ── Bing URL Redirect Decoder ────────────────────────────────

export function decodeBingUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('/ck/a?')) return url;
  try {
    const parsed = new URL(url);
    const u = parsed.searchParams.get('u');
    if (!u) return url;
    const b64 = u.startsWith('a1') ? u.slice(2) : u;
    const standardB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(standardB64, 'base64').toString('utf-8');
  } catch {
    return url;
  }
}

// ── Extract Domain from URL ──────────────────────────────────

export function extractDomain(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const skip = [
      'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
      'youtube.com', 'wikipedia.org', 'wiktionary.org', 'google.com', 'bing.com',
      'duckduckgo.com', 'apple.com', 'play.google.com', 'github.com', 'glassdoor.com',
      'crunchbase.com', 'microsoft.com', 'support.microsoft.com', 'medium.com',
      'reddit.com', 'tiktok.com', 't.me', 'telegram.org', 'zoominfo.com', 'yandex.ru',
      'dzen.ru', 'mail.ru', 'habr.com', 'hh.ru', 'zhihu.com', 'baidu.com'
    ];
    if (skip.some(s => host === s || host.endsWith('.' + s))) return null;
    return host;
  } catch {
    return null;
  }
}

// ── Search Engine Query (Bing with decoded links) ─────────────

export async function searchBing(query: string, count = 10): Promise<CrawledSource[]> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en-US&mkt=en-US&count=${count}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'SRCHHPGUSR=ADLT=STRICT&NRSLT=10&SRCHLANG=en;'
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const items: CrawledSource[] = [];

    const blockedDomains = ['reddit.com', 'zhihu.com', 'baidu.com', 'bing.com', 'porn', 'xxx', 'adult'];

    $('li.b_algo').each((_, el) => {
      const rawLink = $(el).find('h2 a').attr('href') || '';
      const realLink = decodeBingUrl(rawLink);
      const title = $(el).find('h2 a').text().trim();
      const snippet = $(el).find('.b_caption p, .b_algoSlug, p').text().trim();

      const isBlocked = blockedDomains.some(b => realLink.toLowerCase().includes(b) || title.toLowerCase().includes(b));

      if (title && realLink && !isBlocked) {
        items.push({
          title,
          link: realLink,
          snippet,
          source: 'Web Search Engine',
        });
      }
    });

    return items;
  } catch {
    return [];
  }
}

// ── Domain & Company Canonical Resolution ────────────────────

export async function findCompanyDomain(companyName: string): Promise<{
  domain?: string;
  name?: string;
} | null> {
  const resolved = await resolveCompanyDomain(companyName);
  return resolved.domain ? { domain: resolved.domain, name: resolved.officialName } : null;
}

export async function resolveCompanyDomain(
  companyName: string,
  providedDomain?: string
): Promise<{ domain?: string; officialName?: string }> {
  const trimmed = companyName.trim();
  if (providedDomain?.trim()) {
    return { domain: providedDomain.trim().toLowerCase(), officialName: trimmed };
  }

  // 1. Direct domain check
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return { domain: trimmed.toLowerCase(), officialName: trimmed };
  }

  // 2. Clearbit Autocomplete
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.domain) {
        return { domain: data[0].domain.toLowerCase(), officialName: data[0].name || trimmed };
      }
    }
  } catch {}

  // 3. AI Resolution via Groq (Fast, high-precision for international companies)
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groq = new Groq({ apiKey: groqKey });
      const comp = await groq.chat.completions.create({
        model: process.env.AI_MODEL_GROQ || 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'Identify primary domain and English official name for companies worldwide (e.g. Novakid Inc -> novakidschool.com, Циан -> cian.ru, Grab -> grab.com). Return JSON only: {"domain": "string or null", "officialName": "string"}'
          },
          {
            role: 'user',
            content: `What is the primary official website domain and official name for company: "${trimmed}"?`
          }
        ],
        response_format: { type: 'json_object' }
      });
      const txt = comp.choices[0]?.message?.content;
      if (txt) {
        const parsed = JSON.parse(txt);
        if (parsed.domain && parsed.domain.includes('.')) {
          return {
            domain: parsed.domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
            officialName: parsed.officialName || trimmed
          };
        }
      }
    }
  } catch {}

  // 4. Web Search fallback
  try {
    const results = await searchBing(`"${trimmed}" official site OR company`);
    for (const r of results) {
      const d = extractDomain(r.link);
      if (d) {
        return { domain: d, officialName: trimmed };
      }
    }
  } catch {}

  return { domain: undefined, officialName: trimmed };
}

// ── Direct Company Website Crawler ───────────────────────────

export async function crawlCompanyWebsite(
  domain: string,
  _companyName: string
): Promise<{
  website: string;
  careersUrl?: string;
  linkedinCompanyUrl?: string;
  generalEmails: string[];
  contacts: ContactResult[];
}> {
  const website = `https://${domain}`;
  const contacts: ContactResult[] = [];
  const generalEmails = new Set<string>();
  let careersUrl: string | undefined;
  let linkedinCompanyUrl: string | undefined;

  const candidatePaths = [
    '',
    '/about-us',
    '/about',
    '/team',
    '/leadership',
    '/contact-us',
    '/contact',
    '/careers',
    '/jobs'
  ];

  for (const path of candidatePaths) {
    const pageUrl = `${website}${path}`;
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      // 1. Detect Company LinkedIn URL
      if (!linkedinCompanyUrl) {
        const compA = $('a[href*="linkedin.com/company/"]').first().attr('href');
        if (compA) linkedinCompanyUrl = compA;
      }

      // 2. Detect Careers URL
      if (!careersUrl) {
        const careerA = $('a[href*="recruitee.com"], a[href*="greenhouse.io"], a[href*="lever.co"], a[href*="workable.com"], a[href*="/careers"], a[href*="/jobs"]').first().attr('href');
        if (careerA) {
          careersUrl = careerA.startsWith('http') ? careerA : `${website}${careerA.startsWith('/') ? '' : '/'}${careerA}`;
        }
      }

      // 3. Extract Team & Leadership LinkedIn Profiles
      $('a[href*="linkedin.com/in/"]').each((_, aEl) => {
        const l = $(aEl).attr('href') || '';
        if (!l || contacts.some(c => c.linkedinUrl === l)) return;

        const parentHeader = $(aEl).closest('div');
        const container = parentHeader.parent();

        let name = container.find('[class*="name"]').first().text().trim() ||
                   parentHeader.find('[class*="name"]').first().text().trim() ||
                   container.find('h2, h3, h4, strong').first().text().trim();

        let role = container.find('[class*="role"], [class*="title"]').first().text().trim() ||
                   container.find('p').first().text().trim() || 'Leader / Specialist';

        if (!name) {
          const slug = l.split('linkedin.com/in/')[1]?.replace(/\/.*$/, '')?.replace(/[-_0-9]+$/, '');
          name = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : '';
        }

        if (name && name.length > 2 && name.length < 60) {
          const roleLower = role.toLowerCase();
          contacts.push({
            name,
            role,
            department: roleLower.includes('hr') || roleLower.includes('talent') || roleLower.includes('people')
              ? 'Human Resources'
              : roleLower.includes('engineer') || roleLower.includes('tech') || roleLower.includes('developer')
              ? 'Engineering'
              : roleLower.includes('product')
              ? 'Product'
              : roleLower.includes('finance')
              ? 'Finance'
              : roleLower.includes('marketing')
              ? 'Marketing'
              : undefined,
            seniority: normalizeSeniority(role),
            emailVerified: false,
            linkedinUrl: l,
          });
        }
      });

      // 4. Extract Company Emails
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      let match;
      while ((match = emailRegex.exec(html)) !== null) {
        const em = match[1].toLowerCase();
        if (
          !em.endsWith('.png') &&
          !em.endsWith('.jpg') &&
          !em.endsWith('.svg') &&
          !em.includes('sentry') &&
          !em.includes('wixpress') &&
          !em.includes('example.com') &&
          !em.includes('schema.org') &&
          !em.includes('webpack')
        ) {
          generalEmails.add(em);
        }
      }
    } catch {}
  }

  // Also inspect external careers page if available
  if (careersUrl && careersUrl.startsWith('http') && !careersUrl.includes(domain)) {
    try {
      const res = await fetch(careersUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const text = await res.text();
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        let match;
        while ((match = emailRegex.exec(text)) !== null) {
          const em = match[1].toLowerCase();
          if (!em.endsWith('.png') && !em.endsWith('.jpg') && !em.endsWith('.svg') && !em.includes('example.com')) {
            generalEmails.add(em);
          }
        }
      }
    } catch {}
  }

  return {
    website,
    careersUrl,
    linkedinCompanyUrl,
    generalEmails: Array.from(generalEmails),
    contacts,
  };
}

// ── LinkedIn OSINT Scraper (Decodes Bing Tracking Links) ──────

export async function findContactsDDG(
  companyName: string,
  domain?: string
): Promise<ContactResult[]> {
  try {
    const query = domain
      ? `("${companyName}" OR "${domain}") site:linkedin.com/in`
      : `"${companyName}" site:linkedin.com/in`;

    const results = await searchBing(query, 12);
    const contacts: ContactResult[] = [];

    for (const r of results) {
      if (!r.link.includes('linkedin.com/in')) continue;

      let cleanTitle = r.title
        .replace(/\s+\|\s+LinkedIn/gi, '')
        .replace(/LinkedIn/gi, '')
        .replace(/\.\.\./g, '')
        .trim();

      const parts = cleanTitle.split(/\s*[-–|]\s*/);
      const name = parts[0]?.trim();
      let role = parts.slice(1).join(' - ').trim();

      if (!role) {
        role = r.snippet ? r.snippet.slice(0, 60).trim() : 'Professional';
      }

      if (name && name.length >= 2 && name.length < 50) {
        contacts.push({
          name,
          role,
          emailVerified: false,
          linkedinUrl: r.link,
          seniority: normalizeSeniority(role),
        });
      }
    }

    return contacts;
  } catch (e) {
    console.error('[OSINT People Search Error]', e);
    return [];
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
        name: [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unknown',
        firstName: e.first_name,
        lastName: e.last_name,
        role: e.position || classifySeniority(e.seniority ?? ''),
        department: e.department,
        seniority: normalizeSeniority(e.seniority ?? ''),
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
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        q_organization_domains: domain,
        page: 1,
        per_page: limit,
        person_titles: [
          'CEO', 'CTO', 'COO', 'VP', 'Director', 'Head of',
          'Hiring Manager', 'Recruiter', 'HR', 'Talent', 'Engineering Manager',
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
      name: p.name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
      firstName: p.first_name,
      lastName: p.last_name,
      role: p.title || '',
      department: p.department,
      seniority: normalizeSeniority(p.seniority ?? ''),
      email: p.email,
      emailVerified: p.email_status === 'verified',
      linkedinUrl: p.linkedin_url,
    }));
  } catch {
    return [];
  }
}

// ── Merge & Deduplicate Contacts ─────────────────────────────

export function mergeContacts(
  siteContacts: ContactResult[],
  osintContacts: ContactResult[],
  hunterContacts: ContactResult[] = [],
  apolloContacts: ContactResult[] = []
): ContactResult[] {
  const map = new Map<string, ContactResult>();

  // Helper key generator
  const makeKey = (c: ContactResult) => {
    if (c.email) return `email:${c.email.toLowerCase()}`;
    if (c.linkedinUrl) return `li:${c.linkedinUrl.toLowerCase().replace(/\/$/, '')}`;
    return `name:${c.name.toLowerCase().trim()}`;
  };

  // 1. Site contacts first (direct official team members)
  for (const c of siteContacts) {
    map.set(makeKey(c), c);
  }

  // 2. Apollo contacts
  for (const c of apolloContacts) {
    const key = makeKey(c);
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      const existing = map.get(key)!;
      if (!existing.email && c.email) {
        existing.email = c.email;
        existing.emailVerified = c.emailVerified;
      }
    }
  }

  // 3. Hunter contacts
  for (const c of hunterContacts) {
    const key = makeKey(c);
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      const existing = map.get(key)!;
      if (!existing.email && c.email) {
        existing.email = c.email;
        existing.emailVerified = c.emailVerified;
      }
    }
  }

  // 4. OSINT LinkedIn contacts
  for (const c of osintContacts) {
    const key = makeKey(c);
    let matched = false;
    for (const existing of map.values()) {
      if (
        (existing.linkedinUrl && c.linkedinUrl && existing.linkedinUrl === c.linkedinUrl) ||
        existing.name.toLowerCase().trim() === c.name.toLowerCase().trim()
      ) {
        if (!existing.linkedinUrl && c.linkedinUrl) existing.linkedinUrl = c.linkedinUrl;
        matched = true;
        break;
      }
    }
    if (!matched) {
      map.set(key, c);
    }
  }

  return Array.from(map.values()).sort(senioritySort);
}

// ── Deep Full-Intelligence Crawl ─────────────────────────────

export async function crawlDeepCompanyIntel(
  companyName: string,
  providedDomain?: string
): Promise<DeepCompanyIntelResult> {
  const trimmedName = companyName.trim();

  // 1. Resolve canonical domain and company name
  const { domain, officialName } = await resolveCompanyDomain(trimmedName, providedDomain);
  const canonicalName = officialName || trimmedName;

  // 2. Search web for company presence & save crawled sources
  const searchQuery = `"${canonicalName}"`;
  const searchResults = await searchBing(searchQuery, 10);
  const crawledSources: CrawledSource[] = [...searchResults];

  let website: string | undefined = domain ? `https://${domain}` : undefined;
  let careersUrl: string | undefined;
  let linkedinCompanyUrl: string | undefined;

  for (const r of searchResults) {
    if (r.link.includes('linkedin.com/company/')) {
      if (!linkedinCompanyUrl) linkedinCompanyUrl = r.link;
    }
    if (
      r.link.includes('recruitee.com') ||
      r.link.includes('greenhouse.io') ||
      r.link.includes('lever.co') ||
      r.link.includes('workable.com') ||
      r.link.includes('/careers') ||
      r.link.includes('/jobs')
    ) {
      if (!careersUrl) careersUrl = r.link;
    }
  }

  // 3. Parallel deep crawl: Website + OSINT LinkedIn + Hunter + Apollo
  let siteContacts: ContactResult[] = [];
  const generalEmails: string[] = [];

  const [siteData, osintContacts, hunterContacts, apolloContacts] = await Promise.all([
    domain ? crawlCompanyWebsite(domain, canonicalName) : Promise.resolve(null),
    findContactsDDG(canonicalName, domain),
    domain ? findEmailsHunter(domain) : Promise.resolve([]),
    domain ? findContactsApollo(domain) : Promise.resolve([]),
  ]);

  if (siteData) {
    siteContacts = siteData.contacts;
    if (siteData.website && !website) website = siteData.website;
    if (siteData.careersUrl && !careersUrl) careersUrl = siteData.careersUrl;
    if (siteData.linkedinCompanyUrl && !linkedinCompanyUrl) linkedinCompanyUrl = siteData.linkedinCompanyUrl;
    generalEmails.push(...siteData.generalEmails);
  }

  // 4. Create action contacts for discovered general / recruiting emails
  const emailChannelContacts: ContactResult[] = [];
  const uniqueEmails = Array.from(new Set(generalEmails));
  for (const em of uniqueEmails) {
    const isHr = em.includes('hr') || em.includes('talent') || em.includes('recruit') || em.includes('job') || em.includes('apply') || em.includes('career');
    emailChannelContacts.push({
      name: isHr ? 'Careers & Recruitment Channel' : `${canonicalName} Inquiries`,
      role: isHr ? 'Recruiting & Talent Acquisition' : 'Corporate Communications',
      department: isHr ? 'Human Resources' : 'General',
      seniority: 'Manager',
      email: em,
      emailVerified: true,
      linkedinUrl: linkedinCompanyUrl,
    });
  }

  // 5. Merge all contacts
  const mergedContacts = mergeContacts(
    [...siteContacts, ...emailChannelContacts],
    osintContacts,
    hunterContacts,
    apolloContacts
  );

  // 6. Build structured metadata
  const metadata: CompanyMetadata = {
    website,
    careersUrl,
    linkedinUrl: linkedinCompanyUrl,
    generalEmails: uniqueEmails,
    crawledSources,
  };

  return {
    companyName: trimmedName,
    domain,
    website,
    careersUrl,
    linkedinUrl: linkedinCompanyUrl,
    description: JSON.stringify(metadata),
    metadata,
    contacts: mergedContacts,
  };
}

// ── Seniority Helpers ─────────────────────────────────────────

const SENIORITY_ORDER: Record<string, number> = {
  'C-Level': 0,
  VP: 1,
  Director: 2,
  Manager: 3,
  IC: 4,
  Other: 5,
};

function senioritySort(a: ContactResult, b: ContactResult): number {
  const aScore = SENIORITY_ORDER[a.seniority ?? 'Other'] ?? 5;
  const bScore = SENIORITY_ORDER[b.seniority ?? 'Other'] ?? 5;
  return aScore - bScore;
}

function normalizeSeniority(raw: string): string {
  const lower = raw.toLowerCase();
  if (['c_suite', 'c-level', 'ceo', 'cto', 'coo', 'cfo', 'founder', 'co-founder', 'owner', 'chief'].some(s => lower.includes(s))) return 'C-Level';
  if (['vp', 'vice president'].some(s => lower.includes(s))) return 'VP';
  if (['director', 'head of', 'head'].some(s => lower.includes(s))) return 'Director';
  if (['manager', 'lead', 'principal'].some(s => lower.includes(s))) return 'Manager';
  if (['engineer', 'developer', 'designer', 'analyst', 'specialist'].some(s => lower.includes(s))) return 'IC';
  return 'Other';
}

function classifySeniority(seniority: string): string {
  const map: Record<string, string> = {
    executive: 'C-Level Executive',
    director: 'Director',
    manager: 'Manager',
    senior: 'Senior',
    junior: 'Junior',
    entry: 'Entry Level',
  };
  return (map[seniority.toLowerCase()] ?? seniority) || 'Professional';
}
