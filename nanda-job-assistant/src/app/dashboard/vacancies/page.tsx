// ============================================================
// Nanda AI Job Assistant — Vacancies List Page
// Server component — supports filter tabs + pagination via query params
// ============================================================

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";

// ── Constants ─────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Analyzed", value: "analyzed" },
  { label: "Notified", value: "notified" },
  { label: "Applied", value: "applied_manual" },
  { label: "Skipped", value: "skipped" },
  { label: "Saved", value: "saved" },
  { label: "Low Priority", value: "low_priority" },
] as const;

// ── Local types ───────────────────────────────────────────────

interface AnalysisSummary {
  matchScore: number;
  recommendation: string;
  aiStatus: string;
  redFlags: unknown[];
}

interface VacancyItem {
  id: string;
  title: string;
  company?: string;
  area?: string;
  salary?: unknown;
  status: string;
  createdAt: string;
  analysis?: AnalysisSummary;
}

interface VacanciesResponse {
  vacancies: VacancyItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Helpers ───────────────────────────────────────────────────

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "";
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return "";
  if (s.from && s.to)
    return `${s.from.toLocaleString()} – ${s.to.toLocaleString()} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString()} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString()} ${s.currency ?? "RUR"}`;
}

function statusVariant(
  status: string,
): "green" | "yellow" | "red" | "blue" | "gray" {
  const map: Record<string, "green" | "yellow" | "red" | "blue" | "gray"> = {
    applied_manual: "green",
    analyzed: "blue",
    notified: "yellow",
    skipped: "red",
    saved: "blue",
    new: "gray",
    low_priority: "gray",
    ignored: "red",
  };
  return map[status] ?? "gray";
}

function recVariant(rec: string): "green" | "yellow" | "red" {
  if (rec === "apply") return "green";
  if (rec === "maybe") return "yellow";
  return "red";
}

// ── Page ──────────────────────────────────────────────────────

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  // Build query string
  const qs = new URLSearchParams({
    ...(status && { status }),
    page: String(page),
    limit: "20",
    sortBy: "matchScore",
    order: "desc",
  });

  let data: VacanciesResponse = {
    vacancies: [],
    total: 0,
    page: 1,
    totalPages: 1,
  };

  try {
    const res = await fetch(`${BASE_URL}/api/vacancies?${qs}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) data = json.data as VacanciesResponse;
    }
  } catch {
    /* show empty state */
  }

  // Helpers for pagination links
  const prevHref = `/dashboard/vacancies?${status ? `status=${status}&` : ""}page=${Math.max(1, page - 1)}`;
  const nextHref = `/dashboard/vacancies?${status ? `status=${status}&` : ""}page=${Math.min(data.totalPages, page + 1)}`;

  return (
    <div className="max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Vacancies</h1>
        <p className="text-gray-400 text-sm mt-1">
          {data.total.toLocaleString()} total vacancies
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const href = `/dashboard/vacancies?${
            tab.value ? `status=${tab.value}&` : ""
          }page=1`;
          const isActive = status === tab.value;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-green-400/10 text-green-400 border border-green-400/30"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ── Vacancy Cards ── */}
      <div className="space-y-3">
        {data.vacancies.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm">
              No vacancies found for this filter.
            </p>
          </div>
        ) : (
          data.vacancies.map((v) => {
            const redFlagCount = Array.isArray(v.analysis?.redFlags)
              ? v.analysis!.redFlags.length
              : 0;
            const salary = formatSalary(v.salary);

            return (
              <Link
                key={v.id}
                href={`/dashboard/vacancies/${v.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-800/50 transition-colors block group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-start gap-2 flex-wrap mb-1.5">
                      <h3 className="text-white font-semibold leading-snug group-hover:text-green-400 transition-colors">
                        {v.title}
                      </h3>
                      <Badge
                        label={v.status.replace(/_/g, " ")}
                        variant={statusVariant(v.status)}
                      />
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

                    {/* Meta line */}
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

                  {/* View Details */}
                  <div className="shrink-0 self-center">
                    <span className="text-gray-500 group-hover:text-gray-300 text-sm font-medium transition-colors">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {data.totalPages > 1 && (
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
            Page {data.page} of {data.totalPages}
          </span>

          <Link
            href={nextHref}
            aria-disabled={page >= data.totalPages}
            className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors ${
              page >= data.totalPages ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
