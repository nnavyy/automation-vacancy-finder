import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Standard API User-Agent required by HH.ru API (must include app name and contact)
 * Note: generic emails like admin@example.com are blacklisted by HH.
 */
const USER_AGENT = "NandaJobAssistant/1.0 (nandazhafran@gmail.com)";

/**
 * Common headers for HH.ru private endpoints using session token
 */
function getHeaders(token: string) {
  return {
    "User-Agent": USER_AGENT,
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
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
 * Fetches the list of active resumes for the authenticated user by scraping the web UI.
 * This bypasses the api.hh.ru OAuth restriction by using the raw browser cookies.
 */
export async function fetchMyResumes(cookieString: string): Promise<HHResume[]> {
  try {
    // Clean up the cookie string just in case the user accidentally copied quotes
    let cleanCookie = cookieString.replace(/^['"]|['"]$/g, '').trim();

    // Extract ONLY the essential cookies to avoid DDoS-Guard (WAF) 403 Forbidden errors
    const extractCookie = (name: string) => {
      const match = cleanCookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match ? `${name}=${match[1]}` : null;
    };

    const hhtoken = extractCookie("hhtoken");
    const hhuid = extractCookie("hhuid");
    const xsrf = extractCookie("_xsrf");

    const minimalCookies = [hhtoken, hhuid, xsrf].filter(Boolean).join("; ");

    const res = await axios.get("https://hh.ru/applicant/resumes", {
      headers: {
        "User-Agent": USER_AGENT,
        "Cookie": minimalCookies,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
    });

    const text = res.data;
    
    // Parse the HTML using regex to find resumes
    // Matches: <a ... href="/resume/1234567890abcdef" ... data-qa="resume-title" ...><span ...>Resume Title</span>
    const regex = /href="\/resume\/([a-f0-9]+(?:\?[^"]*)?)"[^>]*>.*?data-qa="resume-title".*?<span[^>]*>([^<]+)<\/span>/g;
    let match;
    const resumes: HHResume[] = [];
    
    while ((match = regex.exec(text)) !== null) {
      resumes.push({
        id: match[1].split('?')[0],
        title: match[2],
        updated_at: new Date().toISOString(), // Mock date as it's hard to parse from HTML
        url: `https://hh.ru/resume/${match[1]}`,
        status: { id: "published", name: "Active" }
      });
    }

    if (resumes.length === 0) {
      // Check if we got redirected to login
      if (text.includes('data-qa="login-input-username"')) {
        throw new Error("Session expired or invalid. Please copy the FULL cookie string from your Network tab again.");
      }
    }

    return resumes;
  } catch (error: any) {
    console.error("[HH Private] Failed to fetch resumes via web:", error.message);
    throw new Error(error.message || "Failed to fetch resumes from web UI. Ensure your full Cookie string is correct.");
  }
}

/**
 * Applies to a vacancy on HH.ru.
 */
export async function applyToVacancy(
  token: string,
  resumeId: string,
  vacancyId: string,
  message: string
): Promise<boolean> {
  try {
    // According to HH API docs, you submit a POST to /negotiations
    // with query parameters or body form-data
    const params = new URLSearchParams();
    params.append("vacancy_id", vacancyId);
    params.append("resume_id", resumeId);
    params.append("message", message);

    const res = await axios.post("https://api.hh.ru/negotiations", params, {
      headers: {
        ...getHeaders(token),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 201 Created means successfully applied
    return res.status === 201 || res.status === 200;
  } catch (error: any) {
    console.error("[HH Private] Failed to apply:", error.response?.data || error.message);
    // 400 Bad Request often means already applied or questions required
    if (error.response?.status === 400 && error.response?.data?.description?.includes("already")) {
       throw new Error("You have already applied to this vacancy.");
    }
    throw new Error(error.response?.data?.description || "Failed to apply. Vacancy may be closed or require an external test.");
  }
}

/**
 * Optional utility to bump/update resume.
 */
export async function bumpResume(token: string, resumeId: string): Promise<boolean> {
  try {
    const res = await axios.post(`https://api.hh.ru/resumes/${resumeId}/publish`, {}, {
      headers: getHeaders(token),
    });
    return res.status === 204 || res.status === 200;
  } catch (error: any) {
    console.error("[HH Private] Failed to bump resume:", error.response?.data || error.message);
    return false;
  }
}

/**
 * Fetches the user's HH.ru profile and analytics (applications count) by scraping the web UI.
 */
export async function fetchHHProfile(cookieString: string): Promise<{ name: string | null, avatar: string | null, totalApplications: number }> {
  try {
    let cleanCookie = cookieString.replace(/^['"]|['"]$/g, '').trim();

    const extractCookie = (name: string) => {
      const match = cleanCookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match ? `${name}=${match[1]}` : null;
    };
    const minimalCookies = [extractCookie("hhtoken"), extractCookie("hhuid"), extractCookie("_xsrf")].filter(Boolean).join("; ");

    // Fetch resumes page for profile info
    const resResumes = await axios.get("https://hh.ru/applicant/resumes", {
      headers: { 
        "User-Agent": USER_AGENT, 
        "Cookie": minimalCookies, 
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" 
      },
    });
    const $1 = cheerio.load(resResumes.data);
    const name = $1('[data-qa="profile-activator-fullname"]').text().trim() || null;
    const avatar = $1('[data-qa="profile-avatar-image"]').attr('src') || null;

    // Fetch negotiations page for applications count
    const resNeg = await axios.get("https://hh.ru/applicant/negotiations", {
      headers: { 
        "User-Agent": USER_AGENT, 
        "Cookie": minimalCookies, 
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" 
      },
    });
    const $2 = cheerio.load(resNeg.data);
    
    // Find count from a badge or pagination. If "All 51" badge exists, we can extract it.
    let totalApplications = 0;
    const allBadgeText = $2('[data-qa="negotiations-nav-item_all"] [data-qa="negotiations-nav-item-count"]').text().trim() 
                      || $2('.bloko-tabs-item_current').text().trim();
    const countMatch = allBadgeText.match(/\d+/);
    if (countMatch) {
      totalApplications = parseInt(countMatch[0], 10);
    } else {
      // Fallback: count items on first page
      $2('[data-qa]').each((i, el) => {
        if ($2(el).attr('data-qa') === 'negotiations-item') totalApplications++;
      });
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
  
  if (lower.includes('сегодня') || lower.includes('today')) {
    return now;
  }
  if (lower.includes('вчера') || lower.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  
  const ruMonths: Record<string, number> = {
    'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'май': 4, 'мая': 4, 'июн': 5,
    'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11,
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
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

/**
 * Scrapes all history of applications from HH.ru
 */
export async function syncHHHistory(cookieString: string) {
  const history: any[] = [];
  try {
    let cleanCookie = cookieString.replace(/^['"]|['"]$/g, '').trim();
    const extractCookie = (name: string) => {
      const match = cleanCookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match ? `${name}=${match[1]}` : null;
    };
    const minimalCookies = [extractCookie("hhtoken"), extractCookie("hhuid"), extractCookie("_xsrf")].filter(Boolean).join("; ");

    let page = 0;
    let hasMore = true;

    while (hasMore && page < 20) { // arbitrary limit 20 pages (400 items)
      const res = await axios.get(`https://hh.ru/applicant/negotiations?page=${page}`, {
        headers: { 
          "User-Agent": USER_AGENT, 
          "Cookie": minimalCookies, 
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" 
        },
      });
      
      const $ = cheerio.load(res.data);
      const items = $('[data-qa="negotiations-item"]');
      
      if (items.length === 0) {
        console.log("[DEBUG] No items found on page", page, "Title:", $('title').text(), "HTML snippet:", res.data.substring(0, 500));
        hasMore = false;
        break;
      }

      items.each((_, el) => {
        const item = $(el);
        const titleElem = item.find('[data-qa="negotiations-item-vacancy"]');
        const title = titleElem.text().trim();
        const url = titleElem.attr('href') || "";
        const company = item.find('[data-qa="negotiations-item-company"]').text().trim();
        const status = item.find('[data-qa="negotiations-item-status"]').text().trim();
        const dateText = item.find('[data-qa="negotiations-item-date"]').text().trim() || item.find('.bloko-text_tertiary').text().trim();
        const appliedAt = parseHHDate(dateText);
        
        if (title) {
          history.push({ title, company, status, url, appliedAt });
        }
      });

      // Check if there's a next page button
      const nextBtn = $('[data-qa="pager-next"]');
      if (nextBtn.length === 0) {
        hasMore = false;
      } else {
        page++;
        await new Promise(r => setTimeout(r, 1000)); // be nice to HH
      }
    }
    return { success: true, history };
  } catch (error: any) {
    console.error("[HH Private] Failed to sync history:", error.message);
    return { success: false, history: [] };
  }
}

// header fix
