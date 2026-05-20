"use client";

// ============================================================
// Run Collection Button
// Polls the database for real-time progress across page reloads
// ============================================================

import { useState, useEffect } from "react";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function RunCollectionButton() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ analyzed: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

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
            setLoading(true);
            setProgress({ analyzed: status.analyzed ?? 0, total: status.total ?? 0 });
          } else {
            // It finished
            if (loading) {
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
  }, [loading]);

  const handleRun = async () => {
    setLoading(true);
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

  return (
    <div className="flex flex-col items-end gap-2">
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

      {loading && progress && (
        <div className="text-xs text-gray-400 flex items-center gap-1.5 animate-pulse">
          ⚙️ Analyzing {progress.analyzed} of {progress.total || "?"} vacancies...
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
