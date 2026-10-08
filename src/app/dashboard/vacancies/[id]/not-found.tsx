// ============================================================
// wingkiiy Job Copilot — Vacancy Not Found (404)
// Rendered when an individual vacancy ID is missing or deleted
// ============================================================

import Link from "next/link";
import {
  FileQuestion,
  Briefcase,
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function VacancyNotFound() {
  return (
    <div className="max-w-4xl font-sans">
      {/* Header bar */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Vacancy Dossier</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Detailed vacancy telemetry, skill matching, and tailored cover letter
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileQuestion size={16} />
            </div>
            <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
              Record Resolution Error // 404
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-500">
            Status: <span className="text-amber-400">Archived / Missing</span>
          </span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Vacancy Dossier Not Located
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
              The vacancy ID specified does not exist in your local database. It may have been skipped and pruned during database cleanup, expired from HeadHunter, or never synced to your profile.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-xs text-zinc-300 space-y-2">
            <div className="font-semibold text-zinc-200">Suggested Action:</div>
            <p className="text-zinc-400 leading-relaxed">
              Return to your active vacancies feed to browse freshly synced jobs, or execute a new HeadHunter collection run from the Overview page.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/vacancies"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-medium transition-all shadow-sm"
            >
              <Briefcase size={15} />
              <span>Browse All Vacancies</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/dashboard/vacancies"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Vacancies</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
