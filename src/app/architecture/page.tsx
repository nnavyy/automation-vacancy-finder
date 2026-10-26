"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  FileCode,
  CheckCircle2,
  Send,
  Database,
  Sparkles,
  ShieldCheck,
  Search,
  MessageSquare,
  HelpCircle,
  Plus,
  Minus,
  Maximize2,
  Eye,
  Layers,
  Zap,
  Activity,
  ShieldAlert,
  Server,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

interface StageItem {
  id: string;
  stepNumber: string;
  timestamp: string;
  markerColor: string;
  headline: string;
  narrative: string;
  bullets: string[];
  card: {
    channel: string;
    sourceTag: string;
    badgeIconText: string;
    badgeSender: string;
    eventTitle: string;
    endpointMethod: string;
    endpointUrl: string;
    stats: { label: string; value: string; isSuccess?: boolean }[];
    detailTitle: string;
    detailBody: string;
    actionLabel: string;
    expandablePayload?: string;
    diagramSrc?: string;
    diagramLabel?: string;
    footerStatus: string;
    footerSubtext: string;
  };
}

const STAGES: StageItem[] = [
  {
    id: "ingestion",
    stepNumber: "01",
    timestamp: "00:00.000",
    markerColor: "bg-rose-500",
    headline: "Your crawler catches it first",
    narrative:
      "Target search terms get decomposed into boolean RSS queries with randomized delays. Instead of dealing with hh.ru's restricted employer API and OAuth keys - which require a registered Russian business entity and hits rate limits after a few dozen calls - the worker pulls raw XML directly, normalizes Cyrillic encodings, and parses net salary figures.",
    bullets: [
      "Rate-limit immune RSS 2.0 XML polling",
      "Unicode NFC and mixed-Cyrillic character normalization",
      "Net salary parser with 13% NDFL Russian tax calculation",
    ],
    card: {
      channel: "#feed-ingestion",
      sourceTag: "hh.ru · public rss",
      badgeIconText: "hh",
      badgeSender: "hh-copilot APP",
      eventTitle: "New feed parsed: React & Next.js",
      endpointMethod: "GET",
      endpointUrl: "https://hh.ru/rss/vacancies?text=React+Next.js&search_field=name",
      stats: [
        { label: "Status", value: "200 OK", isSuccess: true },
        { label: "Items Ingested", value: "34 vacancies" },
        { label: "Fetch Latency", value: "312 ms" },
        { label: "Jitter Spread", value: "840 ms ± 30%" },
      ],
      detailTitle: "Parsed Vacancy Example",
      detailBody:
        "Fullstack Developer (React 19 / TypeScript) · Дэстэн Партнерс · Москва · Remote · Net salary: 180,000 - 250,000 RUR",
      actionLabel: "Inspect Raw XML Payload",
      expandablePayload: `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>hh.ru: React Next.js</title>
    <item>
      <title>Фронтенд разработчик (React 19 / TypeScript)</title>
      <link>https://hh.ru/vacancy/1094821</link>
      <description>Дэстэн Партнерс. Требуемый опыт: 3-6 лет. Полная занятость, удаленная работа. Зарплата от 180 000 до 250 000 руб. на руки.</description>
      <pubDate>Mon, 19 Oct 2026 00:00:00 +0300</pubDate>
    </item>
  </channel>
</rss>`,
      footerStatus: "Also User-Agent rotated · Deduplication verified · Zero 429 errors",
      footerSubtext: "34 items parsed, 0 rate limit penalties",
    },
  },
  {
    id: "rules",
    stepNumber: "02",
    timestamp: "00:00.820",
    markerColor: "bg-amber-500",
    headline: "Kill ghost postings and verify the salary floor",
    narrative:
      "Over 20% of postings on job boards are outdated ghosts or missing basic compensation details. A fast HTTP HEAD request checks if the posting is still active on hh.ru, while deterministic regex rules throw out unpaid internships, citizenship restrictions, and low pay. If a vacancy fails these checks, it gets dropped immediately before burning any LLM tokens.",
    bullets: [
      "HTTP HEAD liveness probe to purge 404s",
      "Salary floor verification (>= 180,000 RUR)",
      "Zero-token scam, OTP, and citizenship barrier detector",
    ],
    card: {
      channel: "#deterministic-rules",
      sourceTag: "sub-10ms · pre-filter",
      badgeIconText: "chk",
      badgeSender: "rule-engine APP",
      eventTitle: "Deterministic screening completed",
      endpointMethod: "HEAD",
      endpointUrl: "https://hh.ru/vacancy/1094821",
      stats: [
        { label: "Liveness Status", value: "200 OK (Active)", isSuccess: true },
        { label: "Salary Floor", value: "Pass (>= 180k RUR)", isSuccess: true },
        { label: "Scam & OTP Flags", value: "0 Detected" },
        { label: "DB Duplicate", value: "Unique (No collision)" },
      ],
      detailTitle: "Filter Assertion",
      detailBody:
        "Passed: Russian citizenship not required, remote work permitted, compensation exceeds candidate minimum floor of 180,000 RUR.",
      actionLabel: "View Filter Rule Routine",
      expandablePayload: `// Deterministic Pre-Filter Assertions
export function validateVacancyRules(rawText: string, salary: SalaryInfo) {
  if (salary.from && salary.from < 180000) {
    return { pass: false, reason: "Below 180,000 RUR compensation floor" };
  }
  if (/гражданство рф строго|только с паспортом рф/i.test(rawText)) {
    return { pass: false, reason: "Requires mandatory Russian citizenship" };
  }
  if (/стажировка без оплаты|испытательный срок без зп/i.test(rawText)) {
    return { pass: false, reason: "Unpaid predatory internship" };
  }
  return { pass: true };
}`,
      footerStatus: "Also Zero LLM tokens consumed · Discarded 14 low-value listings in 8ms",
      footerSubtext: "Fast-tier router invoked for surviving listings",
    },
  },
  {
    id: "scoring",
    stepNumber: "03",
    timestamp: "00:01.240",
    markerColor: "bg-emerald-500",
    headline: "Score compatibility in 380ms with fast-tier LLMs",
    narrative:
      "Sending full job posts to massive reasoning models is too slow and burns money fast. We route structured vacancy schemas through Groq running Llama 3.3 70B instead. It evaluates tech stack synergy, architecture fit, and seniority in under 400 milliseconds, returning strict JSON.",
    bullets: [
      "Groq Llama 3.3 70B inference pool",
      "Strict JSON schema validation via OpenAI-compatible endpoints",
      "Three-axis synergy matrix: stack, architecture, and seniority",
    ],
    card: {
      channel: "#ai-scoring",
      sourceTag: "groq · llama-3.3-70b",
      badgeIconText: "ai",
      badgeSender: "groq-evaluator APP",
      eventTitle: "Vacancy synergy evaluated",
      endpointMethod: "POST",
      endpointUrl: "https://api.groq.com/openai/v1/chat/completions",
      stats: [
        { label: "Synergy Score", value: "94 / 100", isSuccess: true },
        { label: "Inference Time", value: "382 ms" },
        { label: "Stack Synergy", value: "38 / 40" },
        { label: "Architecture Fit", value: "34 / 35" },
      ],
      detailTitle: "Synergy Breakdown",
      detailBody:
        "Seniority: 22/25. Direct match on React 19, Next.js App Router, and PostgreSQL schema design. Exceeds salary target.",
      diagramSrc: "/diagrams/DVD lvl 2 AIML analysis.png",
      diagramLabel: "Inspect DFD Level 2 AI Decision Tree Diagram",
      actionLabel: "Inspect Scoring JSON Schema",
      expandablePayload: `{
  "score": 94,
  "confidence": "HIGH_SYNERGY",
  "breakdown": {
    "stackSynergy": 38,
    "architectureFit": 34,
    "seniorityLevel": 22
  },
  "matchedSkills": ["React 19", "Next.js App Router", "TypeScript Strict", "PostgreSQL", "Prisma"],
  "notes": "Direct match on fullstack architecture. Salary 180k-250k RUR aligns with candidate floor."
}`,
      footerStatus: "Also High Synergy confirmed · Priority alert triggered · 614 tokens processed",
      footerSubtext: "Eligible for recruiter OSINT discovery",
    },
  },
  {
    id: "osint",
    stepNumber: "04",
    timestamp: "00:01.680",
    markerColor: "bg-sky-500",
    headline: "Dig up the recruiter and bypass the 300-resume pile",
    narrative:
      "Submitting an application through the main job portal means your resume sits behind 300 other candidates. The OSINT worker inspects corporate domains and recruiter signatures from vacancy footers to find direct Telegram handles and verified work emails. You reach the hiring lead before the posting gets flooded.",
    bullets: [
      "Corporate DNS verification and domain mapping",
      "Direct Telegram handle matching from job descriptions",
      "1-click tailored intro message draft ready to send",
    ],
    card: {
      channel: "#recruiter-osint",
      sourceTag: "dns & heuristic lookup",
      badgeIconText: "hr",
      badgeSender: "osint-enricher APP",
      eventTitle: "Recruiter contacts resolved",
      endpointMethod: "RESOLVE",
      endpointUrl: "desten-partners.ru/mx-records",
      stats: [
        { label: "Telegram", value: "@daria_desten_hr", isSuccess: true },
        { label: "Email", value: "d.ivanova@desten-partners.ru" },
        { label: "Confidence", value: "Verified (MX Valid)" },
        { label: "Hiring Role", value: "Lead Tech Recruiter" },
      ],
      detailTitle: "Direct Outreach Dossier",
      detailBody:
        "Draft tailored intro message created referencing React 19 micro-frontends and candidate Next.js portfolio.",
      diagramSrc: "/screenshots/06_find_recruiter_dossier.png",
      diagramLabel: "Inspect Recruiter OSINT Finder Screenshot",
      actionLabel: "View Draft Intro Pitch",
      expandablePayload: `Здравствуйте, Дарья!

Увидел вашу позицию Fullstack Developer (React 19 / TypeScript) в Дэстэн Партнерс на hh.ru.

Мой стек идеально совпадает с требованиями: Next.js App Router, SSR-оптимизация, TypeScript в strict mode и реляционные схемы PostgreSQL (Prisma). В моем портфолио есть несколько production-проектов с высокой нагрузкой.

Буду рад познакомиться и обсудить задачи команды:
Portfolio: https://nandaz-portofolio.vercel.app
GitHub: https://github.com/nnavyy`,
      footerStatus: "Also Direct hiring manager identified · MX record verified · 0 spam traps",
      footerSubtext: "Pushing card to Telegram alert worker",
    },
  },
  {
    id: "delivery",
    stepNumber: "05",
    timestamp: "00:02.150",
    markerColor: "bg-violet-500",
    headline: "Instant Telegram alert and local database sync",
    narrative:
      "A rich card lands in your Telegram chat with the company name, compensation, AI score, and a direct application link. Simultaneously, the vacancy gets committed to your local PostgreSQL database under a compound index to prevent duplicate entries and table bloat.",
    bullets: [
      "Instant push notification to your private Telegram bot",
      "Idempotent compound index: @@unique([userId, hhId])",
      "Strict 100-vacancy cap keeps local search queries fast",
    ],
    card: {
      channel: "#telegram-dispatch",
      sourceTag: "postgresql & bot hook",
      badgeIconText: "tg",
      badgeSender: "notifier-daemon APP",
      eventTitle: "Lead dispatched to candidate",
      endpointMethod: "POST",
      endpointUrl: "https://api.telegram.org/bot<TOKEN>/sendMessage",
      stats: [
        { label: "Delivery", value: "Delivered (Telegram)", isSuccess: true },
        { label: "DB Transaction", value: "Committed (Prisma)" },
        { label: "Active Queue", value: "48 / 100 Vacancies" },
        { label: "End-to-End Latency", value: "2,150 ms" },
      ],
      detailTitle: "Delivered Notification",
      detailBody:
        "Message delivered with inline buttons: [Open on hh.ru], [Send Telegram to Recruiter], [Generate Custom Cover Letter].",
      diagramSrc: "/screenshots/03_vacancy_redflags_detail.png",
      diagramLabel: "Inspect Vacancy Details & Red Flag Analysis",
      actionLabel: "Inspect Database Schema Model",
      expandablePayload: `model Vacancy {
  id               String    @id @default(cuid())
  userId           String
  hhId             String
  title            String
  company          String
  salaryFrom       Int?
  salaryTo         Int?
  currency         String?
  score            Int
  status           String    @default("new")
  recruiterEmail   String?
  recruiterTg      String?
  createdAt        DateTime  @default(now())

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Compound index guarantees zero duplicate vacancies per candidate
  @@unique([userId, hhId])
  @@index([userId, status, score])
}`,
      footerStatus: "Also Compound index locked · Stored in local PostgreSQL · Zero cloud leaks",
      footerSubtext: "End-to-end cycle finished in 2.15 seconds",
    },
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why parse public RSS feeds instead of using HeadHunter's official REST API?",
    answer:
      "HeadHunter's official REST API (/vacancies endpoint) requires a verified employer account with a registered Russian legal entity (OGRN/INN). Furthermore, individual developer tokens are subject to aggressive rate limits (HTTP 429) after several dozen requests. By pulling public RSS 2.0 XML endpoints with randomized jitter spreads (800ms ± 30%), the copilot parses fresh listings without OAuth overhead, token expiration, or IP bans.",
  },
  {
    question: "Will HeadHunter ban my IP address for running automated queries?",
    answer:
      "No. The crawler rotates realistic browser User-Agent headers, introduces randomized delays between requests, and runs in bounded batch cycles (typically every 1 to 2 hours). It mimics standard RSS reader behavior rather than aggressive web scraping.",
  },
  {
    question: "How does the fast-tier AI evaluation keep inference latency under 400ms?",
    answer:
      "We pre-process and normalize raw vacancy text, stripping boilerplate corporate legalities and non-technical noise. The cleaned payload is routed to Groq running Llama 3.3 70B (with Gemini 2.5 Flash as a fallback) using strict JSON Schema enforcement. This guarantees structured scoring outputs in 300 - 400ms without expensive reasoning loops.",
  },
  {
    question: "How does recruiter OSINT resolution work without LinkedIn access?",
    answer:
      "In the CIS tech market, hiring managers and recruiters frequently list their direct Telegram handles (@username) or corporate email domains directly in vacancy descriptions. The OSINT worker runs domain DNS lookups and regex pattern heuristics to match hiring leads, generating a 1-click introduction message so you can bypass the 300+ applicant queue.",
  },
  {
    question: "Why is there a strict 100-vacancy cap in the PostgreSQL database?",
    answer:
      "Commercial job scrapers let tables grow into tens of thousands of dead listings, slowing down queries and ballooning database size. Our 100-Vacancy Guard automatically purges listings that return HTTP 404 (archived by employers) and caps the active queue at 100 of the highest-synergy postings. This maintains sub-12ms full-text search speeds and zero disk bloat.",
  },
  {
    question: "Can I self-host this entirely on my own VPS or local machine?",
    answer:
      "Yes. HH Job Copilot is 100% open-source and local-first. You can spin it up with a single docker compose up -d command or run it directly on Node.js with local PostgreSQL.",
  },
  {
    question: "Is any of my resume or candidate data transmitted to third-party tracking servers?",
    answer:
      "Never. There is zero telemetry, zero analytics tracking, and no proprietary cloud database. Your search criteria, resume text, API keys, and application history stay strictly inside your local PostgreSQL container.",
  },
];

export default function ArchitecturePage() {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [copiedStage, setCopiedStage] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [blueprintExpanded, setBlueprintExpanded] = useState<boolean>(false);

  const toggleExpand = (stageId: string) => {
    setExpandedStage((prev) => (prev === stageId ? null : stageId));
  };

  const copyPayload = (stageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStage(stageId);
    setTimeout(() => setCopiedStage(null), 2000);
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black antialiased">
      <LandingHeader />

      <main className="pt-28 pb-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </motion.div>

        {/* Page Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-12 space-y-4"
        >

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            One Vacancy, Start to Finish
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
            From a raw public RSS feed to a verified high-synergy lead in your personal Telegram bot in under 2.5 seconds. Here is what happens under the hood.
          </p>

          {/* Quick Anchor Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
            {STAGES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <span className="text-zinc-500 mr-1.5">{s.timestamp}</span>
                <span>{s.stepNumber}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Master Architecture Topology Visual Card (High-Res Asset Blueprint) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-16 bg-[#0e0e11] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.08] gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">System Architecture &amp; Data Flow Topology</h2>
                <div className="text-xs text-zinc-400">
                  Decomposed RSS Worker · Deterministic Rule Assertions · Groq Fast-Tier Inference · PostgreSQL
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBlueprintExpanded(!blueprintExpanded)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{blueprintExpanded ? "Collapse Blueprint" : "Expand Full View"}</span>
            </button>
          </div>

          {/* Architecture Diagram Image */}
          <div className={`relative rounded-xl overflow-hidden border border-white/10 bg-black transition-all duration-300 ${blueprintExpanded ? "max-h-none" : "max-h-[460px]"}`}>
            <img
              src="/system_workflow_complete.jpg"
              alt="System Architecture Diagram"
              className="w-full h-auto object-cover object-top"
            />
          </div>

          {/* Protocol Comparison Bar: RSS vs REST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                <span>HeadHunter Official REST API</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30">
                  Rate-Limit Risk
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Requires Russian registered legal entity (OGRN/INN) for employer tokens. Client IP triggers HTTP 429 Too Many Requests after ~50 automated vacancy queries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>Composite RSS 2.0 Syndication Engine</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                  Immune &middot; 312ms Avg
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Zero authentication barriers. Polled with randomized jitter (800ms ± 30%) and rotating User-Agents. Infinite batch scanning without rate limit throttling.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vertical Pipeline: Connecting Timeline Line + Sticky Left Column + Realistic Right Cards */}
        <div className="relative pl-7 sm:pl-9 space-y-20 md:space-y-28">
          {/* Continuous Vertical Timeline Rail Line */}
          <div
            className="absolute left-[3px] top-6 bottom-10 w-[2px] bg-gradient-to-b from-rose-500/60 via-zinc-800 to-zinc-800/20 pointer-events-none"
            aria-hidden="true"
          />

          {STAGES.map((stage) => {
            const isExpanded = expandedStage === stage.id;
            const isCopied = copiedStage === stage.id;

            return (
              <section
                key={stage.id}
                id={stage.id}
                className="relative pt-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left Column (Slide in from Left): STICKY so it scrolls smoothly with the user through this stage */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-5"
                  >
                    {/* Timestamp with square box marker sitting directly on the vertical timeline rail */}
                    <div className="relative flex items-center gap-2.5">
                      <span
                        className={`absolute -left-[31px] sm:-left-[39px] w-2.5 h-2.5 rounded-[2px] ${stage.markerColor} ring-4 ring-[#09090b] shrink-0 z-10`}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs text-zinc-400 tracking-wider">
                        {stage.timestamp}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                      {stage.headline}
                    </h2>

                    {/* Story narrative */}
                    <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                      {stage.narrative}
                    </p>

                    {/* Bullet points / Links */}
                    <ul className="space-y-2 pt-2 text-xs text-zinc-300">
                      {stage.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-zinc-600">-</span>
                          <span className="text-zinc-300 hover:text-white transition-colors">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Right Column (Slide in from Right): Realistic Incident / Slack / Terminal Mock Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-7"
                  >
                    <div className="bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-xs">
                      {/* Card Topbar: Channel name on left, Source/tag on right */}
                      <div className="px-5 py-3.5 bg-[#121216] border-b border-white/[0.08] flex items-center justify-between">
                        <div className="font-mono text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <span className="text-zinc-500">#</span>
                          <span>{stage.card.channel.replace("#", "")}</span>
                        </div>
                        <div className="font-mono text-[11px] text-zinc-500">
                          {stage.card.sourceTag}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 sm:p-6 space-y-5">
                        {/* Event Title + HTTP Method + URL */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-mono font-bold text-[10px] text-white shrink-0 uppercase">
                            {stage.card.badgeIconText}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-zinc-400">
                                {stage.card.badgeSender}
                              </span>
                              <span className="text-zinc-600">·</span>
                              <span className="font-medium text-white text-xs truncate">
                                {stage.card.eventTitle}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-zinc-400 flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-md border border-white/[0.04] truncate">
                              <span className="font-bold text-emerald-400">
                                {stage.card.endpointMethod}
                              </span>
                              <span className="text-zinc-400 truncate">
                                {stage.card.endpointUrl}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Matrix Grid (OpenStatus 4-box layout) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                          {stage.card.stats.map((stat, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] space-y-1"
                            >
                              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                                {stat.label}
                              </div>
                              <div
                                className={`font-mono text-xs font-semibold truncate ${
                                  stat.isSuccess ? "text-emerald-400" : "text-white"
                                }`}
                              >
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Detail Highlight Box */}
                        <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/[0.06] space-y-1">
                          <div className="text-[11px] font-semibold text-white">
                            {stage.card.detailTitle}
                          </div>
                          <div className="text-xs text-zinc-400 leading-relaxed font-normal">
                            {stage.card.detailBody}
                          </div>
                        </div>

                        {/* Optional Diagram Embed */}
                        {stage.card.diagramSrc && (
                          <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                            <div className="px-3 py-1.5 bg-[#141418] border-b border-white/[0.06] text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                              <span>{stage.card.diagramLabel}</span>
                              <span className="text-emerald-400">Verified Flow</span>
                            </div>
                            <img
                              src={stage.card.diagramSrc}
                              alt={stage.card.detailTitle}
                              className="w-full h-auto max-h-[280px] object-cover object-top"
                            />
                          </div>
                        )}

                        {/* Expandable Technical Payload Button */}
                        {stage.card.expandablePayload && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpand(stage.id)}
                              className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                              <span>{stage.card.actionLabel}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Expandable Payload Content */}
                            {isExpanded && (
                              <div className="mt-3 relative">
                                <div className="absolute top-2 right-2 z-10">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyPayload(stage.id, stage.card.expandablePayload!)
                                    }
                                    className="p-1.5 rounded-lg bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                                    title="Copy raw payload"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <pre className="p-4 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed max-h-64">
                                  <code>{stage.card.expandablePayload}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Status */}
                      <div className="px-5 py-3 bg-[#101014] border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-500 gap-1">
                        <span>{stage.card.footerStatus}</span>
                        <span className="font-mono text-zinc-400">
                          {stage.card.footerSubtext}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Interactive FAQ Section Accordion */}
        <div className="mt-32 pt-20 border-t border-white/[0.08] max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Architecture &amp; Design Decisions
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-normal">
              Technical rationale behind HeadHunter RSS protocols, PostgreSQL compound indexing, and zero-telemetry local execution.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx;
              return (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-white/[0.08] bg-[#0e0e11] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(fIdx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white leading-snug">
                      {faq.question}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal border-t border-white/[0.04]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
