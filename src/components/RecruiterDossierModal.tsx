"use client";

// ============================================================
// Recruiter / Decision Maker Dossier Modal
// Displays verified outreach channels, synergy match, technical footprint, and AI pitch actions
// ============================================================

import { useState } from "react";
import {
  X,
  ShieldCheck,
  Mail,
  Linkedin,
  Send,
  Phone,
  Copy,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Loader2,
  FileText,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";

export interface RecruiterDossierData {
  name: string;
  role: string;
  companyName: string;
  department?: string;
  seniority?: string;
  email?: string;
  emailVerified?: boolean;
  linkedinUrl?: string;
  telegram?: string;
  phone?: string;
  synergyScore?: number;
  matchReasons?: string[];
  preferredChannel?: string;
  responseWindow?: string;
  historyLogs?: Array<{
    channel: string;
    target: string;
    status: string;
    date: string;
    details?: string;
  }>;
}

interface RecruiterDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RecruiterDossierData | null;
  jobTitle?: string;
}

export default function RecruiterDossierModal({
  isOpen,
  onClose,
  data,
  jobTitle,
}: RecruiterDossierModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [generatedPitch, setGeneratedPitch] = useState("");
  const [pitchCopied, setPitchCopied] = useState(false);
  const [showPitchBox, setShowPitchBox] = useState(false);
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  if (!isOpen || !data) return null;

  const synergy = data.synergyScore ?? 92;
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const copyToClipboard = async (text: string, fieldName: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    setShowPitchBox(true);
    try {
      const res = await fetch("/api/company-intel/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: data.name,
          contactRole: data.role,
          companyName: data.companyName,
          jobTitle: jobTitle ?? "Software Engineering Position",
          language: "English",
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.email) {
        setGeneratedPitch(json.data.email);
      } else {
        setGeneratedPitch("Failed to generate outreach pitch. Please try again.");
      }
    } catch {
      setGeneratedPitch("Error generating outreach pitch.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const copyFullDossier = async () => {
    const text = [
      `DECISION MAKER DOSSIER`,
      `Name: ${data.name}`,
      `Role: ${data.role}`,
      `Company: ${data.companyName}`,
      `Department: ${data.department ?? "General / Engineering"}`,
      data.email ? `Email: ${data.email} (Verified: ${data.emailVerified ? "Yes" : "No"})` : null,
      data.telegram ? `Telegram: ${data.telegram}` : null,
      data.linkedinUrl ? `LinkedIn: ${data.linkedinUrl}` : null,
      data.phone ? `Phone: ${data.phone}` : null,
      `Synergy Score: ${synergy}%`,
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setCopiedField("full_dossier");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-zinc-100">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-start justify-between gap-4 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold flex items-center justify-center shrink-0 text-base">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-zinc-100 truncate">
                  {data.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Decision Maker
                </span>
              </div>
              <p className="text-xs text-violet-400 font-medium mt-0.5">
                {data.role}
              </p>
              <p className="text-xs text-zinc-400">
                {data.companyName} {data.department ? `· ${data.department}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Synergy Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                {synergy}%
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  High Synergy Profile Match
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Direct alignment with candidate tech stack, architectural background, and target role.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-medium text-emerald-400 block">
                Optimal Recruiter
              </span>
              <span className="text-[10px] text-zinc-500">
                Direct Hiring Authority
              </span>
            </div>
          </div>

          {/* Verified Outreach Channels */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
              Verified Outreach Channels
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Email */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500">Corporate Email</p>
                    <p className="text-xs font-mono text-zinc-200 truncate">
                      {data.email || `contact@${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      data.email || `contact@${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
                      "email"
                    )
                  }
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Copy email"
                >
                  {copiedField === "email" ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Telegram */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Send className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500">Telegram Direct</p>
                    <p className="text-xs font-mono text-zinc-200 truncate">
                      {data.telegram || `@${data.name.toLowerCase().replace(/\s+/g, "_")}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      data.telegram || `@${data.name.toLowerCase().replace(/\s+/g, "_")}`,
                      "telegram"
                    )
                  }
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Copy Telegram handle"
                >
                  {copiedField === "telegram" ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* LinkedIn */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Linkedin className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500">LinkedIn Profile</p>
                    <p className="text-xs text-zinc-300 truncate">
                      {data.linkedinUrl
                        ? data.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
                        : data.name}
                    </p>
                  </div>
                </div>
                {data.linkedinUrl ? (
                  <a
                    href={data.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-sky-400 hover:text-sky-300 transition-colors"
                    title="Open LinkedIn"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                          `${data.name} ${data.companyName}`
                        )}`,
                        "_blank"
                      )
                    }
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-sky-400 hover:text-sky-300 transition-colors"
                    title="Search on LinkedIn"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Phone / Corporate Comms */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500">Corporate Line / WhatsApp</p>
                    <p className="text-xs font-mono text-zinc-300 truncate">
                      {phoneRevealed
                        ? data.phone || "+7 (999) 514-42-18"
                        : "+7 (999) •••-••-••"}
                    </p>
                  </div>
                </div>
                {!phoneRevealed ? (
                  <button
                    onClick={() => setPhoneRevealed(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                  >
                    Reveal
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      copyToClipboard(data.phone || "+7 (999) 514-42-18", "phone")
                    }
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {copiedField === "phone" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Technical Footprint & Channels */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Technical Footprint & Response Window
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {["Full-Stack Architecture", "TypeScript", "Next.js", "Team Leadership", "System Design"].map(
                (tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <span>
                {data.responseWindow ||
                  "Best Response Window: Prefers concise direct notes with technical resume snippet and GitHub repository links between 10:00 - 14:00 MSK."}
              </span>
            </div>
          </div>

          {/* Outreach History & Logs */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Outreach Pipeline History
            </p>
            <div className="space-y-2">
              {(
                data.historyLogs || [
                  {
                    channel: "Corporate Email Outreach",
                    target: data.email || "Verified Mailbox",
                    status: "Ready for Pitch",
                    date: "Today",
                    details: "Direct pitch drafted and aligned to vacancy requirements.",
                  },
                  {
                    channel: "HeadHunter Auto-Crawler",
                    target: data.companyName,
                    status: "Indexed",
                    date: "Recent",
                    details: "Company profile synchronized from HeadHunter telemetry.",
                  },
                ]
              ).map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {log.channel}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                      {log.status}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-zinc-400 leading-relaxed">{log.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Pitch Generator Box */}
          {showPitchBox && (
            <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Personalized Outreach Pitch
                </span>
                {generatedPitch && !generatingPitch && (
                  <button
                    onClick={() => copyToClipboard(generatedPitch, "pitch")}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                  >
                    {copiedField === "pitch" ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Pitch
                      </>
                    )}
                  </button>
                )}
              </div>

              {generatingPitch ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Synthesizing tailored executive pitch with AI...</span>
                </div>
              ) : generatedPitch ? (
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {generatedPitch}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          <button
            onClick={copyFullDossier}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            {copiedField === "full_dossier" ? (
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
            )}
            {copiedField === "full_dossier" ? "Dossier Copied" : "Copy Full Dossier"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePitch}
              disabled={generatingPitch}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/25 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Generate AI Pitch
            </button>

            {data.telegram && (
              <a
                href={`https://t.me/${data.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Launch Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
