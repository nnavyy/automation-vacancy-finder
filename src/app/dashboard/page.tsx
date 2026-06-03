// ============================================================
// Nanda AI Job Assistant — Dashboard Overview Page
// ============================================================
// Uses direct Prisma queries instead of self-fetch to avoid
// URL resolution issues on Replit/serverless deployments.
// ============================================================

import Link from "next/link";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  BookmarkCheck,
  Clock,
  FileText,
  LucideIcon,
} from "lucide-react";
import ScoreBar from "@/components/ui/ScoreBar";
import Badge from "@/components/ui/Badge";
import RunCollectionButton from "@/components/RunCollectionButton";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

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

function recVariant(rec: string): "green" | "yellow" | "red" {
  if (rec === "apply") return "green";
  if (rec === "maybe") return "yellow";
  return "red";
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass = "text-white",
  iconColorClass = "text-gray-600",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass?: string;
  iconColorClass?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest leading-none">
          {label}
        </p>
        <Icon size={15} className={iconColorClass} strokeWidth={1.8} />
      </div>
      <p
        className={`text-3xl font-bold tabular-nums tracking-tight ${colorClass}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default async function DashboardPage() {
  await new Promise(r => setTimeout(r, 800));
  const user = await requireUser();
  let all: any[] = [];
  let total = 0;
  let topMatches: any[] = [];

  try {
    const [allVacancies, allCount, topVacancies] = await withRetry(() =>
      Promise.all([
        prisma.vacancy.findMany({
          where:   { userId: user.id },
          take:    1000,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, hhId: true, title: true, company: true, area: true,
            salary: true, url: true, status: true, createdAt: true, updatedAt: true,
            analysis: { select: { matchScore: true, recommendation: true, aiStatus: true, redFlags: true } },
          },
        }),
        prisma.vacancy.count({ where: { userId: user.id } }),
        prisma.vacancy.findMany({
          where:   { userId: user.id, analysis: { isNot: null } },
          take:    5,
          orderBy: { analysis: { matchScore: "desc" } },
          select: {
            id: true, hhId: true, title: true, company: true, area: true,
            salary: true, url: true, status: true, rawData: true, createdAt: true,
            analysis: { select: { matchScore: true, recommendation: true, aiStatus: true, redFlags: true } },
          },
        }),
      ])
    );
    all = allVacancies;
    total = allCount;
    topMatches = topVacancies;
  } catch (err) {
    console.error("[Dashboard] Failed to fetch data:", err);
    throw err;
  }

  const applied = all.filter((v) => v.status === "applied_manual").length;
  const skipped = all.filter((v) => v.status === "skipped").length;
  const saved = all.filter((v) => v.status === "saved").length;
  const aiPending = all.filter(
    (v) => v.analysis?.aiStatus === "pending_limit",
  ).length;

  const scores = all
    .filter((v) => v.analysis?.matchScore !== undefined)
    .map((v) => v.analysis!.matchScore);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;

  return (
    <div className="max-w-6xl space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Overview
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Your job search at a glance
          </p>
        </div>
        <RunCollectionButton />
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total"
          value={total}
          icon={FileText}
          colorClass="text-white"
          iconColorClass="text-gray-600"
        />
        <StatCard
          label="Applied"
          value={applied}
          icon={CheckCircle2}
          colorClass="text-green-400"
          iconColorClass="text-green-700"
        />
        <StatCard
          label="Skipped"
          value={skipped}
          icon={XCircle}
          colorClass="text-red-400"
          iconColorClass="text-red-900"
        />
        <StatCard
          label="Saved"
          value={saved}
          icon={BookmarkCheck}
          colorClass="text-blue-400"
          iconColorClass="text-blue-900"
        />
        <StatCard
          label="AI Pending"
          value={aiPending}
          icon={Clock}
          colorClass="text-yellow-400"
          iconColorClass="text-yellow-900"
        />
      </div>

      {/* ── Average Score ── */}
      {avgScore > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-green-400" />
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">
              Average Match Score
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <span
              className={`text-5xl font-bold tabular-nums tracking-tight ${
                avgScore >= 75
                  ? "text-green-400"
                  : avgScore >= 50
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {avgScore}
            </span>
            <div className="flex-1 space-y-1.5">
              <ScoreBar score={avgScore} />
              <p className="text-xs text-gray-600">
                Based on {scores.length}{" "}
                {scores.length === 1 ? "vacancy" : "vacancies"} analyzed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Matches ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-widest">
            Top Matches
          </h2>
          <Link
            href="/dashboard/vacancies"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="space-y-2">
          {topMatches.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
              <p className="text-gray-500 text-sm">
                No analyzed vacancies yet.
              </p>
              <p className="text-gray-700 text-xs mt-1">
                Run a collection to start finding matches.
              </p>
            </div>
          ) : (
            topMatches.map((v: any) => {
              const salary = formatSalary(v.salary);
              // Safely extract the publication date from rawData or fallback to createdAt
              let dateStr = "";
              if (v.rawData && typeof v.rawData === 'object' && 'published_at' in v.rawData) {
                dateStr = new Date((v.rawData as any).published_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
              } else if (v.createdAt) {
                dateStr = new Date(v.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
              }

              return (
                <Link
                  key={v.id}
                  href={`/dashboard/vacancies/${v.id}`}
                  className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-gray-700 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-white group-hover:text-green-400 transition-colors truncate">
                        {v.title}
                      </span>
                      {v.analysis?.recommendation && (
                        <Badge
                          label={v.analysis.recommendation}
                          variant={recVariant(v.analysis.recommendation)}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      {v.company && (
                        <span className="text-gray-400 font-medium">{v.company}</span>
                      )}
                      {v.area && <span>· {v.area}</span>}
                      {salary && (
                        <span className="text-green-500">· {salary}</span>
                      )}
                      {dateStr && (
                        <span className="text-gray-500">· {dateStr}</span>
                      )}
                    </div>
                  </div>

                  {v.analysis?.matchScore !== undefined && (
                    <div className="shrink-0 w-32">
                      <ScoreBar score={v.analysis.matchScore} size="sm" />
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
