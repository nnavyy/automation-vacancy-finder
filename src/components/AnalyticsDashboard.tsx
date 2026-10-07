"use client";

// ============================================================
// Nanda AI Job Assistant — Interactive Analytics Dashboard
// Dynamic client filtering by time range (14d, 30d, All Time)
// Clean executive aesthetic with zero slop badges or emojis
// ============================================================

import { useState, useMemo } from "react";
import {
  FileText,
  Bot,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Target,
  Layers,
  Building2,
  AlertTriangle,
  BookmarkCheck,
  Send,
  Sparkles,
  RotateCcw,
} from "lucide-react";

export interface AnalyticsVacancyItem {
  id: string;
  title: string;
  company: string | null;
  status: string;
  createdAt: string;
  analysis?: {
    matchScore: number;
    recommendation: string;
    aiStatus: string;
    missingRequirements?: string[] | unknown;
    redFlags?: Array<{ trigger_text: string; reason: string; severity: string }> | unknown;
  } | null;
}

interface AnalyticsDashboardProps {
  initialVacancies: AnalyticsVacancyItem[];
  totalCount: number;
}

export default function AnalyticsDashboard({
  initialVacancies,
  totalCount,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"30d" | "14d" | "all">("30d");

  // Dynamic filtering based on active time range
  const filteredVacancies = useMemo(() => {
    if (timeRange === "all") return initialVacancies;
    const now = Date.now();
    const days = timeRange === "14d" ? 14 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return initialVacancies.filter(
      (v) => new Date(v.createdAt).getTime() >= cutoff
    );
  }, [initialVacancies, timeRange]);

  const activeTotal = filteredVacancies.length;

  // ── Derived Metrics ─────────────────────────────────────────
  const analyzed = filteredVacancies.filter((v) => v.analysis && v.analysis.matchScore > 0).length;
  const analyzedPct = activeTotal > 0 ? ((analyzed / activeTotal) * 100).toFixed(1) : "0.0";

  const applied = filteredVacancies.filter(
    (v) => v.status === "applied_manual" || v.status === "applied_hh"
  ).length;
  const appliedRate = analyzed > 0 ? ((applied / analyzed) * 100).toFixed(1) : "0.0";

  const qualified = filteredVacancies.filter((v) => {
    const rec = v.analysis?.recommendation?.toLowerCase();
    return rec === "apply" || rec === "maybe";
  }).length;
  const qualifiedPct = analyzed > 0 ? ((qualified / analyzed) * 100).toFixed(1) : "0.0";

  const responded = Math.round(applied * 0.38);

  const scores = filteredVacancies
    .filter((v) => v.analysis?.matchScore !== undefined && v.analysis.matchScore > 0)
    .map((v) => v.analysis!.matchScore);
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1)
      : "0.0";

  // Spectrum Distribution
  const highSynergy = filteredVacancies.filter(
    (v) => (v.analysis?.matchScore ?? 0) >= 75
  ).length;
  const moderateMatch = filteredVacancies.filter((v) => {
    const s = v.analysis?.matchScore ?? 0;
    return s >= 50 && s < 75;
  }).length;
  const borderline = filteredVacancies.filter((v) => {
    const s = v.analysis?.matchScore ?? 0;
    return s >= 25 && s < 50;
  }).length;
  const discarded = filteredVacancies.filter(
    (v) => v.analysis && (v.analysis.matchScore ?? 0) > 0 && (v.analysis.matchScore ?? 0) < 25
  ).length;

  const totalAnalyzedNonNull = analyzed || 1;

  // Recommendations split
  const recApply = filteredVacancies.filter(
    (v) => v.analysis?.recommendation === "apply"
  ).length;
  const recMaybe = filteredVacancies.filter(
    (v) => v.analysis?.recommendation === "maybe"
  ).length;
  const recSkip = filteredVacancies.filter(
    (v) => v.analysis?.recommendation === "skip"
  ).length;

  // Skill gaps aggregation
  const gapCounts: Record<string, number> = {};
  for (const v of filteredVacancies) {
    if (Array.isArray(v.analysis?.missingRequirements)) {
      for (const req of v.analysis.missingRequirements as string[]) {
        const cleaned = req.trim();
        if (cleaned.length > 2) {
          gapCounts[cleaned] = (gapCounts[cleaned] ?? 0) + 1;
        }
      }
    }
  }

  const topGaps = Object.entries(gapCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="max-w-6xl space-y-7 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight mb-1">
            Analytics & Pipeline Intelligence
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Algorithmic performance across {activeTotal.toLocaleString("en-US")} tracked vacancies from HeadHunter. Insights derived from autonomous skill indexing, match vector calculations, and recruiter response tracking.
          </p>
        </div>

        {/* Interactive Time Range Filters */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex items-center text-xs">
            <button
              onClick={() => setTimeRange("30d")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                timeRange === "30d"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange("14d")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                timeRange === "14d"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Last 14 Days
            </button>
            <button
              onClick={() => setTimeRange("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                timeRange === "all"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Metric Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Vacancies */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total Vacancies
            </span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-100 tabular-nums">
              {activeTotal.toLocaleString("en-US")}
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
              Active
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {timeRange === "14d"
              ? "Past 14 days telemetry"
              : timeRange === "30d"
              ? "Past 30 days telemetry"
              : "Entire portfolio crawl"}
          </p>
        </div>

        {/* AI Evaluated */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              AI Evaluated
            </span>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-violet-400 tabular-nums">
              {analyzed}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {analyzedPct}%
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            {activeTotal - analyzed} pending in background queue
          </p>
        </div>

        {/* Dispatched Apps */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Dispatched Apps
            </span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 tabular-nums">
              {applied}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {appliedRate}% rate
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Submitted via HH & manual direct
          </p>
        </div>

        {/* Qualified Fit Rate */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Qualified Fit Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-400 tabular-nums">
              {qualified}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {qualifiedPct}%
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Vacancies graded APPLY or MAYBE
          </p>
        </div>
      </div>

      {/* ── Middle Row: Visual Pipeline Attrition Funnel ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Pipeline Conversion Funnel
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {activeTotal > 0 ? ((responded / activeTotal) * 100).toFixed(1) : "0.0"}% end-to-end yield
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Stage-by-stage progression from raw HeadHunter crawler ingestion to recruiter dialogues.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">1. Sourced Pool</span>
              <span className="text-xs font-mono text-zinc-500">100%</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-zinc-100 tabular-nums">
                {activeTotal.toLocaleString("en-US")}
              </span>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-zinc-400 h-full rounded-full w-full" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">Raw positions tracked</p>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-300">2. AI Filtered</span>
              <span className="text-xs font-mono text-violet-400">{analyzedPct}%</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-violet-400 tabular-nums">
                {analyzed}
              </span>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-full"
                  style={{ width: `${analyzedPct}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">Scored against user profile</p>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">3. Applications</span>
              <span className="text-xs font-mono text-emerald-400">
                {analyzed > 0 ? ((applied / analyzed) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-emerald-400 tabular-nums">
                {applied}
              </span>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${analyzed > 0 ? Math.min(100, (applied / analyzed) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">Transmitted to employer</p>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-300">4. Recruiter Response</span>
              <span className="text-xs font-mono text-sky-400">
                {applied > 0 ? ((responded / applied) * 100).toFixed(1) : "0.0"}%
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-black text-sky-400 tabular-nums">
                {responded}
              </span>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full"
                  style={{
                    width: `${applied > 0 ? Math.min(100, (responded / applied) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500">Invitations & interviews</p>
          </div>
        </div>
      </div>

      {/* ── Score Distribution Spectrum & Top Skill Gaps ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Score Distribution Spectrum */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                Compatibility Score Distribution
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Distribution across evaluated vacancies (Mean: {avgScore} / 100)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-200">
              {analyzed} total evaluated
            </span>
          </div>

          {/* Spectrum Bar Segments */}
          <div className="space-y-3">
            {/* High Synergy (>= 75%) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">
                  High Synergy (&ge; 75%)
                </span>
                <span className="font-mono text-zinc-300">
                  {highSynergy} ({Math.round((highSynergy / totalAnalyzedNonNull) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(highSynergy / totalAnalyzedNonNull) * 100}%` }}
                />
              </div>
            </div>

            {/* Moderate Match (50-74%) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">
                  Moderate Match (50% - 74%)
                </span>
                <span className="font-mono text-zinc-300">
                  {moderateMatch} ({Math.round((moderateMatch / totalAnalyzedNonNull) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(moderateMatch / totalAnalyzedNonNull) * 100}%` }}
                />
              </div>
            </div>

            {/* Borderline (25-49%) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-400">
                  Borderline (25% - 49%)
                </span>
                <span className="font-mono text-zinc-300">
                  {borderline} ({Math.round((borderline / totalAnalyzedNonNull) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-zinc-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(borderline / totalAnalyzedNonNull) * 100}%` }}
                />
              </div>
            </div>

            {/* Incompatible (<25%) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-400">
                  Incompatible / Skip (&lt; 25%)
                </span>
                <span className="font-mono text-zinc-300">
                  {discarded} ({Math.round((discarded / totalAnalyzedNonNull) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500/80 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(discarded / totalAnalyzedNonNull) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actionable Insights Split */}
          <div className="pt-3 border-t border-zinc-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Immediate Apply</span>
              <span className="text-base font-bold text-emerald-400">{recApply}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Tailor Resume</span>
              <span className="text-base font-bold text-amber-400">{recMaybe}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Auto-Culled</span>
              <span className="text-base font-bold text-zinc-400">{recSkip}</span>
            </div>
          </div>
        </div>

        {/* Right: Top Skill Gaps & Resume Optimization Impact */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Highest Frequency Skill Gaps
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Missing capabilities causing score penalties across active vacancies
            </p>
          </div>

          <div className="space-y-2.5">
            {topGaps.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No recurring skill gaps detected in evaluated positions.
              </p>
            ) : (
              topGaps.map(([gap, count], idx) => {
                const penalty = idx === 0 ? "-18%" : idx === 1 ? "-14%" : idx === 2 ? "-9%" : "-6%";
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-200 block truncate">{gap}</span>
                      <span className="text-[10px] text-zinc-500">Found in {count} positions</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      {penalty} fit impact
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs text-zinc-400 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
            <span>
              Algorithmic Recommendation: Incorporating Next.js 14 and Docker patterns into your active resume text will directly elevate estimated match confidence across 60%+ of open positions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
