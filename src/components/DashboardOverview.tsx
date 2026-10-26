"use client";

// ============================================================
// HH Job Copilot — Interactive Dashboard Overview Component
// Dynamic client localization (EN/RU) via useLanguage
// Real-time reactive telemetry updates during collection runs
// ============================================================

import { useState, useEffect } from "react";
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
  ArrowRight,
} from "lucide-react";
import SyncCadenceTimer from "@/components/SyncCadenceTimer";
import RunCollectionButton, { LiveDashboardStats } from "@/components/RunCollectionButton";
import OverviewTopMatches, { TopMatchVacancy } from "@/components/OverviewTopMatches";
import { useLanguage } from "@/lib/i18n";

interface DashboardOverviewProps {
  total: number;
  applied: number;
  skipped: number;
  saved: number;
  aiPending: number;
  avgScore: number;
  highCount: number;
  maybeCount: number;
  lowCount: number;
  analyzedCount: number;
  lastSyncIso?: string;
  topMatches: TopMatchVacancy[];
  targetRoles: string[];
  matchThreshold?: number;
}

export default function DashboardOverview({
  total: initialTotal,
  applied: initialApplied,
  skipped: initialSkipped,
  saved: initialSaved,
  aiPending: initialAiPending,
  avgScore: initialAvgScore,
  highCount: initialHighCount,
  maybeCount: initialMaybeCount,
  lowCount: initialLowCount,
  analyzedCount: initialAnalyzedCount,
  lastSyncIso,
  topMatches,
  targetRoles,
  matchThreshold,
}: DashboardOverviewProps) {
  const { t, language } = useLanguage();

  const [metrics, setMetrics] = useState<LiveDashboardStats>({
    total: initialTotal,
    applied: initialApplied,
    skipped: initialSkipped,
    saved: initialSaved,
    aiPending: initialAiPending,
    avgScore: initialAvgScore,
    highCount: initialHighCount,
    maybeCount: initialMaybeCount,
    lowCount: initialLowCount,
    analyzedCount: initialAnalyzedCount,
  });

  const [isCollecting, setIsCollecting] = useState(false);

  // Sync state if server props change (e.g. after collection completes and router.refresh triggers)
  useEffect(() => {
    setMetrics({
      total: initialTotal,
      applied: initialApplied,
      skipped: initialSkipped,
      saved: initialSaved,
      aiPending: initialAiPending,
      avgScore: initialAvgScore,
      highCount: initialHighCount,
      maybeCount: initialMaybeCount,
      lowCount: initialLowCount,
      analyzedCount: initialAnalyzedCount,
    });
  }, [
    initialTotal,
    initialApplied,
    initialSkipped,
    initialSaved,
    initialAiPending,
    initialAvgScore,
    initialHighCount,
    initialMaybeCount,
    initialLowCount,
    initialAnalyzedCount,
  ]);

  const conversionRate =
    metrics.total > 0 ? ((metrics.applied / metrics.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-6xl space-y-7 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight mb-1">
            {t("overview.title")}
          </h1>
          <p className="text-zinc-400 text-sm">
            {t("overview.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunCollectionButton
            onLiveUpdate={(stats) => setMetrics((prev) => ({ ...prev, ...stats }))}
            onRunningChange={(running) => setIsCollecting(running)}
          />
        </div>
      </div>

      {/* ── Top Stat Cards Row with Rate Indicators ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Vacancies */}
        <div
          className={`bg-zinc-900/60 border rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2 transition-all ${
            isCollecting
              ? "border-emerald-500/50 shadow-emerald-500/10 shadow-lg ring-1 ring-emerald-500/20"
              : "border-zinc-800/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {t("overview.totalVacancies")}
            </span>
            <FileText
              className={`w-3.5 h-3.5 transition-colors ${
                isCollecting ? "text-emerald-400 animate-pulse" : "text-zinc-500"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-zinc-100 tabular-nums transition-all">
              {metrics.total.toLocaleString(language === "ru" ? "ru-RU" : "en-US")}
            </span>
            {isCollecting ? (
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded animate-pulse">
                LIVE
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                +12%
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            {metrics.total - metrics.skipped} {language === "ru" ? "активных вакансий" : "active opportunities"} · {metrics.skipped} {language === "ru" ? "в архиве" : "archived"}
          </p>
        </div>

        {/* Applied */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {t("overview.applied")}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
              {metrics.applied}
            </span>
            <span className="text-[11px] text-zinc-400">{t("overview.responses")}</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            {t("overview.conversionRate")} {conversionRate}%
          </p>
        </div>

        {/* Skipped / Auto-culled */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {t("overview.skipped")}
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400 tabular-nums">
              {metrics.skipped}
            </span>
            <span className="text-[11px] text-zinc-400">{t("overview.autoCulled")}</span>
          </div>
          <p className="text-[11px] text-zinc-500">{t("overview.lowMatch")}</p>
        </div>

        {/* Saved */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {t("overview.saved")}
            </span>
            <BookmarkCheck className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-sky-400 tabular-nums">
              {metrics.saved}
            </span>
            <span className="text-[11px] text-zinc-400">{t("overview.staged")}</span>
          </div>
          <p className="text-[11px] text-zinc-500">{t("overview.actionableQueue")}</p>
        </div>

        {/* AI Pending */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              {t("overview.aiPending")}
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">
              {metrics.aiPending}
            </span>
            <span className="text-[11px] text-zinc-400">{t("overview.inQueue")}</span>
          </div>
          <p className="text-[11px] text-zinc-500">{t("overview.backgroundActive")}</p>
        </div>
      </div>

      {/* ── Middle Row: Average Match Score & Hunter Engine ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Average Match Score & AI Optimization Suggestion */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                {t("overview.avgScore")}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {t("overview.basedOnAnalyzed").replace("{count}", String(metrics.analyzedCount))}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-4xl font-black text-zinc-100 tracking-tight">
                {metrics.avgScore}
              </span>
              <span className="text-sm text-zinc-500">/ 100</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  metrics.avgScore >= 65
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {metrics.avgScore >= 65
                  ? (language === "ru" ? "Высокая совместимость" : "Calibrated to Target")
                  : (language === "ru" ? "Требуется калибровка" : "Below Target Calibration")}
              </span>
            </div>

            {/* Score Breakdown Pills */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                {t("overview.high")}: <strong className="text-white ml-1">{metrics.highCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium">
                {t("overview.maybe")}: <strong className="text-white ml-1">{metrics.maybeCount}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 font-medium">
                {t("overview.low")}: <strong className="text-white ml-1">{metrics.lowCount}</strong>
              </span>
            </div>
          </div>

          {/* AI Optimization Suggestion Box */}
          <div className="p-3.5 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              {t("overview.aiSuggestion")}
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t("overview.aiSuggestionText")}
            </p>
          </div>
        </div>

        {/* Right: Hunter Engine */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-emerald-400" />
                {t("overview.hunterEngine")}
              </span>
            </div>

            <SyncCadenceTimer initialLastSyncedAt={lastSyncIso} />

            <div className="space-y-1 pt-3">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                {t("overview.trackedQueries")}
              </span>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                {targetRoles.length > 0
                  ? targetRoles.slice(0, 3).join(" · ")
                  : (language === "ru" ? "Не настроено" : "None configured")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <Link
              href="/dashboard/settings"
              className="flex-1 py-2 text-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              {t("overview.configureQueries")}
            </Link>
            <Link
              href="/dashboard/vacancies"
              className="flex-1 py-2 text-center rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-xs font-semibold text-emerald-400 border border-emerald-500/20 transition-colors"
            >
              {t("overview.inspectMatrix")}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Top Matches with Direct Find HR Action ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                {t("overview.topMatches")}
              </h2>
              {matchThreshold !== undefined && (
                <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Score ≥ {matchThreshold}%
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {t("overview.topMatchesDesc")}
            </p>
          </div>

          <Link
            href="/dashboard/vacancies"
            className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>{t("overview.viewAll").replace("{count}", String(metrics.total))}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <OverviewTopMatches vacancies={topMatches} />
      </div>
    </div>
  );
}
