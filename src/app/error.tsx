"use client";

// ============================================================
// App-Level Error Boundary — catches errors in page components
// Shows a friendly error page with retry and home buttons
// ============================================================

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider mb-4">
          500 — Server Error
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          An unexpected error occurred while loading this page. This is usually temporary — please try again.
        </p>
        <p className="text-gray-500 text-xs mb-1">
          Common causes: database timeout, service unavailable, or a brief network issue.
        </p>

        {/* Error digest for support reference */}
        {error.digest && (
          <p className="mt-2 mb-6 text-xs text-gray-600 font-mono bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 inline-block">
            ref: {error.digest}
          </p>
        )}

        {!error.digest && <div className="mb-6" />}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-red-500/20"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-semibold rounded-xl transition-all duration-150"
          >
            <Home size={14} />
            Dashboard
          </a>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 text-sm font-medium rounded-xl transition-all duration-150"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
