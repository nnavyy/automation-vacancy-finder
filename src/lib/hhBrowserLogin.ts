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
import os from "os";

export async function performBrowserLogin(timeoutMs: number = 240000): Promise<HHLoginResult> {
  const executablePath = findBrowserExecutable();
  const profileDir = path.join(os.tmpdir(), `hh_login_session_${Date.now()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: false,
      userDataDir: profileDir,
      defaultViewport: null,
      args: [
        "--new-window",
        "--window-position=80,60",
        "--window-size=1260,860",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const initialPages = await browser.pages();
    const initialPage = initialPages[0] || (await browser.newPage());
    await initialPage.bringToFront().catch(() => {});

    try {
      await initialPage.goto("https://hh.ru/account/login?backurl=%2Fapplicant%2Fresumes", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch {
      // If initial domcontentloaded takes longer, page remains open and responsive in browser window
    }

    const startTime = Date.now();
    let loginDetected = false;
    let targetPage = initialPage;
    let targetCookies: any[] = [];

    // Poll until login is completed or timeout is reached
    while (Date.now() - startTime < timeoutMs) {
      if (browser && !browser.connected) {
        throw new Error("Browser window was closed before login was completed.");
      }

      try {
        const currentPages = await browser.pages();

        // Inspect every open tab/window for authentication indicators
        for (const p of currentPages) {
          const currentUrl = p.url();

          // 1. Check all cookies in current page context and hh.ru domains
          const pageCookies = await p.cookies().catch(() => []);
          const domainCookies = await p.cookies("https://hh.ru", "https://api.hh.ru", "https://spb.hh.ru").catch(() => []);
          
          const cookieMap = new Map<string, any>();
          for (const c of [...pageCookies, ...domainCookies]) {
            if (c?.name && c?.value) {
              cookieMap.set(c.name, c);
            }
          }
          const allCookies = Array.from(cookieMap.values());
          const hhtokenCookie = allCookies.find((c) => c.name === "hhtoken" && c.value);

          const isAuthUrl =
            currentUrl.includes("/applicant/") ||
            currentUrl.includes("/resume/") ||
            (currentUrl.includes("hh.ru") &&
              !currentUrl.includes("/account/login") &&
              !currentUrl.includes("/account/signup") &&
              !currentUrl.includes("/account/verification") &&
              !currentUrl.includes("/account/otp") &&
              !currentUrl.includes("/account/code") &&
              !currentUrl.includes("/account/captcha") &&
              currentUrl !== "about:blank");

          // Check if session token exists and user navigated away from login screens
          if ((hhtokenCookie && isAuthUrl) || (currentUrl.includes("/applicant/resumes"))) {
            loginDetected = true;
            targetPage = p;
            targetCookies = allCookies;
            break;
          }
        }

        if (loginDetected) {
          break;
        }
      } catch {
        // Transient CDP / frame navigation error while user is submitting forms, ignore and continue polling
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!loginDetected) {
      throw new Error(
        "Login timed out (4 minutes). Please complete the sign-in inside the opened browser window, or use 'Advanced: Manual Cookie String Input (Fallback)' below."
      );
    }

    // Ensure we are on applicant/resumes so we can extract profile & resumes directly
    await targetPage.bringToFront().catch(() => {});
    if (!targetPage.url().includes("/applicant/resumes")) {
      await targetPage.goto("https://hh.ru/applicant/resumes", {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      }).catch(() => {});
    }

    // Wait a brief moment for page rendering
    await new Promise((r) => setTimeout(r, 2500));

    // Refresh cookies list to get all updated session & security cookies
    const pCookies = await targetPage.cookies().catch(() => []);
    const domainCookies = await targetPage.cookies("https://hh.ru", "https://api.hh.ru", "https://spb.hh.ru").catch(() => []);
    const cookieMap = new Map<string, any>();
    for (const c of [...targetCookies, ...pCookies, ...domainCookies]) {
      if (c?.name && c?.value) {
        cookieMap.set(c.name, c);
      }
    }
    const finalCookies = Array.from(cookieMap.values());

    // Format cookie string: "name1=val1; name2=val2"
    const cookieString = finalCookies.map((c) => `${c.name}=${c.value}`).join("; ");

    // Extract expiration date from hhtoken or fallback to 30 days
    const hhtokenCookie = finalCookies.find((c) => c.name === "hhtoken");
    let expiresAt: Date | null = null;
    if (hhtokenCookie && hhtokenCookie.expires && hhtokenCookie.expires > 0) {
      expiresAt = new Date(hhtokenCookie.expires * 1000);
    } else {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Extract HTML directly from the active logged-in page
    const html = await targetPage.content();
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

    // Check SSR state if resumes not found in DOM
    if (resumes.length === 0) {
      try {
        const luxMatch = html.match(/<template[^>]*HH-Lux-InitialState[^>]*>([\s\S]*?)<\/template>/i);
        const stateObj = luxMatch ? JSON.parse(luxMatch[1]) : null;
        if (stateObj?.resumes && Array.isArray(stateObj.resumes)) {
          for (const r of stateObj.resumes) {
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
      } catch {}
    }

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
    try {
      if (fs.existsSync(profileDir)) {
        fs.rmSync(profileDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
