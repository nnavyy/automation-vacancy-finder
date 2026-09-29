"use client";

// ============================================================
// Sync Cadence Timer Component
// Live countdown for autonomous 30-minute sync cycles
// Clean, executive UI with zero slop badges or emojis
// ============================================================

import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";

interface SyncCadenceTimerProps {
  initialLastSyncedAt?: string;
}

export default function SyncCadenceTimer({
  initialLastSyncedAt,
}: SyncCadenceTimerProps) {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    initialLastSyncedAt || null
  );
  const [timeAgoText, setTimeAgoText] = useState<string>("Checking...");
  const [nextSyncText, setNextSyncText] = useState<string>("Calculating...");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/dashboard/collect-status");
      if (res.ok) {
        const json = await res.json();
        if (json.lastSyncedAt) {
          setLastSyncedAt(json.lastSyncedAt);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const baseTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : Date.now() - 5 * 60000;
      const now = Date.now();
      const elapsedMs = Math.max(0, now - baseTime);

      // Format elapsed time
      const elapsedSec = Math.floor(elapsedMs / 1000);
      if (elapsedSec < 60) {
        setTimeAgoText(`${elapsedSec}s ago`);
      } else {
        const elapsedMin = Math.floor(elapsedSec / 60);
        if (elapsedMin < 60) {
          setTimeAgoText(`${elapsedMin}m ago`);
        } else {
          const hours = Math.floor(elapsedMin / 60);
          setTimeAgoText(`${hours}h ${elapsedMin % 60}m ago`);
        }
      }

      // 30 minute cycle = 1800 seconds
      const cycleDurationMs = 30 * 60 * 1000;
      const msIntoCurrentCycle = elapsedMs % cycleDurationMs;
      const remainingMs = cycleDurationMs - msIntoCurrentCycle;

      const remainingSec = Math.floor(remainingMs / 1000);
      const remMins = Math.floor(remainingSec / 60);
      const remSecs = remainingSec % 60;

      setNextSyncText(
        `${remMins.toString().padStart(2, "0")}m ${remSecs.toString().padStart(2, "0")}s`
      );

      const percent = Math.min(100, Math.max(0, (msIntoCurrentCycle / cycleDurationMs) * 100));
      setProgressPercent(percent);
    };

    updateCountdown();
    const ticker = setInterval(updateCountdown, 1000);
    return () => clearInterval(ticker);
  }, [lastSyncedAt]);

  const handleManualCheck = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-2.5 text-xs">
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800">
        <span className="text-zinc-400">HH.ru Session Status</span>
        <span className="font-mono text-emerald-400 font-medium">Valid Active</span>
      </div>

      <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Autonomous Cadence
          </span>
          <button
            onClick={handleManualCheck}
            disabled={isRefreshing}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
            title="Refresh sync status"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/80">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
              Last Synced
            </span>
            <span className="font-mono text-zinc-200 font-medium text-xs">
              {timeAgoText}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-semibold">
              Next Sync in
            </span>
            <span className="font-mono text-violet-400 font-semibold text-xs">
              {nextSyncText}
            </span>
          </div>
        </div>

        {/* Subtle cycle progression line */}
        <div className="w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden mt-1.5">
          <div
            className="bg-violet-500/80 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
