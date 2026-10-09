"use client";

// ============================================================
// wingkiiy Job Copilot — Vacancies View Error Boundary
// Specific recovery boundary for /dashboard/vacancies
// ============================================================

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  RotateCcw,
  LayoutDashboard,
  Briefcase,
  Database,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

export default function VacanciesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[VacanciesViewIncident]", error);
  }, [error]);

  const isDbTimeout =
    error.message?.toLowerCase().includes("prisma") ||
    error.message?.toLowerCase().includes("database") ||
    error.message?.toLowerCase().includes("connection") ||
    error.message?.toLowerCase().includes("p1001");

  const digestId = error.digest || "VACANCY_FEED_FAULT";

  return (
    <div className="max-w-4xl font-sans">
      {/* Header bar matching dashboard layout */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Vacancies</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Smart job collection, AI matching scores, and auto-apply pipeline
        </p>
      </div>

      {/* Incident Recovery Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Briefcase size={16} />
            </div>
            <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
              Vacancy Index Query Incident
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500">
              Ref: <span className="text-zinc-300">{digestId}</span>
            </span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(digestId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Copy Reference"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {isDbTimeout ? "Database Connection Waking Up" : "Unable to Index Vacancy Feed"}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
              {isDbTimeout
                ? "The database connection pool encountered an idle latency window on NeonDB. Serverless PostgreSQL instances hibernate when idle, causing the initial handshake to time out."
                : "An unexpected exception interrupted the retrieval of your saved and analyzed vacancy feed."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-xs text-zinc-300 space-y-1.5">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <Database size={14} className="text-amber-400" />
              <span>Recommended Action:</span>
            </div>
            <p className="text-zinc-400">
              {isDbTimeout
                ? "Click 'Retry Query' below. The database instance has already begun warming up, and the subsequent query will succeed immediately."
                : "Try reloading the vacancy dataset or return to the overview workspace."}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => startTransition(() => reset())}
              disabled={isPending}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-medium transition-all duration-150 active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              <RotateCcw
                size={15}
                className={`transition-transform duration-300 ${isPending ? "animate-spin" : "group-hover:-rotate-45"}`}
              />
              <span>{isPending ? "Connecting..." : "Retry Query"}</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
            >
              <Sparkles size={14} />
              <span>AI Profile Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
