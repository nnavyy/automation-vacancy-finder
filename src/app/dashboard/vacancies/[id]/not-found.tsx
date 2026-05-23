// ============================================================
// Vacancy Detail — 404 Not Found
// Shown when a specific vacancy ID does not exist in the DB
// ============================================================

import Link from "next/link";
import { FileSearch, ArrowLeft, Briefcase } from "lucide-react";

export default function VacancyNotFound() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vacancy Detail</h1>
        <p className="text-gray-500 text-sm mt-1">Vacancy not found</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileSearch size={26} className="text-blue-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider mb-4">
          404 — Not Found
        </div>

        <h2 className="text-lg font-bold text-white mb-2">Vacancy not found</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
          This vacancy does not exist or may have been removed. It might have been deleted after you marked it as skipped or ignored.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/dashboard/vacancies"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-150 shadow-lg shadow-blue-500/20"
          >
            <Briefcase size={14} />
            All Vacancies
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl transition-all duration-150"
          >
            <ArrowLeft size={14} />
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
