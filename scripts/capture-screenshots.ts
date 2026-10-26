import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();

  try {
    console.log("Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle2" });

    console.log("Filling login credentials...");
    await page.type("#login-email", "demo@hhcopilot.local");
    await page.type("#login-password", "demopass123");
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    console.log("Current URL after login:", page.url());

    // 1. Dashboard Overview
    console.log("Navigating to Dashboard Overview...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    const ss1 = path.join(OUT_DIR, "01_dashboard_overview.png");
    await page.screenshot({ path: ss1, fullPage: false });
    console.log("Saved:", ss1);

    // 2. Vacancies Feed
    console.log("Navigating to Vacancies Feed...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 4000));
    const ss2 = path.join(OUT_DIR, "02_vacancies_split_view.png");
    await page.screenshot({ path: ss2, fullPage: false });
    console.log("Saved:", ss2);

    // Try clicking first vacancy card to show details & red flags
    try {
      const cards = await page.$$("div[role='button'], div.cursor-pointer, button");
      if (cards.length > 5) {
        await cards[5].click().catch(() => {});
        await new Promise((r) => setTimeout(r, 1500));
        const ss3 = path.join(OUT_DIR, "03_vacancy_redflags_detail.png");
        await page.screenshot({ path: ss3, fullPage: false });
        console.log("Saved:", ss3);
      }
    } catch (e) {
      console.log("Notice on card click:", e);
    }

    // 3. Settings / AI Config
    console.log("Navigating to Settings...");
    await page.goto("http://localhost:3000/dashboard/settings", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    const ss4 = path.join(OUT_DIR, "04_settings_ai_profiles.png");
    await page.screenshot({ path: ss4, fullPage: false });
    console.log("Saved:", ss4);

    console.log("All screenshots captured successfully!");
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

run();
