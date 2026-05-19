const axios = require("axios");

async function test() {
  const r = await axios.get("https://hh.ru/vacancy/133100580", {
    headers: { 
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html",
    },
    validateStatus: () => true,
  });
  
  const html = String(r.data);
  
  // Try JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    console.log("JSON-LD found!");
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      console.log("Title:", data.title);
      console.log("Description:", data.description?.substring(0, 300));
      console.log("Skills:", data.skills);
      console.log("Company:", data.hiringOrganization?.name);
    } catch(e) {
      console.log("Parse error:", e.message);
      console.log("Raw:", jsonLdMatch[1].substring(0, 500));
    }
  }
  
  // Try initial state
  const stateMatch = html.match(/window\.__initialState__\s*=\s*({[\s\S]*?});/);
  if (stateMatch) {
    console.log("\n__initialState__ found! Length:", stateMatch[1].length);
  }
  
  // Try HH-Lux-InitialState
  const luxMatch = html.match(/HH-Lux-InitialState[^>]*>([\s\S]*?)<\/template>/);
  if (luxMatch) {
    console.log("\nHH-Lux-InitialState found! Length:", luxMatch[1].length);
    try {
      const data = JSON.parse(luxMatch[1]);
      const keys = Object.keys(data);
      console.log("Keys:", keys.slice(0, 10));
    } catch(e) {
      console.log("Parse failed, first 200:", luxMatch[1].substring(0, 200));
    }
  }
  
  // Check for any JSON data blocks
  const scriptTags = html.match(/<script[^>]*>([\s\S]{100,}?)<\/script>/g) || [];
  console.log("\nScript tags with content:", scriptTags.length);
  scriptTags.forEach((s, i) => {
    if (s.includes("vacancy") || s.includes("description")) {
      console.log(`  Script ${i}: contains vacancy/description keywords, length: ${s.length}`);
    }
  });
}

test().catch(e => console.error("Error:", e.message));
