// ============================================================
// wingkiiy Job AI — Vacancies List Page
// Server component — supports filter tabs + pagination
// ============================================================

import Link from "next/link";
import { AlertTriangle, Search, Settings, Briefcase, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

// ── Constants ─────────────────────────────────────────────────

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
  const user = await requireUser();
  const sp = await searchParams;
  const status = sp.status ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId: user.id };
  if (status) where.status = status;

  let vacancies: any[] = [];
  let total = 0;
  let hasProfile = false;

  try {
    // Check if user has any search preferences set up
    const profileCount = await withRetry(() =>
      prisma.searchPreference.count({ where: { userId: user.id } })
    );
    hasProfile = profileCount > 0;

    [vacancies, total] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where,
          skip,
          take: limit,
          orderBy: { analysis: { matchScore: "desc" } },
          select: {
            id: true,
            title: true,
            company: true,
            area: true,
            salary: true,
            status: true,
            createdAt: true,
            analysis: {
              select: {
                matchScore: true,
                recommendation: true,
                aiStatus: true,
                redFlags: true,
              },
            },
          },
        }),
        prisma.vacancy.count({ where }),
      ])
    );
  } catch (err) {
    console.error("[Vacancies Page] Database error:", err);
    // Re-throw so the error.tsx boundary can catch and show a proper error page
    throw err;
  }


  const totalPages = Math.ceil(total / limit) || 1;
  const prevHref = `/dashboard/vacancies?${status ? `status=${status}&` : ""}page=${Math.max(1, page - 1)}`;
  const nextHref = `/dashboard/vacancies?${status ? `status=${status}&` : ""}page=${Math.min(totalPages, page + 1)}`;

  return (
    <div className="max-w-5xl space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Vacancies</h1>
        <p className="text-gray-400 text-sm mt-1">
          {total.toLocaleString()} total vacancies
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

      {/* ── Vacancy Cards / Empty State ── */}
      <div className="space-y-3">
        {vacancies.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
            {!hasProfile ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
                  <Settings size={28} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Set up your profile first
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mb-6">
                  Configure your job search preferences — target roles, skills, and work format — so we can find matching vacancies for you.
                </p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Settings size={15} />
                  Go to Settings
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                  <Search size={28} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No vacancies yet
                </h3>
                <p className="text-gray-400 text-sm max-w-sm mb-6">
                  {status
                    ? `No vacancies match the "${status.replace(/_/g, " ")}" filter. Try a different filter or run a new collection.`
                    : "Run a collection to start finding job listings that match your profile. Hit the \"Run Collection\" button on the Overview page."}
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Briefcase size={15} />
                  Go to Overview
                </Link>
              </>
            )}
          </div>
        ) : (
          vacancies.map((v: any) => {
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

                  {/* Actions */}
                  <div className="shrink-0 self-center flex items-center gap-3">
                    {v.company && (
                      <Link
                        href={`/dashboard/company-intel?company=${encodeURIComponent(v.company)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-xs font-medium text-violet-400 hover:text-violet-300 transition-all duration-150"
                      >
                        <Users size={12} />
                        Find Contacts
                      </Link>
                    )}
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
