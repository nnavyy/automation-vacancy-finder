// ============================================================
// Global 404 Not Found Page
// ============================================================

import Link from "next/link";
import { FileSearch, Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileSearch size={28} className="text-blue-400" />
          </div>
        </div>

        {/* Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider mb-4">
          404 — Not Found
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          The page you are looking for does not exist, may have been moved, or you might not have permission to view it.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-blue-500/20"
          >
            <Home size={14} />
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/vacancies"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl transition-all duration-150"
          >
            <ArrowLeft size={14} />
            View Vacancies
          </Link>
        </div>
      </div>
    </div>
  );
}
