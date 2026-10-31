// ============================================================
// Company Intel & OSINT Intelligence Service
// Search Engine Web Crawl -> Domain Resolution -> Site Extraction -> LinkedIn OSINT
// ============================================================

import * as cheerio from 'cheerio';
import { isSafePublicUrl } from "@/lib/security";
import { fetchPublicPage } from "@/lib/publicFetch";

export interface ContactResult {
  sourceUrl?: string;
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
  contactSources?: { name: string; email?: string; linkedinUrl?: string; sourceUrl: string }[];
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
      'dzen.ru', 'mail.ru', 'habr.com', 'hh.ru', 'zhihu.com', 'baidu.com',
      'scribd.com', 'tenforums.com', 'detik.com', 'generalblue.com',
      'kalenderlengkap.id', 'kalenderindo.id', 'kalender-365.nl', 'kalenderfox.nl',
      'newsweek.com', 'nytimes.com', 'cnn.com', 'cbsnews.com', 'hindustantimes.com',
      'bbc.com', 'reuters.com', 'bloomberg.com', 'forbes.com', 'tripadvisor.com',
      'booking.com', 'airbnb.com', 'hotels.com'
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

export function cleanCompanyName(raw: string): string {
  if (!raw) return "";
  let name = raw.trim();
  // Strip opening/closing quotes and brackets
  name = name.replace(/^["'«»“„]+|["'«»“„]+$/g, "").trim();
  // Strip legal prefixes (case-insensitive)
  name = name.replace(/^(?:ООО|ОАО|ЗАО|ПАО|АО|ИП|LLC|LTD|INC|CORP|CO|GROUP|ГК|КОМПАНИЯ|COMPANY)\s+/i, "");
  // Strip legal suffixes
  name = name.replace(/\s+(?:ООО|ОАО|ЗАО|ПАО|АО|ИП|LLC|LTD|INC|CORP|CO|GROUP|ГК)$/i, "");
  // Strip remaining quotes
  name = name.replace(/["'«»“„]/g, "").trim();
  return name || raw.trim();
}

export const KNOWN_ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "workable.com",
  "recruitee.com",
  "ashbyhq.com",
  "huntflow.ru",
  "bamboohr.com",
  "smartrecruiters.com",
  "breezy.hr",
  "applytojob.com",
  "career.habr.com",
  "hh.ru",
];

export function isValidCareersUrl(
  candidateUrl?: string,
  domain?: string,
  cleanName?: string
): boolean {
  if (!candidateUrl) return false;
  try {
    const parsed = new URL(candidateUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 1. If corporate domain is known, URL must match domain
    if (domain) {
      const normDomain = domain.toLowerCase().replace(/^www\./, "");
      if (host === normDomain || host.endsWith("." + normDomain)) {
        return true;
      }
    }

    // 2. Recognized ATS platforms
    const isAts = KNOWN_ATS_DOMAINS.some((ats) => host === ats || host.endsWith(`.${ats}`));
    if (isAts) {
      // Must match company slug or name in pathname or subdomain
      if (cleanName) {
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetStr = (host + pathname).replace(/[^a-z0-9]/g, "");
        if (slug.length >= 3 && targetStr.includes(slug)) {
          return true;
        }
      }
      if (domain) {
        const domainSlug = domain.split(".")[0]?.toLowerCase();
        if (domainSlug && domainSlug.length >= 3 && (host + pathname).includes(domainSlug)) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

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
): Promise<{ domain?: string; officialName?: string; careersUrl?: string }> {
  const trimmed = companyName.trim();
  if (providedDomain?.trim()) {
    const d = extractDomain(providedDomain.trim());
    if (d) return { domain: d, officialName: trimmed };
  }

  // 1. Direct domain check (e.g. "cian.ru", "pyxl.ai", "hh.ru", "domain.com")
  const domainPattern = /^(?:https?:\/\/)?([a-zA-Z0-9-]+\.(?:ru|com|net|org|io|ai|dev|app|co|tech|me|by|kz|uz))(?:\/.*)?$/i;
  const match = trimmed.match(domainPattern);
  if (match) {
    const rawHost = match[1].toLowerCase();
    const d = extractDomain(rawHost) || rawHost;
    return { domain: d, officialName: trimmed };
  }

  const cleanName = cleanCompanyName(trimmed);

  // 3. Clearbit Autocomplete (Strict name matching)
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(cleanName)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.domain && data[0]?.name) {
        const cbName = data[0].name.toLowerCase();
        const targetLower = cleanName.toLowerCase();
        if (cbName.includes(targetLower) || targetLower.includes(cbName)) {
          const d = extractDomain(data[0].domain);
          if (d) {
            return { domain: d, officialName: data[0].name || trimmed };
          }
        }
      }
    }
  } catch {}

  // 4. Web Search fallback with STRICT Relevance Verification
  try {
    const results = await searchBing(`"${cleanName}" official site OR company`);
    for (const r of results.slice(0, 3)) {
      const d = extractDomain(r.link);
      if (!d) continue;

      const titleLower = r.title.toLowerCase();
      const snippetLower = r.snippet.toLowerCase();
      const targetLower = cleanName.toLowerCase();

      // Search result MUST explicitly mention the company name
      const mentionsCompany = titleLower.includes(targetLower) || snippetLower.includes(targetLower);
      if (mentionsCompany) {
        try {
          const page = await fetchPublicPage(`https://${d}`, 4000);
          if (!page.ok) continue;
          const $ = cheerio.load(await page.text());
          const identity = `${$('title').text()} ${$('meta[property="og:site_name"]').attr('content') ?? ''}`.toLowerCase();
          if (identity.includes(targetLower)) return { domain: d, officialName: trimmed };
        } catch {}
      }
    }
  } catch {}

  // No verified domain found - DO NOT GUESS OR HALLUCINATE!
  return { domain: undefined, officialName: trimmed };
}

// ── Direct Company Website Crawler ───────────────────────────

export async function crawlCompanyWebsite(
  domain: string,
  companyName: string
): Promise<{
  website: string;
  careersUrl?: string;
  linkedinCompanyUrl?: string;
  generalEmails: string[];
  contacts: ContactResult[];
  sources: CrawledSource[];
}> {
  const website = `https://${domain}`;
  const contacts: ContactResult[] = [];
  const sources: CrawledSource[] = [];
  const generalEmails = new Set<string>();
  let careersUrl: string | undefined;
  let linkedinCompanyUrl: string | undefined;
  const queue = [website];
  const visited = new Set<string>();
  const sameCompanyEmail = (email: string) => {
    const host = email.split('@')[1]?.toLowerCase();
    return host === domain || host?.endsWith(`.${domain}`);
  };
  const relevant = /career|job|vacanc|recruit|hiring|team|people|contact|about|ваканс|карьер|команд|работа|контакт/i;
  if (!isSafePublicUrl(website)) return { website, generalEmails: [], contacts, sources };

  async function inspect(pageUrl: string): Promise<void> {
    try {
      const res = await fetchPublicPage(pageUrl, 5000);
      if (!res.ok) return;
      const $ = cheerio.load(await res.text());
      $('script, style, noscript').remove();
      sources.push({ title: $('title').text().trim() || `${companyName} — company website`, link: pageUrl, snippet: $('body').text().replace(/\s+/g, ' ').trim().slice(0, 250), source: 'Company website' });
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href') ?? '';
        try {
          const link = new URL(href, pageUrl);
          link.hash = '';
          if (!isSafePublicUrl(link.href)) return;
          const host = link.hostname.toLowerCase().replace(/^www\./, '');
          if (host === 'linkedin.com' && link.pathname.startsWith('/company/')) linkedinCompanyUrl ??= link.href;
          if (relevant.test(`${link.pathname} ${$(element).text()}`) && isValidCareersUrl(link.href, domain, companyName)) {
            if (/career|job|vacanc|ваканс|карьер|работа/i.test(`${link.pathname} ${$(element).text()}`)) careersUrl ??= link.href;
            if ((host === domain || host.endsWith(`.${domain}`)) && queue.length < 30 && !visited.has(link.href) && !queue.includes(link.href)) queue.push(link.href);
          }
          if (host !== 'linkedin.com' || !link.pathname.startsWith('/in/')) return;
          // Use the nearest individual card, never names guessed from a URL slug.
          let card = $(element).closest('article, li, [class*="member"], [class*="person"], [class*="employee"]');
          if (!card.length) card = $(element).closest('div');
          if (!card.find('h2,h3,h4,[class*="name"]').length) card = card.parent();
          if (card.find('a[href*="linkedin.com/in/"]').length > 1) return;
          const name = card.find('[class*="name"], h2, h3, h4').first().text().trim();
          const role = card.find('[class*="role"], [class*="position"], [class*="title"], p').first().text().trim();
          if (!name || name.length > 80 || !role || role.length > 180) return;
          const email = card.find('a[href^="mailto:"]').first().attr('href')?.slice(7).split('?')[0].toLowerCase();
          contacts.push({ name, role, department: isHiringRole(role) ? 'Human Resources' : undefined, email: email && sameCompanyEmail(email) ? email : undefined, emailVerified: false, linkedinUrl: link.href, sourceUrl: pageUrl, seniority: normalizeSeniority(role) });
        } catch {}
      });
      const text = `${$('body').text()} ${$('a[href^="mailto:"]').map((_, element) => $(element).attr('href')).get().join(' ')}`;
      for (const match of text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)) {
        const email = match[0].toLowerCase();
        if (sameCompanyEmail(email)) generalEmails.add(email);
      }
    } catch { /* Partial results remain useful when a page is unavailable. */ }
  }

  visited.add(website);
  await inspect(website);
  // Discovered links first; common paths only fill gaps. Three bounded batches.
  queue.push(...['/careers', '/jobs', '/team', '/contact', '/about'].map(path => website + path));
  let budget = 9;
  while (queue.length && budget > 0) {
    const batch: string[] = [];
    while (queue.length && batch.length < Math.min(3, budget)) {
      const url = queue.shift()!;
      if (!visited.has(url)) { visited.add(url); batch.push(url); }
    }
    if (!batch.length) break;
    budget -= batch.length;
    await Promise.allSettled(batch.map(inspect));
  }
  return { website, careersUrl, linkedinCompanyUrl, generalEmails: [...generalEmails], contacts, sources };
}

function isHiringRole(role: string): boolean {
  return /\bhr\b|human resources|recruit|talent|people|hiring|кадр|рекрут|персонал|подбор/i.test(role);
}

// ── LinkedIn OSINT Scraper (Decodes Bing Tracking Links) ──────

export async function findContactsDDG(
  companyName: string,
  domain?: string
): Promise<ContactResult[]> {
  try {
    const query = domain
      ? `("${companyName}" OR "${domain}") (recruiter OR "talent acquisition" OR HR) site:linkedin.com/in`
      : `"${companyName}" (recruiter OR HR OR рекрутер) site:linkedin.com/in`;

    const results = await searchBing(query, 12);
    const contacts: ContactResult[] = [];

    for (const r of results) {
      try {
        const url = new URL(r.link);
        if (url.protocol !== 'https:' || !['linkedin.com', 'www.linkedin.com'].includes(url.hostname) || !url.pathname.startsWith('/in/')) continue;
      } catch { continue; }
      const evidence = `${r.title} ${r.snippet}`.toLowerCase();
      const company = cleanCompanyName(companyName).toLowerCase();
      if (!company || !evidence.includes(company) || !isHiringRole(evidence)) continue;
      if (/\bformer\b|\bpreviously\b|\bex-|бывш/i.test(evidence)) continue;

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
          sourceUrl: r.link,
          department: 'Human Resources',
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
      verification?: { status?: string };
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
        emailVerified: e.verification?.status === "valid",
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
    if (!map.has(makeKey(c))) map.set(makeKey(c), c);
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
  const { domain, officialName, careersUrl: resolvedCareersUrl } = await resolveCompanyDomain(trimmedName, providedDomain);
  const canonicalName = officialName || trimmedName;
  const cleanName = cleanCompanyName(canonicalName);

  // 2. Search web for company presence & save crawled sources
  const searchQuery = `"${canonicalName}"`;
  const searchResults = await searchBing(searchQuery, 10);

  // Filter crawled sources to only retain sources that explicitly mention the company name or verified domain
  const cleanLower = cleanName.toLowerCase();
  const crawledSources: CrawledSource[] = searchResults.filter((r) => {
    const titleLower = r.title.toLowerCase();
    const snippetLower = r.snippet.toLowerCase();
    const linkLower = r.link.toLowerCase();
    const mentionsName = cleanLower.length > 2 && (titleLower.includes(cleanLower) || snippetLower.includes(cleanLower));
    const mentionsDomain = domain ? linkLower.includes(domain.toLowerCase()) : false;
    return mentionsName || mentionsDomain;
  });

  let website: string | undefined = domain ? `https://${domain}` : undefined;
  let careersUrl: string | undefined = isValidCareersUrl(resolvedCareersUrl, domain, cleanName)
    ? resolvedCareersUrl
    : undefined;
  let linkedinCompanyUrl: string | undefined;

  for (const r of searchResults) {
    if (r.link.includes('linkedin.com/company/')) {
      const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const linkSlug = r.link.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSlug.length >= 3 && linkSlug.includes(cleanSlug)) {
        if (!linkedinCompanyUrl) linkedinCompanyUrl = r.link;
      }
    }
    if (
      r.link.includes('recruitee.com') ||
      r.link.includes('greenhouse.io') ||
      r.link.includes('lever.co') ||
      r.link.includes('workable.com') ||
      r.link.includes('/careers') ||
      r.link.includes('/jobs')
    ) {
      if (!careersUrl && isValidCareersUrl(r.link, domain, cleanName)) {
        careersUrl = r.link;
      }
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
    if (siteData.careersUrl && isValidCareersUrl(siteData.careersUrl, domain, cleanName)) {
      careersUrl = siteData.careersUrl;
    }
    if (siteData.linkedinCompanyUrl && !linkedinCompanyUrl) linkedinCompanyUrl = siteData.linkedinCompanyUrl;
    generalEmails.push(...siteData.generalEmails);
    crawledSources.push(...siteData.sources);
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
      emailVerified: false,
      sourceUrl: siteData?.sources.find(source => source.snippet.includes(em))?.link ?? website,
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
    contactSources: mergedContacts.flatMap(contact => contact.sourceUrl ? [{ name: contact.name, email: contact.email, linkedinUrl: contact.linkedinUrl, sourceUrl: contact.sourceUrl }] : []),
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
  return Number(isHiringRole(b.role)) - Number(isHiringRole(a.role)) || aScore - bScore;
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
