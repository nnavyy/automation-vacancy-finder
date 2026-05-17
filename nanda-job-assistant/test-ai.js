const Groq = require("groq-sdk");
const fs = require("fs");

// Manual .env loading
const envContent = fs.readFileSync(".env", "utf8");
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^#=]+)=["']?(.*?)["']?\s*$/);
  if (match) process.env[match[1].trim()] = match[2];
});

async function testGroq() {
  console.log("GROQ_API_KEY set:", !!process.env.GROQ_API_KEY);
  
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: 'Reply with only valid JSON: {"greeting": "hello"}' }],
      temperature: 0.3,
      max_tokens: 100,
    });
    console.log("Groq WORKS! Response:", res.choices[0]?.message?.content);
  } catch (e) {
    console.log("Groq FAILED:", e.message);
    console.log("Status:", e.status);
  }
}

testGroq();
