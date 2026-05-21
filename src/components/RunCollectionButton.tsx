"use client";

// ============================================================
// Run Collection Button
// Polls the database for real-time progress across page reloads
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Play, Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export default function RunCollectionButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ analyzed: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [stale, setStale] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  // Poll status on mount and while loading
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/dashboard/collect-status");
        if (res.ok) {
          const json = await res.json();
          const status = json.data;

          if (status?.running) {
            // Check if it's been running for > 10 minutes (likely Vercel timeout)
            const startedAt = status.startedAt ? new Date(status.startedAt) : null;
            const minutesRunning = startedAt
              ? (Date.now() - startedAt.getTime()) / 1000 / 60
              : 0;

            if (minutesRunning > 10) {
              // Stale — auto-reset via API
              setStale(true);
              setLoading(false);
              setProgress(null);
            } else {
              setLoading(true);
              setStale(false);
              setProgress({ analyzed: status.analyzed ?? 0, total: status.total ?? 0 });
            }
          } else {
            setStale(false);
            // It finished
            if (loadingRef.current) {
              setLoading(false);
              setProgress(null);
              setResult({
                ok: true,
                message: `Collection complete — ${status?.analyzed ?? 0} analyzed.`,
              });
              setTimeout(() => setResult(null), 8000);
            }
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    checkStatus(); // initial check
    interval = setInterval(checkStatus, 2000); // poll every 2s

    return () => clearInterval(interval);
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setStale(false);
    setProgress({ analyzed: 0, total: 0 });
    setResult(null);

    // Fire and forget
    fetch("/api/dashboard/collect").catch(() => {
      setResult({
        ok: false,
        message: "Network error starting collection.",
      });
      setLoading(false);
    });
  };

  const handleForceReset = async () => {
    await fetch("/api/dashboard/reset-collection", { method: "POST" }).catch(() => {});
    setStale(false);
    setLoading(false);
    setProgress(null);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {stale && (
          <button
            onClick={handleForceReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 text-yellow-400 text-xs font-medium transition-colors"
          >
            <RefreshCw size={12} />
            Reset Stuck
          </button>
        )}
        <button
          onClick={handleRun}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin shrink-0" />
          ) : (
            <Play size={14} className="shrink-0" />
          )}
          <span className="truncate">
            {loading ? "Collecting..." : "Run Collection"}
          </span>
        </button>
      </div>

      {loading && progress && (
        <div className="text-xs text-gray-400 flex items-center gap-1.5 animate-pulse">
          <Loader2 size={11} className="animate-spin" />
          Analyzing {progress.analyzed} of {progress.total || "?"} vacancies...
        </div>
      )}

      {stale && (
        <div className="text-xs text-yellow-500 flex items-center gap-1.5">
          <RefreshCw size={11} />
          Collection appears stuck. Click Reset Stuck to clear.
        </div>
      )}

      {result && !loading && (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            result.ok ? "text-green-400" : "text-red-400"
          }`}
        >
          {result.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
