import puppeteer from "puppeteer-core";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT_DIR = path.resolve(process.cwd(), "screenshots");

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

    document.querySelectorAll(".privacy-blur-text").forEach((el) => {
      (el as HTMLElement).style.filter = "blur(6px) !important";
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue) {
        if (/nandazhafran@gmail\.com/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/nandazhafran@gmail\.com/gi, "CandidateVerified@gmail.com");
        }
        if (/nanda/i.test(node.nodeValue) || /zhafran/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue
            .replace(/Nanda Zhafran/gi, "Candidate (Verified)")
            .replace(/Nanda/gi, "Candidate")
            .replace(/Zhafran/gi, "Verified");
        }
      }
    }
  });
}

async function run() {
  let nextProcess: any = null;
  let serverReady = false;
  try {
    const res = await fetch("http://localhost:3000/");
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
        const res = await fetch("http://localhost:3000/");
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

  // 1. Under Construction (EN)
  console.log("Capturing 07_under_construction_en.png...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    localStorage.setItem("app_language", "en");
  });
  await page.reload({ waitUntil: "networkidle2" });
  await applyPrivacyBlur(page);
  await new Promise((r) => setTimeout(r, 2000));
  await applyPrivacyBlur(page);
  await page.screenshot({ path: path.join(OUT_DIR, "07_under_construction_en.png"), fullPage: true });

  // 2. Under Construction (RU)
  console.log("Capturing 07_under_construction_ru.png...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    localStorage.setItem("app_language", "ru");
  });
  await page.reload({ waitUntil: "networkidle2" });
  await applyPrivacyBlur(page);
  await new Promise((r) => setTimeout(r, 2000));
  await applyPrivacyBlur(page);
  await page.screenshot({ path: path.join(OUT_DIR, "07_under_construction_ru.png"), fullPage: true });

  await browser.close();

  if (nextProcess) {
    console.log("Stopping Next.js server...");
    nextProcess.kill();
  }
  console.log("All done!");
}

run().catch(console.error);
