// ============================================================
// Nanda AI Job Assistant — HH API Query Builder
// ============================================================
// Translates SearchPreferenceData into HH API-compatible
// query strings and URL parameter objects.
// ============================================================

import type { SearchPreferenceData } from "@/types";

/**
 * Builds an array of HH API search query strings from SearchPreferenceData.
 *
 * Combines English and Russian keywords, deduplicates, trims whitespace,
 * and caps at 20 total queries to avoid excessive API calls.
 *
 * @param pref - The active search preferences from DB
 * @returns Deduplicated array of query strings (max 20)
 */
export function buildSearchQueries(pref: SearchPreferenceData): string[] {
  // Merge EN and RU keywords into a single list
  const allKeywords: string[] = [
    ...pref.searchKeywordsEn,
    ...pref.searchKeywordsRu,
  ];

  // Trim, filter empties, then deduplicate using Array.from + Set
  // (Array.from avoids the --downlevelIteration requirement for Set spread)
  const unique = Array.from(
    new Set(allKeywords.map((k) => k.trim()).filter((k) => k.length > 0)),
  );

  // Cap at 20 to stay within reasonable API call limits
  return unique.slice(0, 20);
}

// ── HH Params Type ────────────────────────────────────────────

/**
 * Params object for a single HH API request.
 * Values can be strings or string arrays (for repeated query params
 * like experience=noExperience&experience=between1And3).
 */
export type HHParams = Record<string, string | string[]>;

/**
 * Builds a params object for a single HH vacancies API request.
 *
 * HH API docs: https://api.hh.ru/openapi/en/redoc#tag/Vacancy-search
 *
 * Param notes:
 *   - text:       the search query string
 *   - per_page:   always 50 (max per page)
 *   - page:       0-indexed page number
 *   - experience: HH experience IDs as repeated params (NOT comma-separated)
 *   - schedule:   "remote" when remote is in pref.workFormat
 *   - area:       "1" (Moscow) — used as relevance hint; remote jobs appear regardless
 *
 * @param query - The search query string for this request
 * @param pref  - Active search preferences
 * @param page  - Page number (0-indexed)
 * @returns Params object ready for axios (with paramsSerializer for arrays)
 */
export function buildHHParams(
  query: string,
  pref: SearchPreferenceData,
  page: number,
): HHParams {
  const params: HHParams = {
    text: query,
    per_page: "50",
    page: String(page),
    // Sort by publication date so newest vacancies appear first
    order_by: "publication_time",
  };

  // Add experience filter — HH API requires REPEATED params, not comma-separated.
  // e.g. experience=noExperience&experience=between1And3
  if (pref.experience && pref.experience.length > 0) {
    params.experience = pref.experience;
  }

  // Filter by remote schedule when "remote" is in workFormat preferences
  if (pref.workFormat && pref.workFormat.includes("remote")) {
    params.schedule = "remote";
  }

  // Area 1 = Moscow; set as a base region for HH relevance ranking.
  // Remote vacancies appear regardless of area, so this does not exclude them.
  params.area = "1";

  // Pass salary and currency filters directly to HH API
  if (pref.salaryMinimum) {
    params.salary = String(pref.salaryMinimum);
    if (pref.salaryCurrency) {
      params.currency = pref.salaryCurrency;
    }
  }

  return params;
}

/**
 * Serializes an HHParams object into a URL query string.
 * Handles arrays by repeating the key (HH API format).
 *
 * Example: { experience: ["noExperience", "between1And3"], text: "react" }
 *       → "experience=noExperience&experience=between1And3&text=react"
 *
 * @param params - The params object to serialize
 * @returns URL-encoded query string
 */
export function serializeHHParams(params: HHParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      // Repeat the key for each array element (HH API format)
      for (const v of value) {
        searchParams.append(key, v);
      }
    } else {
      searchParams.append(key, value);
    }
  }

  return searchParams.toString();
}
