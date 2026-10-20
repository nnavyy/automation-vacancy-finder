"use client";

import React, { useState } from "react";
import { Download, FileArchive, RefreshCw, Layers, ShieldCheck } from "lucide-react";

export default function DownloadHub() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (type: string = "source") => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = `/api/download?type=${type}`;
    link.download = `hh-job-copilot-${type === "compose" ? "docker" : "source"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <section id="download" className="py-20 md:py-28 bg-[#09090b] border-t border-white/[0.08] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Download Open-Source Release
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Directly packaged on this server with zero external redirects. Extract the archive, configure your parameters, and run locally.
          </p>
        </div>

        {/* Download Cards */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Full Source Archive */}
          <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white mb-4">
                <FileArchive className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
                Full Source Archive (.ZIP)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-5 font-normal">
                Includes the complete Next.js full-stack application, Prisma schemas, background collection daemon, Chrome session extension, and documentation.
              </p>

              <div className="space-y-1.5 text-xs text-zinc-400 mb-6 border-y border-white/[0.08] py-3.5">
                <div className="flex items-center justify-between">
                  <span>Format</span>
                  <span className="font-medium text-white">.ZIP archive</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Size</span>
                  <span className="font-medium text-emerald-400">384 KB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-medium text-white">Direct localhost bundle</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownload("source")}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-xs text-black bg-white hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Archive...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Source (.ZIP)</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Docker Compose Bundle */}
          <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white mb-4">
                <Layers className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
                Docker Compose Release
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-5 font-normal">
                Pre-configured multi-container package containing the standalone Next.js container, PostgreSQL service, and persistent volume definitions.
              </p>

              <div className="space-y-1.5 text-xs text-zinc-400 mb-6 border-y border-white/[0.08] py-3.5">
                <div className="flex items-center justify-between">
                  <span>Configuration</span>
                  <span className="font-medium text-white">Dockerfile + docker-compose</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Database</span>
                  <span className="font-medium text-white">PostgreSQL 16 Alpine</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Command</span>
                  <span className="font-mono text-zinc-300">docker compose up -d</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownload("compose")}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-xs text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 active:scale-[0.98] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Download Docker Bundle</span>
            </button>
          </div>
        </div>

        {/* Footnote */}
        <div className="max-w-3xl mx-auto mt-6 p-4 rounded-xl bg-zinc-900/40 border border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Open Source under MIT License &middot; Verified Local Package</span>
          </div>
          <span>Version 1.0.0 Stable</span>
        </div>
      </div>
    </section>
  );
}
