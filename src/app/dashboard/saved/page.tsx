// ============================================================
// Nanda AI Job Assistant — Saved Vacancies Page
// Dedicated page for bookmarked vacancies
// ============================================================

import Link from "next/link";
import { Bookmark, AlertTriangle, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface AnalysisSummary {
  matchScore: number;
  recommendation: string;
  aiStatus: string;
  redFlags: unknown[];
  coverLetter?: string;
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

function recVariant(rec: string): "green" | "yellow" | "red" {
  if (rec === "apply") return "green";
  if (rec === "maybe") return "yellow";
  return "red";
}

export default async function SavedPage({
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
      status: "saved",
      page: String(page),
      limit: "20",
      sortBy: "matchScore",
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

  const prevHref = `/dashboard/saved?page=${Math.max(1, page - 1)}`;
  const nextHref = `/dashboard/saved?page=${Math.min(totalPages, page + 1)}`;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Bookmark size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Vacancies</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {total} saved {total === 1 ? "vacancy" : "vacancies"} — review and apply when ready
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {vacancies.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <Bookmark size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-sm mb-1">No saved vacancies yet.</p>
            <p className="text-gray-600 text-xs">
              Click &quot;Save&quot; on any vacancy to bookmark it here.
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
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <Link
                        href={`/dashboard/vacancies/${v.id}`}
                        className="text-white font-semibold leading-snug group-hover:text-blue-400 transition-colors"
                      >
                        {v.title}
                      </Link>
                      {v.analysis?.recommendation && (
                        <Badge
                          label={v.analysis.recommendation.toUpperCase()}
                          variant={recVariant(v.analysis.recommendation)}
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
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
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
