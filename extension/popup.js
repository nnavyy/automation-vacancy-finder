const DEFAULT_URL = "http://localhost:3000";
const CLOUD_URL = "https://automation-vacancy-finder-phi.vercel.app";

document.getElementById("syncBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.className = "";
  statusEl.textContent = "Reading session cookies from hh.ru...";

  try {
    // Read all cookies from hh.ru domain
    const cookies = await chrome.cookies.getAll({ domain: "hh.ru" });

    // Look for hhtoken
    const hhtokenCookie = cookies.find((c) => c.name === "hhtoken");

    if (!hhtokenCookie || !hhtokenCookie.value) {
      statusEl.className = "error";
      statusEl.textContent = "Cookie 'hhtoken' not found. Please open hh.ru in a new tab and sign in first!";
      return;
    }

    // Combine hhtoken with _xsrf, hhuid and DDoS-Guard cookies if present
    const cookieParts = [`hhtoken=${hhtokenCookie.value}`];
    const optionalNames = ["_xsrf", "hhuid", "__ddg1_", "__ddg2_", "__ddgid_"];

    for (const name of optionalNames) {
      const found = cookies.find((c) => c.name === name);
      if (found && found.value) {
        cookieParts.push(`${found.name}=${found.value}`);
      }
    }

    const fullCookieString = cookieParts.join("; ");

    // Copy combined string directly to clipboard
    try {
      await navigator.clipboard.writeText(fullCookieString);
    } catch {}

    statusEl.className = "success";
    statusEl.innerHTML = `<strong>Session tokens copied to clipboard!</strong><br/><span style="word-break:break-all;font-size:10px;color:#a1a1aa;">${fullCookieString.slice(0, 35)}...</span>`;

    // Check if user has localhost:3000 open in any tab, otherwise use CLOUD_URL
    const tabs = await chrome.tabs.query({});
    const localTab = tabs.find((t) => t.url && t.url.includes("localhost:3000"));
    const appBase = localTab ? DEFAULT_URL : CLOUD_URL;

    const targetUrl = `${appBase}/dashboard/settings?import_token=${encodeURIComponent(fullCookieString)}`;
    chrome.tabs.create({ url: targetUrl });
  } catch (err) {
    statusEl.className = "error";
    statusEl.textContent = "Failed to read cookies: " + err.message;
  }
});

