// ============================================================
// Nanda AI Job Assistant — Saved Vacancies Page
// ============================================================

import Link from "next/link";
import { Bookmark, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "";
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return "";
  if (s.from && s.to)
    return `${s.from.toLocaleString("en-US")} – ${s.to.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
}

function recVariant(rec: string): "green" | "yellow" | "red" {
  if (rec === "apply") return "green";
  if (rec === "maybe") return "yellow";
  return "red";
}

export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Math.max(1, parseInt((sp.page as string) ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  let vacancies: any[] = [];
  let total = 0;

  try {
    [vacancies, total] = await Promise.all([
      prisma.vacancy.findMany({
        where: { userId: user.id, status: "saved" },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, hhId: true, title: true, company: true, area: true,
          salary: true, url: true, status: true, rawData: true, createdAt: true, updatedAt: true,
          analysis: { select: { matchScore: true, recommendation: true, aiStatus: true, redFlags: true, coverLetter: true } },
        },
      }),
      prisma.vacancy.count({ where: { userId: user.id, status: "saved" } }),
    ]);
  } catch (err) {
    console.error("[Saved Page]", err);
  }

  const totalPages = Math.ceil(total / limit) || 1;
  const prevHref = `/dashboard/saved?page=${Math.max(1, page - 1)}`;
  const nextHref = `/dashboard/saved?page=${Math.min(totalPages, page + 1)}`;

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <Bookmark size={20} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Saved Vacancies</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {total} saved {total === 1 ? "vacancy" : "vacancies"} — bookmarked for review and applications
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {vacancies.length === 0 ? (
          <div className="bg-zinc-900/40 border border-zinc-800/60 border-dashed rounded-xl p-16 text-center">
            <Bookmark size={36} className="text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium mb-1">No saved vacancies yet</p>
            <p className="text-zinc-500 text-xs">
              Click &quot;Save&quot; on any vacancy in the search feed to bookmark it here.
            </p>
          </div>
        ) : (
          vacancies.map((v: any) => {
            const redFlagCount = Array.isArray(v.analysis?.redFlags) ? v.analysis!.redFlags.length : 0;
            const salary = formatSalary(v.salary);

            let dateStr = "";
            if (v.rawData && typeof v.rawData === 'object' && 'published_at' in v.rawData) {
              dateStr = new Date((v.rawData as any).published_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            } else if (v.createdAt) {
              dateStr = new Date(v.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
            }

            return (
              <div
                key={v.id}
                className="relative bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700/80 hover:bg-zinc-900/90 transition-all group backdrop-blur-sm shadow-sm"
              >
                {/* Full card clickable area */}
                <Link href={`/dashboard/vacancies/${v.id}`} className="absolute inset-0 z-0 rounded-xl" aria-label="View Details" />

                <div className="relative z-10 flex flex-col md:flex-row items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1.5 pointer-events-none">
                      <span
                        className="text-zinc-100 font-semibold leading-snug group-hover:text-emerald-400 transition-colors"
                      >
                        {v.title}
                      </span>
                      {v.analysis?.recommendation && (
                        <Badge label={v.analysis.recommendation.toUpperCase()} variant={recVariant(v.analysis.recommendation)} />
                      )}
                      {redFlagCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-400 border border-rose-500/25">
                          <AlertTriangle size={10} />
                          {redFlagCount} flag{redFlagCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap pointer-events-none">
                      {v.company && <span className="font-medium text-zinc-200">{v.company}</span>}
                      {v.area && <span className="text-zinc-500">· {v.area}</span>}
                      {salary && <span className="text-emerald-400 font-medium">· {salary}</span>}
                      {dateStr && <span className="text-zinc-500">· {dateStr}</span>}
                    </div>
                    {v.analysis?.matchScore !== undefined && (
                      <div className="mt-3 max-w-xs pointer-events-none">
                        <ScoreBar score={v.analysis.matchScore} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 shrink-0">
                    <Link href={`/dashboard/vacancies/${v.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-center">
                      View Details
                    </Link>
                    {v.url && (
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/80 hover:bg-zinc-700 transition-colors inline-flex items-center justify-center gap-1.5">
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
        <div className="flex items-center justify-between pt-3">
          <Link
            href={prevHref}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors ${
              page <= 1 ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            <ChevronLeft size={13} />
            Previous
          </Link>
          <span className="text-xs text-zinc-500 tabular-nums">Page {page} of {totalPages}</span>
          <Link
            href={nextHref}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors ${
              page >= totalPages ? "opacity-40 pointer-events-none" : ""
            }`}
          >
            Next
            <ChevronRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
