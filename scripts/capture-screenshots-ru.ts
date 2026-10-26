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

    console.log("Logging in...");
    await page.type("#login-email", "demo@hhcopilot.local");
    await page.type("#login-password", "demopass123");
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);

    // Switch to Russian language for authentic Habr screenshots
    console.log("Switching language to Russian (RU)...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    
    try {
      const ruButtons = await page.$$("button, span");
      for (const el of ruButtons) {
        const text = await el.evaluate(e => e.textContent?.trim());
        if (text === "RU") {
          await el.click();
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      }
    } catch (e) {
      console.log("Lang toggle notice:", e);
    }

    // 1. Dashboard Overview (RU)
    console.log("Capturing 01_dashboard_overview_ru.png...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUT_DIR, "01_dashboard_overview_ru.png"), fullPage: false });

    // 2. Vacancies Feed (RU)
    console.log("Capturing 02_vacancies_split_view_ru.png...");
    await page.goto("http://localhost:3000/dashboard/vacancies", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3500));
    await page.screenshot({ path: path.join(OUT_DIR, "02_vacancies_split_view_ru.png"), fullPage: false });

    // 3. Analytics Funnel
    console.log("Capturing 05_analytics_funnel.png...");
    await page.goto("http://localhost:3000/dashboard/analytics", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUT_DIR, "05_analytics_funnel.png"), fullPage: false });

    console.log("Finished capturing additional Russian & Analytics views!");
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

run();
