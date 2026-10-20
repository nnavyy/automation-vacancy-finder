import prisma from "../src/lib/db";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");
const LOGIN_PAGE_PATH = path.resolve(process.cwd(), "src/app/login/page.tsx");
const PROXY_PATH = path.resolve(process.cwd(), "src/proxy.ts");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function applyPrivacyBlur(page: any) {
  await page.evaluate(() => {
    let style = document.getElementById("privacy-blur-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "privacy-blur-style";
      style.innerHTML = `
        .privacy-masked {
          filter: blur(8px) !important;
          user-select: none !important;
        }
        .privacy-blur-avatar {
          filter: blur(10px) !important;
        }
      `;
      document.head.appendChild(style);
    }

    document
      .querySelectorAll("img, svg[class*='avatar'], .privacy-blur-avatar, .w-12.h-12, .w-7.h-7, [class*='avatar']")
      .forEach((el) => {
        (el as HTMLElement).classList.add("privacy-blur-avatar");
        (el as HTMLElement).style.filter = "blur(10px) !important";
      });

    document.querySelectorAll(".privacy-blur-text").forEach((el) => {
      (el as HTMLElement).style.filter = "blur(6px) !important";
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue) {
        if (/nanda/i.test(node.nodeValue) || /zhafran/i.test(node.nodeValue) || /akung/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue
            .replace(/Nanda Zhafran/gi, "Candidate (Verified)")
            .replace(/Nanda/gi, "Candidate")
            .replace(/Zhafran/gi, "Verified")
            .replace(/akung/gi, "user");
        }
        if (/nandazhafran@gmail\.com/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/nandazhafran@gmail\.com/gi, "candidate@hhcopilot.local");
        }
      }
    }

    document.querySelectorAll("input, textarea").forEach((input: any) => {
      if (input.value) {
        if (/nanda/i.test(input.value) || /zhafran/i.test(input.value) || /akung/i.test(input.value)) {
          input.value = input.value
            .replace(/Nanda Zhafran/gi, "Candidate Profile")
            .replace(/Nanda/gi, "Candidate")
            .replace(/Zhafran/gi, "Profile")
            .replace(/akung/gi, "user");
        }
        if (/nandazhafran@gmail\.com/i.test(input.value)) {
          input.value = input.value.replace(/nandazhafran@gmail\.com/gi, "candidate@hhcopilot.local");
        }
      }
    });

    const topSidebarBtn = document.querySelector("button[title*='Switch'], button.w-full.flex.items-center");
    if (topSidebarBtn) {
      const span = topSidebarBtn.querySelector("span.truncate");
      if (span && span.textContent && (/Nanda/i.test(span.textContent) || /Candidate/i.test(span.textContent))) {
        span.textContent = "Candidate · Full-Stack Profile";
      }
    }

    const bottomUser = document.querySelector(".p-4.border-t");
    if (bottomUser) {
      const pTags = bottomUser.querySelectorAll("p");
      pTags.forEach((p) => {
        if (p.textContent && /candidate/i.test(p.textContent)) {
          p.style.filter = "blur(4px)";
        }
      });
    }
  });
}

async function run() {
  console.log("1. Finding user nandazhafran@gmail.com...");
  const user = await prisma.user.findFirst({
    where: { email: "nandazhafran@gmail.com" },
  });

  if (!user) {
    console.error("User not found!");
    return;
  }

  const originalHash = user.passwordHash;
  const tempPass = "tempPass2026!";
  const tempHash = await bcrypt.hash(tempPass, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: tempHash },
  });
  console.log("Temporary password set for session.");

  let originalLoginContent: string | null = null;
  let originalProxyContent: string | null = null;
  let nextProcess: any = null;

  try {
    if (fs.existsSync(LOGIN_PAGE_PATH)) {
      originalLoginContent = fs.readFileSync(LOGIN_PAGE_PATH, "utf-8");
      if (originalLoginContent.includes("const IS_MAINTENANCE_LOCK = true;")) {
        console.log("Temporarily unlocking /login page for session...");
        fs.writeFileSync(
          LOGIN_PAGE_PATH,
          originalLoginContent.replace("const IS_MAINTENANCE_LOCK = true;", "const IS_MAINTENANCE_LOCK = false;"),
          "utf-8"
        );
      }
    }

    if (fs.existsSync(PROXY_PATH)) {
      originalProxyContent = fs.readFileSync(PROXY_PATH, "utf-8");
      if (originalProxyContent.includes("export const IS_MAINTENANCE_LOCKDOWN = true;")) {
        console.log("Temporarily unlocking src/proxy.ts for session...");
        fs.writeFileSync(
          PROXY_PATH,
          originalProxyContent.replace("export const IS_MAINTENANCE_LOCKDOWN = true;", "export const IS_MAINTENANCE_LOCKDOWN = false;"),
          "utf-8"
        );
      }
    }

    console.log("Checking Next.js dev server...");
    let serverReady = false;
    try {
      const res = await fetch("http://localhost:3000/login");
      if (res.status === 200) serverReady = true;
    } catch {}

    if (!serverReady) {
      console.log("Starting Next.js server on port 3000...");
      nextProcess = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-p", "3000"], {
        cwd: process.cwd(),
        stdio: "ignore",
      });

      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch("http://localhost:3000/login");
          if (res.status === 200) {
            serverReady = true;
            console.log("Server ready!");
            break;
          }
        } catch {}
      }
    }

    console.log("Launching Chrome...");
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1536,900"],
      defaultViewport: {
        width: 1536,
        height: 900,
        deviceScaleFactor: 2,
      },
    });

    const page = await browser.newPage();

    console.log("Navigating to /login...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await page.waitForSelector("#login-email", { timeout: 25000 });
    await page.type("#login-email", "nandazhafran@gmail.com");
    await page.type("#login-password", tempPass);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    // ==========================================
    // CAPTURE ENGLISH COMPANY INTEL (BLURRED)
    // ==========================================
    console.log("\n--- [EN] Capturing Company Intel ---");
    await page.evaluate(() => {
      localStorage.setItem("app_language", "en");
      document.documentElement.lang = "en";
    });

    console.log("Navigating to http://localhost:3000/dashboard/company-intel...");
    await page.goto("http://localhost:3000/dashboard/company-intel", { waitUntil: "networkidle2" });
    await applyPrivacyBlur(page);
    await new Promise((r) => setTimeout(r, 4000));
    await applyPrivacyBlur(page);
    await page.screenshot({ path: path.join(OUT_DIR, "06_company_intel.png"), fullPage: false });
    console.log("Saved screenshots/06_company_intel.png");

    // ==========================================
    // CAPTURE RUSSIAN COMPANY INTEL (BLURRED)
    // ==========================================
    console.log("\n--- [RU] Capturing Russian Company Intel ---");
    await page.evaluate(() => {
      localStorage.setItem("app_language", "ru");
      document.documentElement.lang = "ru";
    });

    await page.goto("http://localhost:3000/dashboard/company-intel", { waitUntil: "networkidle2" });
    await page.evaluate(() => localStorage.setItem("app_language", "ru"));
    await page.reload({ waitUntil: "networkidle2" });
    await applyPrivacyBlur(page);
    await new Promise((r) => setTimeout(r, 4000));
    await applyPrivacyBlur(page);
    await page.screenshot({ path: path.join(OUT_DIR, "06_company_intel_ru.png"), fullPage: false });
    console.log("Saved screenshots/06_company_intel_ru.png");

    await browser.close();
    console.log("\nCompany Intel screenshots successfully captured!");
  } catch (err) {
    console.error("Error during capture:", err);
  } finally {
    console.log("\nCleanup: Restoring original state...");
    if (originalLoginContent && fs.existsSync(LOGIN_PAGE_PATH)) {
      fs.writeFileSync(LOGIN_PAGE_PATH, originalLoginContent, "utf-8");
      console.log("Restored original login page code.");
    }
    if (originalProxyContent && fs.existsSync(PROXY_PATH)) {
      fs.writeFileSync(PROXY_PATH, originalProxyContent, "utf-8");
      console.log("Restored original proxy code.");
    }

    console.log("Restoring original user password...");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: originalHash },
    });
    console.log("Original password successfully restored!");

    if (nextProcess) {
      console.log("Killing temporary Next.js dev server...");
      try {
        process.kill(nextProcess.pid);
      } catch {}
    }
  }
}

run();
