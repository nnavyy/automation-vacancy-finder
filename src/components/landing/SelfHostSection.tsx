"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function SelfHostSection() {
  const [activeTab, setActiveTab] = useState<"docker" | "windows" | "manual">("docker");
  const [copied, setCopied] = useState(false);

  const snippets = {
    docker: `# 1. Clone repository or unpack release archive
cd hh-job-copilot

# 2. Configure environment
cp .env.example .env

# 3. Spin up PostgreSQL and application in Docker
docker compose up -d

# 4. Open in browser:
# http://localhost:3000`,

    windows: `:: 1. Extract hh-job-copilot-source.zip
cd "hh-job-copilot"

:: 2. Execute automated setup script
setup.bat

:: 3. Access local dashboard at http://localhost:3000`,

    manual: `# 1. Install dependencies
npm install

# 2. Configure PostgreSQL credentials in .env
# DATABASE_URL="postgresql://postgres:password@localhost:5432/hh_copilot"

# 3. Apply Prisma migrations
npx prisma migrate dev

# 4. Launch Next.js development server
npm run dev`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="self-host" className="py-20 md:py-28 bg-[#09090b] border-t border-white/[0.08] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Local First. Zero Vendor Lock-in.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Your candidate credentials, search queries, resume text, and application logs remain strictly within your local PostgreSQL instance.
          </p>
        </div>

        {/* macOS Terminal Window (Dub / Developer Dark Aesthetic) */}
        <div className="max-w-3xl mx-auto bg-[#141417] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <div className="px-4 py-3 bg-[#19191d] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl text-xs border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab("docker")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === "docker"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Docker Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("windows")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === "windows"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Windows (setup.bat)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  activeTab === "manual"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Manual (Node.js)
              </button>
            </div>

            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 hover:text-white text-[11px] font-medium transition-all active:scale-[0.97]"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal Content */}
          <div className="p-6 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto bg-[#0e0e11]">
            <pre>{snippets[activeTab]}</pre>
          </div>
        </div>

        {/* Requirements info row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-6 text-xs">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.08] text-zinc-400">
            <strong className="text-white block mb-1 font-semibold">Runtime Environment</strong>
            Node.js 20+ or Docker Desktop on Windows, Linux, or macOS.
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.08] text-zinc-400">
            <strong className="text-white block mb-1 font-semibold">Database Layer</strong>
            PostgreSQL 15+ (Pre-packaged in Docker or external URI).
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.08] text-zinc-400">
            <strong className="text-white block mb-1 font-semibold">AI Model Providers</strong>
            BYOK support: Groq, Gemini, Claude, or local Ollama instances.
          </div>
        </div>
      </div>
    </section>
  );
}
