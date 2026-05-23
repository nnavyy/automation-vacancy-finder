"use client";

// ============================================================
// Vacancies Page — Error Boundary
// Specific error page for /dashboard/vacancies crashes
// ============================================================

import { useEffect } from "react";
import Link from "next/link";
import { Briefcase, RefreshCw, Home, Database } from "lucide-react";

export default function VacanciesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[VacanciesError]", error);
  }, [error]);

  const isDbError =
    error.message?.toLowerCase().includes("prisma") ||
    error.message?.toLowerCase().includes("database") ||
    error.message?.toLowerCase().includes("connection");

  return (
    <div className="max-w-5xl">
      {/* Page header so layout stays consistent */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vacancies</h1>
        <p className="text-gray-500 text-sm mt-1">Could not load vacancy list</p>
      </div>

      {/* Error card */}
      <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-10 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            {isDbError ? (
              <Database size={26} className="text-yellow-400" />
            ) : (
              <Briefcase size={26} className="text-red-400" />
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider mb-4">
          500 — Failed to load
        </div>

        <h2 className="text-lg font-bold text-white mb-2">
          {isDbError ? "Database connection timeout" : "Failed to load vacancies"}
        </h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-2">
          {isDbError
            ? "The database took too long to respond. This often happens when NeonDB wakes from sleep mode on the free tier."
            : "An error occurred while fetching your vacancy list from the server."}
        </p>
        <p className="text-gray-500 text-xs max-w-sm mx-auto mb-6">
          {isDbError
            ? "Click \"Try Again\" — the second attempt usually succeeds once the connection is warmed up."
            : "Try refreshing or navigate away and come back."}
        </p>

        {error.digest && (
          <p className="text-xs text-gray-600 font-mono bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 inline-block mb-6">
            ref: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-green-500/20"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl transition-all duration-150"
          >
            <Home size={14} />
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
