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
          className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${
            msg.type === "success"
              ? "bg-green-400/10 text-green-400 border-green-400/30"
              : "bg-red-400/10  text-red-400  border-red-400/30"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Primary action buttons */}
      <div className="flex flex-wrap gap-3">
        {/* 🚀 Apply via HH.ru (Auto) */}
        <button
          onClick={() => handleAction("apply_hh")}
          disabled={loading !== null || status === "applied_manual" || status === "applied_hh"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("apply_hh") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {status === "applied_hh" ? "Applied on HH" : "Apply via HH.ru"}
        </button>

        {/* ✅ Mark Applied */}
        <button
          onClick={() => handleAction("applied")}
          disabled={loading !== null || status === "applied_manual" || status === "applied_hh"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("applied") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          {status === "applied_manual" ? "Marked Applied" : "Mark Applied"}
        </button>

        {/* ❌ Skip */}
        <button
          onClick={() => handleAction("skip")}
          disabled={loading !== null || status === "skipped"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("skip") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <XCircle size={14} />
          )}
          {status === "skipped" ? "Skipped" : "Skip"}
        </button>

        {/* 💾 Save */}
        <button
          onClick={() => handleAction("save")}
          disabled={loading !== null || status === "saved"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 border border-blue-400/30 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("save") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Bookmark size={14} />
          )}
          {status === "saved" ? "Saved" : "Save"}
        </button>

        {/* 🚫 Block Company */}
        <button
          onClick={() => handleAction("block_company")}
          disabled={loading !== null || status === "ignored"}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-400/10 hover:bg-orange-400/20 text-orange-400 border border-orange-400/30 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("block_company") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Ban size={14} />
          )}
          {status === "ignored" ? "Company Blocked" : "Block Company"}
        </button>

        {/* ✍️ Regenerate Letter */}
        <button
          onClick={() => handleAction("regenerate")}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("regenerate") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Regenerate Letter
        </button>

        {/* ✈️ Send to Telegram */}
        <button
          onClick={() => handleAction("telegram")}
          disabled={loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy("telegram") ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Send to Telegram
        </button>
      </div>

      {/* Copy cover letter */}
      {coverLetter && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-all"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-gray-400" />
              <span className="text-gray-200">Copy Cover Letter</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
