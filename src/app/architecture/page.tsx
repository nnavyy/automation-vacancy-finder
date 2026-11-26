"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  Plus,
  Minus,
  Maximize2,
  Layers,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import "@/components/public/public.css";

interface StageItem {
  id: string;
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
    timestamp: "00:00.000",
    markerColor: "bg-rose-500",
    headline: "Your crawler catches it first",
    narrative:
      "The vacancy worker builds RSS queries from the search profile. It reads HeadHunter's vacancy feed, normalizes the text, and parses the available compensation figures.",
    bullets: [
      "Bounded RSS polling with retry backoff",
      "Unicode NFC and mixed-Cyrillic character normalization",
      "Salary normalization for comparison with profile filters",
    ],
    card: {
      channel: "#feed-ingestion",
      sourceTag: "hh.ru · public rss",
      badgeIconText: "hh",
      badgeSender: "hh-copilot APP",
      eventTitle: "New feed parsed: React & Next.js",
      endpointMethod: "GET",
      endpointUrl: "https://hh.ru/search/vacancy/rss?text=React+Next.js&search_field=name",
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
    timestamp: "00:00.820",
    markerColor: "bg-amber-500",
    headline: "Kill ghost postings and verify the salary floor",
    narrative:
      "Collection can include listings that have since closed or that fall outside the search profile. A liveness check and deterministic rules filter unavailable or unsuitable listings before AI scoring.",
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
    timestamp: "00:01.240",
    markerColor: "bg-emerald-500",
    headline: "Score compatibility with fast-tier language models",
    narrative:
      "The scoring step sends structured vacancy and profile context to the selected AI provider. The result describes fit across the technology stack, role, and seniority. Latency varies with the provider and request.",
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
    timestamp: "00:01.680",
    markerColor: "bg-sky-500",
    headline: "Research hiring contacts before reaching out",
    narrative:
      "Company Intel checks publicly available hiring references and organization information. It can surface contact leads for candidates to verify and help draft an introduction.",
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
    timestamp: "00:02.150",
    markerColor: "bg-violet-500",
    headline: "Save the vacancy and prepare a Telegram alert",
    narrative:
      "For users who connect Telegram, an alert can include the company, compensation, fit score, and application link. The vacancy is stored with a unique key per user and HeadHunter vacancy ID.",
    bullets: [
      "Telegram alert for connected users",
      "Idempotent compound index: @@unique([userId, hhId])",
      "Configured limit for the active vacancy queue",
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
        { label: "Active Queue", value: "48 vacancies" },
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
      "The collection worker reads HeadHunter's public vacancy feed as one input for profile-based search. REST API authentication and limits depend on the endpoint. The app backs off when HeadHunter returns a rate limit or temporary service error.",
  },
  {
    question: "How does the collector handle rate limits?",
    answer:
      "The collector limits pagination and uses bounded retries with backoff. Availability and service limits are controlled by HeadHunter.",
  },
  {
    question: "How does fast-tier AI evaluation work?",
    answer:
      "The app normalizes vacancy text and sends a structured evaluation request to the configured provider. The response time varies with the provider and the size of the input.",
  },
  {
    question: "How does recruiter OSINT resolution work without LinkedIn access?",
    answer:
      "Company Intel looks for published contacts and relevant organization information. Where there is enough evidence, the app can draft an introduction for candidate review.",
  },
  {
    question: "How does the collector keep the active vacancy queue manageable?",
    answer:
      "The collector tracks when postings close and can park lower-scoring vacancies the candidate has not acted on. It uses a configured active-queue limit to control how many new records can enter.",
  },
  {
    question: "Is HH Job Copilot a hosted platform or self-hosted?",
    answer:
      "HH Job Copilot is a proprietary, fully hosted cloud platform. All crawlers, jitter algorithms, and multi-provider AI failovers run on our managed high-availability infrastructure so you get real-time alerts without managing Docker containers or server keys.",
  },
  {
    question: "How is candidate and resume data protected?",
    answer:
      "Your search criteria, resume text, and integration secrets are protected with AES-256-GCM authenticated encryption at rest and strict multi-tenant isolation. We never sell candidate data to third parties or advertisers.",
  },
];

export default function ArchitecturePage() {
  const reduceMotion = useReducedMotion();
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
    <div lang="en" className="fw-public-theme min-h-screen bg-public-950 text-public-100 antialiased">
      <LandingHeader />

      <main className="pt-10 sm:pt-16 pb-20 w-full max-w-6xl mx-auto px-5 sm:px-8">
        {/* Navigation Breadcrumb */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-public-400 hover:text-public-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </Link>
        </motion.div>

        {/* Page Hero Header */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-4xl"
        >
          <div className="space-y-4">
          <h1 className="fw-public-title">
            One Vacancy, Start to Finish
          </h1>

          <p className="text-base sm:text-lg text-public-400 leading-relaxed font-normal">
            Follow a vacancy from HeadHunter through profile filtering, AI scoring, and Telegram delivery. The timeline uses example data and timings.
          </p>

          {/* Quick Anchor Bar */}
          <nav aria-label="Pipeline stages" className="pt-2 flex flex-wrap items-center gap-2 text-sm">
            {STAGES.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-2 rounded-lg bg-public-900 border border-public-800 text-public-300 hover:text-field-accent hover:border-field-accent/50 transition-colors capitalize"
              >
                {s.id.replaceAll("-", " ")}
              </a>
            ))}
          </nav>
          </div>
        </motion.div>

        {/* Master Architecture Topology Visual Card (High-Res Asset Blueprint) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-16 bg-public-900 border border-public-800 rounded-2xl p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-field-line gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-public-900 border border-field-line text-emerald-700">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-public-100">System Architecture &amp; Data Flow Topology</h2>
                <div className="text-xs text-public-400">
                  Decomposed RSS Worker · Deterministic Rule Assertions · Groq Fast-Tier Inference · PostgreSQL
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBlueprintExpanded(!blueprintExpanded)}
              aria-expanded={blueprintExpanded}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-public-900 border border-field-line hover:bg-public-800 text-xs text-public-300 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-public-400" />
              <span>{blueprintExpanded ? "Collapse Blueprint" : "Expand Full View"}</span>
            </button>
          </div>

          {/* Architecture Diagram Image */}
          <div className={`relative rounded-xl overflow-hidden border border-field-line bg-field-raised transition-all duration-300 ${blueprintExpanded ? "max-h-none" : "max-h-[460px]"}`}>
            <Image
              src="/system_workflow_complete.jpg"
              alt="System Architecture Diagram"
              width={1376}
              height={768}
              sizes="(max-width: 1200px) 100vw, 1050px"
              className="w-full h-auto object-cover object-top"
            />
          </div>

          {/* Protocol Comparison Bar: RSS vs REST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-public-900/50 border border-field-line space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
                <span>HeadHunter Official REST API</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-50 border border-rose-500/30">
                  API
                </span>
              </div>
              <p className="text-xs text-public-400 leading-relaxed">
                Authentication and rate limits depend on the endpoint. See the{" "}
                <a href="https://api.hh.ru/openapi/en/redoc" className="text-field-accent underline">official HeadHunter API documentation</a>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-public-900/50 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>Composite RSS 2.0 Syndication Engine</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-500/30">
                  Feed
                </span>
              </div>
              <p className="text-xs text-public-400 leading-relaxed">
                The collection worker reads the feed in bounded pages and backs off on rate-limit or temporary service errors.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Vertical Pipeline: Connecting Timeline Line + Sticky Left Column + Realistic Right Cards */}
        <div className="relative pl-7 sm:pl-9 space-y-20 md:space-y-28">
          {/* Continuous Vertical Timeline Rail Line */}
          <div
            className="absolute left-[3px] top-6 bottom-10 w-[2px] bg-gradient-to-b from-rose-500/60 via-public-800 to-public-800/20 pointer-events-none"
            aria-hidden="true"
          />

          {STAGES.map((stage) => {
            const isExpanded = expandedStage === stage.id;
            const isCopied = copiedStage === stage.id;

            return (
              <section
                key={stage.id}
                id={stage.id}
                className="relative scroll-mt-24 pt-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left Column (Slide in from Left): STICKY so it scrolls smoothly with the user through this stage */}
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="min-w-0 lg:col-span-5 lg:sticky lg:top-28 lg:self-start space-y-5"
                  >
                    {/* Timestamp with square box marker sitting directly on the vertical timeline rail */}
                    <div className="relative flex items-center gap-2.5">
                      <span
                        className={`absolute -left-[31px] sm:-left-[39px] w-2.5 h-2.5 rounded-[2px] ${stage.markerColor} ring-4 ring-public-950 shrink-0 z-10`}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs text-public-400 tracking-wider">
                        {stage.timestamp}
                      </span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-public-100 leading-snug">
                      {stage.headline}
                    </h2>

                    {/* Story narrative */}
                    <p className="text-sm text-public-400 leading-relaxed font-normal">
                      {stage.narrative}
                    </p>

                    {/* Bullet points / Links */}
                    <ul className="space-y-2 pt-2 text-xs text-public-300">
                      {stage.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-public-600">-</span>
                          <span className="text-public-300 hover:text-public-100 transition-colors">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Right Column (Slide in from Right): Realistic Incident / Slack / Terminal Mock Card */}
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                    className="min-w-0 lg:col-span-7"
                  >
                    <div className="bg-field-panel border border-field-line rounded-2xl shadow-2xl overflow-hidden text-xs">
                      {/* Card Topbar: Channel name on left, Source/tag on right */}
                      <div className="px-5 py-3.5 bg-field-raised border-b border-field-line flex flex-wrap items-center justify-between gap-2 break-all">
                        <div className="font-mono text-xs font-semibold text-public-300 flex items-center gap-1.5">
                          <span className="text-public-500">#</span>
                          <span>{stage.card.channel.replace("#", "")}</span>
                        </div>
                        <div className="font-mono text-[11px] text-public-500">
                          {stage.card.sourceTag}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-5 sm:p-6 space-y-5">
                        {/* Event Title + HTTP Method + URL */}
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-public-800 border border-field-line flex items-center justify-center font-mono font-bold text-[10px] text-public-100 shrink-0 uppercase">
                            {stage.card.badgeIconText}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-semibold text-public-400">
                                {stage.card.badgeSender}
                              </span>
                              <span className="text-public-600">·</span>
                              <span className="font-medium text-public-100 text-xs truncate">
                                {stage.card.eventTitle}
                              </span>
                            </div>
                            <div className="font-mono text-[11px] text-public-400 flex items-center gap-2 bg-field-raised px-2.5 py-1 rounded-md border border-field-line truncate">
                              <span className="font-bold text-emerald-700">
                                {stage.card.endpointMethod}
                              </span>
                              <span className="text-public-400 truncate">
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
                              className="p-3 rounded-xl bg-public-900/60 border border-field-line space-y-1"
                            >
                              <div className="text-[10px] font-mono text-public-500 uppercase tracking-wider">
                                {stat.label}
                              </div>
                              <div
                                className={`font-mono text-xs font-semibold truncate ${
                                  stat.isSuccess ? "text-emerald-700" : "text-public-100"
                                }`}
                              >
                                {stat.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Detail Highlight Box */}
                        <div className="p-3.5 rounded-xl bg-public-900/40 border border-field-line space-y-1">
                          <div className="text-[11px] font-semibold text-public-100">
                            {stage.card.detailTitle}
                          </div>
                          <div className="text-xs text-public-400 leading-relaxed font-normal">
                            {stage.card.detailBody}
                          </div>
                        </div>

                        {/* Optional Diagram Embed */}
                        {stage.card.diagramSrc && (
                          <div className="rounded-xl overflow-hidden border border-field-line bg-field-raised">
                            <div className="px-3 py-1.5 bg-field-raised border-b border-field-line text-[10px] font-mono text-public-400 flex items-center justify-between">
                              <span>{stage.card.diagramLabel}</span>
                            </div>
                            <a href={stage.card.diagramSrc} target="_blank" rel="noreferrer" className="relative block aspect-video max-h-[280px]">
                              <Image
                                src={stage.card.diagramSrc}
                                alt={stage.card.diagramLabel ?? stage.card.detailTitle}
                                fill
                                sizes="(max-width: 1023px) 100vw, 560px"
                                className="object-cover object-top"
                              />
                            </a>
                          </div>
                        )}

                        {/* Expandable Technical Payload Button */}
                        {stage.card.expandablePayload && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpand(stage.id)}
                              aria-expanded={isExpanded}
                              className="inline-flex items-center gap-2 text-xs font-mono text-public-400 hover:text-public-100 transition-colors cursor-pointer"
                            >
                              <FileCode className="w-3.5 h-3.5 text-public-500" />
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
                                    className="p-1.5 rounded-lg bg-public-800 border border-field-line text-public-400 hover:text-public-100 transition-colors"
                                    title="Copy raw payload"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <pre className="p-4 rounded-xl bg-field-raised border border-field-line font-mono text-[11px] text-public-300 overflow-x-auto leading-relaxed max-h-64">
                                  <code>{stage.card.expandablePayload}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Status */}
                      <div className="px-5 py-3 bg-field-panel border-t border-field-line flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-public-500 gap-1">
                        <span>{stage.card.footerStatus}</span>
                        <span className="font-mono text-public-400">
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
        <div className="mt-32 pt-20 border-t border-field-line max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-public-100 mb-3">
              Architecture &amp; Design Decisions
            </h2>
            <p className="text-sm text-public-400 leading-relaxed font-normal">
              Technical rationale behind HeadHunter RSS protocols, PostgreSQL compound indexing, and zero-telemetry local execution.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx;
              return (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-field-line bg-field-panel overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(fIdx)}
                    aria-expanded={isOpen}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-public-900/40 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-public-100 leading-snug">
                      {faq.question}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-public-800 border border-field-line flex items-center justify-center text-public-400 shrink-0">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-public-100" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-public-400 leading-relaxed font-normal border-t border-field-line">
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
