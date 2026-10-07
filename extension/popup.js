const APP_URL = "https://automation-vacancy-finder-phi.vercel.app";

document.getElementById("syncBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.className = "";
  statusEl.textContent = "Reading session cookie from hh.ru...";

  try {
    const cookie = await chrome.cookies.get({
      url: "https://hh.ru",
      name: "hhtoken"
    });

    if (!cookie || !cookie.value) {
      statusEl.className = "error";
      statusEl.textContent = "Cookie 'hhtoken' not found. Please open hh.ru in a new tab and sign in first!";
      return;
    }

    statusEl.className = "success";
    statusEl.textContent = "Token detected! Opening dashboard for automatic verification...";

    // Open dashboard settings tab with import_token query parameter
    const targetUrl = `${APP_URL}/dashboard/settings?import_token=${encodeURIComponent(cookie.value)}`;
    chrome.tabs.create({ url: targetUrl });
  } catch (err) {
    statusEl.className = "error";
    statusEl.textContent = "Failed to read cookie: " + err.message;
  }
});
