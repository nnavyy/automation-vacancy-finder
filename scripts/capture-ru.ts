import prisma from "../src/lib/db";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";
import path from "path";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

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

  let nextProcess: any = null;

  try {
    console.log("2. Checking Next.js dev server...");
    let serverReady = false;
    try {
      const res = await fetch("http://localhost:3000/login");
      if (res.status === 200) serverReady = true;
    } catch {}

    if (!serverReady) {
      console.log("Starting Next.js server...");
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

    console.log("3. Launching Chrome for Russian screenshot capture...");
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

    // Set Russian language in localStorage and reload
    console.log("Setting app_language to 'ru'...");
    await page.evaluate(() => {
      localStorage.setItem("app_language", "ru");
      document.documentElement.lang = "ru";
    });

    // 1. Overview in Russian
    console.log("Capturing 01_dashboard_overview_ru.png...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await page.evaluate(() => {
      localStorage.setItem("app_language", "ru");
    });
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "01_dashboard_overview_ru.png"), fullPage: false });

    // 2. Vacancies Split-View in Russian
    console.log("Capturing 02_vacancies_split_view_ru.png...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUT_DIR, "02_vacancies_split_view_ru.png"), fullPage: false });

    // 3. Analytics Dashboard in Russian
    console.log("Capturing 05_analytics_funnel_ru.png...");
    await page.goto("http://localhost:3000/dashboard/analytics", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "05_analytics_funnel_ru.png"), fullPage: false });

    await browser.close();
    console.log("All Russian screenshots captured successfully!");
  } catch (err) {
    console.error("Error during Russian capture:", err);
  } finally {
    console.log("4. Restoring original user password...");
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
