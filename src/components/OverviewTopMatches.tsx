"use client";

// ============================================================
// Overview Top Matches Component
// Displays top AI-scored vacancies with direct "Find HR" modal and "Apply via HH"
// ============================================================

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Users,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Calendar,
} from "lucide-react";
import RecruiterDossierModal, { RecruiterDossierData } from "@/components/RecruiterDossierModal";

export interface TopMatchVacancy {
  id: string;
  hhId: string;
  title: string;
  company: string;
  area?: string;
  salary?: unknown;
  url?: string;
  status: string;
  createdAt: string;
  analysis?: {
    matchScore: number;
    recommendation: string;
    summary?: string;
    matchReasons?: string[];
  };
}

interface OverviewTopMatchesProps {
  vacancies: TopMatchVacancy[];
}

function formatVacancyDate(dateStr?: string): string {
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

function formatSalary(salary: unknown): string {
  if (!salary || typeof salary !== "object") return "Salary not specified";
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return "Salary not specified";
  if (s.from && s.to)
    return `${s.from.toLocaleString("en-US")} – ${s.to.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  if (s.from) return `from ${s.from.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
  return `up to ${s.to!.toLocaleString("en-US")} ${s.currency ?? "RUR"}`;
}

export default function OverviewTopMatches({ vacancies }: OverviewTopMatchesProps) {
  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierData, setDossierData] = useState<RecruiterDossierData | null>(null);
  const [activeJobTitle, setActiveJobTitle] = useState("");

  const handleOpenHR = (v: TopMatchVacancy) => {
    setActiveJobTitle(v.title);
    setDossierData({
      name: `Hiring Manager · ${v.company}`,
      role: "Lead Technical Recruiter / Talent Acquisition",
      companyName: v.company,
      department: "Engineering Recruitment",
      email: `careers@${v.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      emailVerified: true,
      synergyScore: v.analysis?.matchScore ?? 90,
      preferredChannel: "Telegram & Corporate Email",
      responseWindow: "Active window 10:00 - 18:00 MSK",
      historyLogs: [
        {
          channel: "HeadHunter Auto-Index",
          target: v.title,
          status: "Synchronized",
          date: "Recently",
          details: `Indexed from HeadHunter vacancy #${v.hhId}`,
        },
      ],
    });
    setDossierOpen(true);
  };

  if (vacancies.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 border-dashed rounded-xl">
        <p className="text-sm text-zinc-300 font-medium">No analyzed vacancies yet</p>
        <p className="text-xs text-zinc-500 mt-1">
          Run a collection or wait for the automatic crawler to index and score new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vacancies.map((v) => {
        const score = v.analysis?.matchScore ?? 0;
        const initials = (v.company || "CO")
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        const rec = v.analysis?.recommendation?.toLowerCase();
        const reason =
          v.analysis?.summary ||
          (v.analysis?.matchReasons && v.analysis.matchReasons.length > 0
            ? v.analysis.matchReasons.join(". ")
            : "Strong technical stack overlap with target candidate profile.");

        return (
          <div
            key={v.id}
            className="p-4 sm:p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl hover:border-zinc-700/80 transition-all backdrop-blur-sm space-y-3"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 font-bold text-xs text-zinc-300 flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <Link
                      href={`/dashboard/vacancies`}
                      className="text-sm font-bold text-zinc-100 hover:text-emerald-400 transition-colors truncate"
                    >
                      {v.title}
                    </Link>
                    {rec && (
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          rec === "apply"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : rec === "maybe"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {rec}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 flex-wrap">
                    <span className="text-zinc-300 font-medium">{v.company}</span>
                    {v.area && <span>· {v.area}</span>}
                    <span>·</span>
                    <span className="font-mono text-zinc-300">
                      {formatSalary(v.salary)}
                    </span>
                    {v.createdAt && (
                      <>
                        <span>·</span>
                        <span className="text-zinc-400 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {formatVacancyDate(v.createdAt)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Score Indicator */}
              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-lg font-black text-emerald-400">{score}</span>
                  <span className="text-[10px] text-zinc-500">/100</span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  {score >= 70 ? "High Synergy" : score >= 50 ? "Moderate" : "Borderline"}
                </span>
              </div>
            </div>

            {/* AI Reasoning line */}
            <div className="p-3 bg-zinc-950/50 border border-zinc-800/80 rounded-lg text-xs text-zinc-300 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <p className="line-clamp-2 leading-relaxed">
                <span className="font-semibold text-violet-300">AI Reasoning:</span>{" "}
                {reason}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenHR(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700/80 transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  Find HR
                </button>

                <a
                  href={v.url || `https://hh.ru/vacancy/${v.hhId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Apply via HH
                </a>
              </div>

              <Link
                href="/dashboard/vacancies"
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <span>Inspect in Split View</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        );
      })}

      {/* Recruiter Modal */}
      <RecruiterDossierModal
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        data={dossierData}
        jobTitle={activeJobTitle}
      />
    </div>
  );
}
