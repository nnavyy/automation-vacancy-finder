// ============================================================
// Nanda AI Job Assistant — HH Vacancy Client (RSS-based)
// ============================================================
// Fetches vacancies from hh.ru via the public RSS feed endpoint
// (no API token or dev account required).
//
// RSS endpoint: https://hh.ru/search/vacancy/rss?text=...
//
// Handles pagination, rate limiting, normalization,
// and deduplication by hhId.
// ============================================================

import axios from "axios";
import { createHash } from "crypto";
import type {
  NormalizedVacancy,
  SearchPreferenceData,
  HHSalary,
} from "@/types";
import { buildSearchQueries } from "@/lib/queryBuilder";

// ── Constants ─────────────────────────────────────────────────

const HH_RSS_BASE = "https://hh.ru/search/vacancy/rss";

/** Browser-like User-Agent to avoid DDoS-Guard blocks */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/** Polite delay between different query strings */
const QUERY_DELAY_MS = 800;

/** Max RSS pages to fetch per query (RSS returns ~20 items per page) */
const MAX_PAGES_PER_QUERY = 3;

// ── Utility Helpers ───────────────────────────────────────────

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips HTML tags from a string and normalises whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Computes an MD5 hash for content deduplication / change detection.
 */
function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

// ── RSS XML Parser ────────────────────────────────────────────

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

/**
 * Parses RSS XML string into an array of RSSItem objects.
 * Uses simple regex parsing (no XML library dependency needed).
 */
function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = (itemXml.match(/<title>(.*?)<\/title>/) || [])[1] || "";
    const link = (itemXml.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const pubDate = (itemXml.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";

    // Description is in CDATA
    const descMatch = itemXml.match(
      /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/
    );
    const description = descMatch ? descMatch[1] : "";

    if (title && link) {
      items.push({ title, link, pubDate, description });
    }
  }

  return items;
}

/**
 * Extracts structured data from the RSS description HTML.
 *
 * The description typically contains:
 *   <p>Вакансия компании: CompanyName</p>
 *   <p>Создана: 14.05.2026</p>
 *   <p>Регион: Москва</p>
 *   <p>Предполагаемый уровень месячного дохода: от X до Y $</p>
 */
function parseRSSDescription(desc: string): {
  company?: string;
  area?: string;
  salary?: HHSalary;
} {
  const result: { company?: string; area?: string; salary?: HHSalary } = {};

  // Extract company
  const companyMatch = desc.match(/Вакансия компании:\s*(.*?)(?:<\/p>|$)/i);
  if (companyMatch) {
    result.company = stripHtml(companyMatch[1]).trim();
  }

  // Extract area/region
  const regionMatch = desc.match(/Регион:\s*(.*?)(?:<\/p>|$)/i);
  if (regionMatch) {
    result.area = stripHtml(regionMatch[1]).trim();
  }

  // Extract salary
  const salaryMatch = desc.match(
    /(?:месячного дохода|дохода):\s*(.*?)(?:<\/p>|$)/i
  );
  if (salaryMatch) {
    const salaryStr = stripHtml(salaryMatch[1]).trim();
    result.salary = parseSalaryString(salaryStr);
  }

  return result;
}

/**
 * Parses a salary string like "от 50 000 до 80 000 руб." into HHSalary.
 */
function parseSalaryString(str: string): HHSalary | undefined {
  if (!str || str === "не указан") return undefined;

  const salary: HHSalary = {};

  // Detect currency
  if (str.includes("$") || str.toLowerCase().includes("usd")) {
    salary.currency = "USD";
  } else if (str.includes("€") || str.toLowerCase().includes("eur")) {
    salary.currency = "EUR";
  } else {
    salary.currency = "RUR";
  }

  // Remove spaces in numbers (e.g., "50 000" → "50000")
  const cleaned = str.replace(/\s/g, "");

  // Extract "от X" (from)
  const fromMatch = cleaned.match(/от(\d+)/i);
  if (fromMatch) {
    salary.from = parseInt(fromMatch[1], 10);
  }

  // Extract "до X" (to)
  const toMatch = cleaned.match(/до(\d+)/i);
  if (toMatch) {
    salary.to = parseInt(toMatch[1], 10);
  }

  // If neither from nor to, try to find any number
  if (!salary.from && !salary.to) {
    const numMatch = cleaned.match(/(\d+)/);
    if (numMatch) {
      salary.from = parseInt(numMatch[1], 10);
    }
  }

  if (!salary.from && !salary.to) return undefined;

  return salary;
}

/**
 * Extracts the HH vacancy ID from a URL like "https://hh.ru/vacancy/132430381"
 */
function extractVacancyId(url: string): string {
  const match = url.match(/vacancy\/(\d+)/);
  return match ? match[1] : url;
}

// ── RSS Fetching ──────────────────────────────────────────────

/**
 * Fetches one page of vacancy results from the HH RSS feed.
 *
 * @param query - Search query string
 * @param pref  - Active search preferences
 * @param page  - Page number (0-indexed)
 * @returns Array of parsed RSS items
 */
async function fetchRSSPage(
  query: string,
  pref: SearchPreferenceData,
  page: number
): Promise<RSSItem[]> {
  const params: Record<string, string | number> = {
    text: query,
    page,
  };

  // Add area filter
  params.area = 1; // Moscow (remote jobs appear regardless)

  // Add schedule filter
  if (pref.workFormat && pref.workFormat.includes("remote")) {
    params.schedule = "remote";
  }

  // Add experience filter (RSS supports single value)
  if (pref.experience && pref.experience.length > 0) {
    // Use the most permissive experience level
    params.experience = pref.experience[0];
  }

  try {
    const response = await axios.get(HH_RSS_BASE, {
      params,
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
      validateStatus: () => true,
    });

    if (response.status !== 200) {
      console.warn(
        `[HH RSS] Non-200 status ${response.status} for query "${query}" page ${page}`
      );
      return [];
    }

    return parseRSSItems(String(response.data));
  } catch (error) {
    console.error(
      `[HH RSS] Error fetching query "${query}" page ${page}:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// ── Normalize ─────────────────────────────────────────────────

/**
 * Fetches the vacancy page HTML and extracts the JSON-LD description.
 * This provides the full job requirements which the RSS feed lacks.
 */
export async function fetchVacancyJsonLd(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html",
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (response.status === 200) {
      const html = String(response.data);
      const jsonLdMatch = html.match(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
      );

      if (jsonLdMatch) {
        try {
          const data = JSON.parse(jsonLdMatch[1]);
          if (data.description) {
            return stripHtml(data.description);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  } catch (error) {
    // Ignore network errors
  }
  return null;
}

/**
 * Converts an RSS item into the NormalizedVacancy format used by the pipeline.
 */
function normalizeRSSItem(
  item: RSSItem,
  sourceKeyword: string
): NormalizedVacancy {
  const hhId = extractVacancyId(item.link);
  const parsed = parseRSSDescription(item.description);
  const descriptionText = stripHtml(item.description);

  return {
    hhId,
    title: stripHtml(item.title),
    company: parsed.company,
    area: parsed.area,
    salary: parsed.salary,
    url: item.link,
    applyUrl: item.link,
    apiUrl: `https://api.hh.ru/vacancies/${hhId}`,
    description: descriptionText,
    descriptionHash: md5(descriptionText),
    sourceKeyword,
    snippet: {
      requirement: descriptionText,
    },
  };
}

// ── Main Collection Function ──────────────────────────────────

/**
 * Collects all vacancies from HH.ru using the RSS feed.
 *
 * For each search keyword (EN + RU):
 *   1. Fetch up to MAX_PAGES_PER_QUERY pages from RSS
 *   2. Parse and normalize each vacancy
 *   3. Deduplicate across all keywords by hhId
 *
 * @param pref - Active search preferences
 * @returns Deduplicated array of NormalizedVacancy objects
 */
export async function collectAllVacancies(
  pref: SearchPreferenceData
): Promise<NormalizedVacancy[]> {
  const queries = buildSearchQueries(pref);
  const seenIds = new Set<string>();
  const allVacancies: NormalizedVacancy[] = [];

  console.log(
    `[HH RSS] Starting collection with ${queries.length} keywords...`
  );

  for (const query of queries) {
    console.log(`[HH RSS] Query: "${query}"`);

    for (let page = 0; page < MAX_PAGES_PER_QUERY; page++) {
      const items = await fetchRSSPage(query, pref, page);

      if (items.length === 0) {
        // No more results for this query
        break;
      }

      for (const item of items) {
        const hhId = extractVacancyId(item.link);

        // Skip duplicates across queries
        if (seenIds.has(hhId)) continue;
        seenIds.add(hhId);

        const normalized = normalizeRSSItem(item, query);
        allVacancies.push(normalized);
      }

      console.log(
        `[HH RSS]   Page ${page}: ${items.length} items (${allVacancies.length} unique total)`
      );

      // Polite delay between pages
      if (page < MAX_PAGES_PER_QUERY - 1 && items.length > 0) {
        await sleep(400);
      }
    }

    // Polite delay between queries
    await sleep(QUERY_DELAY_MS);
  }

  console.log(
    `[HH RSS] Collection complete — ${allVacancies.length} unique vacancies found.`
  );

  return allVacancies;
}
