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
function getWebHeaders(cookieString: string, referer: string = "https://hh.ru/") {
  return {
    "User-Agent": BROWSER_USER_AGENT,
    "Cookie": formatHHCookies(cookieString),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "max-age=0",
    "Referer": referer,
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

/**
 * Scans HH SSR state and Cheerio DOM for candidate profile photo / avatar.
 */
function extractAvatar(state: any, $: cheerio.CheerioAPI): string | null {
  const normalize = (u: any): string | null => {
    if (!u || typeof u !== "string") return null;
    if (u.includes("default") || u.includes("blank")) return null;
    if (u.startsWith("//")) return `https:${u}`;
    if (u.startsWith("/")) return `https://img.hhcdn.ru${u}`;
    return u;
  };

  // 1. From applicantProfileHeaderMenu (Magritte / SSR profile/me)
  if (state?.applicantProfileHeaderMenu?.avatarUrl) {
    const res = normalize(state.applicantProfileHeaderMenu.avatarUrl);
    if (res) return res;
  }

  // 2. From applicantInfo in SSR state
  if (state?.applicantInfo) {
    if (state.applicantInfo.smallAvatarUrl) return normalize(state.applicantInfo.smallAvatarUrl);
    if (state.applicantInfo.mediumAvatarUrl) return normalize(state.applicantInfo.mediumAvatarUrl);
    if (state.applicantInfo.avatarUrl) return normalize(state.applicantInfo.avatarUrl);
    if (state.applicantInfo.photoUrl) return normalize(state.applicantInfo.photoUrl);
    if (state.applicantInfo.photo?.medium) return normalize(state.applicantInfo.photo.medium);
    if (state.applicantInfo.photo?.small) return normalize(state.applicantInfo.photo.small);
  }

  // 3. From header user in SSR state
  if (state?.header?.user?.photo) {
    if (state.header.user.photo.medium) return normalize(state.header.user.photo.medium);
    if (state.header.user.photo.small) return normalize(state.header.user.photo.small);
  }
  if (state?.user?.photoUrl) return normalize(state.user.photoUrl);
  if (state?.user?.avatar) return normalize(state.user.avatar);

  // 4. From resumes inside SSR state
  if (Array.isArray(state?.resumes)) {
    for (const r of state.resumes) {
      if (r?.photo?.medium) return normalize(r.photo.medium);
      if (r?.photo?.small) return normalize(r.photo.small);
      if (r?.photo?.original) return normalize(r.photo.original);
      if (r?.photo?.["100"]) return normalize(r.photo["100"]);
      if (r?.photo?.["40"]) return normalize(r.photo["40"]);
    }
  }

  // 5. From Cheerio DOM selectors
  const selectors = [
    '[data-qa="profile-avatar-image"]',
    '[data-qa="resume-photo-image"]',
    '[data-qa="mainmenu_applicantProfile-avatar"] img',
    '[data-qa="mainmenu_applicantProfile-avatar-image"]',
    '.resume-header-photo img',
    '[data-qa="resume-photo"] img',
    'img[src*="hhcdn.ru/photo/"]',
    'img[src*="hh.ru/photo/"]',
  ];

  for (const sel of selectors) {
    const src = $(sel).first().attr("src");
    const normalized = normalize(src);
    if (normalized) return normalized;
  }

  return null;
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
 * Decodes HTML entities (e.g. &#34; to ") from Frontik SSR template blocks.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Extracts JSON data from Frontik/React SSR templates in HH.ru HTML.
 */
function extractHHInitialState(html: string): Record<string, any> | null {
  try {
    const luxMatch = html.match(/<template[^>]*HH-Lux-InitialState[^>]*>([\s\S]*?)<\/template>/i);
    if (luxMatch) {
      return JSON.parse(decodeHtmlEntities(luxMatch[1]));
    }

    const stateMatch = html.match(/window\.__initialState__\s*=\s*({[\s\S]*?});/);
    if (stateMatch) {
      return JSON.parse(decodeHtmlEntities(stateMatch[1]));
    }
  } catch {
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
      headers: getWebHeaders(formattedCookies, "https://hh.ru/"),
      timeout: 15000,
      validateStatus: () => true,
    });

    if (res.status === 401 || res.status === 403 || res.status === 406) {
      throw new Error("Access denied by HH.ru (403/406). Please copy your complete Cookie string (including __ddg cookies) and try again.");
    }

    const finalUrl = res.request?.res?.responseUrl || "";
    if (finalUrl.includes("/account/login")) {
      throw new Error("HH.ru session expired or logged out. Please reconnect your session.");
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
      const rawTitle = item.text().trim();
      const title = rawTitle.replace(/(Updated|Обновлено|Active|Активно).*$/i, "").trim() || rawTitle;

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
        const rawTitle = $(el).text().trim();
        const title = rawTitle.replace(/(Updated|Обновлено|Active|Активно).*$/i, "").trim() || rawTitle;
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
      if (text.includes('data-qa="login-input-username"') && !state?.applicantInfo && !state?.applicantProfileHeaderMenu) {
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

    const headers = getWebHeaders(formattedCookies, "https://hh.ru/");

    // Fetch resumes / profile page for profile info
    const resResumes = await axios.get("https://hh.ru/applicant/resumes", {
      headers,
      timeout: 15000,
      validateStatus: () => true,
    });

    const htmlResumes = String(resResumes.data);
    const $1 = cheerio.load(htmlResumes);
    const stateResumes = extractHHInitialState(htmlResumes);

    let rawName =
      stateResumes?.applicantInfo?.fullName ||
      $1('[data-qa="profile-activator-fullname"]').text().trim() ||
      $1("h1").first().text().trim() ||
      null;

    if (rawName === "HeadHunter" || rawName === "HeadHunter — Jobs in Russia") {
      rawName = null;
    }

    let avatar = extractAvatar(stateResumes, $1);

    // Fetch negotiations page for applications count & additional avatar check
    const resNeg = await axios.get("https://hh.ru/applicant/negotiations", {
      headers: getWebHeaders(formattedCookies, "https://hh.ru/applicant/resumes"),
      timeout: 15000,
      validateStatus: () => true,
    });

    const htmlNeg = String(resNeg.data);
    const $2 = cheerio.load(htmlNeg);
    const stateNeg = extractHHInitialState(htmlNeg);

    let totalApplications = 0;

    if (typeof stateNeg?.applicantNegotiations?.total === "number") {
      totalApplications = stateNeg.applicantNegotiations.total;
    } else if (typeof stateNeg?.userStats?.["new-stats-total"] === "number") {
      totalApplications = stateNeg.userStats["new-stats-total"];
    } else if (typeof stateNeg?.vacanciesShort?.total === "number") {
      totalApplications = stateNeg.vacanciesShort.total;
    } else {
      // DOM extraction
      const allBadgeText =
        $2('[data-qa="negotiations-nav-item_all"] [data-qa="negotiations-nav-item-count"]').text().trim() ||
        $2(".bloko-tabs-item_current").text().trim();
      const countMatch = allBadgeText.match(/\d+/);
      if (countMatch) {
        totalApplications = parseInt(countMatch[0], 10);
      } else {
        totalApplications = $2('[data-qa="negotiations-item"]').length;
      }
    }

    if (!avatar) {
      avatar = extractAvatar(stateNeg, $2);
    }

    // Fallback: If avatar still not found, check first resume page directly
    const firstResumeId =
      stateResumes?.resumes?.[0]?.id ||
      $1('a[href*="/resume/"]').first().attr("href")?.match(/\/resume\/([a-f0-9]+)/i)?.[1];

    if (!avatar && firstResumeId) {
      try {
        const resSingle = await axios.get(`https://hh.ru/resume/${firstResumeId}`, {
          headers: getWebHeaders(formattedCookies, "https://hh.ru/applicant/resumes"),
          timeout: 8000,
          validateStatus: () => true,
        });
        if (resSingle.status === 200) {
          const htmlSingle = String(resSingle.data);
          const stateSingle = extractHHInitialState(htmlSingle);
          const $single = cheerio.load(htmlSingle);
          avatar = extractAvatar(stateSingle, $single);
        }
      } catch {}
    }

    return { name: rawName, avatar, totalApplications };
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

    let page = 0;
    let hasMore = true;

    while (hasMore && page < 15) {
      const targetUrl = page === 0
        ? "https://hh.ru/applicant/negotiations"
        : `https://hh.ru/applicant/negotiations?page=${page}`;

      const res = await axios.get(targetUrl, {
        headers: getWebHeaders(formattedCookies, page === 0 ? "https://hh.ru/applicant/resumes" : "https://hh.ru/applicant/negotiations"),
        timeout: 15000,
        validateStatus: () => true,
        maxRedirects: 5,
      });

      if (res.status === 403 || res.status === 401 || res.status === 406) {
        if (page === 0) {
          return {
            success: false,
            history: [],
            sessionExpired: true,
            error: "HeadHunter session is expired or invalid (403/406 Forbidden). Please reconnect your session.",
          };
        }
        break;
      }

      const finalUrl = res.request?.res?.responseUrl || "";
      if (finalUrl.includes("/account/login")) {
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

      const html = String(res.data);
      const state = extractHHInitialState(html);
      let pageFoundCount = 0;

      // Build map of vacancies from vacanciesShort
      const vacanciesMap = new Map<string, any>();
      if (state?.vacanciesShort) {
        const vList = Array.isArray(state.vacanciesShort)
          ? state.vacanciesShort
          : (Array.isArray(state.vacanciesShort.vacanciesList)
              ? state.vacanciesShort.vacanciesList
              : (Array.isArray(state.vacanciesShort.items) ? state.vacanciesShort.items : []));
        for (const v of vList) {
          if (v?.vacancyId) {
            vacanciesMap.set(String(v.vacancyId), v);
          }
        }
      }

      // Method A: Extract structured topics from HH-Lux-InitialState
      if (state?.applicantNegotiations) {
        const possibleLists = [
          state.applicantNegotiations.topicList,
          state.applicantNegotiations.items,
          state.applicantNegotiations.negotiations,
          state.applicantNegotiations.topics,
          ...(state.applicantNegotiations.topicsByState ? Object.values(state.applicantNegotiations.topicsByState) : []),
        ];

        for (const list of possibleLists) {
          if (Array.isArray(list)) {
            for (const topic of list) {
              if (topic && typeof topic === "object") {
                // Only accept genuine numeric vacancy IDs. topic.id is a negotiation thread ID and MUST NOT be used!
                let vacancyId = "";
                if (topic.vacancyId && /^\d+$/.test(String(topic.vacancyId))) {
                  vacancyId = String(topic.vacancyId);
                } else if (topic.vacancy?.id && /^\d+$/.test(String(topic.vacancy.id))) {
                  vacancyId = String(topic.vacancy.id);
                } else if (topic.url) {
                  const m = String(topic.url).match(/vacancy\/(\d+)/);
                  if (m) vacancyId = m[1];
                }

                const vacInfo = vacancyId ? vacanciesMap.get(vacancyId) : null;

                const title =
                  vacInfo?.name ||
                  topic.vacancyName ||
                  topic.vacancy?.name ||
                  topic.title ||
                  (vacancyId ? `Vacancy #${vacancyId}` : "Job Application");

                const company =
                  vacInfo?.company?.name ||
                  vacInfo?.company?.visibleName ||
                  topic.employerName ||
                  topic.employer?.name ||
                  topic.companyName ||
                  "Employer";

                // Real canonical URL only if valid vacancyId exists
                const url = vacancyId
                  ? `https://hh.ru/vacancy/${vacancyId}`
                  : (vacInfo?.links?.desktop || (topic.url?.includes("/vacancy/") ? topic.url : ""));

                const appliedAt = topic.creationTime || topic.createdAt
                  ? new Date(topic.creationTime || topic.createdAt)
                  : new Date();

                const status = topic.lastState || topic.state?.name || topic.status || "applied";

                // Strictly enforce valid vacancy link to prevent broken or displaced links
                if (url && !history.some((h) => h.url === url)) {
                  history.push({ title, company, status, url, appliedAt });
                  pageFoundCount++;
                }
              }
            }
          }
        }
      }

      // Method B: Fallback directly to vacanciesShort if topicList didn't populate items
      if (pageFoundCount === 0 && vacanciesMap.size > 0) {
        for (const [vId, vac] of vacanciesMap.entries()) {
          if (!/^\d+$/.test(vId)) continue;
          const title = vac.name || `Vacancy #${vId}`;
          const company = vac.company?.name || vac.company?.visibleName || "Employer";
          const url = `https://hh.ru/vacancy/${vId}`;
          const appliedAt = vac.creationTime ? new Date(vac.creationTime) : new Date();
          const status = "applied";

          if (!history.some((h) => h.url === url)) {
            history.push({ title, company, status, url, appliedAt });
            pageFoundCount++;
          }
        }
      }

      // Method C: Cheerio DOM fallback if state was completely missing
      if (pageFoundCount === 0) {
        const $ = cheerio.load(html);
        const items = $('div[data-qa="negotiations-item"]');

        items.each((_, el) => {
          const item = $(el);
          const title = item.find('[data-qa="negotiations-item-vacancy"]').text().trim();
          const company = item.find('[data-qa="negotiations-item-company"]').text().trim();
          const status =
            item.find('[data-qa*="negotiations-item-"]').not('[data-qa*="checkbox"]').text().trim() ||
            item.find('[data-qa*="negotiations-tag"]').text().trim() ||
            "applied";
          const dateText =
            item.find('[data-qa="negotiations-item-date"]').text().trim() ||
            item.find(".bloko-text_tertiary").text().trim();
          const appliedAt = parseHHDate(dateText);

          const rawHref = item.find('a[href*="/vacancy/"]').attr("href") || "";
          const match = rawHref.match(/vacancy\/(\d+)/);
          const url = match ? `https://hh.ru/vacancy/${match[1]}` : "";

          if (title && url && !history.some((h) => h.url === url)) {
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
      headers: getWebHeaders(formatted, "https://hh.ru/"),
      timeout: 10000,
      validateStatus: () => true,
    });

    if (res.status === 401 || res.status === 403 || res.status === 406) {
      return { active: false, error: `Access denied by HH.ru (${res.status} Unauthorized / Session expired).` };
    }

    const finalUrl = res.request?.res?.responseUrl || "";
    if (finalUrl.includes("/account/login")) {
      return { active: false, error: "Session expired or logged out." };
    }

    const text = String(res.data);
    const state = extractHHInitialState(text);
    const $ = cheerio.load(text);

    if (text.includes('data-qa="login-input-username"') && !state?.applicantInfo && !state?.applicantProfileHeaderMenu) {
      return { active: false, error: "Session expired or logged out." };
    }

    const resumes: HHResume[] = [];
    const seenIds = new Set<string>();

    let rawName =
      state?.applicantInfo?.fullName ||
      $('[data-qa="profile-activator-fullname"]').text().trim() ||
      $("h1").first().text().trim() ||
      null;
    if (rawName === "HeadHunter" || rawName === "HeadHunter — Jobs in Russia") {
      rawName = null;
    }

    let avatar: string | null = extractAvatar(state, $);

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

    $('[data-qa="resume-title"]').each((_, el) => {
      const item = $(el);
      const link = item.attr("href") || item.closest("a").attr("href") || item.find("a").attr("href") || "";
      const rawTitle = item.text().trim();
      const title = rawTitle.replace(/(Updated|Обновлено|Active|Активно).*$/i, "").trim() || rawTitle;

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

    $('a[href*="/resume/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/\/resume\/([a-f0-9]+)/i);
      if (match && !seenIds.has(match[1])) {
        const rawTitle = $(el).text().trim();
        const title = rawTitle.replace(/(Updated|Обновлено|Active|Активно).*$/i, "").trim() || rawTitle;
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

    let totalApplications = 0;
    if (typeof state?.applicantNegotiations?.total === "number") {
      totalApplications = state.applicantNegotiations.total;
    } else if (typeof state?.userStats?.["new-stats-total"] === "number") {
      totalApplications = state.userStats["new-stats-total"];
    }

    return {
      active: true,
      resumes,
      profile: {
        name: rawName,
        avatar,
        totalApplications,
      },
    };
  } catch (error: any) {
    return {
      active: false,
      error: error.message || "Failed to connect to HH.ru.",
    };
  }
}


