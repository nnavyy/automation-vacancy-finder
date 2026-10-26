"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rss,
  Sparkles,
  ShieldCheck,
  Send,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Zap,
  Lock,
  Globe,
  Sliders,
  CheckCheck
} from "lucide-react";

export default function ScrollStorySection() {
  const [activeStep, setActiveStep] = useState(1);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Smooth scroll sync with equal 3-way distribution (0-33%, 33-66%, 66-100%)
  // without artificial dead space or scrolling into an empty void
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Section is in viewing range
      const sectionHeight = rect.height;
      if (rect.top > windowHeight || rect.bottom < 0) return;

      const visibleProgress = Math.max(0, Math.min(1, (windowHeight * 0.7 - rect.top) / (sectionHeight + windowHeight * 0.4)));

      if (visibleProgress < 0.35) {
        setActiveStep(1);
      } else if (visibleProgress < 0.70) {
        setActiveStep(2);
      } else {
        setActiveStep(3);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("d.ivanova@desten-partners.ru");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyTg = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("@daria_desten_hr");
    setCopiedTg(true);
    setTimeout(() => setCopiedTg(false), 2000);
  };

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#09090b] text-white py-20 md:py-28 border-t border-white/[0.06] overflow-hidden"
    >
      {/* Background Dot Grid Pattern with radial fade */}
      <div
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[450px] h-[350px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[450px] h-[350px] bg-sky-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Step Indicator Tabs with Pop Motion */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-12">
          {[
            { id: 1, label: "01 Ingestion", icon: Rss, color: "text-amber-400" },
            { id: 2, label: "02 AI Scoring", icon: Sparkles, color: "text-emerald-400" },
            { id: 3, label: "03 Recruiter Outreach", icon: ShieldCheck, color: "text-sky-400" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStep === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStep(tab.id)}
                className={`relative px-4 py-2 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-white text-black font-semibold shadow-xl scale-105"
                    : "bg-zinc-900/90 text-zinc-400 border border-white/[0.08] hover:text-white hover:border-white/20"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : tab.color}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-white rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 3-Column Layout: Left UI Preview | Center Typography | Right UI Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ================= LEFT VISUAL PREVIEW (Slide in from Left: x: -60 -> 0) ================= */}
          <div className="lg:col-span-3 hidden lg:block">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="left-step-1"
                  initial={{ opacity: 0, x: -60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="space-y-3"
                >
                  {/* Live RSS Stream Card */}
                  <div className="p-4 rounded-2xl bg-[#0e0e13] border border-amber-500/20 shadow-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-1.5 text-amber-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                        <span>RSS Stream</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">Jitter: 780ms</span>
                    </div>

                    <div className="bg-black/60 rounded-xl p-2.5 font-mono text-[10px] text-zinc-300 space-y-1">
                      <div className="text-zinc-500">&lt;rss version=&quot;2.0&quot;&gt;</div>
                      <div className="text-amber-300 pl-2">&lt;item&gt;</div>
                      <div className="text-zinc-300 pl-4 truncate">&lt;title&gt;React 19 / TS&lt;/title&gt;</div>
                      <div className="text-emerald-400 pl-4">&lt;salary&gt;250k RUB&lt;/salary&gt;</div>
                      <div className="text-amber-300 pl-2">&lt;/item&gt;</div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span>hh.ru/react-fullstack</span>
                      <span className="text-emerald-400 font-mono font-medium">Parsed OK</span>
                    </div>
                  </div>

                  {/* Normalized Data Payload Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="p-3.5 rounded-2xl bg-[#121218] border border-white/10 shadow-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-white font-medium">NFC Cleaned</span>
                      <span className="text-[10px] font-mono text-emerald-400">0 Throttling</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                      <span>Rate-Limit Immune</span>
                      <span>&middot;</span>
                      <span>No Russian Entity Req</span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="left-step-2"
                  initial={{ opacity: 0, x: -60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="p-5 rounded-2xl bg-[#0e0e13] border border-emerald-500/30 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-400">AI Compatibility</span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      380ms Latency
                    </span>
                  </div>

                  {/* Visual Radial Gauge SVG */}
                  <div className="flex items-center justify-center py-2 relative">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        stroke="#27272a"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="45"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 17 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-white">94%</span>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
                        Synergy
                      </span>
                    </div>
                  </div>

                  {/* Fast Tier Model Indicator */}
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] text-center text-[10px] font-mono text-zinc-400">
                    Engine: <strong className="text-zinc-200">Groq Llama 3.3 70B</strong>
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="left-step-3"
                  initial={{ opacity: 0, x: -60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="p-5 rounded-2xl bg-[#0e0e13] border border-sky-500/30 shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-950 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center">
                      DI
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Daria Ivanova</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      </div>
                      <div className="text-[10px] text-zinc-400">Lead Tech Recruiter</div>
                    </div>
                  </div>

                  <div
                    onClick={handleCopyTg}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between text-xs cursor-pointer hover:border-sky-500/40 transition-colors"
                  >
                    <div className="font-mono text-sky-400 text-[11px]">@daria_desten_hr</div>
                    {copiedTg ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </div>

                  <div
                    onClick={handleCopyEmail}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-between text-xs cursor-pointer hover:border-sky-500/40 transition-colors"
                  >
                    <div className="font-mono text-zinc-300 text-[11px] truncate max-w-[150px]">
                      d.ivanova@desten-partners.ru
                    </div>
                    {copiedEmail ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Verified Corporate DNS</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ================= CENTER STORYTELLING NARRATIVE ================= */}
          <div className="lg:col-span-6 text-center lg:text-left space-y-6 max-w-2xl mx-auto px-2">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Job hunting isn&apos;t just about spamming resumes.
              </div>
              <div className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-400 leading-tight">
                It&apos;s about outcomes.
              </div>
            </motion.div>

            <div className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal">
              HH Job Copilot is the modern vacancy platform that unifies{" "}
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  activeStep === 1
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm"
                    : "bg-zinc-900 border-white/10 text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <Rss className="w-3.5 h-3.5 text-amber-400" />
                <span>RSS Feeds</span>
              </button>
              ,{" "}
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  activeStep === 2
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm"
                    : "bg-zinc-900 border-white/10 text-emerald-400/80 hover:text-emerald-300"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Scoring</span>
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  activeStep === 3
                    ? "bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm"
                    : "bg-zinc-900 border-white/10 text-sky-400/80 hover:text-sky-300"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Recruiter Dossiers</span>
              </button>{" "}
              , all in one place.
            </div>

            <div className="space-y-1 text-sm text-zinc-400">
              <p className="text-zinc-300 font-medium">No cloud trackers or paid subscription tiers.</p>
              <p className="text-zinc-400">Runs locally against your PostgreSQL database.</p>
            </div>

            <div className="text-xs text-zinc-400 leading-relaxed">
              Because you deserve more than recruiter blackholes. You deserve clarity.
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition-all shadow-md active:scale-95"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/architecture"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-zinc-300 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:text-white transition-all"
              >
                <span>System Architecture</span>
              </Link>
            </div>
          </div>

          {/* ================= RIGHT VISUAL PREVIEW (Slide in from Right: x: 60 -> 0) ================= */}
          <div className="lg:col-span-3 hidden lg:block">
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="right-step-1"
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="p-5 rounded-2xl bg-[#0e0e13] border border-white/10 shadow-2xl space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                    <span className="text-[11px] font-mono text-zinc-400">Cleaned Vacancy</span>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/20">
                      Live Lead
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white">
                    Fullstack Developer (React 19 / Next.js)
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Дэстэн Партнерс &middot; Москва &middot; Remote
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
                      React 19
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
                      Next.js
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
                      PostgreSQL
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 text-[10px] text-zinc-300 flex items-center justify-between">
                    <span>Net: 180,000 - 250,000 RUR</span>
                    <span className="text-emerald-400 font-mono font-medium">13% NDFL</span>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div
                  key="right-step-2"
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="p-5 rounded-2xl bg-[#0e0e13] border border-emerald-500/30 shadow-2xl space-y-3"
                >
                  <div className="text-xs font-semibold text-white flex items-center justify-between">
                    <span>Skills Synergy Match</span>
                    <span className="text-[10px] font-mono text-emerald-400">94/100</span>
                  </div>

                  {/* Visual Skill Match Progress Bars */}
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-300">
                        <span>React 19 &amp; Next.js 16</span>
                        <span className="text-emerald-400 font-mono">98%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "98%" }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-300">
                        <span>TypeScript Strict Mode</span>
                        <span className="text-emerald-400 font-mono">95%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "95%" }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-300">
                        <span>PostgreSQL &amp; Prisma Schemas</span>
                        <span className="text-emerald-400 font-mono">90%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "90%" }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Meets 250k RUB salary floor</span>
                  </div>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div
                  key="right-step-3"
                  initial={{ opacity: 0, x: 60, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="p-4 rounded-2xl bg-[#0d1622] border border-sky-500/40 shadow-2xl space-y-3 text-xs"
                >
                  {/* Authentic Telegram Chat Bubble Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-black">
                      <Send className="w-3 h-3" />
                    </div>
                    <span className="font-semibold text-white text-[11px]">
                      HH Job Copilot Bot
                    </span>
                    <span className="ml-auto text-[9px] text-zinc-400 font-mono">10:42 AM</span>
                  </div>

                  {/* Telegram Message Payload */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-zinc-200 leading-snug space-y-1.5 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Fullstack Developer</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        94% Match
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[10px]">Дэстэн Партнерс &middot; 250,000 RUR</p>
                    <p className="text-[10px] text-sky-300 font-mono">Recruiter: @daria_desten_hr</p>
                  </div>

                  {/* Telegram Inline Buttons */}
                  <div className="pt-1 flex gap-2">
                    <a
                      href="https://hh.ru"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-semibold text-[10px] transition-colors text-center inline-block"
                    >
                      Open on hh.ru
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyTg}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition-colors"
                    >
                      {copiedTg ? "Copied" : "Copy Recruiter"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
