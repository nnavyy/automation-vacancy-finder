"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Github,
  Globe,
  Mail,
  Instagram,
  ShieldCheck,
  Terminal,
  Database,
  Cpu,
  ArrowUpRight,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Code2,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AboutClientProps {
  userEmail?: string | null;
}

const GALLERY_ITEMS = [
  {
    id: "dashboard",
    title: "Production Dashboard & Live Vacancy Feed",
    desc: "Real-time HeadHunter vacancies evaluated by AI with compatibility ratings, compensation filters, and fast status toggles.",
    src: "/screenshots/01_dashboard_overview.png",
    tag: "Core Workspace",
  },
  {
    id: "split-view",
    title: "Split-View Candidate Review Workspace",
    desc: "Inspect full vacancy specifications, extracted tech stacks, and deterministic filter assertions side-by-side.",
    src: "/screenshots/02_vacancies_split_view.png",
    tag: "Review Engine",
  },
  {
    id: "recruiter-osint",
    title: "Engineering Recruiter OSINT Dossier",
    desc: "Automated corporate domain resolution and direct hiring manager outreach to bypass flooded applicant portals.",
    src: "/screenshots/06_find_recruiter_dossier.png",
    tag: "OSINT Intelligence",
  },
  {
    id: "analytics",
    title: "Application Conversion & Funnel Analytics",
    desc: "Historical metrics tracking total scanned vacancies, AI synergy breakdown, and interview callback rates.",
    src: "/screenshots/05_analytics_funnel.png",
    tag: "Telemetry",
  },
];

const TECH_STACK = [
  { name: "Next.js 16", src: "/assets/nextjs.svg" },
  { name: "React 19", src: "/assets/react.svg" },
  { name: "TypeScript", src: "/assets/typescript.svg" },
  { name: "PostgreSQL", src: "/assets/postgresql.svg" },
  { name: "Tailwind CSS", src: "/assets/tailwind.svg" },
  { name: "Docker", src: "/assets/docker.svg" },
];

export default function AboutClient({ userEmail }: AboutClientProps) {
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  const nextSlide = () => {
    setActiveGalleryIdx((prev) => (prev + 1) % GALLERY_ITEMS.length);
  };

  const prevSlide = () => {
    setActiveGalleryIdx((prev) => (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
  };

  return (
    <main className="pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navigation Breadcrumb (Slide Down) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </motion.div>

      {/* Profile Header (Slide from Left & Fade) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#0e0e11] border border-white/10 rounded-2xl p-8 sm:p-10 shadow-2xl mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Nanda (Zhafran)
            </h1>
            <p className="text-base text-zinc-300 font-medium">
              Full-Stack Engineer &amp; Automation Specialist
            </p>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Building web applications, web scrapers, and developer automation tools. Focused on clean TypeScript codebases, fast local workflows, and robust PostgreSQL databases.
            </p>

            {/* Tech Stack Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {TECH_STACK.map((tech, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-[11px] text-zinc-300"
                >
                  <img src={tech.src} alt={tech.name} className="w-3.5 h-3.5 object-contain" />
                  <span>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Badges (Slide in from Right) */}
          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <a
              href="https://nandaz-portofolio.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-black bg-white hover:bg-zinc-200 transition-all shadow-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Portfolio</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-500" />
            </a>
            <a
              href="https://github.com/nnavyy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub @nnavyy</span>
            </a>
            <a
              href="mailto:nandazhafran@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Email</span>
            </a>
            <a
              href="https://www.instagram.com/rrqac_zsyons/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@rrqac_zsyons</span>
            </a>
          </div>
        </div>

        {/* Mission & Why HH Job Copilot was Built */}
        <div className="pt-8 space-y-6 text-xs text-zinc-300 leading-relaxed">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">
              Why I Built HH Job Copilot
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-3">
              Most commercial job automation SaaS tools (like LoopCV, LazyApply, or Sonara) charge anywhere from $39 to $199 every month. Despite their high subscription fees, they suffer from critical limitations:
            </p>
            <ul className="space-y-2 text-zinc-300 pl-4 list-disc marker:text-zinc-600 mb-4">
              <li>They fail completely on HeadHunter (hh.ru) because they lack Cyrillic text parsing, composite search query handling, and Russian IT terminology models.</li>
              <li>They enforce strict daily quotas (10 - 25 applications per day) to force users into higher paid tiers.</li>
              <li>They store your resume, credentials, and search behaviors on proprietary third-party cloud servers with zero privacy guarantees.</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed">
              I engineered <strong>HH Job Copilot</strong> as a modern, dedicated AI copilot and career automation service. It operates directly against HeadHunter&apos;s public feeds, executes high-precision AI evaluations on secure infrastructure, enforces a curated vacancy cap to keep your pipeline clean and relevant, and delivers high-synergy listings straight to your personal Telegram.
            </p>
          </div>

          {/* Core Engineering Tenets */}
          <div className="pt-4 border-t border-white/[0.08]">
            <h2 className="text-base font-semibold text-white mb-4">
              Core Engineering Tenets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
                <div className="font-semibold text-white mb-1">Zero-Trust &amp; Privacy</div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  All session tokens and API keys are encrypted with AES-256-GCM. Your candidate data never leaves your local PostgreSQL database.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <Database className="w-4 h-4 text-sky-400 mb-2" />
                <div className="font-semibold text-white mb-1">Idempotent Pipelines</div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Compound indexing and bounded concurrency pools eliminate duplicate postings, rate-limit bans, and database table bloat.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <Cpu className="w-4 h-4 text-violet-400 mb-2" />
                <div className="font-semibold text-white mb-1">Task-Specific AI Routing</div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Fast-tier models (Groq/Gemini Flash) handle high-volume compatibility scoring, while advanced reasoning is reserved for cover letter synthesis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Production Project Showcase Gallery Carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/[0.08] gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mt-1">
              HH Job Copilot in Production
            </h2>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              title="Previous Screenshot"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-500 px-2">
              {activeGalleryIdx + 1} / {GALLERY_ITEMS.length}
            </span>
            <button
              type="button"
              onClick={nextSlide}
              className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              title="Next Screenshot"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Gallery Preview Box */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black group">
            <AnimatePresence mode="wait">
              <motion.img
                key={GALLERY_ITEMS[activeGalleryIdx].id}
                src={GALLERY_ITEMS[activeGalleryIdx].src}
                alt={GALLERY_ITEMS[activeGalleryIdx].title}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="w-full h-auto max-h-[520px] object-cover object-top"
              />
            </AnimatePresence>

            {/* Tag Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-black/80 border border-white/20 text-xs font-mono text-white backdrop-blur-md">
                {GALLERY_ITEMS[activeGalleryIdx].tag}
              </span>
            </div>
          </div>

          {/* Screenshot Caption & Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {GALLERY_ITEMS[activeGalleryIdx].title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {GALLERY_ITEMS[activeGalleryIdx].desc}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 shrink-0">
              {GALLERY_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveGalleryIdx(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    activeGalleryIdx === idx
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border border-white/[0.06] hover:text-white"
                  }`}
                >
                  0{idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
