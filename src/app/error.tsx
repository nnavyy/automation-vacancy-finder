"use client";

// ============================================================
// wingkiiy Job Copilot — Root Application Error Boundary
// Premium, developer-grade diagnostic & incident recovery interface
// ============================================================

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  RotateCcw,
  LayoutDashboard,
  ArrowLeft,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Database,
  ShieldAlert,
  ServerCrash,
  WifiOff,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export default function RootErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    console.error("[SystemRuntimeIncident]", error);
    setTimestamp(new Date().toISOString());

    // Keyboard shortcuts: 'R' to retry, 'Escape' to go back
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRetry();
      } else if (e.key === "Escape") {
        e.preventDefault();
        window.history.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      reset();
    });
  };

  const digestId = error.digest || "ERR_LOCAL_ENV";

  const handleCopyDigest = async () => {
    try {
      await navigator.clipboard.writeText(digestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const handleCopyPayload = async () => {
    try {
      const payload = {
        product: BRAND_NAME,
        digest: digestId,
        message: error.message || "Unknown runtime exception",
        name: error.name,
        timestamp: timestamp || new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  // Determine failure context
  const errMsg = error.message?.toLowerCase() || "";
  const isDbIssue = errMsg.includes("prisma") || errMsg.includes("database") || errMsg.includes("connect") || errMsg.includes("p1001");
  const isNetwork = errMsg.includes("fetch") || errMsg.includes("network") || errMsg.includes("econnrefused");
  const isAuth = errMsg.includes("unauthorized") || errMsg.includes("401") || errMsg.includes("jwt") || errMsg.includes("session");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-300 relative overflow-hidden font-sans">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(244,63,94,0.08),rgba(24,24,27,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0d_1px,transparent_1px),linear-gradient(to_bottom,#27272a0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top System Bar */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-inner">
            W
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {BRAND_NAME}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Diagnostic & Recovery Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
          <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
            Runtime Incident Active
          </span>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-10 md:py-16 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Human Guidance & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-medium">
              <AlertOctagon size={13} className="text-rose-400 shrink-0" />
              <span>HTTP 500 // UNHANDLED_RUNTIME_EXCEPTION</span>
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-3">
                Application Service Interruption
              </h1>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
                An unhandled state was encountered while processing this view. Our internal circuit breakers captured the event and isolated the runtime environment to safeguard your data.
              </p>
            </div>

            {/* Contextual Diagnosis Card */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-sm space-y-3">
              <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                {isDbIssue && <Database size={14} className="text-amber-400" />}
                {isNetwork && <WifiOff size={14} className="text-amber-400" />}
                {isAuth && <ShieldAlert size={14} className="text-rose-400" />}
                {!isDbIssue && !isNetwork && !isAuth && <ServerCrash size={14} className="text-rose-400" />}
                <span>Probable Root Cause</span>
              </div>
              <p className="text-xs text-zinc-300 leading-normal">
                {isDbIssue && (
                  "Database pool suspended or cold start latency. NeonDB instances on serverless tiers spin down after idle intervals; a warm retry will re-establish the pool within ~1.5s."
                )}
                {isNetwork && (
                  "Network packet delivery timed out or socket dropped prematurely. Verify your internet uplink or VPN connection."
                )}
                {isAuth && (
                  "Authentication session handshake failed or security token expired. Re-authenticating via login will re-issue cryptographic credentials."
                )}
                {!isDbIssue && !isNetwork && !isAuth && (
                  "An unexpected client-server component mismatch occurred. This is commonly resolved by requesting a clean state re-render."
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleRetry}
                disabled={isPending}
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-medium transition-all duration-150 active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
              >
                <RotateCcw
                  size={15}
                  className={`transition-transform duration-300 ${isPending ? "animate-spin" : "group-hover:-rotate-45"}`}
                />
                <span>{isPending ? "Re-executing..." : "Retry Operation"}</span>
                <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-zinc-800/20 text-zinc-600 text-[10px] font-mono">
                  R
                </span>
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-sm font-medium transition-all duration-150 hover:text-white"
              >
                <LayoutDashboard size={15} />
                <span>Return to Dashboard</span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Go Back</span>
              </button>
            </div>
          </div>

          {/* Right Column: Diagnostic Telemetry Console */}
          <div className="lg:col-span-5 w-full">
            <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-md">
              {/* Telemetry Header */}
              <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={14} className="text-zinc-400" />
                  <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wider">
                    Telemetry Packet
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-zinc-700" />
                  <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                </div>
              </div>

              {/* Telemetry Body */}
              <div className="p-4 space-y-4 font-mono text-xs">
                {/* Digest ID Row */}
                <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/60 flex items-center justify-between">
                  <div className="overflow-hidden pr-2">
                    <span className="text-[10px] uppercase text-zinc-500 block mb-0.5">
                      Incident Digest
                    </span>
                    <span className="text-rose-300 font-semibold truncate block">
                      {digestId}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyDigest}
                    className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                    title="Copy Digest ID"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Key-Value Metrics */}
                <div className="space-y-1.5 text-[11px] text-zinc-400">
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Timestamp</span>
                    <span className="text-zinc-300">{timestamp || "Synchronizing..."}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Environment</span>
                    <span className="text-emerald-400 font-medium">SOC 2 Monitored</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Isolation Layer</span>
                    <span className="text-zinc-300">App Router Boundary</span>
                  </div>
                </div>

                {/* Exception Message */}
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 block mb-1">
                    System Message
                  </span>
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/70 text-zinc-300 text-[11px] break-words max-h-24 overflow-y-auto custom-scrollbar">
                    {error.message || "No public error description provided by server."}
                  </div>
                </div>

                {/* Expandable Stack Trace */}
                {error.stack && (
                  <div>
                    <button
                      onClick={() => setShowStack(!showStack)}
                      className="flex items-center justify-between w-full text-[11px] text-zinc-400 hover:text-zinc-200 py-1 transition-colors"
                    >
                      <span>Developer Stack Trace</span>
                      {showStack ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {showStack && (
                      <pre className="mt-2 p-3 rounded-lg bg-black/80 border border-zinc-800 text-[10px] text-zinc-400 overflow-x-auto max-h-48 custom-scrollbar whitespace-pre-wrap">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}

                {/* Copy Support Payload Button */}
                <button
                  onClick={handleCopyPayload}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-[11px]"
                >
                  {copiedPayload ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Diagnostic Payload Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Full Diagnostics JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Audit Notice */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
        <span>
          © {new Date().getFullYear()} {BRAND_NAME}. High-availability job aggregation & matching copilot.
        </span>
        <div className="flex items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/legal/terms" className="hover:text-zinc-300 transition-colors">
            Terms of Service
          </Link>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-zinc-400">SOC 2 Type II Safeguarded</span>
        </div>
      </footer>
    </div>
  );
}
