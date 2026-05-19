// ============================================================
// Nanda AI Job Assistant — Applied Vacancies Page
// Tracks all manually applied vacancies
// ============================================================

import Link from "next/link";
import { CheckCircle, AlertTriangle, ExternalLink, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface AnalysisSummary {
  matchScore: number;
  recommendation: string;
  aiStatus: string;
  redFlags: unknown[];
}

interface VacancyItem {
  id: string;
  hhId: string;
  title: string;
  company?: string;
  area?: string;
  salary?: { from?: number; to?: number; currency?: string };
  url?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  analysis?: AnalysisSummary;
}

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "";
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return "";
  if (s.from && s.to)
    return `${s.from.toLocaleString()} – ${s.to.toLocaleString()} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString()} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString()} ${s.currency ?? "RUR"}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AppliedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  let vacancies: VacancyItem[] = [];
  let total = 0;
  let totalPages = 1;

  try {
    const qs = new URLSearchParams({
      status: "applied_manual",
      page: String(page),
      limit: "20",
      sortBy: "updatedAt",
      order: "desc",
    });
    const res = await fetch(`${BASE_URL}/api/vacancies?${qs}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        vacancies = json.data.vacancies;
        total = json.data.total;
        totalPages = json.data.totalPages;
      }
    }
  } catch {
    /* show empty state */
  }

  const prevHref = `/dashboard/applied?page=${Math.max(1, page - 1)}`;
  const nextHref = `/dashboard/applied?page=${Math.min(totalPages, page + 1)}`;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle size={20} className="text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Applied Vacancies</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {total} application{total !== 1 ? "s" : ""} — track your progress
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Applied</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {vacancies.filter((v) => v.analysis && v.analysis.matchScore >= 75).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">High Match (75+)</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {vacancies.filter((v) => {
                const d = Date.now() - new Date(v.updatedAt).getTime();
                return d < 86400000 * 7;
              }).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">This Week</p>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {vacancies.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <CheckCircle size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-1">No applications yet.</p>
            <p className="text-gray-600 text-xs">
              Mark vacancies as &quot;Applied&quot; to track them here.
            </p>
          </div>
        ) : (
          vacancies.map((v) => {
            const redFlagCount = Array.isArray(v.analysis?.redFlags)
              ? v.analysis!.redFlags.length
              : 0;
            const salary = formatSalary(v.salary);

            return (
              <div
                key={v.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-green-500/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <Link
                        href={`/dashboard/vacancies/${v.id}`}
                        className="text-white font-semibold leading-snug group-hover:text-green-400 transition-colors"
                      >
                        {v.title}
                      </Link>
                      <Badge label="APPLIED" variant="green" />
                      {v.analysis?.recommendation && (
                        <Badge
                          label={`Score: ${v.analysis.matchScore}`}
                          variant={v.analysis.matchScore >= 75 ? "green" : v.analysis.matchScore >= 50 ? "yellow" : "red"}
                        />
                      )}
                      {redFlagCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-400/10 text-red-400 border border-red-400/30">
                          <AlertTriangle size={10} />
                          {redFlagCount} flag{redFlagCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                      {v.company && (
                        <span className="font-medium text-gray-300">
                          {v.company}
                        </span>
                      )}
                      {v.area && <span>• {v.area}</span>}
                      {salary && (
                        <span className="text-green-400 font-medium">
                          • {salary}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <Clock size={11} />
                        Applied {timeAgo(v.updatedAt)}
                      </span>
                    </div>

                    {/* Score bar */}
                    {v.analysis?.matchScore !== undefined && (
                      <div className="mt-3 max-w-xs">
                        <ScoreBar score={v.analysis.matchScore} size="sm" />
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/dashboard/vacancies/${v.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                    >
                      View Details
                    </Link>
                    {v.url && (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <ExternalLink size={11} />
                        Open on HH
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Link
            href={prevHref}
            aria-disabled={page <= 1}
            className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors ${
              page <= 1 ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            ← Previous
          </Link>
          <span className="text-sm text-gray-400 tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Link
            href={nextHref}
            aria-disabled={page >= totalPages}
            className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors ${
              page >= totalPages ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
