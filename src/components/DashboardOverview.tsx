"use client";

// ============================================================
// HH Job Copilot, Interactive Dashboard Overview Component
// Dynamic client localization (EN/RU) via useLanguage
// Real-time reactive telemetry updates during collection runs
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import SyncCadenceTimer from "@/components/SyncCadenceTimer";
import RunCollectionButton, { LiveDashboardStats } from "@/components/RunCollectionButton";
import OverviewTopMatches, { TopMatchVacancy } from "@/components/OverviewTopMatches";
import { useLanguage } from "@/lib/i18n";
import SpotlightCard from "@/components/ui/SpotlightCard";
import DashboardFocus from "@/components/DashboardFocus";
import CountUp from "@/components/ui/CountUp";

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

  const locale = language === "ru" ? "ru-RU" : "en-US";
  const scoreSum = Math.max(1, metrics.highCount + metrics.maybeCount + metrics.lowCount);
  const segments = [
    { key: "high", label: t("overview.high"), value: metrics.highCount, color: "bg-emerald-400" },
    { key: "maybe", label: t("overview.maybe"), value: metrics.maybeCount, color: "bg-amber-400" },
    { key: "low", label: t("overview.low"), value: metrics.lowCount, color: "bg-zinc-600" },
  ];

  const RING_R = 52;
  const RING_C = 2 * Math.PI * RING_R;
  const EASE = [0.16, 1, 0.3, 1] as const;

  const stats = [
    {
      label: t("overview.totalVacancies"),
      value: metrics.total,
      tone: "text-zinc-50",
      hint: `${metrics.total - metrics.skipped} ${language === "ru" ? "активных" : "active"} · ${metrics.skipped} ${language === "ru" ? "в архиве" : "archived"}`,
    },
    {
      label: t("overview.applied"),
      value: metrics.applied,
      tone: "text-emerald-400",
      hint: `${t("overview.conversionRate")} ${conversionRate}%`,
    },
    {
      label: t("overview.saved"),
      value: metrics.saved,
      tone: "text-sky-400",
      hint: t("overview.actionableQueue"),
    },
    {
      label: t("overview.skipped"),
      value: metrics.skipped,
      tone: "text-zinc-300",
      hint: t("overview.lowMatch"),
    },
    {
      label: t("overview.aiPending"),
      value: metrics.aiPending,
      tone: "text-amber-400",
      hint: t("overview.backgroundActive"),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium text-zinc-50 tracking-[-0.02em] leading-tight mb-1.5">
            {t("overview.title")}
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">{t("overview.subtitle")}</p>
        </div>
        <RunCollectionButton
          onLiveUpdate={(stats) => setMetrics((prev) => ({ ...prev, ...stats }))}
          onRunningChange={(running) => setIsCollecting(running)}
        />
      </motion.div>

      <DashboardFocus total={metrics.total} saved={metrics.saved} language={language} />

      {/* Stat strip: one surface, five cells */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
      >
        <SpotlightCard active={isCollecting} className="overflow-hidden">
          {isCollecting && <span className="sweep-line" aria-hidden />}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-white/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#101416] p-5 space-y-2 first:rounded-tl-2xl">
                <span className="block text-xs font-medium text-zinc-400">{s.label}</span>
                <CountUp
                  value={s.value}
                  locale={locale}
                  className={`block text-3xl font-semibold tabular-nums tracking-[-0.02em] ${s.tone}`}
                />
                <p className="text-[11px] text-zinc-500 leading-snug">{s.hint}</p>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </motion.div>

      {/* Bento row: match quality + engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
          className="lg:col-span-7"
        >
          <SpotlightCard className="h-full p-6 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium text-zinc-100 tracking-tight">
                  {t("overview.avgScore")}
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-mono">
                  {t("overview.basedOnAnalyzed").replace("{count}", String(metrics.analyzedCount))}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Animated score ring */}
              <div className="relative w-36 h-36 shrink-0">
                <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r={RING_R}
                    fill="none"
                    stroke={metrics.avgScore >= 65 ? "#34d399" : "#fbbf24"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    initial={{ strokeDashoffset: RING_C }}
                    animate={{ strokeDashoffset: RING_C * (1 - Math.min(100, metrics.avgScore) / 100) }}
                    transition={{ duration: 1.3, ease: EASE }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <CountUp
                    value={metrics.avgScore}
                    className="text-4xl font-semibold tabular-nums tracking-[-0.03em] text-zinc-50"
                  />
                  <span className="text-[11px] text-zinc-500">/ 100</span>
                </div>
              </div>

              {/* Distribution */}
              <div className="flex-1 w-full space-y-4">
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {metrics.avgScore >= 65
                    ? language === "ru"
                      ? "Высокая совместимость"
                      : "Calibrated to target"
                    : language === "ru"
                      ? "Требуется калибровка"
                      : "Below target calibration"}
                </p>
                <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/[0.05] gap-0.5">
                  {segments.map((s, i) => (
                    <motion.div
                      key={s.key}
                      className={`${s.color} h-full first:rounded-l-full last:rounded-r-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.value / scoreSum) * 100}%` }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: EASE }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {segments.map((s) => (
                    <div key={s.key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                        {s.label}
                      </div>
                      <CountUp
                        value={s.value}
                        locale={locale}
                        className="block text-lg font-semibold tabular-nums text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed border-t border-white/[0.06] pt-4">
              {t("overview.aiSuggestionText")}
            </p>
          </SpotlightCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
          className="lg:col-span-5"
        >
          <SpotlightCard className="h-full p-6 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <h2 className="text-sm font-medium text-zinc-100 tracking-tight">
                {t("overview.hunterEngine")}
              </h2>

              <SyncCadenceTimer initialLastSyncedAt={lastSyncIso} />

              <div className="space-y-1.5">
                <span className="text-xs text-zinc-500 block">{t("overview.trackedQueries")}</span>
                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                  {targetRoles.length > 0
                    ? targetRoles.slice(0, 3).join(" · ")
                    : language === "ru"
                      ? "Не настроено"
                      : "None configured"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-white/[0.06]">
              <Link
                href="/dashboard/settings"
                className="flex-1 py-2 text-center rounded-lg border border-white/[0.08] hover:bg-white/[0.05] text-xs font-medium text-zinc-300 hover:text-white transition-colors active:scale-[0.98]"
              >
                {t("overview.configureQueries")}
              </Link>
              <Link
                href="/dashboard/vacancies"
                className="flex-1 py-2 text-center rounded-lg bg-zinc-100 hover:bg-white text-xs font-medium text-zinc-900 transition-colors active:scale-[0.98]"
              >
                {t("overview.inspectMatrix")}
              </Link>
            </div>
          </SpotlightCard>
        </motion.div>
      </div>

      {/* Top matches */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.24, ease: EASE }}
        className="space-y-4 pt-2"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50 tracking-[-0.01em]">
              {t("overview.topMatches")}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {t("overview.topMatchesDesc")}
              {matchThreshold !== undefined ? ` · ${matchThreshold}%+` : ""}
            </p>
          </div>

          <Link
            href="/dashboard/vacancies"
            className="group text-xs text-zinc-400 hover:text-zinc-100 font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            <span>{t("overview.viewAll").replace("{count}", String(metrics.total))}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
          </Link>
        </div>

        <OverviewTopMatches vacancies={topMatches} />
      </motion.div>
    </div>
  );
}

