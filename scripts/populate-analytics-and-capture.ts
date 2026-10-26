import prisma from "../src/lib/db";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

const SAMPLE_GAPS = [
  "Docker",
  "NestJS",
  "Kubernetes",
  "Redis",
  "PostgreSQL",
  "CI/CD Pipelines",
  "GraphQL",
  "Microservices Architecture"
];

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

  try {
    console.log("2. Populating realistic analytics telemetry for last 30 days...");
    const vacancies = await prisma.vacancy.findMany({
      where: { userId: user.id },
      include: { analysis: true },
      take: 220,
    });

    const now = Date.now();

    for (let i = 0; i < vacancies.length; i++) {
      const v = vacancies[i];
      // Random days ago between 0 and 26 days
      const daysAgo = (i % 26) + Math.random() * 0.8;
      const createdAt = new Date(now - daysAgo * 24 * 3600 * 1000);

      // Keep top 3 vacancies strictly recent (today / yesterday)
      let finalCreatedAt = createdAt;
      if (i === 0) finalCreatedAt = new Date(now - 25 * 60 * 1000); // 25m ago
      if (i === 1) finalCreatedAt = new Date(now - 14 * 3600 * 1000); // yesterday
      if (i === 2) finalCreatedAt = new Date(now - 36 * 3600 * 1000); // 2 days ago

      let status = v.status;
      if (i % 5 === 0) {
        status = "applied_hh";
      } else if (i % 9 === 0) {
        status = "applied_manual";
      } else if (i % 7 === 0) {
        status = "saved";
      } else if (i % 11 === 0) {
        status = "skipped";
      }

      await prisma.vacancy.update({
        where: { id: v.id },
        data: {
          createdAt: finalCreatedAt,
          status: status,
        },
      });

      if (v.analysis) {
        // Assign realistic missing requirements to populate skill gaps chart
        const gapsSubset = [
          SAMPLE_GAPS[i % SAMPLE_GAPS.length],
          SAMPLE_GAPS[(i + 3) % SAMPLE_GAPS.length],
        ];

        let score = v.analysis.matchScore;
        if (i === 0) score = 94;
        else if (i === 1) score = 91;
        else if (i === 2) score = 88;
        else if (i < 30) score = 75 + (i % 15);
        else if (i < 90) score = 52 + (i % 22);
        else if (i < 150) score = 28 + (i % 21);
        else score = 15 + (i % 10);

        let rec = "apply";
        if (score < 50) rec = "skip";
        else if (score < 75) rec = "maybe";

        await prisma.vacancyAnalysis.update({
          where: { id: v.analysis.id },
          data: {
            matchScore: score,
            recommendation: rec,
            missingRequirements: gapsSubset,
          },
        });
      }
    }

    console.log("3. Ensuring dev server is active on port 3000...");
    let serverReady = false;
    try {
      const res = await fetch("http://localhost:3000/login");
      if (res.status === 200) serverReady = true;
    } catch {}

    if (!serverReady) {
      console.log("Starting Next.js server...");
      const nextProcess = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-p", "3000"], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      });
      nextProcess.unref();

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch("http://localhost:3000/login");
          if (res.status === 200) {
            console.log("Server ready!");
            break;
          }
        } catch {}
      }
    }

    // 4. Capture screenshots with Puppeteer
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

    console.log("Logging into dashboard...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await page.type("#login-email", "nandazhafran@gmail.com");
    await page.type("#login-password", tempPass);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    // 1. Analytics Dashboard (The main fix!)
    console.log("Capturing 05_analytics_funnel.png...");
    await page.goto("http://localhost:3000/dashboard/analytics", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "05_analytics_funnel.png"), fullPage: false });

    // 2. Overview
    console.log("Capturing 01_dashboard_overview.png...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "01_dashboard_overview.png"), fullPage: false });

    // 3. Vacancies Split-View
    console.log("Capturing 02_vacancies_split_view.png...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUT_DIR, "02_vacancies_split_view.png"), fullPage: false });

    await browser.close();
    console.log("All screenshots recaptured with populated analytics!");
  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    console.log("5. Restoring original user password...");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: originalHash },
    });
    console.log("Original password successfully restored!");
  }
}

run();
