import prisma from "../src/lib/db";
import bcrypt from "bcryptjs";
import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

async function run() {
  console.log("Finding user nandazhafran@gmail.com...");
  const user = await prisma.user.findFirst({
    where: { email: "nandazhafran@gmail.com" },
  });

  if (!user) return;

  const originalHash = user.passwordHash;
  const tempPass = "tempPass2026!";
  const tempHash = await bcrypt.hash(tempPass, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: tempHash },
  });

  try {
    console.log("Ensuring Next.js dev server is active...");
    let ready = false;
    try {
      const res = await fetch("http://localhost:3000/login");
      if (res.status === 200) ready = true;
    } catch {}

    if (!ready) {
      console.log("Launching dev server...");
      const p = spawn("cmd.exe", ["/c", "npx", "next", "dev", "-p", "3000"], {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      });
      p.unref();

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const res = await fetch("http://localhost:3000/login");
          if (res.status === 200) {
            ready = true;
            break;
          }
        } catch {}
      }
    }

    console.log("Launching Puppeteer...");
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
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });
    await page.type("#login-email", "nandazhafran@gmail.com");
    await page.type("#login-password", tempPass);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    // Go to dashboard and toggle Russian
    console.log("Toggling Russian language UI...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    try {
      const elements = await page.$$("button, span");
      for (const el of elements) {
        const txt = await el.evaluate((e) => e.textContent?.trim());
        if (txt === "RU") {
          await el.click();
          await new Promise((r) => setTimeout(r, 1200));
          break;
        }
      }
    } catch (e) {
      console.log("RU toggle note:", e);
    }

    // 1. Overview RU
    console.log("Capturing 01_dashboard_overview_ru.png...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "01_dashboard_overview_ru.png"), fullPage: false });

    // 2. Vacancies Feed RU
    console.log("Capturing 02_vacancies_split_view_ru.png...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUT_DIR, "02_vacancies_split_view_ru.png"), fullPage: false });

    // 3. Analytics RU
    console.log("Capturing 05_analytics_funnel_ru.png...");
    await page.goto("http://localhost:3000/dashboard/analytics", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "05_analytics_funnel_ru.png"), fullPage: false });

    await browser.close();
    console.log("Russian screenshots captured successfully!");
  } catch (err) {
    console.error("Capture err:", err);
  } finally {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: originalHash },
    });
    console.log("Original password restored.");
  }
}

run();
