import fs from "fs";
import path from "path";
import puppeteer, { Browser } from "puppeteer-core";
import * as cheerio from "cheerio";
import type { HHResume } from "./hhPrivateClient";

/**
 * Searches common Windows install locations for Google Chrome or Microsoft Edge.
 */
export function findBrowserExecutable(): string {
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  const candidates = [
    // Google Chrome
    path.join(programFiles, "Google\\Chrome\\Application\\chrome.exe"),
    path.join(programFilesX86, "Google\\Chrome\\Application\\chrome.exe"),
    path.join(localAppData, "Google\\Chrome\\Application\\chrome.exe"),
    // Microsoft Edge
    path.join(programFilesX86, "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join(programFiles, "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join(localAppData, "Microsoft\\Edge\\Application\\msedge.exe"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Neither Google Chrome nor Microsoft Edge could be found on this system.");
}

export interface HHLoginResult {
  success: boolean;
  cookieString: string;
  expiresAt: Date | null;
  resumes: HHResume[];
  profile: {
    name: string | null;
    avatar: string | null;
    totalApplications: number;
  };
  error?: string;
}

/**
 * Launches a real browser window for the user to log in to hh.ru.
 * Automatically waits for login completion, grabs all cookies (with expiration date),
 * extracts resumes and profile, and closes the browser.
 */
export async function performBrowserLogin(timeoutMs: number = 180000): Promise<HHLoginResult> {
  const executablePath = findBrowserExecutable();
  const profileDir = path.join(process.cwd(), ".hh_browser_profile");

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: false,
      userDataDir: profileDir,
      defaultViewport: null,
      args: [
        "--start-maximized",
        "--disable-blink-features=AutomationControlled",
        "--no-default-browser-check",
      ],
    });

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    await page.goto("https://hh.ru/account/login?backurl=%2Fapplicant%2Fresumes", {
      waitUntil: "domcontentloaded",
    });

    const startTime = Date.now();
    let loginDetected = false;
    let targetCookies: any[] = [];

    // Poll until login is completed or timeout is reached
    while (Date.now() - startTime < timeoutMs) {
      if (browser && !browser.connected) {
        throw new Error("Browser window was closed before login was completed.");
      }

      // Check current cookies
      const cookies = await page.cookies("https://hh.ru", "https://api.hh.ru");
      const hhtokenCookie = cookies.find((c) => c.name === "hhtoken");
      const currentUrl = page.url();

      // Check if logged in: hhtoken present AND not on the login/otp page
      if (
        hhtokenCookie &&
        hhtokenCookie.value &&
        !currentUrl.includes("/account/login") &&
        !currentUrl.includes("/account/signup") &&
        !currentUrl.includes("/account/verification")
      ) {
        loginDetected = true;
        targetCookies = cookies;
        break;
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!loginDetected) {
      throw new Error("Login timed out. Please complete the login in the browser window.");
    }

    // Ensure we are on applicant/resumes so we can extract profile & resumes directly
    if (!page.url().includes("/applicant/resumes")) {
      await page.goto("https://hh.ru/applicant/resumes", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      }).catch(() => {});
    }

    // Wait a brief moment for page rendering
    await new Promise((r) => setTimeout(r, 2000));

    // Refresh cookies list to get all updated session & security cookies
    targetCookies = await page.cookies("https://hh.ru", "https://api.hh.ru");

    // Format cookie string: "name1=val1; name2=val2"
    const cookieString = targetCookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Extract expiration date from hhtoken or fallback to 30 days
    const hhtokenCookie = targetCookies.find((c) => c.name === "hhtoken");
    let expiresAt: Date | null = null;
    if (hhtokenCookie && hhtokenCookie.expires && hhtokenCookie.expires > 0) {
      // Puppeteer cookie.expires is in seconds
      expiresAt = new Date(hhtokenCookie.expires * 1000);
    } else {
      // Default estimate: 30 days from now
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Extract HTML directly from the logged-in page
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract Resumes
    const resumes: HHResume[] = [];
    const seenIds = new Set<string>();

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

    // Extract Profile info
    const name = $('[data-qa="profile-activator-fullname"]').text().trim() || null;
    const avatar = $('[data-qa="profile-avatar-image"]').attr("src") || null;

    // Check negotiations count if visible
    let totalApplications = 0;
    const countText = $('[data-qa="negotiations-nav-item_all"] [data-qa="negotiations-nav-item-count"]').text().trim();
    const countMatch = countText.match(/\d+/);
    if (countMatch) {
      totalApplications = parseInt(countMatch[0], 10);
    }

    return {
      success: true,
      cookieString,
      expiresAt,
      resumes,
      profile: {
        name,
        avatar,
        totalApplications,
      },
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
