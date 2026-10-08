"use client";

// ============================================================
// HH Job Copilot — 404 & Under Construction Page
// Professional Elementor Pro / WordPress maintenance kit inspired layout
// STRICT REQUIREMENT: ZERO EMOJIS (All icons are vector Lucide SVGs)
// Features: 2D animated engineer scene, live countdown clock,
// system progress bar, feature pill tags, Telegram & Email direct contact.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  Mail,
  Copy,
  Check,
  Github,
  Clock,
  ShieldAlert,
  ArrowRight,
  Lock,
  ExternalLink,
  Star,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

// Target Launch Date: October 24, 2026 00:00:00 UTC
const LAUNCH_DATE_MS = new Date("2026-10-24T00:00:00Z").getTime();

export default function UnderConstruction404({ is404 = true }: { is404?: boolean }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calculateCountdown() {
      const now = Date.now();
      const diff = Math.max(0, LAUNCH_DATE_MS - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyEmail = async () => {
    await navigator.clipboard.writeText("nandazhafran@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Background Ambience: Blueprint Grid + Glowing Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),rgba(9,11,14,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a12_1px,transparent_1px),linear-gradient(to_bottom,#27272a12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-zinc-800/60 bg-[#090b0e]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-sm tracking-wider text-zinc-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            HH
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-100 tracking-tight">HH Job Copilot</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold uppercase">
                Under Construction
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">Autonomous AI Job Search for HeadHunter</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/nnavyy/automation-vacancy-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-all shadow-sm"
          >
            <Github className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">GitHub Repository</span>
            <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Star
            </span>
          </a>
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-semibold text-emerald-400 transition-all"
            title="Private Developer Access"
          >
            <Lock className="w-3 h-3" />
            <span className="hidden sm:inline">Admin Login</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 sm:py-14 flex-1 flex flex-col items-center justify-center text-center">
        
        {/* 2D Animated Illustration (Elementor Pro / WordPress Vector Technical Scene) */}
        <div className="relative w-full max-w-md h-64 sm:h-72 mb-4 flex items-center justify-center select-none">
          {/* Pulsing Backlight Glow */}
          <div className="absolute w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none -bottom-4" />

          {/* SVG 2D Scene with floating animations */}
          <svg
            viewBox="0 0 500 320"
            className="w-full h-full drop-shadow-2xl overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gradDesk" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="gradMonitor" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="gradBadge" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Platform / Floating Island Base */}
            <ellipse cx="250" cy="275" rx="190" ry="24" fill="#0f172a" opacity="0.6" />
            <ellipse cx="250" cy="270" rx="160" ry="16" fill="#182234" opacity="0.8" />

            {/* Workstation Desk */}
            <rect x="150" y="210" width="200" height="12" rx="4" fill="url(#gradDesk)" stroke="#334155" strokeWidth="2" />
            <line x1="180" y1="222" x2="175" y2="265" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
            <line x1="320" y1="222" x2="325" y2="265" stroke="#334155" strokeWidth="4" strokeLinecap="round" />

            {/* Glowing Dual Monitors */}
            {/* Monitor 1 (Main AI Code Terminal) */}
            <rect x="180" y="130" width="85" height="65" rx="5" fill="#090d16" stroke="#10b981" strokeWidth="2" />
            <line x1="222" y1="195" x2="222" y2="210" stroke="#334155" strokeWidth="3" />
            {/* Terminal Lines on Monitor 1 */}
            <rect x="188" y="140" width="40" height="4" rx="2" fill="#10b981" opacity="0.8" />
            <rect x="188" y="148" width="65" height="3" rx="1.5" fill="#38bdf8" opacity="0.7" />
            <rect x="188" y="155" width="50" height="3" rx="1.5" fill="#a78bfa" opacity="0.7" />
            <rect x="188" y="162" width="60" height="3" rx="1.5" fill="#64748b" opacity="0.6" />
            <rect x="188" y="172" width="24" height="12" rx="2" fill="#10b981" opacity="0.2" />
            <text x="192" y="181" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">94%</text>

            {/* Monitor 2 (HeadHunter Vacancy Pipeline) */}
            <rect x="275" y="140" width="75" height="55" rx="5" fill="#090d16" stroke="#3b82f6" strokeWidth="2" />
            <line x1="312" y1="195" x2="312" y2="210" stroke="#334155" strokeWidth="3" />
            <rect x="282" y="148" width="55" height="5" rx="2" fill="#ef4444" opacity="0.7" />
            <rect x="282" y="158" width="45" height="3" rx="1.5" fill="#38bdf8" opacity="0.6" />
            <rect x="282" y="165" width="58" height="3" rx="1.5" fill="#64748b" opacity="0.6" />

            {/* 2D Character (Engineer at Work with Hardhat / Headphones) */}
            <g className="animate-[bounce_3s_ease-in-out_infinite]">
              {/* Chair Backrest */}
              <rect x="105" y="170" width="30" height="55" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
              {/* Character Body / Torso */}
              <path d="M115 190 Q130 185 145 190 L140 240 Q125 242 110 240 Z" fill="#0284c7" />
              {/* Arms Typing */}
              <path d="M140 198 Q165 208 175 208" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
              <circle cx="178" cy="208" r="4" fill="#fcd34d" />
              {/* Head */}
              <circle cx="130" cy="162" r="14" fill="#fcd34d" />
              {/* Hair / Cap / Construction Hardhat */}
              <path d="M114 160 Q130 144 146 160 L148 162 L112 162 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
              <rect x="110" y="161" width="40" height="3" rx="1.5" fill="#f59e0b" />
              {/* Headphones / Glasses */}
              <path d="M120 152 Q130 148 140 152" stroke="#475569" strokeWidth="2.5" fill="none" />
              <rect x="118" y="156" width="4" height="8" rx="2" fill="#059669" />
              <rect x="138" y="156" width="4" height="8" rx="2" fill="#059669" />
            </g>

            {/* Animated Rotating Gear (Construction / Engine) */}
            <g className="animate-[spin_12s_linear_infinite]" style={{ transformOrigin: "85px 95px" }}>
              <circle cx="85" cy="95" r="18" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 3" />
              <circle cx="85" cy="95" r="7" fill="#f59e0b" opacity="0.3" />
            </g>

            {/* Floating Gear 2 (Smaller Cyan Gear) */}
            <g className="animate-[spin_8s_linear_infinite_reverse]" style={{ transformOrigin: "115px 75px" }}>
              <circle cx="115" cy="75" r="11" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray="4 2" />
            </g>

            {/* Floating 2D AI Copilot Bot with Antenna */}
            <g className="animate-[bounce_4s_ease-in-out_infinite]">
              <rect x="370" y="90" width="38" height="32" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />
              {/* Bot Eyes */}
              <circle cx="381" cy="106" r="3.5" fill="#34d399" />
              <circle cx="397" cy="106" r="3.5" fill="#34d399" />
              {/* Bot Antenna */}
              <line x1="389" y1="90" x2="389" y2="80" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <circle cx="389" cy="78" r="3" fill="#34d399" />
              {/* Bot Floating Wings */}
              <path d="M364 104 Q360 98 368 96" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <path d="M414 104 Q418 98 410 96" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Animated Floating 404 & Hazard Badge */}
            <g className="animate-[bounce_2.5s_ease-in-out_infinite]">
              <rect x="215" y="45" width="110" height="38" rx="8" fill="#18181b" stroke="url(#gradBadge)" strokeWidth="2" filter="url(#glow)" />
              <text x="270" y="70" fill="#f8fafc" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="900" textAnchor="middle" letterSpacing="2">
                404
              </text>
            </g>

            {/* Floating Code Brackets and Sparks */}
            <text x="60" y="160" fill="#10b981" fontSize="18" fontFamily="monospace" fontWeight="bold" opacity="0.7" className="animate-pulse">
              &lt; / &gt;
            </text>
            <text x="415" y="180" fill="#a855f7" fontSize="20" fontFamily="monospace" fontWeight="bold" opacity="0.6">
              &#123; &#125;
            </text>
            <circle cx="160" cy="80" r="2.5" fill="#f59e0b" className="animate-ping" />
            <circle cx="340" cy="60" r="2" fill="#38bdf8" className="animate-ping" />
          </svg>
        </div>

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3 shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
          <span>{is404 ? "HTTP 404 · Route Under Construction" : "Private Beta · Maintenance Mode"}</span>
        </div>

        {/* Big Bold Headline (WordPress / Elementor Pro Style) */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-100 max-w-2xl mb-3 leading-tight">
          We&apos;re Building Something <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">Extraordinary</span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mb-6 leading-relaxed">
          The public portal is temporarily closed while our neural scoring engine, HeadHunter session pipeline, and telemetry models undergo final closed-beta calibration.
        </p>

        {/* Feature Pills (Elementor Pro Style) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <Cpu className="w-3 h-3 text-emerald-400" /> Neural Vacancy Matching
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <Layers className="w-3 h-3 text-sky-400" /> Recruiter Decision Dossier
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Humanized Anti-Ban Throttling
          </span>
        </div>

        {/* Progress Bar (Elementor Pro Maintenance Gauge) */}
        <div className="w-full max-w-xl bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 mb-6 text-left backdrop-blur-md">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-400 font-mono flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Engine Calibration &amp; Pipeline Sync
            </span>
            <span className="font-mono font-bold text-emerald-400">88% Completed</span>
          </div>
          <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full w-[88%] relative">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Live Countdown Timer Section */}
        <div className="w-full max-w-xl bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 sm:p-7 mb-8 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Release Countdown</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              October 24–26, 2026
            </div>
          </div>

          {/* 4 Counter Boxes */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="bg-[#090b0e] border border-zinc-800 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {String(timeLeft.days).padStart(2, "0")}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Days
              </div>
            </div>

            <div className="bg-[#090b0e] border border-zinc-800 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight">
                {String(timeLeft.hours).padStart(2, "0")}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Hours
              </div>
            </div>

            <div className="bg-[#090b0e] border border-zinc-800 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-zinc-100 tracking-tight">
                {String(timeLeft.minutes).padStart(2, "0")}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Minutes
              </div>
            </div>

            <div className="bg-[#090b0e] border border-zinc-800 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-4xl font-extrabold font-mono text-amber-400 tracking-tight">
                {String(timeLeft.seconds).padStart(2, "0")}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                Seconds
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Early Access Section (Telegram + Email) */}
        <div className="w-full max-w-xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Need Early Beta Access or Have Questions? Contact Creator Directly:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Telegram Contact Button */}
            <a
              href="https://t.me/wonkiiy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/25 hover:border-sky-500/40 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 font-medium">Telegram Direct</p>
                  <p className="text-xs font-bold text-sky-300 truncate">@wonkiiy</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-sky-400/60 group-hover:text-sky-300 transition-colors" />
            </a>

            {/* Email Contact with Copy Action */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-left transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 font-medium">Direct Email</p>
                  <p className="text-xs font-mono text-zinc-200 truncate">nandazhafran@gmail.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyEmail}
                className="p-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 transition-colors shrink-0"
                title="Copy email to clipboard"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer (STRICT ZERO EMOJI) */}
      <footer className="relative z-10 border-t border-zinc-800/60 bg-[#090b0e]/90 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <div>
          <span>© 2026 HH Job Copilot. Autonomous AI platform for software engineers.</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/nnavyy/automation-vacancy-finder"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <span>GitHub Launchpad</span>
            <ArrowRight className="w-3 h-3" />
          </a>
          <span className="text-zinc-700">·</span>
          <Link href="/login" className="hover:text-zinc-400 transition-colors font-mono text-[11px]">
            Private Auth
          </Link>
        </div>
      </footer>
    </div>
  );
}
