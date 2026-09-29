"use client";

// ============================================================
// Nanda AI Job Assistant — Vacancy Action Buttons
// Client component: mark-applied / skip / save / regenerate-letter
// + copy cover letter to clipboard
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Bookmark,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Ban,
  Send,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface VacancyActionsProps {
  vacancyId: string;
  currentStatus: string;
  coverLetter?: string;
}

type ActionKey = "applied" | "apply_hh" | "skip" | "save" | "regenerate" | "block_company" | "telegram";

interface Msg {
  text: string;
  type: "success" | "error";
}

// ── Constants ─────────────────────────────────────────────────

const ENDPOINT: Record<ActionKey, (id: string) => string> = {
  applied: (id) => `/api/vacancies/${id}/mark-applied`,
  apply_hh: (id) => `/api/vacancies/${id}/apply-hh`,
  skip: (id) => `/api/vacancies/${id}/skip`,
  save: (id) => `/api/vacancies/${id}/save`,
  regenerate: (id) => `/api/vacancies/${id}/regenerate-letter`,
  block_company: (id) => `/api/vacancies/${id}/block-company`,
  telegram: (id) => `/api/vacancies/${id}/send-telegram`,
};

const STATUS_AFTER: Partial<Record<ActionKey, string>> = {
  applied: "applied_manual",
  apply_hh: "applied_hh",
  skip: "skipped",
  save: "saved",
  block_company: "ignored",
};

const SUCCESS_MSG: Record<ActionKey, string> = {
  applied: "Marked as applied.",
  apply_hh: "Application sent via HH.ru successfully!",
  skip: "Vacancy skipped.",
  save: "Saved to your list.",
  regenerate: "Regeneration queued — refresh to see the new letter.",
  block_company: "Company blocked successfully.",
  telegram: "Sent to Telegram successfully!",
};

// ── Component ─────────────────────────────────────────────────

export default function VacancyActions({
  vacancyId,
  currentStatus,
  coverLetter,
}: VacancyActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // ── Action handler ───────────────────────────────────────
  const handleAction = async (action: ActionKey) => {
    if (loading) return;
    setLoading(action);
    setMsg(null);

    try {
      const res = await fetch(ENDPOINT[action](vacancyId), { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.ok) {
        const next = STATUS_AFTER[action];
        if (next) setStatus(next);
        setMsg({ text: SUCCESS_MSG[action], type: "success" });
        if (action === "regenerate") {
          router.refresh(); // Reload to show the new cover letter
        }
      } else {
        setMsg({
          text: data.error ?? "Action failed. Please try again.",
          type: "error",
        });
      }
    } catch {
      setMsg({ text: "Network error — please try again.", type: "error" });
    } finally {
      setLoading(null);
      setTimeout(() => setMsg(null), 6000);
    }
  };

  // ── Copy cover letter ────────────────────────────────────
  const handleCopy = async () => {
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement("textarea");
      ta.value = coverLetter;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const busy = (a: ActionKey) => loading === a;

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Feedback message */}
      {msg && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-xs font-medium border ${
            msg.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Primary action buttons */}
      <div className="flex flex-wrap gap-2.5">
        {/* Apply via HH.ru (Auto) */}
        <button
          onClick={() => handleAction("apply_hh")}
          disabled={loading !== null || status === "applied_manual" || status === "applied_hh"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("apply_hh") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          {status === "applied_hh" ? "Applied on HH" : "Apply via HH.ru"}
        </button>

        {/* Mark Applied */}
        <button
          onClick={() => handleAction("applied")}
          disabled={loading !== null || status === "applied_manual" || status === "applied_hh"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("applied") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <CheckCircle size={13} />
          )}
          {status === "applied_manual" ? "Marked Applied" : "Mark Applied"}
        </button>

        {/* Skip */}
        <button
          onClick={() => handleAction("skip")}
          disabled={loading !== null || status === "skipped"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("skip") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <XCircle size={13} />
          )}
          {status === "skipped" ? "Skipped" : "Skip"}
        </button>

        {/* Save */}
        <button
          onClick={() => handleAction("save")}
          disabled={loading !== null || status === "saved"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("save") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Bookmark size={13} />
          )}
          {status === "saved" ? "Saved" : "Save"}
        </button>

        {/* Block Company */}
        <button
          onClick={() => handleAction("block_company")}
          disabled={loading !== null || status === "ignored"}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("block_company") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Ban size={13} />
          )}
          {status === "ignored" ? "Company Blocked" : "Block Company"}
        </button>

        {/* Regenerate Letter */}
        <button
          onClick={() => handleAction("regenerate")}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("regenerate") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} />
          )}
          Regenerate Letter
        </button>

        {/* Send to Telegram */}
        <button
          onClick={() => handleAction("telegram")}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy("telegram") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          Send to Telegram
        </button>
      </div>

      {/* Copy cover letter */}
      {coverLetter && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-xs font-medium transition-all"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-zinc-400" />
              <span className="text-zinc-200">Copy Cover Letter</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
