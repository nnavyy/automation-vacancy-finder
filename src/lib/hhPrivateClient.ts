import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Modern Chrome Browser User-Agent for accessing hh.ru web pages without getting blocked by DDoS-Guard / WAF.
 */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * Standard API User-Agent for api.hh.ru REST endpoints.
 */
const API_USER_AGENT =
  process.env.HH_USER_AGENT || "VacancyAssistant/2.0 (automation-client@vacancy-finder.io)";

/**
 * Cleans and formats the HH cookie string.
 * Supports:
 *   1. Just the raw token value: "kC1Prc_YclrJLbU2xWEC!VF1uP!l" -> "hhtoken=kC1Prc_..."
 *   2. Single cookie key-value: "hhtoken=kC1Prc_..."
 *   3. Full cookie string from Network tab: "hhtoken=...; hhuid=...; __ddg1_=...; _xsrf=..."
 * Preserves DDoS-Guard cookies (__ddg*) to avoid 403 Forbidden WAF blocks.
 */
export function formatHHCookies(cookieString: string): string {
  if (!cookieString) return "";
  let clean = cookieString.replace(/^['"]|['"]$/g, "").trim();
  // Strip "Cookie: " prefix if copied directly from Request Headers
  clean = clean.replace(/^cookie:\s*/i, "").trim();

  // If user pasted only the raw token value (no key=value format)
  if (!clean.includes("=") && !clean.includes(";")) {
    return `hhtoken=${clean}`;
  }

  // If it's a full cookie string or key=value, preserve it all
  return clean;
}

/**
 * Browser request headers for hh.ru HTML endpoints.
 */
function getWebHeaders(cookieString: string) {
  return {
    "User-Agent": BROWSER_USER_AGENT,
    "Cookie": formatHHCookies(cookieString),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
}

export interface HHResume {
  id: string;
  title: string;
  updated_at: string;
  url: string;
  status: {
    id: string;
    name: string;
  };
}

/**
 * Extracts JSON data from Frontik/React SSR templates in HH.ru HTML.
 */
function extractHHInitialState(html: string): Record<string, any> | null {
  try {
    const luxMatch = html.match(/<template[^>]*HH-Lux-InitialState[^>]*>([\s\S]*?)<\/template>/i);
    if (luxMatch) {
      return JSON.parse(luxMatch[1]);
    }

    const stateMatch = html.match(/window\.__initialState__\s*=\s*({[\s\S]*?});/);
    if (stateMatch) {
      return JSON.parse(stateMatch[1]);
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return null;
}

/**
 * Fetches the list of active resumes for the authenticated user by scraping the web UI.
 * Supports both raw token values and full cookie strings.
 */
export async function fetchMyResumes(cookieString: string): Promise<HHResume[]> {
  try {
    const formattedCookies = formatHHCookies(cookieString);
    if (!formattedCookies) {
      throw new Error("HH.ru Token/Cookie is empty. Please provide your hhtoken or cookie string.");
    }

    const res = await axios.get("https://hh.ru/applicant/resumes", {
      headers: getWebHeaders(formattedCookies),
      timeout: 15000,
      validateStatus: () => true,
    });

    if (res.status === 403) {
      throw new Error("Access denied by HH.ru (403). Please copy the full Cookie string from your browser's Network tab (including __ddg cookies) and try again.");
    }

    const text = String(res.data);
    const resumes: HHResume[] = [];
    const seenIds = new Set<string>();

    // 1. Check for structured SSR data in HH-Lux-InitialState
    const state = extractHHInitialState(text);
    if (state && Array.isArray(state.resumes)) {
      for (const r of state.resumes) {
        if (r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          resumes.push({
            id: r.id,
            title: r.title || "Resume",
            updated_at: r.updatedAt || new Date().toISOString(),
            url: `https://hh.ru/resume/${r.id}`,
            status: { id: r.status?.id || "published", name: r.status?.name || "Active" },
          });
        }
      }
    }

    // 2. Parse HTML using Cheerio
    const $ = cheerio.load(text);

    // Look for resume title elements
    $('[data-qa="resume-title"]').each((_, el) => {
      const item = $(el);
      const link = item.attr("href") || item.closest("a").attr("href") || item.find("a").attr("href") || "";
      const title = item.text().trim();

      const match = link.match(/\/resume\/([a-f0-9]+)/i) || link.match(/resume=([a-f0-9]+)/i);
      if (match && !seenIds.has(match[1])) {
        seenIds.add(match[1]);
        resumes.push({
          id: match[1],
          title: title || "Resume",
          updated_at: new Date().toISOString(),
          url: `https://hh.ru/resume/${match[1]}`,
          status: { id: "published", name: "Active" },
        });
      }
    });

    // Also look for all links matching /resume/<hex>
    $('a[href*="/resume/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/\/resume\/([a-f0-9]+)/i);
      if (match && !seenIds.has(match[1])) {
        const title = $(el).text().trim();
        if (title && title.length < 100) {
          seenIds.add(match[1]);
          resumes.push({
            id: match[1],
            title,
            updated_at: new Date().toISOString(),
            url: `https://hh.ru/resume/${match[1]}`,
            status: { id: "published", name: "Active" },
          });
        }
      }
    });

    if (resumes.length === 0) {
      if (text.includes('data-qa="login-input-username"') || text.includes("/account/login")) {
        throw new Error("HH.ru session expired or invalid. Please copy your hhtoken or Cookie string from your browser again.");
      }
    }

    return resumes;
  } catch (error: any) {
    console.error("[HH Private] Failed to fetch resumes via web:", error.message);
    throw new Error(error.message || "Failed to fetch resumes from HH.ru. Ensure your token or cookie string is correct.");
  }
}

/**
 * Fetches the user's HH.ru profile and analytics (applications count) by scraping the web UI.
 */
export async function fetchHHProfile(
  cookieString: string
): Promise<{ name: string | null; avatar: string | null; totalApplications: number }> {
  try {
    const formattedCookies = formatHHCookies(cookieString);
    if (!formattedCookies) {
      return { name: null, avatar: null, totalApplications: 0 };
    }

    const headers = getWebHeaders(formattedCookies);

    // Fetch resumes page for profile info
    const resResumes = await axios.get("https://hh.ru/applicant/resumes", {
      headers,
      timeout: 15000,
      validateStatus: () => true,
    });

    const htmlResumes = String(resResumes.data);
    const $1 = cheerio.load(htmlResumes);

    let name = $1('[data-qa="profile-activator-fullname"]').text().trim() || null;
    let avatar = $1('[data-qa="profile-avatar-image"]').attr("src") || null;

    // Check SSR state fallback for profile
    const stateResumes = extractHHInitialState(htmlResumes);
    if (stateResumes?.applicantInfo) {
      if (!name && stateResumes.applicantInfo.fullName) {
        name = stateResumes.applicantInfo.fullName;
      }
      if (!avatar && stateResumes.applicantInfo.smallAvatarUrl) {
        avatar = stateResumes.applicantInfo.smallAvatarUrl;
      }
    }

    // Fetch negotiations page for applications count
    const resNeg = await axios.get("https://hh.ru/applicant/negotiations", {
      headers,
      timeout: 15000,
      validateStatus: () => true,
    });

    const htmlNeg = String(resNeg.data);
    const $2 = cheerio.load(htmlNeg);

    let totalApplications = 0;

    // Check SSR state for negotiations total
    const stateNeg = extractHHInitialState(htmlNeg);
    if (typeof stateNeg?.applicantNegotiations?.total === "number") {
      totalApplications = stateNeg.applicantNegotiations.total;
    } else {
      // DOM extraction
      const allBadgeText =
        $2('[data-qa="negotiations-nav-item_all"] [data-qa="negotiations-nav-item-count"]').text().trim() ||
        $2('.bloko-tabs-item_current').text().trim();
      const countMatch = allBadgeText.match(/\d+/);
      if (countMatch) {
        totalApplications = parseInt(countMatch[0], 10);
      } else {
        totalApplications = $2('[data-qa="negotiations-item"]').length;
      }
    }

    return { name, avatar, totalApplications };
  } catch (error: any) {
    console.error("[HH Private] Failed to fetch HH profile:", error.message);
    return { name: null, avatar: null, totalApplications: 0 };
  }
}

function parseHHDate(dateStr: string): Date {
  const now = new Date();
  if (!dateStr) return now;
  const lower = dateStr.toLowerCase();

  if (lower.includes("сегодня") || lower.includes("today")) {
    return now;
  }
  if (lower.includes("вчера") || lower.includes("yesterday")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  const ruMonths: Record<string, number> = {
    янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4, июн: 5,
    июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  const match = lower.match(/(\d+)\s+([а-яa-z]+)(?:\s+(\d{4}))?/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const yearStr = match[3];

    let month = now.getMonth();
    for (const [key, val] of Object.entries(ruMonths)) {
      if (monthStr.startsWith(key)) {
        month = val;
        break;
      }
    }

    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    return new Date(year, month, day);
  }

  return now;
}

export interface HHSyncHistoryResult {
  success: boolean;
  history: any[];
  sessionExpired?: boolean;
  error?: string;
}

/**
 * Scrapes all history of applications from HH.ru.
 */
export async function syncHHHistory(cookieString: string): Promise<HHSyncHistoryResult> {
  const history: any[] = [];
  try {
    const formattedCookies = formatHHCookies(cookieString);
    if (!formattedCookies) {
      return { success: false, history: [], error: "No HeadHunter session cookie provided." };
    }

    const headers = getWebHeaders(formattedCookies);
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 15) {
      const res = await axios.get(`https://hh.ru/applicant/negotiations?page=${page}`, {
        headers,
        timeout: 15000,
        validateStatus: () => true,
      });

      if (res.status === 403 || res.status === 401) {
        if (page === 0) {
          return {
            success: false,
            history: [],
            sessionExpired: true,
            error: "HeadHunter session is expired or invalid (403 Forbidden). Please reconnect your session.",
          };
        }
        break;
      }

      const html = String(res.data);

      // Check if redirected to login page
      if (html.includes('data-qa="login-input-username"') || html.includes("/account/login")) {
        if (page === 0) {
          return {
            success: false,
            history: [],
            sessionExpired: true,
            error: "HeadHunter session has expired (redirected to login). Please reconnect your session.",
          };
        }
        break;
      }

      if (res.status !== 200) {
        if (page === 0) {
          return {
            success: false,
            history: [],
            error: `HH.ru returned HTTP status ${res.status} when fetching negotiations.`,
          };
        }
        break;
      }

      const state = extractHHInitialState(html);
      let pageFoundCount = 0;

      // Method A: Extract structured topics from HH-Lux-InitialState
      if (state?.applicantNegotiations?.topicList && Array.isArray(state.applicantNegotiations.topicList)) {
        for (const topic of state.applicantNegotiations.topicList) {
          const vacancyId = topic.vacancyId;
          const url = vacancyId ? `https://hh.ru/vacancy/${vacancyId}` : "";
          const appliedAt = topic.creationTime ? new Date(topic.creationTime) : new Date();
          const status = topic.lastState || "applied";

          history.push({
            title: `Vacancy #${vacancyId || topic.id}`,
            company: String(topic.employerId || "Employer"),
            status,
            url,
            appliedAt,
          });
          pageFoundCount++;
        }
      }

      // Method B: Cheerio DOM fallback if topicList is empty
      if (pageFoundCount === 0) {
        const $ = cheerio.load(html);
        const items = $('[data-qa="negotiations-item"]');

        items.each((_, el) => {
          const item = $(el);
          const title = item.find('[data-qa="negotiations-item-vacancy"]').text().trim();
          const company = item.find('[data-qa="negotiations-item-company"]').text().trim();
          const status =
            item.find('[data-qa*="negotiations-item-"]').text().trim() ||
            item.find('[data-qa*="negotiations-tag"]').text().trim() ||
            "applied";
          const dateText =
            item.find('[data-qa="negotiations-item-date"]').text().trim() ||
            item.find('.bloko-text_tertiary').text().trim();
          const appliedAt = parseHHDate(dateText);

          let url = item.find('[data-qa="negotiations-item-vacancy"]').closest("a").attr("href") || "";
          if (url && !url.startsWith("http")) url = `https://hh.ru${url}`;

          if (title) {
            history.push({ title, company, status, url, appliedAt });
            pageFoundCount++;
          }
        });
      }

      if (pageFoundCount === 0) {
        hasMore = false;
        break;
      }

      // Check pagination
      const $ = cheerio.load(html);
      const nextBtn = $('[data-qa="pager-next"]');
      if (nextBtn.length === 0) {
        hasMore = false;
      } else {
        page++;
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    return { success: true, history };
  } catch (error: any) {
    console.error("[HH Private] Failed to sync history:", error.message);
    return { success: false, history: [], error: error.message || "Failed to sync history from HH.ru" };
  }
}

/**
 * Applies to a vacancy on HH.ru.
 */
export async function applyToVacancy(
  tokenOrCookie: string,
  resumeId: string,
  vacancyId: string,
  message: string
): Promise<boolean> {
  const clean = formatHHCookies(tokenOrCookie);

  // If token is an official OAuth Bearer token
  if (!clean.includes(";") && clean.length > 40 && !clean.includes("hhtoken=")) {
    try {
      const params = new URLSearchParams();
      params.append("vacancy_id", vacancyId);
      params.append("resume_id", resumeId);
      params.append("message", message);

      const res = await axios.post("https://api.hh.ru/negotiations", params, {
        headers: {
          "User-Agent": API_USER_AGENT,
          Authorization: `Bearer ${clean}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000,
      });

      return res.status === 201 || res.status === 200;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.description?.includes("already")) {
        throw new Error("You have already applied to this vacancy.");
      }
      throw new Error(error.response?.data?.description || "Failed to apply via HH.ru REST API.");
    }
  }

  // Attempt apply via web form
  try {
    const params = new URLSearchParams();
    params.append("vacancy_id", vacancyId);
    params.append("resume_id", resumeId);
    params.append("letter", message);

    const res = await axios.post("https://hh.ru/applicant/vacancy_response", params, {
      headers: {
        ...getWebHeaders(clean),
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://hh.ru",
        Referer: `https://hh.ru/vacancy/${vacancyId}`,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    if (res.status === 200 || res.status === 302 || res.status === 201) {
      return true;
    }

    if (res.status === 400 || res.status === 403) {
      throw new Error("HH.ru requires an employer questionnaire or direct browser response. Please use the vacancy link to submit.");
    }

    throw new Error(`HH.ru rejected application submission with HTTP status ${res.status}`);
  } catch (error: any) {
    throw new Error(error.message || "Failed to submit application via HH.ru.");
  }
}

export interface HHSessionCheckResult {
  active: boolean;
  error?: string;
  resumes?: HHResume[];
  profile?: {
    name: string | null;
    avatar: string | null;
    totalApplications: number;
  };
}

/**
 * Checks whether the current HeadHunter session cookies are active and valid using a fast single request.
 */
export async function checkHHSession(cookieString: string): Promise<HHSessionCheckResult> {
  try {
    const formatted = formatHHCookies(cookieString);
    if (!formatted) {
      return { active: false, error: "No cookie/token configured." };
    }

    const res = await axios.get("https://hh.ru/applicant/resumes", {
      headers: getWebHeaders(formatted),
      timeout: 8000,
      validateStatus: () => true,
    });

    if (res.status === 403 || res.status === 401) {
      return { active: false, error: "Access denied by HH.ru (Session expired / 403)." };
    }

    const text = String(res.data);
    if (text.includes('data-qa="login-input-username"') || text.includes("/account/login")) {
      return { active: false, error: "Session expired or logged out." };
    }

    const resumes: HHResume[] = [];
    const seenIds = new Set<string>();

    const state = extractHHInitialState(text);
    let name: string | null = null;
    let avatar: string | null = null;

    if (state?.applicantInfo) {
      name = state.applicantInfo.fullName || null;
      avatar = state.applicantInfo.smallAvatarUrl || null;
    }

    if (state && Array.isArray(state.resumes)) {
      for (const r of state.resumes) {
        if (r.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          resumes.push({
            id: r.id,
            title: r.title || "Resume",
            updated_at: r.updatedAt || new Date().toISOString(),
            url: `https://hh.ru/resume/${r.id}`,
            status: { id: r.status?.id || "published", name: r.status?.name || "Active" },
          });
        }
      }
    }

    const $ = cheerio.load(text);
    if (!name) name = $('[data-qa="profile-activator-fullname"]').text().trim() || null;
    if (!avatar) avatar = $('[data-qa="profile-avatar-image"]').attr("src") || null;

    if (resumes.length === 0) {
      $('a[href*="/resume/"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        const match = href.match(/\/resume\/([a-f0-9]+)/i);
        if (match && !seenIds.has(match[1])) {
          const title = $(el).text().trim();
          if (title && title.length < 100) {
            seenIds.add(match[1]);
            resumes.push({
              id: match[1],
              title,
              updated_at: new Date().toISOString(),
              url: `https://hh.ru/resume/${match[1]}`,
              status: { id: "published", name: "Active" },
            });
          }
        }
      });
    }

    return {
      active: true,
      resumes,
      profile: {
        name,
        avatar,
        totalApplications: 0,
      },
    };
  } catch (error: any) {
    return {
      active: false,
      error: error.message || "Failed to connect to HH.ru.",
    };
  }
}


