"use client";

// ============================================================
// Run Collection Button — triggers vacancy collection via
// the server-side proxy route (keeps CRON_SECRET off the client)
// ============================================================

import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function RunCollectionButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/dashboard/collect");
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success !== false) {
        const d = data.data ?? {};
        setResult({
          ok: true,
          message: `Collection complete — ${d.analyzed ?? 0} analyzed, ${d.notified ?? 0} sent to Telegram.`,
        });
      } else {
        setResult({
          ok: false,
          message: data.error ?? "Collection failed. Check server logs.",
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "Network error. Ensure the dev server is running.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 8000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRun}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Play size={14} />
        )}
        {loading ? "Running..." : "Run Collection"}
      </button>

      {result && (
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
