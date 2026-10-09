"use client";

// ============================================================
// Run Collection Button
// Polls the database for real-time progress across page reloads
// and dispatches liveStats updates to parent components.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export interface LiveDashboardStats {
  total: number;
  applied: number;
  skipped: number;
  saved: number;
  aiPending: number;
  avgScore: number;
  highCount: number;
  maybeCount: number;
  lowCount: number;
  analyzedCount: number;
}

interface RunCollectionButtonProps {
  onLiveUpdate?: (stats: LiveDashboardStats) => void;
  onRunningChange?: (running: boolean) => void;
}

export default function RunCollectionButton({
  onLiveUpdate,
  onRunningChange,
}: RunCollectionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [stale, setStale] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const onLiveUpdateRef = useRef(onLiveUpdate);
  onLiveUpdateRef.current = onLiveUpdate;

  const onRunningChangeRef = useRef(onRunningChange);
  onRunningChangeRef.current = onRunningChange;

  // Poll status on mount and while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/dashboard/collect-status");
        if (res.ok) {
          const json = await res.json();
          const status = json.data;

          if (json.liveStats && onLiveUpdateRef.current) {
            onLiveUpdateRef.current(json.liveStats);
          }

          if (status?.running) {
            const startedAt = status.startedAt ? new Date(status.startedAt) : null;
            const minutesRunning = startedAt
              ? (Date.now() - startedAt.getTime()) / 1000 / 60
              : 0;

            if (minutesRunning > 5) {
              // Stale — show reset button
              setStale(true);
              setLoading(false);
              setProgress(null);
              onRunningChangeRef.current?.(false);
            } else {
              setLoading(true);
              setStale(false);
              onRunningChangeRef.current?.(true);

              const currentCount = typeof status.processed === "number"
                ? status.processed
                : (status.analyzed ?? 0);

              setProgress({
                current: currentCount,
                total: status.total ?? 0,
              });
            }
          } else {
            setStale(false);
            onRunningChangeRef.current?.(false);

            if (loadingRef.current) {
              setLoading(false);
              setProgress(null);
              const processedCount = status?.processed ?? status?.analyzed ?? 0;
              setResult({
                ok: true,
                message: `Collection complete — ${processedCount} vacancies processed.`,
              });
              // Automatically refresh server data
              router.refresh();
              setTimeout(() => setResult(null), 8000);
            }
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    checkStatus(); // initial check
    interval = setInterval(checkStatus, 1500); // poll every 1.5s for live reactivity

    return () => clearInterval(interval);
  }, [router]);

  const handleRun = async () => {
    setLoading(true);
    setStale(false);
    setProgress({ current: 0, total: 0 });
    setResult(null);
    onRunningChangeRef.current?.(true);

    // Fire and forget
    fetch("/api/dashboard/collect").catch(() => {
      setResult({
        ok: false,
        message: "Network error starting collection.",
      });
      setLoading(false);
      onRunningChangeRef.current?.(false);
    });
  };

  const handleForceReset = async () => {
    await fetch("/api/dashboard/reset-collection", { method: "POST" }).catch(() => {});
    setStale(false);
    setLoading(false);
    setProgress(null);
    onRunningChangeRef.current?.(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {stale && (
          <button
            onClick={handleForceReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium transition-colors"
          >
            <RefreshCw size={12} />
            Reset Stuck
          </button>
        )}
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin shrink-0" />
          ) : (
            <Play size={13} className="shrink-0" />
          )}
          <span className="truncate">
            {loading ? "Collecting..." : "Run Collection"}
          </span>
        </button>
      </div>

      {loading && (
        <div className="text-xs text-zinc-400 flex items-center gap-1.5 animate-pulse">
          <Loader2 size={11} className="animate-spin text-emerald-400" />
          Analyzing {progress?.current ?? 0} of {progress?.total || "?"} vacancies...
        </div>
      )}

      {stale && (
        <div className="text-xs text-amber-400 flex items-center gap-1.5">
          <RefreshCw size={11} />
          Collection appears stuck. Click Reset Stuck to clear.
        </div>
      )}

      {result && !loading && (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            result.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {result.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
