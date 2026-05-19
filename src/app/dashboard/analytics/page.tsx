// ============================================================
// Nanda AI Job Assistant — Analytics Page
// Server component — text/Tailwind bar charts, no external libs
// ============================================================

import {
  FileText,
  Bot,
  CheckCircle,
  TrendingUp,
  BarChart,
  Target,
  FolderOpen,
  Building2,
  Flag
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Local types ───────────────────────────────────────────────

interface RedFlagItem {
  trigger_text: string;
  reason:       string;
  severity:     string;
}

interface AnalysisSummary {
  matchScore:     number;
  recommendation: string;
  aiStatus:       string;
  redFlags:       unknown[];
}

interface VacancyItem {
  id:       string;
  title:    string;
  company?: string;
  status:   string;
  analysis?: AnalysisSummary;
}

interface VacanciesResponse {
  vacancies: VacancyItem[];
  total:     number;
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon:  React.ElementType;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <span className="text-gray-500">
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
      <p className="text-3xl font-black text-white tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max:   number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs text-gray-400 shrink-0 w-36 truncate"
        title={label}
      >
        {label}
      </span>
      <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 tabular-nums w-6 text-right shrink-0">
        {count}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  let vacancies: VacancyItem[] = [];
  let total = 0;

  try {
    const res = await fetch(`${BASE_URL}/api/vacancies?limit=1000`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        const data = json.data as VacanciesResponse;
        vacancies = data.vacancies;
        total     = data.total;
      }
    }
  } catch {
    /* show empty state */
  }

  // ── Derived stats ────────────────────────────────────────

  const analyzed = vacancies.filter((v) => v.analysis).length;
  const applied  = vacancies.filter((v) => v.status === "applied_manual").length;
  const applyRate =
    analyzed > 0 ? Math.round((applied / analyzed) * 100) : 0;

  // Score distribution buckets
  const scoreBuckets = {
    "75–100 Excellent": vacancies.filter(
      (v) => (v.analysis?.matchScore ?? 0) >= 75
    ).length,
    "50–74  Good": vacancies.filter(({ analysis: a }) => {
      const s = a?.matchScore ?? 0;
      return s >= 50 && s < 75;
    }).length,
    "25–49  Fair": vacancies.filter(({ analysis: a }) => {
      const s = a?.matchScore ?? 0;
      return s >= 25 && s < 50;
    }).length,
    "0–24   Low": vacancies.filter(
      (v) => v.analysis != null && (v.analysis.matchScore ?? 0) < 25
    ).length,
  };
  const maxScore = Math.max(...Object.values(scoreBuckets), 1);

  // AI recommendations
  const recCounts = {
    "Apply": vacancies.filter(
      (v) => v.analysis?.recommendation === "apply"
    ).length,
    "Maybe": vacancies.filter(
      (v) => v.analysis?.recommendation === "maybe"
    ).length,
    "Skip":  vacancies.filter(
      (v) => v.analysis?.recommendation === "skip"
    ).length,
  };
  const maxRec = Math.max(...Object.values(recCounts), 1);

  // AI status breakdown
  const aiStatusCounts: Record<string, number> = {};
  for (const v of vacancies) {
    const key = v.analysis?.aiStatus ?? "no_analysis";
    aiStatusCounts[key] = (aiStatusCounts[key] ?? 0) + 1;
  }
  const maxAi = Math.max(...Object.values(aiStatusCounts), 1);

  // Vacancy status breakdown
  const statusCounts: Record<string, number> = {};
  for (const v of vacancies) {
    statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1;
  }
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  // Top companies
  const companyCounts: Record<string, number> = {};
  for (const v of vacancies) {
    if (v.company) {
      companyCounts[v.company] = (companyCounts[v.company] ?? 0) + 1;
    }
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxCompany = topCompanies[0]?.[1] ?? 1;

  // Red flag triggers
  const rfCounts: Record<string, number> = {};
  for (const v of vacancies) {
    if (Array.isArray(v.analysis?.redFlags)) {
      for (const flag of v.analysis!.redFlags as RedFlagItem[]) {
        const key = flag.trigger_text ?? "unknown";
        rfCounts[key] = (rfCounts[key] ?? 0) + 1;
      }
    }
  }
  const topRedFlags = Object.entries(rfCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxRf = topRedFlags[0]?.[1] ?? 1;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="max-w-5xl space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Insights from {total.toLocaleString()} total vacancies
        </p>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Vacancies"    value={total}            icon={FileText} />
        <StatCard label="With AI Analysis"   value={analyzed}         icon={Bot} />
        <StatCard label="Applied"            value={applied}          icon={CheckCircle} />
        <StatCard label="Apply Rate"         value={`${applyRate}%`}  icon={TrendingUp} />
      </div>

      {/* ── Score Distribution + Recommendations (2-col) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Score distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-widest mb-5">
            <BarChart size={14} className="text-gray-400" />
            Score Distribution
          </h2>
          <div className="space-y-3.5">
            {Object.entries(scoreBuckets).map(([label, count]) => {
              const color =
                label.startsWith("75") ? "bg-green-400"  :
                label.startsWith("50") ? "bg-yellow-400" :
                label.startsWith("25") ? "bg-orange-400" :
                "bg-red-400";
              return (
                <BarRow key={label} label={label} count={count} max={maxScore} color={color} />
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-widest mb-5">
            <Target size={14} className="text-gray-400" />
            AI Recommendations
          </h2>
          <div className="space-y-3.5">
            <BarRow label="Apply" count={recCounts["Apply"]} max={maxRec} color="bg-green-400"  />
            <BarRow label="Maybe" count={recCounts["Maybe"]} max={maxRec} color="bg-yellow-400" />
            <BarRow label="Skip"  count={recCounts["Skip"]}  max={maxRec} color="bg-red-400"    />
          </div>
        </div>

      </div>

      {/* ── AI Status + Vacancy Status (2-col) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* AI analysis status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-widest mb-5">
            <Bot size={14} className="text-gray-400" />
            AI Analysis Status
          </h2>
          <div className="space-y-3.5">
            {Object.entries(aiStatusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <BarRow
                  key={key}
                  label={key.replace(/_/g, " ")}
                  count={count}
                  max={maxAi}
                  color="bg-blue-400"
                />
              ))}
          </div>
        </div>

        {/* Vacancy status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-widest mb-5">
            <FolderOpen size={14} className="text-gray-400" />
            Vacancy Status
          </h2>
          <div className="space-y-3.5">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([key, count]) => (
                <BarRow
                  key={key}
                  label={key.replace(/_/g, " ")}
                  count={count}
                  max={maxStatus}
                  color="bg-purple-400"
                />
              ))}
          </div>
        </div>

      </div>

      {/* ── Top Companies ── */}
      {topCompanies.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-widest mb-5">
            <Building2 size={14} className="text-gray-400" />
            Top Companies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topCompanies.map(([company, count]) => (
              <BarRow
                key={company}
                label={company}
                count={count}
                max={maxCompany}
                color="bg-cyan-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Top Red Flag Triggers ── */}
      {topRedFlags.length > 0 && (
        <div className="bg-gray-900 border border-red-400/20 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-widest mb-5">
            <Flag size={14} />
            Top Red Flag Triggers
          </h2>
          <div className="space-y-3.5">
            {topRedFlags.map(([trigger, count]) => (
              <BarRow
                key={trigger}
                label={trigger}
                count={count}
                max={maxRf}
                color="bg-red-400"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {vacancies.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">No vacancy data yet.</p>
          <p className="text-gray-600 text-xs mt-1">
            Run a collection from the Overview page to populate analytics.
          </p>
        </div>
      )}
    </div>
  );
}
