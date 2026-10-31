"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Send, MapPin, ArrowRight, Sparkles, ShieldCheck, Eye, Terminal, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HeroSection() {
  const [windowView, setWindowView] = useState<"card" | "dashboard">("card");
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const techLogos = [
    { name: "HeadHunter", src: "/assets/hh-logo.png", isPng: true },
    { name: "Telegram", src: "/assets/telegram.svg" },
    { name: "React 19", src: "/assets/react.svg" },
    { name: "Next.js 16", src: "/assets/nextjs.svg" },
    { name: "TypeScript", src: "/assets/typescript.svg" },
    { name: "PostgreSQL", src: "/assets/postgresql.svg" },
    { name: "Docker", src: "/assets/docker.svg" },
    { name: "Google Gemini", src: "/assets/gemini.svg" },
    { name: "Anthropic Claude", src: "/assets/claude.svg" },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-28 bg-[#09090b] text-white overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-violet-600/10 via-emerald-600/10 to-transparent blur-3xl pointer-events-none" />



      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center pt-4">
        {/* Display Headline (Slide Down) */}
        <motion.h1
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl lg:text-[76px] font-semibold text-white tracking-tight leading-[1.05] max-w-4xl mx-auto mb-6"
        >
          HeadHunter search,
          <br />
          <span className="text-zinc-500">completely autonomous.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Configure your developer stack, salary floor, and target criteria. HH Job Copilot scans hh.ru public feeds, calculates compatibility with multi-tier AI, filters out ghost openings, and sends verified leads directly to Telegram.
        </motion.p>

        {/* Action Buttons (Pop In) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto mb-12"
        >
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-200 active:scale-[0.97] transition-all shadow-md"
          >
            <span>Start Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <a
            href="#preview"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 active:scale-[0.97] transition-all"
          >
            <span>Live Interactive Preview</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </motion.div>

        {/* Hardware-Grade Mockup Window (With Interactive vs Screenshot Toggle) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto mb-16 relative"
        >
          <div className="relative bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left">
            {/* Window Topbar */}
            <div className="px-5 py-3 bg-[#121216] border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] inline-block opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] inline-block opacity-80" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] inline-block opacity-80" />
                <span className="ml-3 text-[12px] font-normal text-zinc-400">
                  HH Job Copilot - Autonomous Monitor
                </span>
              </div>

              {/* View Switcher: Interactive Card vs Production Dashboard */}
              <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/[0.06] text-[11px]">
                <button
                  type="button"
                  onClick={() => setWindowView("card")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    windowView === "card"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Live Pipeline Card
                </button>
                <button
                  type="button"
                  onClick={() => setWindowView("dashboard")}
                  className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    windowView === "dashboard"
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Production View</span>
                </button>
              </div>
            </div>

            {/* Window Body */}
            <AnimatePresence mode="wait">
              {windowView === "card" ? (
                <motion.div
                  key="view-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 sm:p-7 space-y-5 bg-[#0e0e11]"
                >
                  {/* Profile Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-xs font-bold">
                        RF
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white">
                          React Full Stack Candidate
                        </h3>
                        <div className="text-[11px] text-zinc-400">
                          Target: Next.js 16, Node.js, PostgreSQL · Minimum 250,000 RUB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>Cadence: 2h</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-emerald-400 font-medium">24 High Matches Found</span>
                    </div>
                  </div>

                  {/* Sample High-Match Listing */}
                  <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-white/20 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          Senior Full Stack Engineer (React 19 / Node.js)
                        </span>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                        <span className="text-zinc-200 font-medium">Yandex Cloud</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" /> Moscow / Remote
                        </span>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">
                          350,000 - 450,000 RUB
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">React 19</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Next.js</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">PostgreSQL</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="text-base font-bold leading-none">94%</span>
                        <span className="text-[8px] uppercase tracking-wider font-medium mt-0.5">Score</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white" title="Delivered to Telegram">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="view-dashboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="relative group overflow-hidden bg-black"
                >
                  <img
                    src="/screenshots/01_dashboard_overview.png"
                    alt="HH Job Copilot Production Dashboard"
                    className="w-full h-auto object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-xs text-zinc-300 font-medium">
                        Production Next.js Dashboard: AI scoring distribution, active vacancy table, and recruiter contacts.
                      </div>
                      <a
                        href="/demo"
                        className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-zinc-200 transition-colors shrink-0"
                      >
                        <span>Open Live Sandbox</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tech Ecosystem Logos Bar */}
        <div className="pt-6 border-t border-white/[0.08]">
          <div className="text-[11px] tracking-wider uppercase text-zinc-500 font-semibold mb-5">
            Designed for Open Standards &amp; Local Execution
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {techLogos.map((tech, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 text-xs font-normal text-zinc-300 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full border border-white/[0.06] transition-colors cursor-pointer"
              >
                <img
                  src={tech.src}
                  alt={tech.name}
                  className="w-3.5 h-3.5 object-contain"
                />
                <span>{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
