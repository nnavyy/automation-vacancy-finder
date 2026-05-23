"use client";

// ============================================================
// Dashboard-Level Error Boundary
// Catches server/client errors within any dashboard/* page
// ============================================================

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Database, Wifi } from "lucide-react";

function getErrorInfo(error: Error): {
  title: string;
  description: string;
  hint: string;
  icon: React.ReactNode;
} {
  const msg = error.message?.toLowerCase() ?? "";

  if (msg.includes("prisma") || msg.includes("database") || msg.includes("connection") || msg.includes("p1")) {
    return {
      title: "Database connection issue",
      description: "Could not connect to the database. This is often a temporary issue with the NeonDB connection pool.",
      hint: "Wait a few seconds and try again — the database may have been in sleep mode.",
      icon: <Database size={28} className="text-yellow-400" />,
    };
  }

  if (msg.includes("network") || msg.includes("fetch") || msg.includes("econnrefused")) {
    return {
      title: "Network error",
      description: "A network request failed while loading this page.",
      hint: "Check your internet connection and try again.",
      icon: <Wifi size={28} className="text-orange-400" />,
    };
  }

  if (msg.includes("unauthorized") || msg.includes("401") || msg.includes("session")) {
    return {
      title: "Session expired",
      description: "Your session has expired or you are not authorized to view this page.",
      hint: "Please log in again to continue.",
      icon: <AlertTriangle size={28} className="text-red-400" />,
    };
  }

  return {
    title: "Something went wrong",
    description: "An unexpected error occurred while loading the dashboard.",
    hint: "This is usually temporary. Try refreshing the page or navigating to another section.",
    icon: <AlertTriangle size={28} className="text-red-400" />,
  };
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  const info = getErrorInfo(error);
  const isAuthError =
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("401") ||
    error.message?.toLowerCase().includes("session");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
              {info.icon}
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider mb-4">
            500 — Server Error
          </div>

          <h2 className="text-xl font-bold text-white mb-2">{info.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-2">{info.description}</p>
          <p className="text-gray-500 text-xs leading-relaxed mb-5">{info.hint}</p>

          {/* Error digest */}
          {error.digest && (
            <p className="text-xs text-gray-600 font-mono bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 mb-5">
              ref: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {isAuthError ? (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-all duration-150"
              >
                Sign In Again
              </Link>
            ) : (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-green-500/20"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl transition-all duration-150"
            >
              <Home size={14} />
              Overview
            </Link>
          </div>
        </div>

        {/* Extra help */}
        <p className="text-center text-xs text-gray-600 mt-4">
          If this keeps happening, try clearing your browser cache or signing out and back in.
        </p>
      </div>
    </div>
  );
}
