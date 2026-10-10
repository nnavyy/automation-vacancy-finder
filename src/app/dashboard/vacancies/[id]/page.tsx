// ============================================================
// Nanda AI Job Assistant — Vacancy Detail Page
// Server component — fetches full vacancy + analysis data
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageSquare,
  ChevronLeft,
  Cpu,
  Users,
  Building2,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";
import VacancyActions from "@/components/VacancyActions";
import TranslateDescription from "@/components/TranslateDescription";
import prisma, { withRetry } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

// ── Constants ─────────────────────────────────────────────────



// ── Local types ───────────────────────────────────────────────

interface RedFlagItem {
  trigger_text: string;
  reason:       string;
  severity:     "low" | "medium" | "high";
}

interface VacancyAnalysis {
  id:                   string;
  matchScore:           number;
  recommendation:       string;
  aiStatus:             string;
  summary?:             string;
  matchReasons?:        string[];
  missingRequirements?: string[];
  redFlags?:            RedFlagItem[];
  coverLetter?:         string;
  questionsToRecruiter?: string[];
  aiProvider?:          string;
  aiModel?:             string;
  bestLanguage?:        string;
  confidence?:          number;
}

interface ApplicationLog {
  id:        string;
  action:    string;
  note?:     string;
  createdAt: string;
}

interface VacancyDetail {
  id:          string;
  hhId:        string;
  title:       string;
  company?:    string;
  area?:       string;
  salary?:     unknown;
  url?:        string;
  applyUrl?:   string;
  description?: string;
  status:      string;
  experience?: string;
  schedule?:   string;
  employment?: string;
  createdAt:   string;
  updatedAt:   string;
  analysis?:   VacancyAnalysis;
  logs?:       ApplicationLog[];
}

// ── Helpers ───────────────────────────────────────────────────

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "";
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return "";
  if (s.from && s.to)
    return `${s.from.toLocaleString("en-US")} – ${s.to.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
}

function formatVacancyDate(dateStr?: string | Date): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function statusVariant(s: string): "green" | "yellow" | "red" | "blue" | "gray" {
  const m: Record<string, "green" | "yellow" | "red" | "blue" | "gray"> = {
    applied_manual: "green",
    analyzed:       "blue",
    notified:       "yellow",
    skipped:        "red",
    saved:          "blue",
    new:            "gray",
    low_priority:   "gray",
  };
  return m[s] ?? "gray";
}

function recVariant(rec: string): "green" | "yellow" | "red" {
  if (rec === "apply") return "green";
  if (rec === "maybe") return "yellow";
  return "red";
}

function aiStatusVariant(s: string): "green" | "yellow" | "red" | "blue" | "gray" {
  if (s === "completed")       return "green";
  if (s === "rule_based_only") return "blue";
  if (s === "pending_limit")   return "yellow";
  return "red";
}

function severityVariant(sev: string): "red" | "yellow" | "gray" {
  if (sev === "high")   return "red";
  if (sev === "medium") return "yellow";
  return "gray";
}

function scoreColorClass(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

// ── Page ──────────────────────────────────────────────────────

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await requireUser();

  let vacancy: VacancyDetail | null = null;

  try {
    const data = await withRetry(() =>
      prisma.vacancy.findUnique({
        where: { id: id, userId: user.id },
        include: {
          analysis: true,
          logs: { orderBy: { createdAt: "desc" } },
        },
      })
    );

    if (data) {
      vacancy = data as unknown as VacancyDetail;
    }
  } catch (err) {
    console.error("[VacancyDetail] Database error:", err);
    throw err;
  }

  if (!vacancy) {
    notFound();
  }

  const a      = vacancy.analysis;
  const salary = formatSalary(vacancy.salary);

  return (
    <div className="max-w-4xl space-y-5 pb-12">

      {/* ── Back navigation ── */}
      <Link
        href="/dashboard/vacancies"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ChevronLeft size={14} /> Back to Vacancies
      </Link>

      {/* ═══════════════════════════════════════════════════
          1 · HEADER CARD
      ═══════════════════════════════════════════════════ */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-sm shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Status + recommendation badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge
                label={vacancy.status.replace(/_/g, " ")}
                variant={statusVariant(vacancy.status)}
              />
              {a?.recommendation && (
                <Badge
                  label={a.recommendation.toUpperCase()}
                  variant={recVariant(a.recommendation)}
                />
              )}
            </div>

            <h1 className="text-xl font-semibold text-zinc-100 leading-snug">
              {vacancy.title}
            </h1>

            {/* Company / area / salary / date */}
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400 flex-wrap">
              {vacancy.company && (
                <span className="text-zinc-200 font-medium">
                  {vacancy.company}
                </span>
              )}
              {vacancy.area       && <span className="text-zinc-500">· {vacancy.area}</span>}
              {salary             && (
                <span className="text-emerald-400 font-medium">· {salary}</span>
              )}
              {vacancy.createdAt  && (
                <span className="text-zinc-400 inline-flex items-center gap-1">
                  · <Calendar size={12} className="text-zinc-500" />
                  {formatVacancyDate(vacancy.createdAt)}
                </span>
              )}
            </div>

            {/* Employment meta */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 flex-wrap">
              {vacancy.experience && (
                <span>Experience: {vacancy.experience}</span>
              )}
              {vacancy.schedule   && <span>· {vacancy.schedule}</span>}
              {vacancy.employment && <span>· {vacancy.employment}</span>}
            </div>
          </div>

          {/* Open on HH.ru */}
          {(() => {
            const validUrl = vacancy.hhId && /^\d+$/.test(vacancy.hhId)
              ? `https://hh.ru/vacancy/${vacancy.hhId}`
              : vacancy.url && vacancy.url.startsWith("http")
              ? vacancy.url
              : null;
            return validUrl ? (
              <a
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors shrink-0"
              >
                <ExternalLink size={13} />
                Open Vacancy
              </a>
            ) : null;
          })()}
        </div>

        {/* Company Intel Banner */}
        {vacancy.company && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <Building2 size={13} className="text-zinc-500 shrink-0" />
              <span className="text-zinc-400">Company:</span>
              <span className="text-zinc-200 font-medium">{vacancy.company}</span>
            </div>
            <Link
              href={`/dashboard/company-intel?company=${encodeURIComponent(vacancy.company)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-xs font-medium text-zinc-200 transition-all duration-150"
            >
              <Users size={12} className="text-zinc-400" />
              Find Contacts at {vacancy.company}
            </Link>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          1.5 · ORIGINAL DESCRIPTION + TRANSLATION
      ═══════════════════════════════════════════════════ */}
      {vacancy.description && (
        <TranslateDescription originalText={vacancy.description} />
      )}

      {/* ═══════════════════════════════════════════════════
          2 · AI ANALYSIS CARD
      ═══════════════════════════════════════════════════ */}
      {a && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 space-y-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Cpu size={16} className="text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">AI Screening Analysis</h2>
            <Badge
              label={a.aiStatus.replace(/_/g, " ")}
              variant={aiStatusVariant(a.aiStatus)}
            />
          </div>

          {/* Big score + bar */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <span className={`text-5xl font-black tabular-nums leading-none ${scoreColorClass(a.matchScore)}`}>
                {a.matchScore}
              </span>
              <p className="text-xs text-zinc-500 mt-1">Match Score</p>
            </div>
            <div className="flex-1 min-w-[160px] space-y-2">
              <ScoreBar score={a.matchScore} />
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                {a.aiProvider   && <span>Provider: <span className="text-zinc-300">{a.aiProvider}</span></span>}
                {a.aiModel      && (
                  <span>Model: <span className="text-zinc-300 max-w-[220px] truncate inline-block align-bottom">{a.aiModel}</span></span>
                )}
                {a.confidence !== undefined && (
                  <span>Confidence: <span className="text-zinc-300 tabular-nums">{a.confidence}%</span></span>
                )}
                {a.bestLanguage && (
                  <span>Language: <span className="text-zinc-300 capitalize">{a.bestLanguage}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {a.summary && (
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Summary</p>
              <p className="text-zinc-300 text-sm leading-relaxed">{a.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          3 · MATCH REASONS + MISSING REQUIREMENTS (2-col)
      ═══════════════════════════════════════════════════ */}
      {a && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Match Reasons */}
          {a.matchReasons && a.matchReasons.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                <CheckCircle size={13} /> Match Reasons
              </h2>
              <ul className="space-y-2.5">
                {a.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Requirements */}
          {a.missingRequirements && a.missingRequirements.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">
                <AlertTriangle size={13} /> Missing Requirements
              </h2>
              <ul className="space-y-2.5">
                {a.missingRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          4 · RED FLAGS
      ═══════════════════════════════════════════════════ */}
      {a?.redFlags && a.redFlags.length > 0 && (
        <div className="bg-zinc-900/60 border border-rose-500/20 rounded-xl p-5 backdrop-blur-sm shadow-sm">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-4">
            <XCircle size={13} /> Red Flags ({a.redFlags.length})
          </h2>
          <div className="space-y-3">
            {a.redFlags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/5 border border-rose-500/20"
              >
                <Badge label={flag.severity} variant={severityVariant(flag.severity)} />
                <div className="min-w-0">
                  <p className="font-mono text-rose-300 text-xs mb-1">
                    &ldquo;{flag.trigger_text}&rdquo;
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {flag.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          5 · COVER LETTER
      ═══════════════════════════════════════════════════ */}
      {a?.coverLetter && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Cover Letter
          </h2>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 mb-4">
            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
              {a.coverLetter}
            </p>
          </div>
          <VacancyActions
            vacancyId={vacancy.id}
            currentStatus={vacancy.status}
            coverLetter={a.coverLetter}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          6 · QUESTIONS TO RECRUITER
      ═══════════════════════════════════════════════════ */}
      {a?.questionsToRecruiter && a.questionsToRecruiter.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-4">
            <MessageSquare size={13} /> Questions to Ask Recruiter
          </h2>
          <ol className="space-y-2.5">
            {a.questionsToRecruiter.map((q, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="text-sky-400 font-semibold shrink-0 tabular-nums">
                  {i + 1}.
                </span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          7 · ACTION BUTTONS (shown standalone if no cover letter section)
      ═══════════════════════════════════════════════════ */}
      {!a?.coverLetter && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Actions
          </h2>
          <VacancyActions
            vacancyId={vacancy.id}
            currentStatus={vacancy.status}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          8 · APPLICATION HISTORY
      ═══════════════════════════════════════════════════ */}
      {vacancy.logs && vacancy.logs.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm shadow-sm">
          <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">
            Application History
          </h2>
          <div className="space-y-2.5">
            {vacancy.logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-200 font-medium capitalize">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  {log.note && (
                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                      {log.note}
                    </p>
                  )}
                </div>
                <time className="text-xs text-zinc-500 shrink-0 tabular-nums">
                  {new Date(log.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day:   "numeric",
                    year:  "numeric",
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
