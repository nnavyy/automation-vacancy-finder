"use client";

// ============================================================
// wingkiiy Job Copilot — Dashboard Error Boundary
// Precision telemetry & recovery console for dashboard routes
// ============================================================

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  RotateCcw,
  LayoutDashboard,
  Database,
  WifiOff,
  ShieldAlert,
  ServerCrash,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Bot,
} from "lucide-react";

function parseDiagnosticState(error: Error) {
  const msg = error.message?.toLowerCase() || "";

  if (msg.includes("prisma") || msg.includes("database") || msg.includes("connection") || msg.includes("p1001") || msg.includes("neon")) {
    return {
      category: "DATABASE_CONNECTION_TIMEOUT",
      badge: "NeonDB Connection Latency",
      title: "Database Connection Suspended",
      description: "The database connection pool encountered a sleep timeout. On serverless PostgreSQL instances, the pool spins down after brief inactivity.",
      remedy: "Clicking 'Retry Operation' will warm up the connection pool and restore full query throughput within ~1.5 seconds.",
      icon: Database,
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
      bgColor: "bg-amber-500/10",
      isAuth: false,
    };
  }

  if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("session") || msg.includes("jwt")) {
    return {
      category: "SESSION_TOKEN_INVALIDATED",
      badge: "Authentication Guard",
      title: "Active Session Expired",
      description: "Your cryptographically signed authentication ticket has expired or could not be validated against the session store.",
      remedy: "Please re-authenticate via the secure login portal to generate a fresh JWT token.",
      icon: ShieldAlert,
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
      bgColor: "bg-rose-500/10",
      isAuth: true,
    };
  }

  if (msg.includes("fetch") || msg.includes("network") || msg.includes("econnrefused")) {
    return {
      category: "NETWORK_UPLINK_FAILURE",
      badge: "Network Subsystem",
      title: "Upstream Network Request Failed",
      description: "An HTTP transport socket was closed unexpectedly while fetching dashboard telemetry.",
      remedy: "Verify network connectivity or VPN tunnel stability before retrying the operation.",
      icon: WifiOff,
      iconColor: "text-orange-400",
      borderColor: "border-orange-500/20",
      bgColor: "bg-orange-500/10",
      isAuth: false,
    };
  }

  if (msg.includes("ai") || msg.includes("groq") || msg.includes("gemini") || msg.includes("openai") || msg.includes("rate limit")) {
    return {
      category: "AI_PROVIDER_PIPELINE_ERROR",
      badge: "AI Scoring Engine",
      title: "AI Synthesis Service Fault",
      description: "The active AI provider (Groq / Gemini / OpenAI) exceeded rate limits or returned an unparseable response.",
      remedy: "You can adjust your AI provider fallback order in Settings or wait a moment for the rate limit window to reset.",
      icon: Bot,
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      bgColor: "bg-emerald-500/10",
      isAuth: false,
    };
  }

  return {
    category: "APPLICATION_RUNTIME_ANOMALY",
    badge: "Runtime Circuit Breaker",
    title: "Unexpected Dashboard Anomaly",
    description: "An unexpected runtime condition halted execution in this dashboard sub-view.",
    remedy: "State isolated successfully. Initiating a component reset will recover the active workspace.",
    icon: ServerCrash,
    iconColor: "text-rose-400",
    borderColor: "border-rose-500/20",
    bgColor: "bg-rose-500/10",
    isAuth: false,
  };
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    console.error("[DashboardRuntimeIncident]", error);
    setTimestamp(new Date().toISOString());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        startTransition(() => reset());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [error, reset]);

  const diagnostic = parseDiagnosticState(error);
  const Icon = diagnostic.icon;
  const digestId = error.digest || "DASHBOARD_ANOMALY";

  const handleCopyTelemetry = async () => {
    try {
      const payload = {
        scope: "dashboard",
        digest: digestId,
        category: diagnostic.category,
        message: error.message,
        timestamp: timestamp || new Date().toISOString(),
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans">
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-2xl overflow-hidden backdrop-blur-md">

        {/* Telemetry Status Bar */}
        <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${diagnostic.bgColor} border ${diagnostic.borderColor}`}>
              <Icon size={18} className={diagnostic.iconColor} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                Dashboard Telemetry
              </span>
              <span className="text-xs font-semibold text-zinc-200">
                {diagnostic.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
              Digest: <span className="text-zinc-200">{digestId}</span>
            </span>
            <button
              onClick={handleCopyTelemetry}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Copy Telemetry Packet"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Diagnostic Details */}
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-2">
              {diagnostic.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              {diagnostic.description}
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-xs text-zinc-300 leading-normal">
              <span className="font-semibold text-zinc-200 block mb-1">Recommended Recovery:</span>
              {diagnostic.remedy}
            </div>
          </div>

          {/* Technical Collapsible Trace */}
          <div className="border-t border-zinc-800/60 pt-4">
            <button
              onClick={() => setShowStack(!showStack)}
              className="flex items-center justify-between w-full text-xs font-mono text-zinc-400 hover:text-zinc-200 py-1 transition-colors"
            >
              <span>Error Exception Payload</span>
              {showStack ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showStack && (
              <div className="mt-3 p-3 rounded-xl bg-black/70 border border-zinc-800 font-mono text-[11px] text-zinc-400 space-y-2">
                <div className="text-rose-400 break-words">
                  {error.message || "No explicit error payload message."}
                </div>
                {error.stack && (
                  <pre className="text-[10px] text-zinc-500 overflow-x-auto max-h-40 custom-scrollbar whitespace-pre-wrap pt-2 border-t border-zinc-900">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Controls */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {diagnostic.isAuth ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-lg shadow-emerald-600/20"
              >
                <ShieldAlert size={15} />
                <span>Sign In Again</span>
              </Link>
            ) : (
              <button
                onClick={() => startTransition(() => reset())}
                disabled={isPending}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-medium transition-all duration-150 active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                <RotateCcw
                  size={15}
                  className={`transition-transform duration-300 ${isPending ? "animate-spin" : "group-hover:-rotate-45"}`}
                />
                <span>{isPending ? "Re-initiating..." : "Retry Operation"}</span>
                <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-zinc-800/20 text-zinc-600 text-[10px] font-mono">
                  R
                </span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-200 text-sm font-medium transition-colors"
            >
              <LayoutDashboard size={15} />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
            >
              <Sliders size={14} />
              <span>Verify Settings</span>
            </Link>
          </div>
        </div>

        {/* Footer Audit Tag */}
        <div className="px-6 py-3 bg-zinc-950/60 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Fault containment active</span>
          <span className="font-mono text-zinc-400">Timestamp: {timestamp || "Tracking..."}</span>
        </div>
      </div>
    </div>
  );
}
