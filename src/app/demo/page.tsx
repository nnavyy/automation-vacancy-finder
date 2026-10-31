"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  CheckCircle2,
  Building2,
  BarChart3,
  Settings,
  Globe,
  LogOut,
  Play,
  RotateCw,
  FileText,
  Clock,
  XCircle,
  TrendingUp,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Send,
  Mail,
  Shield,
  Layers,
  Check,
  X,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  Bot,
  Filter,
  DollarSign
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import CompanyIntelPaywall from "@/components/CompanyIntelPaywall";

interface MockVacancy {
  id: string;
  title: string;
  company: string;
  companyLogoText: string;
  location: string;
  salary: string;
  date: string;
  score: number;
  scoreLabel: string;
  applied?: boolean;
  saved?: boolean;
  tags: string[];
  description: string;
  scoreBreakdown: {
    stackSynergy: number;
    architectureFit: number;
    seniorityLevel: number;
    notes: string;
  };
}

const INITIAL_VACANCIES: MockVacancy[] = [
  {
    id: "hh-1094821",
    title: "Fullstack Developer (React / Next.js / TypeScript)",
    company: "Дэстэн Партнерс",
    companyLogoText: "ДП",
    location: "Москва · Remote (Удаленно)",
    salary: "180,000 – 250,000 RUR",
    date: "Oct 9, 2026",
    score: 94,
    scoreLabel: "HIGH SYNERGY",
    applied: true,
    tags: ["React 19", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    description:
      "We are looking for a strong Fullstack Developer to lead client-side architecture on high-load fintech products. You will build SSR web applications with Next.js App Router, implement complex client state management, and write robust PostgreSQL queries via Prisma.",
    scoreBreakdown: {
      stackSynergy: 38,
      architectureFit: 34,
      seniorityLevel: 22,
      notes: "Direct match on Next.js 15, TypeScript strict mode, and relational database schema design. Meets compensation floor.",
    },
  },
  {
    id: "hh-1094892",
    title: "Senior Frontend Engineer (React / Cloud Infrastructure)",
    company: "Яндекс (Yandex Cloud)",
    companyLogoText: "ЯН",
    location: "Москва · Hybrid / Remote",
    salary: "320,000 – 450,000 RUR",
    date: "Oct 15, 2026",
    score: 96,
    scoreLabel: "HIGH SYNERGY",
    tags: ["React", "TypeScript", "Micro-frontends", "Performance", "WebSockets"],
    description:
      "Join the cloud portal console team. Focus on sub-millisecond interaction responsiveness, complex distributed dashboard visualizations, and high-security role-based access control interfaces.",
    scoreBreakdown: {
      stackSynergy: 40,
      architectureFit: 35,
      seniorityLevel: 21,
      notes: "Exceptional alignment with modern React paradigms, clean system design, and security perimeter enforcement.",
    },
  },
  {
    id: "hh-1093774",
    title: "Lead React / Next.js Developer",
    company: "Т-Банк (Tinkoff)",
    companyLogoText: "ТБ",
    location: "Remote (Любой регион РФ)",
    salary: "280,000 – 360,000 RUR",
    date: "Oct 14, 2026",
    score: 91,
    scoreLabel: "HIGH SYNERGY",
    saved: true,
    tags: ["Next.js", "TailwindCSS", "Jest / Playwright", "GraphQL"],
    description:
      "Responsible for leading a cross-functional squad building customer onboarding and self-service portals. High emphasis on code quality, testing suites, and seamless mobile-responsive performance.",
    scoreBreakdown: {
      stackSynergy: 37,
      architectureFit: 33,
      seniorityLevel: 21,
      notes: "Solid match on full-stack TypeScript ecosystem, testing rigor, and remote asynchronous team leadership.",
    },
  },
  {
    id: "hh-1092109",
    title: "Fullstack Engineer (TypeScript / Node.js)",
    company: "Ozon Marketplace",
    companyLogoText: "OZ",
    location: "Москва · Remote",
    salary: "220,000 – 310,000 RUR",
    date: "Oct 12, 2026",
    score: 88,
    scoreLabel: "HIGH SYNERGY",
    tags: ["TypeScript", "Node.js", "Kafka", "PostgreSQL", "Docker"],
    description:
      "Building high-throughput merchant tools for order lifecycle tracking. Demands reliable transactional flows and microservice coordination.",
    scoreBreakdown: {
      stackSynergy: 35,
      architectureFit: 31,
      seniorityLevel: 22,
      notes: "High concurrency and pipeline experience matches their distributed messaging needs.",
    },
  },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "vacancies" | "saved" | "applied" | "company-intel" | "analytics" | "settings"
  >("overview");
  const [vacancies, setVacancies] = useState<MockVacancy[]>(INITIAL_VACANCIES);
  const [selectedVacancy, setSelectedVacancy] = useState<MockVacancy | null>(INITIAL_VACANCIES[0]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<string | null>(null);
  const [lang, setLang] = useState<"EN" | "RU">("EN");
  const [queryFilter, setQueryFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Stats State
  const [stats, setStats] = useState({
    total: 682,
    active: 278,
    archived: 404,
    applied: 69,
    skipped: 404,
    saved: 19,
    pending: 0,
    avgScore: 42,
    highScoreCount: 34,
    maybeScoreCount: 61,
    lowScoreCount: 145,
    lastSynced: "16h 41m ago",
    nextSync: "18m 50s",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunCollection = () => {
    if (isCollecting) return;
    setIsCollecting(true);
    setCollectionStatus("Polling HeadHunter RSS feeds for tracked queries...");

    setTimeout(() => {
      setCollectionStatus("Parsing XML feed stream & jittering delay pool...");
    }, 800);

    setTimeout(() => {
      setCollectionStatus("Evaluating compatibility with fast-tier LLM...");
    }, 1600);

    setTimeout(() => {
      setIsCollecting(false);
      setCollectionStatus(null);
      setStats((prev) => ({
        ...prev,
        total: prev.total + 3,
        active: prev.active + 3,
        saved: prev.saved + 1,
        highScoreCount: prev.highScoreCount + 1,
        lastSynced: "Just now",
        nextSync: "29m 59s",
      }));
      showToast("Collection complete: 3 vacancies staged, 1 high-synergy match added.");
    }, 2400);
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVacancies((prev) =>
      prev.map((v) => (v.id === id ? { ...v, saved: !v.saved } : v))
    );
    const target = vacancies.find((v) => v.id === id);
    if (target?.saved) {
      setStats((s) => ({ ...s, saved: Math.max(0, s.saved - 1) }));
      showToast(`Removed from saved queue.`);
    } else {
      setStats((s) => ({ ...s, saved: s.saved + 1 }));
      showToast(`Saved to manual queue.`);
    }
  };

  const handleToggleApply = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVacancies((prev) =>
      prev.map((v) => (v.id === id ? { ...v, applied: !v.applied } : v))
    );
    const target = vacancies.find((v) => v.id === id);
    if (!target?.applied) {
      setStats((s) => ({ ...s, applied: s.applied + 1 }));
      showToast(`Marked as Applied.`);
    } else {
      setStats((s) => ({ ...s, applied: Math.max(0, s.applied - 1) }));
      showToast(`Reverted Applied status.`);
    }
  };

  const filteredVacancies = vacancies.filter((v) => {
    if (activeTab === "saved") return v.saved;
    if (activeTab === "applied") return v.applied;
    if (queryFilter) {
      const q = queryFilter.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        v.company.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="h-screen max-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col overflow-hidden antialiased selection:bg-emerald-500 selection:text-black">
      {/* Top Demo Notification Header Bar with Generous Padding */}
      <header className="bg-[#0e0e12] border-b border-white/[0.08] px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0 z-40">
        <div className="flex items-center gap-2.5 text-zinc-300">
          <span className="font-semibold text-white">Free account preview</span>
          <span className="text-zinc-600 hidden sm:inline">&middot;</span>
          <span className="text-zinc-400 hidden sm:inline">
            Sample data. Search, matching, cover letters, and Analytics are free.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing</span>
          </Link>

          <Link
            href="/architecture"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-colors"
          >
            <span>Architecture Specs</span>
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-colors"
          >
            <span>About Creator</span>
          </Link>
        </div>
      </header>

      {/* Main Body: Sticky Pinned Sidebar on Left + Independently Scrollable Workspace on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Sticky and always visible) */}
        <aside className="w-64 bg-[#0a0a0c] border-r border-white/[0.08] flex flex-col justify-between shrink-0 hidden md:flex p-5 h-full overflow-y-auto">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-1">
              <BrandLogo size={28} variant="dark" showBackground={true} className="rounded-lg border border-white/10" />
              <div>
                <div className="text-sm font-bold text-white tracking-tight leading-tight">
                  HH Job Copilot
                </div>
                <div className="text-[11px] text-zinc-400">Job Copilot</div>
              </div>
            </div>

            {/* User Profile Info */}
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="truncate font-medium text-zinc-200">
                Demo account · Free plan
              </div>
            </div>

            {/* Navigation Menu (Updates the main content area) */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("vacancies")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "vacancies"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Briefcase className="w-4 h-4 text-zinc-400" />
                <span>Vacancies</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-500">682</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("saved")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "saved"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Bookmark className="w-4 h-4 text-zinc-400" />
                <span>Saved</span>
                {stats.saved > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
                    {stats.saved}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("applied")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "applied"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                <span>Applied</span>
                <span className="ml-auto px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
                  {stats.applied}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("company-intel")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "company-intel"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span>Company Intel</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("analytics")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                <span>Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#183626] text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Bottom Sidebar Info */}
          <div className="pt-4 border-t border-white/[0.08] space-y-4">
            {/* Language Switcher */}
            <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Globe className="w-3.5 h-3.5" />
                <span>LANG</span>
              </div>
              <div className="flex items-center rounded-lg bg-zinc-900 p-0.5 border border-white/[0.08] text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setLang("EN")}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    lang === "EN" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("RU")}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    lang === "RU" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  RU
                </button>
              </div>
            </div>

            {/* User Identity */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400">
                  N
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Nanda Zhafran</span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[110px]">
                    nandazhafran@gmail.com
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono">v0.1.0</span>
                </div>
              </div>

              <Link
                href="/"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Exit Demo"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Workspace Main Content (Scrolls smoothly with generous padding) */}
        <main className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-6">
          {/* Top Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white capitalize">
                {activeTab === "overview" && "Overview"}
                {activeTab === "vacancies" && "All Vacancies"}
                {activeTab === "saved" && "Saved Vacancies"}
                {activeTab === "applied" && "Applied Responses"}
                {activeTab === "company-intel" && "Company Intelligence"}
                {activeTab === "analytics" && "Synergy Analytics"}
                {activeTab === "settings" && "Search Settings"}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {activeTab === "overview" && "Autonomous job search and pipeline intelligence at a glance"}
                {activeTab === "vacancies" && "Active listings scraped from HeadHunter RSS feeds"}
                {activeTab === "saved" && "Actionable manual queue staged for review"}
                {activeTab === "applied" && "Submitted applications and direct recruiter responses"}
                {activeTab === "company-intel" && "Verified tech stacks, corporate domains, and recruiter contacts"}
                {activeTab === "analytics" && "Match score calibration and compensation benchmarks"}
                {activeTab === "settings" && "Configure target roles, salary floors, and notification cadences"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRunCollection}
                disabled={isCollecting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-60 cursor-pointer"
              >
                {isCollecting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Collecting...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Collection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collection Status Feedback */}
          {collectionStatus && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
              <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{collectionStatus}</span>
            </div>
          )}

          {/* View: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* 5 KPI Metric Cards Row (Clean typography without decorative badge pills) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* 1. TOTAL VACANCIES */}
                <div className="bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      TOTAL VACANCIES
                    </span>
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {stats.total}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">
                      +12%
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    {stats.active} active opportunities &middot; {stats.archived} archived
                  </div>
                </div>

                {/* 2. APPLIED */}
                <div className="bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      APPLIED
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {stats.applied}
                    </span>
                    <span className="text-[11px] text-zinc-400">responses</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    Conversion rate 10.1%
                  </div>
                </div>

                {/* 3. SKIPPED */}
                <div className="bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      SKIPPED
                    </span>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {stats.skipped}
                    </span>
                    <span className="text-[11px] text-zinc-400">auto-culled</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    Low match threshold
                  </div>
                </div>

                {/* 4. SAVED */}
                <div className="bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      SAVED
                    </span>
                    <Bookmark className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {stats.saved}
                    </span>
                    <span className="text-[11px] text-zinc-400">staged</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    Actionable manual queue
                  </div>
                </div>

                {/* 5. AI PENDING */}
                <div className="bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-5 shadow-sm space-y-2 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">
                      AI PENDING
                    </span>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white">
                      {stats.pending}
                    </span>
                    <span className="text-[11px] text-zinc-400">in queue</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    Background queue active
                  </div>
                </div>
              </div>

              {/* Middle Row: Average Match Score & Hunter Engine */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Average Match Score (7 Columns) */}
                <div className="lg:col-span-7 bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-violet-400" />
                        <span className="font-semibold text-white">Average Match Score</span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Based on 240 analyzed vacancies
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-white">{stats.avgScore}</span>
                        <span className="text-xs text-zinc-500">/ 100</span>
                      </div>
                      <span className="text-xs text-amber-400 font-medium">
                        Below Target Calibration
                      </span>
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      <span className="text-emerald-400 font-semibold">
                        HIGH (&gt;75%): {stats.highScoreCount}
                      </span>
                      <span className="text-zinc-600">&middot;</span>
                      <span className="text-amber-400 font-semibold">
                        MAYBE (50-74%): {stats.maybeScoreCount}
                      </span>
                      <span className="text-zinc-600">&middot;</span>
                      <span className="text-zinc-400">
                        LOW (&lt;50%): {stats.lowScoreCount}
                      </span>
                    </div>
                  </div>

                  {/* AI Optimization Suggestion Card */}
                  <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-violet-300 font-semibold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Optimization Suggestion</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Aligning your required skills and search keywords in Settings with recent vacancy patterns increases match calibration score across automated screening pipelines.
                    </p>
                  </div>
                </div>

                {/* Hunter Engine Status (5 Columns) */}
                <div className="lg:col-span-5 bg-[#0f0f13] border border-white/[0.08] rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-white">Hunter Engine</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        Valid Active
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 mb-1">HH.ru Session Status</div>

                    {/* Autonomous Cadence */}
                    <div className="pt-2 pb-3 border-t border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>Autonomous Cadence</span>
                        </span>
                        <RotateCw className="w-3 h-3 text-zinc-500 hover:text-white cursor-pointer" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">LAST SYNCED: <strong className="text-zinc-300">{stats.lastSynced}</strong></span>
                        <span className="text-zinc-500">NEXT SYNC IN: <strong className="text-violet-300">{stats.nextSync}</strong></span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full w-2/3" />
                      </div>
                    </div>

                    {/* Tracked Queries */}
                    <div className="pt-2 text-xs">
                      <div className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider mb-1.5">
                        TRACKED QUERIES
                      </div>
                      <div className="font-mono text-xs text-zinc-200 bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/[0.06]">
                        React &middot; Next.js &middot; TypeScript
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                    >
                      Configure Queries
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-xs font-medium text-emerald-300 transition-colors cursor-pointer"
                    >
                      Inspect Matrix
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Matches & Opportunities Header */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h2 className="text-base font-bold text-white">Top Matches &amp; Opportunities</h2>
                  <p className="text-xs text-zinc-400">
                    Highest scoring vacancies with instant HR contact discovery
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("vacancies")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>View all 682 vacancies</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Vacancy Feed Cards */}
              <div className="space-y-3">
                {filteredVacancies.map((vac) => {
                  const isSelected = selectedVacancy?.id === vac.id;
                  return (
                    <div
                      key={vac.id}
                      onClick={() => setSelectedVacancy(vac)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-[#141419] border-emerald-500/40 shadow-lg"
                          : "bg-[#0b0b0e] border-white/[0.06] hover:border-white/20 hover:bg-[#111115]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                          {vac.companyLogoText}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-white hover:text-emerald-300 transition-colors">
                              {vac.title}
                            </h3>
                            {vac.applied && (
                              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                                [APPLIED]
                              </span>
                            )}
                            {vac.saved && (
                              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                                [SAVED]
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-300">{vac.company}</span>
                            <span>&middot;</span>
                            <span>{vac.location}</span>
                            <span>&middot;</span>
                            <span className="font-mono text-zinc-200">{vac.salary}</span>
                            <span>&middot;</span>
                            <span className="text-zinc-500">{vac.date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 pl-13 md:pl-0">
                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1">
                            <span className="text-xl font-bold text-white">{vac.score}</span>
                            <span className="text-xs text-zinc-500">/ 100</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                            {vac.scoreLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(vac.id, e)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              vac.saved
                                ? "bg-sky-950/60 border-sky-500/40 text-sky-300"
                                : "bg-zinc-900 border-white/[0.06] text-zinc-400 hover:text-white"
                            }`}
                            title="Save to manual queue"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleToggleApply(vac.id, e)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              vac.applied
                                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                : "bg-zinc-900 border-white/[0.06] text-zinc-400 hover:text-white"
                            }`}
                            title="Mark applied"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? "text-emerald-400 translate-x-0.5" : "text-zinc-600"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Vacancies / Saved / Applied */}
          {(activeTab === "vacancies" || activeTab === "saved" || activeTab === "applied") && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search by title, employer, or tech stack..."
                    value={queryFilter}
                    onChange={(e) => setQueryFilter(e.target.value)}
                    className="w-full bg-[#0f0f13] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredVacancies.map((vac) => (
                  <div
                    key={vac.id}
                    onClick={() => setSelectedVacancy(vac)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedVacancy?.id === vac.id
                        ? "bg-[#141419] border-emerald-500/40 shadow-lg"
                        : "bg-[#0b0b0e] border-white/[0.06] hover:border-white/20 hover:bg-[#111115]"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">
                        {vac.companyLogoText}
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-white hover:text-emerald-300 transition-colors">
                          {vac.title}
                        </h3>
                        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-300">{vac.company}</span>
                          <span>&middot;</span>
                          <span>{vac.location}</span>
                          <span>&middot;</span>
                          <span className="font-mono text-zinc-200">{vac.salary}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 pl-13 md:pl-0">
                      <div className="text-right font-mono">
                        <span className="text-lg font-bold text-white">{vac.score}</span>
                        <span className="text-xs text-zinc-500"> / 100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View: Company Intel */}
          {activeTab === "company-intel" && <CompanyIntelPaywall returnHref="/demo" />}

          {/* View: Analytics */}
          {activeTab === "analytics" && (
            <div className="p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.08] space-y-4">
              <h3 className="text-base font-bold text-white">Synergy &amp; Compensation Distribution</h3>
              <p className="text-xs text-zinc-400">
                Evaluation calibration across 240 processed HeadHunter vacancies.
              </p>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>High Compatibility (&gt;75%)</span>
                    <span className="font-mono text-emerald-400">34 listings (14.2%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[14.2%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Potential Synergy (50-74%)</span>
                    <span className="font-mono text-amber-400">61 listings (25.4%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 w-[25.4%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Low Synergy (&lt;50%)</span>
                    <span className="font-mono text-zinc-400">145 listings (60.4%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-zinc-600 w-[60.4%]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View: Settings */}
          {activeTab === "settings" && (
            <div className="p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.08] space-y-5 max-w-2xl">
              <h3 className="text-base font-bold text-white">Autonomous Hunter Parameters</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Tracked Search Query Keywords</label>
                  <input
                    type="text"
                    readOnly
                    value="React · Next.js · TypeScript"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Minimum Net Compensation Floor (RUR)</label>
                  <input
                    type="text"
                    readOnly
                    value="200,000 RUR"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Telegram Bot Dispatch Channel</label>
                  <input
                    type="text"
                    readOnly
                    value="@hh_vacancy_copilot_bot"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sky-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Inspection Drawer / Detailed Inspector (Always available for selected vacancy) */}
          {selectedVacancy && ["overview", "vacancies", "saved", "applied"].includes(activeTab) && (
            <div className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div className="space-y-1">
                  <div className="text-xs text-emerald-400 font-mono">
                    Vacancy Inspection &middot; {selectedVacancy.id}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedVacancy.title}
                  </h3>
                  <div className="text-xs text-zinc-400">
                    {selectedVacancy.company} &middot; {selectedVacancy.salary} &middot; {selectedVacancy.location}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleToggleApply(selectedVacancy.id, e)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-black bg-white hover:bg-zinc-200 transition-all shadow-sm cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{selectedVacancy.applied ? "Applied" : "Mark as Applied"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVacancy(null)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid: AI Analysis + Recruiter OSINT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#09090c] border border-white/[0.06] rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Multi-Tier AI Match Assessment</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {selectedVacancy.score} / 100
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Core Stack Synergy (React / Next.js)</span>
                      <span className="font-mono text-white">
                        {selectedVacancy.scoreBreakdown.stackSynergy} / 40
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${(selectedVacancy.scoreBreakdown.stackSynergy / 40) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
                      <span>Architecture Alignment (SSR / DB)</span>
                      <span className="font-mono text-white">
                        {selectedVacancy.scoreBreakdown.architectureFit} / 35
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{ width: `${(selectedVacancy.scoreBreakdown.architectureFit / 35) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
                      <span>Seniority &amp; Compensation Floor</span>
                      <span className="font-mono text-white">
                        {selectedVacancy.scoreBreakdown.seniorityLevel} / 25
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{ width: `${(selectedVacancy.scoreBreakdown.seniorityLevel / 25) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-white/[0.04] text-[11px] text-zinc-300 leading-relaxed">
                    {selectedVacancy.scoreBreakdown.notes}
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                  <h3 className="text-sm font-semibold text-zinc-100">Company Intel is a paid feature</h3>
                  <p className="text-xs leading-relaxed text-zinc-400">Company research, recruiter contacts, and outreach drafts are available for $3 per month. Your job search and Analytics stay free.</p>
                  <button type="button" onClick={() => setActiveTab("company-intel")} className="self-start rounded-lg bg-emerald-400 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-300">View Company Intel</button>
                </div>
              </div>

              {/* Vacancy Text Preview */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-300">
                  Vacancy Requirements Summary
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed bg-[#09090c] p-4 rounded-xl border border-white/[0.04]">
                  {selectedVacancy.description}
                </p>
              </div>

              {/* Tech Stack Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {selectedVacancy.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121217] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
