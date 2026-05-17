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
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ScoreBar from "@/components/ui/ScoreBar";
import VacancyActions from "@/components/VacancyActions";
import TranslateDescription from "@/components/TranslateDescription";

// ── Constants ─────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    return `${s.from.toLocaleString()} – ${s.to.toLocaleString()} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString()} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString()} ${s.currency ?? "RUR"}`;
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
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

// ── Page ──────────────────────────────────────────────────────

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let vacancy: VacancyDetail | null = null;

  try {
    const res = await fetch(`${BASE_URL}/api/vacancies/${id}`, {
      cache: "no-store",
    });
    if (res.status === 404) notFound();
    if (res.ok) {
      const json = await res.json();
      if (json.success) vacancy = json.data as VacancyDetail;
    }
  } catch {
    /* show error fallback below */
  }

  if (!vacancy) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link
          href="/dashboard/vacancies"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={15} /> Back to Vacancies
        </Link>
        <div className="bg-red-400/10 border border-red-400/30 rounded-xl p-10 text-center">
          <p className="text-red-400 font-medium">Failed to load vacancy.</p>
          <p className="text-gray-500 text-sm mt-1">
            The record may have been deleted or the server is unavailable.
          </p>
        </div>
      </div>
    );
  }

  const a      = vacancy.analysis;
  const salary = formatSalary(vacancy.salary);

  return (
    <div className="max-w-4xl space-y-5">

      {/* ── Back navigation ── */}
      <Link
        href="/dashboard/vacancies"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={15} /> Back to Vacancies
      </Link>

      {/* ═══════════════════════════════════════════════════
          1 · HEADER CARD
      ═══════════════════════════════════════════════════ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
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

            <h1 className="text-2xl font-bold text-white leading-snug">
              {vacancy.title}
            </h1>

            {/* Company / area / salary */}
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 flex-wrap">
              {vacancy.company && (
                <span className="text-gray-200 font-medium">
                  {vacancy.company}
                </span>
              )}
              {vacancy.area       && <span>• {vacancy.area}</span>}
              {salary             && (
                <span className="text-green-400 font-medium">• {salary}</span>
              )}
            </div>

            {/* Employment meta */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap">
              {vacancy.experience && (
                <span>Experience: {vacancy.experience}</span>
              )}
              {vacancy.schedule   && <span>• {vacancy.schedule}</span>}
              {vacancy.employment && <span>• {vacancy.employment}</span>}
            </div>
          </div>

          {/* Open on HH.ru */}
          {vacancy.url && (
            <a
              href={vacancy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors shrink-0"
            >
              <ExternalLink size={14} />
              Open Vacancy
            </a>
          )}
        </div>
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Cpu size={16} className="text-green-400" />
            <h2 className="text-base font-semibold text-white">AI Analysis</h2>
            <Badge
              label={a.aiStatus.replace(/_/g, " ")}
              variant={aiStatusVariant(a.aiStatus)}
            />
          </div>

          {/* Big score + bar */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <span className={`text-6xl font-black tabular-nums leading-none ${scoreColorClass(a.matchScore)}`}>
                {a.matchScore}
              </span>
              <p className="text-xs text-gray-500 mt-1">Match Score</p>
            </div>
            <div className="flex-1 min-w-[160px] space-y-2">
              <ScoreBar score={a.matchScore} />
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                {a.aiProvider   && <span>Provider: <span className="text-gray-300">{a.aiProvider}</span></span>}
                {a.aiModel      && (
                  <span>Model: <span className="text-gray-300 max-w-[220px] truncate inline-block align-bottom">{a.aiModel}</span></span>
                )}
                {a.confidence !== undefined && (
                  <span>Confidence: <span className="text-gray-300">{a.confidence}%</span></span>
                )}
                {a.bestLanguage && (
                  <span>Language: <span className="text-gray-300 capitalize">{a.bestLanguage}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          {a.summary && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-gray-200 text-sm leading-relaxed">{a.summary}</p>
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-green-400 uppercase tracking-widest mb-4">
                <CheckCircle size={13} /> Match Reasons
              </h2>
              <ul className="space-y-2.5">
                {a.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 shrink-0 mt-0.5 font-bold">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Requirements */}
          {a.missingRequirements && a.missingRequirements.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-4">
                <AlertTriangle size={13} /> Missing Requirements
              </h2>
              <ul className="space-y-2.5">
                {a.missingRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-yellow-400 shrink-0 mt-0.5">⚠</span>
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
        <div className="bg-gray-900 border border-red-400/20 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-widest mb-4">
            <XCircle size={13} /> Red Flags ({a.redFlags.length})
          </h2>
          <div className="space-y-3">
            {a.redFlags.map((flag, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-lg bg-red-400/5 border border-red-400/20"
              >
                <Badge label={flag.severity} variant={severityVariant(flag.severity)} />
                <div className="min-w-0">
                  <p className="font-mono text-red-300 text-xs mb-1">
                    &ldquo;{flag.trigger_text}&rdquo;
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
            ✍️ Cover Letter
          </h2>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-5 mb-4">
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {a.coverLetter}
            </p>
          </div>
          {/* Action buttons include copy + regenerate */}
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
            <MessageSquare size={13} /> Questions to Ask Recruiter
          </h2>
          <ol className="space-y-2.5">
            {a.questionsToRecruiter.map((q, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="text-blue-400 font-semibold shrink-0 tabular-nums">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
            📋 Application History
          </h2>
          <div className="space-y-2.5">
            {vacancy.logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium capitalize">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  {log.note && (
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                      {log.note}
                    </p>
                  )}
                </div>
                <time className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
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
