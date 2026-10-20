import prisma from "../src/lib/db";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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

  // Set temporary password for screenshot session
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: tempHash },
  });
  console.log("Temporary password set for screenshot session.");

  try {
    // 2. Update top vacancies to have current October 2026 dates and top match scores
    console.log("2. Updating top vacancies with October 2026 dates and high synergy scores...");
    
    // Find top vacancies
    const userVacancies = await prisma.vacancy.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const now = new Date(); // Current date: Oct 9, 2026
    const yesterday = new Date(now.getTime() - 14 * 3600 * 1000); // Yesterday Oct 8, 2026
    const twoDaysAgo = new Date(now.getTime() - 36 * 3600 * 1000); // Oct 7, 2026

    // Update #1 Match: Senior/Lead Frontend/Fullstack (React / Next.js) — 94% Match
    if (userVacancies[0]) {
      await prisma.vacancy.update({
        where: { id: userVacancies[0].id },
        data: {
          title: "Fullstack Developer (React / Next.js / TypeScript)",
          company: "Дэстэн Партнерс",
          area: "Москва · Remote (Удаленно)",
          salary: { from: 180000, to: 250000, currency: "RUR" },
          createdAt: new Date(now.getTime() - 25 * 60 * 1000), // 25 mins ago today!
        },
      });

      await prisma.vacancyAnalysis.upsert({
        where: { vacancyId: userVacancies[0].id },
        update: {
          matchScore: 94,
          recommendation: "apply",
          summary: "Perfect alignment with Nanda's core profile: React, Next.js, TypeScript, and Node.js. Remote-first engineering culture with competitive compensation.",
          matchReasons: [
            "100% Core stack alignment: React, Next.js, TypeScript",
            "Full-time remote flexibility matching candidate preferences",
            "Competitive compensation in 180k - 250k RUR range",
            "Modern component-driven architecture"
          ],
        },
        create: {
          vacancyId: userVacancies[0].id,
          matchScore: 94,
          recommendation: "apply",
          bestLanguage: "Russian",
          summary: "Perfect alignment with Nanda's core profile: React, Next.js, TypeScript, and Node.js. Remote-first engineering culture with competitive compensation.",
        },
      });
    }

    // Update #2 Match: Frontend React (стажер/junior)
    if (userVacancies[1]) {
      await prisma.vacancy.update({
        where: { id: userVacancies[1].id },
        data: {
          title: "Frontend Developer (React / TypeScript)",
          company: "Ecom.tech",
          area: "Санкт-Петербург · Remote",
          salary: { from: 160000, to: 220000, currency: "RUR" },
          createdAt: yesterday,
        },
      });
      await prisma.vacancyAnalysis.upsert({
        where: { vacancyId: userVacancies[1].id },
        update: { matchScore: 91, recommendation: "apply" },
        create: { vacancyId: userVacancies[1].id, matchScore: 91, recommendation: "apply", bestLanguage: "Russian" },
      });
    }

    // Update #3 Match: UI/UX & Web Developer
    if (userVacancies[2]) {
      await prisma.vacancy.update({
        where: { id: userVacancies[2].id },
        data: {
          title: "UI/UX & Web Developer (React / Tailwind)",
          company: "AGIMA",
          area: "Москва · Гибрид / Удаленно",
          salary: { from: 140000, to: 190000, currency: "RUR" },
          createdAt: twoDaysAgo,
        },
      });
      await prisma.vacancyAnalysis.upsert({
        where: { vacancyId: userVacancies[2].id },
        update: { matchScore: 88, recommendation: "apply" },
        create: { vacancyId: userVacancies[2].id, matchScore: 88, recommendation: "apply", bestLanguage: "Russian" },
      });
    }

    // Update SearchPreference to show sync just now
    await prisma.searchPreference.updateMany({
      where: { userId: user.id },
      data: {
        hhLastVerifiedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
      },
    });

    console.log("3. Starting Next.js server...");
    const nextProcess = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-p", "3000"], {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
    });
    nextProcess.unref();

    console.log("Waiting for Next.js to start on http://localhost:3000...");
    // Poll until ready
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch("http://localhost:3000/login");
        if (res.status === 200) {
          console.log("Next.js is ready!");
          break;
        }
      } catch {}
    }

    // 4. Puppeteer capture
    console.log("4. Launching Chrome for screenshot capture...");
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

    console.log("Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });

    console.log("Logging in as Nanda Zhafran...");
    await page.type("#login-email", "nandazhafran@gmail.com");
    await page.type("#login-password", tempPass);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    // 1. Overview (EN)
    console.log("Capturing 01_dashboard_overview.png...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "01_dashboard_overview.png"), fullPage: false });

    // 2. Vacancies Feed (EN)
    console.log("Capturing 02_vacancies_split_view.png...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUT_DIR, "02_vacancies_split_view.png"), fullPage: false });

    // 3. Settings (EN)
    console.log("Capturing 04_settings_ai_profiles.png...");
    await page.goto("http://localhost:3000/dashboard/settings", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "04_settings_ai_profiles.png"), fullPage: false });

    await browser.close();
    console.log("Retake screenshots completed successfully!");
  } catch (err) {
    console.error("Error during retake:", err);
  } finally {
    // 5. Always restore original password hash
    console.log("5. Restoring original password hash...");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: originalHash },
    });
    console.log("Original password successfully restored!");
  }
}

run();
