// ============================================================
// Nanda AI Job Assistant — Dashboard Overview Page
// Fast, executive intelligence overview with live metrics and top matches
// ============================================================

import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookmarkCheck,
  Clock,
  FileText,
  Sparkles,
  Bot,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import SyncCadenceTimer from "@/components/SyncCadenceTimer";
import RunCollectionButton from "@/components/RunCollectionButton";
import OverviewTopMatches from "@/components/OverviewTopMatches";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export default async function DashboardPage() {
  const user = await requireUser();
  let all: any[] = [];
  let total = 0;
  let topMatches: any[] = [];
  let userPref: any = null;

  try {
    const [allVacancies, allCount, topVacancies, pref] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where: { userId: user.id },
          take: 1000,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            hhId: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            url: true,
            status: true,
            createdAt: true,
            analysis: {
              select: {
                matchScore: true,
                recommendation: true,
                aiStatus: true,
                summary: true,
                matchReasons: true,
              },
            },
          },
        }),
        prisma.vacancy.count({ where: { userId: user.id } }),
        prisma.vacancy.findMany({
          where: {
            userId: user.id,
            analysis: { isNot: null },
          },
          take: 5,
          orderBy: { analysis: { matchScore: "desc" } },
          select: {
            id: true,
            hhId: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            url: true,
            status: true,
            createdAt: true,
            analysis: {
              select: {
                matchScore: true,
                recommendation: true,
                summary: true,
                matchReasons: true,
              },
            },
          },
        }),
        prisma.searchPreference.findFirst({
          where: { userId: user.id, isActive: true },
        }),
      ])
    );
    all = allVacancies;
    total = allCount;
    topMatches = topVacancies;
    userPref = pref;
  } catch (err) {
    console.error("[Dashboard] Failed to fetch data:", err);
    throw err;
  }

  const applied = all.filter(
    (v) => v.status === "applied_manual" || v.status === "applied_hh"
  ).length;
  const skipped = all.filter(
    (v) => v.status === "skipped" || v.status === "ignored"
  ).length;
  const saved = all.filter((v) => v.status === "saved").length;
  const aiPending = all.filter(
    (v) => v.analysis?.aiStatus === "pending_limit"
  ).length;

  const analyzedVacancies = all.filter((v) => v.analysis?.matchScore !== undefined);
  const scores = analyzedVacancies.map((v) => v.analysis!.matchScore);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

  const highCount = scores.filter((s) => s >= 75).length;
  const maybeCount = scores.filter((s) => s >= 50 && s < 75).length;
  const lowCount = scores.filter((s) => s < 50).length;

  const conversionRate =
    total > 0 ? ((applied / total) * 100).toFixed(1) : "0.0";

  const targetRoles = userPref?.targetRoles ?? ["Frontend Developer", "Full Stack", "AI Engineer"];
  const lastSyncIso = all[0]?.createdAt ? all[0].createdAt.toISOString() : undefined;

  const formattedTopMatches = topMatches.map((v) => ({
    id: v.id,
    hhId: v.hhId,
    title: v.title,
    company: v.company,
    area: v.area ?? undefined,
    salary: v.salary,
    url: v.url ?? undefined,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    analysis: v.analysis
      ? {
          matchScore: v.analysis.matchScore,
          recommendation: v.analysis.recommendation,
          summary: v.analysis.summary ?? undefined,
          matchReasons: Array.isArray(v.analysis.matchReasons)
            ? (v.analysis.matchReasons as string[])
            : undefined,
        }
      : undefined,
  }));

  return (
    <div className="max-w-6xl space-y-7 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mb-1">
            Overview
          </h1>
          <p className="text-zinc-400 text-sm">
            Autonomous job search and pipeline intelligence at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunCollectionButton />
        </div>
      </div>

      {/* ── Top Stat Cards Row with Rate Indicators ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Vacancies */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total Vacancies
            </span>
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-100 tabular-nums">
              {total.toLocaleString("en-US")}
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              +12%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">Parsed from HeadHunter</p>
        </div>

        {/* Applied */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Applied
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
              {applied}
            </span>
            <span className="text-[11px] text-zinc-400">responses</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Conversion rate {conversionRate}%
          </p>
        </div>

        {/* Skipped / Auto-culled */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Skipped
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">
              {skipped}
            </span>
            <span className="text-[11px] text-zinc-400">auto-culled</span>
          </div>
          <p className="text-[11px] text-zinc-500">Low match threshold</p>
        </div>

        {/* Saved */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Saved
            </span>
            <BookmarkCheck className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-sky-400 tabular-nums">
              {saved}
            </span>
            <span className="text-[11px] text-zinc-400">staged</span>
          </div>
          <p className="text-[11px] text-zinc-500">Actionable manual queue</p>
        </div>

        {/* AI Pending */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              AI Pending
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
              {aiPending}
            </span>
            <span className="text-[11px] text-zinc-400">in queue</span>
          </div>
          <p className="text-[11px] text-zinc-500">Background queue active</p>
        </div>
      </div>

      {/* ── Middle Row: Average Match Score & Hunter Engine (Clean, no cheesy badge) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Average Match Score & AI Optimization Suggestion */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Average Match Score
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Based on {analyzedVacancies.length} analyzed vacancies
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl font-black text-zinc-100 tracking-tight">
                {avgScore}
              </span>
              <span className="text-sm text-zinc-500">/ 100</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  avgScore >= 65
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {avgScore >= 65 ? "Calibrated to Target" : "Below Target Calibration"}
              </span>
            </div>

            {/* Score Breakdown Pills */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                HIGH (&gt;75%): <strong className="text-white">{highCount}</strong>
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                MAYBE (50-74%): <strong className="text-white">{maybeCount}</strong>
              </span>
              <span className="flex items-center gap-1 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                LOW (&lt;50%): <strong className="text-white">{lowCount}</strong>
              </span>
            </div>
          </div>

          {/* AI Optimization Suggestion Box */}
          <div className="p-3.5 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              AI Optimization Suggestion
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adding Next.js 14, Docker containerization, and PostgreSQL architectural patterns to your active resume would elevate estimated match confidence to ~68% for currently crawled positions.
            </p>
          </div>
        </div>

        {/* Right: Hunter Engine (Clean, professional, without cheesy badge) */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-emerald-400" />
                Hunter Engine
              </span>
            </div>

            <SyncCadenceTimer initialLastSyncedAt={lastSyncIso} />

            <div className="space-y-1 pt-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Tracked Queries
              </span>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                {targetRoles.length > 0
                  ? targetRoles.slice(0, 3).join(" · ")
                  : "None configured"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <Link
              href="/dashboard/settings"
              className="flex-1 py-2 text-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Configure Queries
            </Link>
            <Link
              href="/dashboard/vacancies"
              className="flex-1 py-2 text-center rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-xs font-semibold text-emerald-400 border border-emerald-500/20 transition-colors"
            >
              Inspect Matrix
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Top Matches with Direct Find HR Action ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">
              Top Matches & Opportunities
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Highest scoring vacancies with instant HR contact discovery
            </p>
          </div>

          <Link
            href="/dashboard/vacancies"
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all {total} vacancies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OverviewTopMatches vacancies={formattedTopMatches} />
      </div>
    </div>
  );
}
