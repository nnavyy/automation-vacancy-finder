"use client";

// ============================================================
// Vacancies Split View (Master-Detail Double Layout)
// Blazing fast client-side switching with deep AI match analysis
// Clean, executive UI with zero slop badges or emojis
// Fully localized (EN/RU)
// ============================================================

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Bookmark,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Check,
  ChevronRight,
  Loader2,
  Copy,
  CheckCheck,
  Languages,
  RotateCcw,
  Calendar,
  Building2,
} from "lucide-react";
import RecruiterDossierModal, { RecruiterDossierData } from "@/components/RecruiterDossierModal";
import { useLanguage } from "@/lib/i18n";

export interface VacancyItem {
  id: string;
  hhId: string;
  title: string;
  company: string;
  area?: string;
  salary?: unknown;
  url?: string;
  status: string;
  createdAt: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any;
  analysis?: {
    matchScore: number;
    ruleScore?: number;
    recommendation: string;
    aiStatus: string;
    summary?: string;
    matchReasons?: string[];
    missingRequirements?: string[];
    redFlags?: Array<{ trigger_text: string; reason: string; severity: string }>;
    coverLetter?: string;
    questions?: string[];
    modelUsed?: string;
    bestLanguage?: string;
  };
}

interface VacanciesSplitViewProps {
  initialVacancies: VacancyItem[];
  totalCount: number;
  hasProfile: boolean;
  minScoreThreshold?: number;
}

function formatVacancyDate(dateStr?: string, lang: string = "en"): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatSalary(salary: unknown, lang: string = "en"): string {
  const notSpecified = lang === "ru" ? "Зарплата не указана" : "Salary not specified";
  if (!salary || typeof salary !== "object") return notSpecified;
  const s = salary as { from?: number; to?: number; currency?: string };
  if (!s.from && !s.to) return notSpecified;
  const curr = s.currency ?? (lang === "ru" ? "руб." : "RUR");
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  if (s.from && s.to)
    return `${s.from.toLocaleString(locale)} – ${s.to.toLocaleString(locale)} ${curr}`;
  if (s.from) return `${lang === "ru" ? "от" : "from"} ${s.from.toLocaleString(locale)} ${curr}`;
  return `${lang === "ru" ? "до" : "up to"} ${s.to!.toLocaleString(locale)} ${curr}`;
}

export default function VacanciesSplitView({
  initialVacancies,
  totalCount,
  minScoreThreshold = 70,
}: VacanciesSplitViewProps) {
  const { t, language } = useLanguage();
  const [vacancies, setVacancies] = useState<VacancyItem[]>(initialVacancies);
  const [selectedId, setSelectedId] = useState<string>(
    initialVacancies[0]?.id ?? ""
  );
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<
    "analysis" | "description" | "tailoring"
  >("analysis");

  // Pitch state
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [customPitch, setCustomPitch] = useState<string | null>(null);

  // Translation state
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  // Analysis on-demand state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Recruiter modal state
  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierData, setDossierData] = useState<RecruiterDossierData | null>(null);

  // Filtered vacancies list
  const filteredVacancies = useMemo(() => {
    return vacancies
      .filter((v) => {
        // If not in the "skip" tab, hide skipped/ignored/low_priority items
        if (filterTab !== "skip" && (v.status === "skipped" || v.status === "ignored" || v.status === "low_priority")) {
          return false;
        }

        // Tab filter
        if (filterTab === "high") {
          if ((v.analysis?.matchScore ?? 0) < minScoreThreshold) return false;
        } else if (filterTab === "maybe") {
          if (v.analysis?.recommendation?.toLowerCase() !== "maybe") return false;
        } else if (filterTab === "analyzed") {
          if (!v.analysis || v.analysis.matchScore === 0) return false;
        } else if (filterTab === "applied") {
          if (!v.status.includes("applied")) return false;
        } else if (filterTab === "saved") {
          if (v.status !== "saved") return false;
        } else if (filterTab === "skip") {
          if (v.status !== "skipped" && v.status !== "ignored" && v.status !== "low_priority") return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = v.title.toLowerCase().includes(q);
          const matchesCompany = v.company?.toLowerCase().includes(q);
          const matchesArea = v.area?.toLowerCase().includes(q);
          return matchesTitle || matchesCompany || matchesArea;
        }

        return true;
      })
      .sort((a, b) => {
        const scoreA = a.analysis?.matchScore ?? -1;
        const scoreB = b.analysis?.matchScore ?? -1;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [vacancies, filterTab, searchQuery, minScoreThreshold]);

  // Active selected vacancy
  const selectedVacancy = useMemo(() => {
    const found = filteredVacancies.find((v) => v.id === selectedId);
    return found ?? filteredVacancies[0] ?? null;
  }, [filteredVacancies, selectedId]);

  const handleToggleSave = async (vacancyId: string) => {
    const target = vacancies.find((v) => v.id === vacancyId);
    if (!target) return;
    const previousStatus = target.status;
    const newStatus = previousStatus === "saved" ? "new" : "saved";

    // 1. Optimistic update (0ms instant response)
    setVacancies((prev) =>
      prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus } : v))
    );

    // 2. Non-blocking background sync with auto-revert on failure
    fetch(`/api/vacancies/${vacancyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Status update failed");
      })
      .catch((err) => {
        console.error("[handleToggleSave] network rollback:", err);
        setVacancies((prev) =>
          prev.map((v) => (v.id === vacancyId ? { ...v, status: previousStatus } : v))
        );
      });
  };

  const handleStatusChange = async (newStatus: string, targetId?: string) => {
    const vacancyId = targetId || selectedVacancy?.id;
    if (!vacancyId) return;
    const target = vacancies.find((v) => v.id === vacancyId);
    const previousStatus = target?.status || "new";

    // 1. Optimistic update (0ms instant response)
    setVacancies((prev) =>
      prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus } : v))
    );

    // 2. Non-blocking background sync
    fetch(`/api/vacancies/${vacancyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Status update failed");
      })
      .catch((err) => {
        console.error("[handleStatusChange] network rollback:", err);
        setVacancies((prev) =>
          prev.map((v) => (v.id === vacancyId ? { ...v, status: previousStatus } : v))
        );
      });
  };

  const handleToggleHide = async (vacancyId: string) => {
    const target = vacancies.find((v) => v.id === vacancyId);
    if (!target) return;
    const previousStatus = target.status;
    const isCurrentlyHidden =
      previousStatus === "skipped" || previousStatus === "ignored" || previousStatus === "low_priority";
    const newStatus = isCurrentlyHidden ? "new" : "skipped";

    // 1. If hiding the currently selected vacancy, advance to next item (0ms instant response)
    if (!isCurrentlyHidden && selectedId === vacancyId) {
      const currentIndex = filteredVacancies.findIndex((v) => v.id === vacancyId);
      const nextRemaining = filteredVacancies.filter((v) => v.id !== vacancyId);
      if (nextRemaining.length > 0) {
        const nextTarget =
          nextRemaining[Math.min(currentIndex, nextRemaining.length - 1)];
        setSelectedId(nextTarget.id);
      }
    }

    // 2. Optimistic update (0ms instant response)
    setVacancies((prev) =>
      prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus } : v))
    );

    // 3. Non-blocking background sync with auto-rollback
    fetch(`/api/vacancies/${vacancyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Status update failed");
      })
      .catch((err) => {
        console.error("[handleToggleHide] network rollback:", err);
        setVacancies((prev) =>
          prev.map((v) => (v.id === vacancyId ? { ...v, status: previousStatus } : v))
        );
        if (!isCurrentlyHidden && selectedId === vacancyId) {
          setSelectedId(vacancyId);
        }
      });
  };

  const handleHide = handleToggleHide;

  const handleRunAnalysis = async (vacancyId: string) => {
    setAnalyzingId(vacancyId);
    try {
      const res = await fetch("/api/vacancies/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? {
                  ...v,
                  analysis: {
                    matchScore: json.data.matchScore ?? 0,
                    ruleScore: json.data.ruleScore,
                    recommendation: json.data.recommendation ?? "maybe",
                    aiStatus: json.data.aiStatus ?? "analyzed",
                    summary: json.data.summary,
                    matchReasons: json.data.matchReasons ?? [],
                    missingRequirements: json.data.missingRequirements ?? [],
                    redFlags: json.data.redFlags ?? [],
                    coverLetter: json.data.coverLetter,
                    questions: json.data.questions,
                  },
                }
              : v
          )
        );
      }
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleTranslate = async () => {
    if (!selectedVacancy) return;
    if (showTranslated) {
      setShowTranslated(false);
      return;
    }
    if (translations[selectedVacancy.id]) {
      setShowTranslated(true);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedVacancy.description || selectedVacancy.title,
          targetLang: "EN",
        }),
      });
      const json = await res.json();
      if (json.success && json.text) {
        setTranslations((prev) => ({
          ...prev,
          [selectedVacancy.id]: json.text,
        }));
        setShowTranslated(true);
      }
    } catch (err) {
      console.error("Translation failed:", err);
    } finally {
      setTranslating(false);
    }
  };

  const openRecruiterModal = (vacancy: VacancyItem) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (vacancy as any)?.rawData;
    const hhContacts = raw?.contacts;
    const phoneObj = hhContacts?.phones?.[0];
    const directPhone = phoneObj
      ? `+${phoneObj.country || ""}${phoneObj.city ? ` (${phoneObj.city})` : ""} ${phoneObj.number || ""}`.trim()
      : undefined;
    const directEmail = hhContacts?.email || undefined;
    const directName = hhContacts?.name || (language === "ru" ? `Нанимающий менеджер · ${vacancy.company}` : `Hiring Authority · ${vacancy.company}`);

    setDossierData({
      name: directName,
      role: hhContacts?.name
        ? (language === "ru" ? "Рекрутер / Контактное лицо" : "Talent Acquisition / Contact Person")
        : (language === "ru" ? "Ведущий технический рекрутер" : "Lead Technical Recruiter / Talent Acquisition"),
      companyName: vacancy.company,
      department: language === "ru" ? "Подбор инженерных кадров" : "Engineering Recruitment",
      email: directEmail,
      emailVerified: Boolean(directEmail),
      phone: directPhone,
      synergyScore: vacancy.analysis?.matchScore ?? 88,
      preferredChannel: directEmail
        ? (language === "ru" ? "Корпоративная почта" : "Corporate Email")
        : (language === "ru" ? "Отклик / Портал HH" : "Direct Application / HH Portal"),
      responseWindow: t("dossier.activeWindow"),
      historyLogs: [
        {
          channel: t("dossier.hhAutoIndex"),
          target: vacancy.title,
          status: language === "ru" ? "Синхронизировано" : "Synchronized",
          date: language === "ru" ? "Недавно" : "Recently",
          details: language === "ru"
            ? `Индексировано по вакансии ID #${vacancy.hhId}.`
            : `Indexed from HeadHunter vacancy ID #${vacancy.hhId}.`,
        },
      ],
    });
    setDossierOpen(true);
  };

  const copyPitchText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const copyDescriptionText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const generateLivePitch = async () => {
    if (!selectedVacancy) return;
    setActiveDetailTab("tailoring");
    setGeneratingPitch(true);
    try {
      const res = await fetch("/api/company-intel/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: language === "ru" ? "Нанимающий менеджер" : "Hiring Manager",
          contactRole: "Engineering Lead",
          companyName: selectedVacancy.company,
          jobTitle: selectedVacancy.title,
          language: language === "ru" ? "Russian" : "English",
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.email) {
        setCustomPitch(json.data.email);
      }
    } catch (err) {
      console.error("Pitch generation error:", err);
    } finally {
      setGeneratingPitch(false);
    }
  };

  const isAnalyzed = Boolean(
    selectedVacancy?.analysis && (selectedVacancy.analysis.matchScore > 0 || selectedVacancy.analysis.matchReasons?.length)
  );

  return (
    <div className="space-y-4">
      {/* ── Top Bar: Search & Filter Tabs ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-3">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("vacancies.searchPlaceholder")}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">
              {t("vacancies.filteredOf")
                .replace("{shown}", String(filteredVacancies.length))
                .replace("{total}", String(totalCount))}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-800/60">
          {[
            {
              id: "all",
              label: t("vacancies.tabAll"),
              count: vacancies.filter((v) => v.status !== "skipped" && v.status !== "ignored" && v.status !== "low_priority").length,
            },
            {
              id: "high",
              label: `${t("vacancies.tabHigh")} (≥${minScoreThreshold}%)`,
              count: vacancies.filter((v) => (v.analysis?.matchScore ?? 0) >= minScoreThreshold && v.status !== "skipped" && v.status !== "ignored" && v.status !== "low_priority").length,
            },
            {
              id: "maybe",
              label: t("vacancies.tabMaybe"),
              count: vacancies.filter((v) => v.analysis?.recommendation?.toLowerCase() === "maybe" && v.status !== "skipped").length,
            },
            {
              id: "analyzed",
              label: t("vacancies.tabAnalyzed"),
              count: vacancies.filter((v) => v.analysis && v.analysis.matchScore > 0 && v.status !== "skipped").length,
            },
            {
              id: "applied",
              label: t("vacancies.tabApplied"),
              count: vacancies.filter((v) => v.status.includes("applied")).length,
            },
            {
              id: "saved",
              label: t("vacancies.tabSaved"),
              count: vacancies.filter((v) => v.status === "saved").length,
            },
            {
              id: "skip",
              label: t("vacancies.tabSkip"),
              count: vacancies.filter((v) => v.status === "skipped" || v.status === "ignored" || v.status === "low_priority").length,
            },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold shadow-sm"
                    : "bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    active ? "bg-zinc-700 text-zinc-200" : "bg-zinc-950 text-zinc-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Split View Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Master List (Scrollable Cards) ── */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
          {filteredVacancies.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 border-dashed rounded-xl">
              <p className="text-sm text-zinc-300 font-medium">{t("vacancies.noMatch")}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {t("vacancies.noMatchDesc")}
              </p>
            </div>
          ) : (
            filteredVacancies.map((v) => {
              const isSelected = v.id === selectedVacancy?.id;
              const matchScore = v.analysis?.matchScore ?? 0;
              const initials = (v.company || "CO")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const rec = v.analysis?.recommendation?.toLowerCase();
              const redFlagsCount = v.analysis?.redFlags?.length ?? 0;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedId(v.id);
                    setCustomPitch(null);
                    setShowTranslated(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-700 shadow-md ring-1 ring-zinc-700"
                      : "bg-zinc-900/60 hover:bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/80 font-bold text-xs text-zinc-300 flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider truncate">
                            {v.company || "Unknown"}
                          </span>
                          {v.company && (
                            <Link
                              href={`/dashboard/company-intel?company=${encodeURIComponent(v.company)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded transition-all inline-flex items-center gap-1 group/intel shrink-0"
                              title={
                                language === "ru"
                                  ? `Открыть ${v.company} в Company Intel`
                                  : `Search ${v.company} in Company Intel`
                              }
                            >
                              <Building2 className="w-2.5 h-2.5 text-emerald-400 group-hover/intel:scale-110 transition-transform" />
                              <span className="font-mono text-[9px] uppercase tracking-wider">Intel</span>
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {v.status === "saved" && (
                            <span
                              className="p-0.5 text-violet-400"
                              title={language === "ru" ? "Сохранено" : "Saved"}
                            >
                              <Bookmark className="w-3 h-3 fill-violet-400" />
                            </span>
                          )}
                          {matchScore > 0 && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                matchScore >= 70
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                  : matchScore >= 45
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/25"
                              }`}
                            >
                              {matchScore}% {language === "ru" ? "СОВПАДЕНИЕ" : "MATCH"}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-zinc-100 line-clamp-1 leading-snug">
                        {v.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap">
                        {v.area && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {v.area}
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-zinc-300 font-mono">
                          {formatSalary(v.salary, language)}
                        </span>
                        {v.createdAt && (
                          <>
                            <span>·</span>
                            <span className="text-zinc-400 inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              {formatVacancyDate(v.createdAt, language)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tags & Quick Actions row */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {rec && matchScore > 0 && (
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                              rec === "apply"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : rec === "maybe"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {rec === "apply"
                              ? (language === "ru" ? "отклик" : "apply")
                              : rec === "maybe"
                              ? (language === "ru" ? "возможно" : "maybe")
                              : rec}
                          </span>
                        )}

                        {redFlagsCount > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {redFlagsCount} {language === "ru" ? "РИСК" : "FLAG"}{language === "ru" ? "" : redFlagsCount > 1 ? "S" : ""}
                          </span>
                        )}

                        {/* Check Company Button right on the card */}
                        {v.company && (
                          <Link
                            href={`/dashboard/company-intel?company=${encodeURIComponent(v.company)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-zinc-700/80 hover:border-emerald-500/40 text-[11px] font-semibold transition-all active:scale-95 shadow-sm group/btn"
                            title={
                              language === "ru"
                                ? `Проверить компанию ${v.company} в Company Intel`
                                : `Check ${v.company} in Company Intel`
                            }
                          >
                            <Building2 className="w-3 h-3 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                            <span>{language === "ru" ? "Проверить компанию" : "Check Company"}</span>
                          </Link>
                        )}

                        {/* Card quick save & hide buttons */}
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSave(v.id);
                            }}
                            className={`p-1 rounded hover:bg-zinc-800 transition-all active:scale-90 ${
                              v.status === "saved"
                                ? "text-violet-400"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            title={
                              language === "ru"
                                ? v.status === "saved"
                                  ? "Убрать из сохраненных"
                                  : "Сохранить"
                                : v.status === "saved"
                                ? "Remove from saved"
                                : "Save"
                            }
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                v.status === "saved" ? "fill-violet-400" : ""
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHide(v.id);
                            }}
                            className={`p-1 rounded hover:bg-zinc-800 transition-all active:scale-90 ${
                              v.status === "skipped" || v.status === "ignored" || v.status === "low_priority"
                                ? "text-amber-400 hover:text-emerald-400"
                                : "text-zinc-500 hover:text-rose-400"
                            }`}
                            title={
                              v.status === "skipped" || v.status === "ignored" || v.status === "low_priority"
                                ? (language === "ru" ? "Восстановить" : "Restore / Unhide")
                                : (language === "ru" ? "Скрыть" : "Hide")
                            }
                          >
                            {v.status === "skipped" || v.status === "ignored" || v.status === "low_priority" ? (
                              <Eye className="w-3.5 h-3.5" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-0.5 ml-1">
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right Column: Detail Pane (Instant Inspector) ── */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm sticky top-4 max-h-[calc(100vh-230px)] overflow-y-auto space-y-6">
          {selectedVacancy ? (
            <>
              {/* Header Box */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-sm">
                      {(selectedVacancy.company || "CO")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          {selectedVacancy.company || "Unknown"}
                        </span>
                        {selectedVacancy.company && (
                          <Link
                            href={`/dashboard/company-intel?company=${encodeURIComponent(selectedVacancy.company)}`}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 transition-all active:scale-95 group/cintel shadow-sm"
                            title={
                              language === "ru"
                                ? `Проверить компанию ${selectedVacancy.company} в Company Intel`
                                : `Check ${selectedVacancy.company} in Company Intel`
                            }
                          >
                            <Building2 className="w-3.5 h-3.5 text-emerald-400 group-hover/cintel:scale-110 transition-transform" />
                            <span>{language === "ru" ? "Искать в Company Intel" : "Search Company Intel"}</span>
                          </Link>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-zinc-100 mt-1 leading-snug">
                        {selectedVacancy.title}
                      </h2>
                    </div>
                  </div>

                  {/* Quick actions top right (0ms Optimistic UI) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSave(selectedVacancy.id)}
                      className={`p-2 rounded-lg border transition-all active:scale-90 ${
                        selectedVacancy.status === "saved"
                          ? "bg-violet-600/20 text-violet-300 border-violet-500/40 ring-1 ring-violet-500/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-zinc-700/60"
                      }`}
                      title={
                        language === "ru"
                          ? selectedVacancy.status === "saved"
                            ? "Убрать из сохраненных"
                            : "Сохранить вакансию"
                          : selectedVacancy.status === "saved"
                          ? "Remove from saved"
                          : "Save vacancy"
                      }
                    >
                      <Bookmark
                        className={`w-4 h-4 transition-transform ${
                          selectedVacancy.status === "saved"
                            ? "fill-violet-400 text-violet-400 scale-110"
                            : ""
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleHide(selectedVacancy.id)}
                      className={`p-2 rounded-lg border transition-all active:scale-90 ${
                        selectedVacancy.status === "skipped" || selectedVacancy.status === "ignored" || selectedVacancy.status === "low_priority"
                          ? "bg-amber-500/10 hover:bg-emerald-500/10 text-amber-400 hover:text-emerald-400 border-amber-500/30 hover:border-emerald-500/30"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700/60"
                      }`}
                      title={
                        selectedVacancy.status === "skipped" || selectedVacancy.status === "ignored" || selectedVacancy.status === "low_priority"
                          ? (language === "ru" ? "Восстановить вакансию" : "Restore / Unhide Vacancy")
                          : (language === "ru" ? "Скрыть вакансию" : "Hide / Cull Vacancy")
                      }
                    >
                      {selectedVacancy.status === "skipped" || selectedVacancy.status === "ignored" || selectedVacancy.status === "low_priority" ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    {selectedVacancy.area || (language === "ru" ? "Удаленно / СНГ" : "Remote / CIS")}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {formatSalary(selectedVacancy.salary, language)}
                  </span>
                  {selectedVacancy.createdAt && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        {formatVacancyDate(selectedVacancy.createdAt, language)}
                      </span>
                    </>
                  )}
                </div>

                {/* Primary Action Buttons Bar */}
                <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-zinc-800">
                  <button
                    onClick={generateLivePitch}
                    disabled={generatingPitch}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
                  >
                    {generatingPitch ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {t("vacancies.generatePitch")}
                  </button>

                  <a
                    href={selectedVacancy.url || `https://hh.ru/vacancy/${selectedVacancy.hhId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleStatusChange("applied_manual", selectedVacancy.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t("vacancies.applyHh")}
                  </a>

                  {selectedVacancy.company && (
                    <Link
                      href={`/dashboard/company-intel?company=${encodeURIComponent(selectedVacancy.company)}`}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-emerald-950/60 border border-zinc-700 hover:border-emerald-500/50 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all shadow-sm active:scale-95"
                      title={
                        language === "ru"
                          ? `Искать компанию ${selectedVacancy.company} в Company Intel`
                          : `Search ${selectedVacancy.company} in Company Intel`
                      }
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === "ru" ? "Искать в Company Intel" : "Search Company Intel"}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => openRecruiterModal(selectedVacancy)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 transition-all active:scale-95 ml-auto"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    {t("vacancies.findRecruiter")}
                  </button>
                </div>
              </div>

              {/* Navigation Tabs inside Detail */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                {[
                  { id: "analysis", label: t("vacancies.tabDeepMatch") },
                  { id: "description", label: t("vacancies.tabDescription") },
                  { id: "tailoring", label: t("vacancies.tabPitch") },
                ].map((tabItem) => (
                  <button
                    key={tabItem.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onClick={() => setActiveDetailTab(tabItem.id as any)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      activeDetailTab === tabItem.id
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: AI Match Analysis */}
              {activeDetailTab === "analysis" && (
                <div className="space-y-5">
                  {/* If not analyzed or score is 0 */}
                  {!isAnalyzed ? (
                    <div className="p-5 rounded-xl bg-zinc-950/40 border border-zinc-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100">
                            {language === "ru" ? "Ожидает анализа ИИ" : "Vacancy Analysis Pending"}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            {language === "ru"
                              ? "Эта вакансия еще не проанализирована по вашему резюме и целевым навыкам."
                              : "This vacancy has not been analyzed against your active resume and target skills yet."}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRunAnalysis(selectedVacancy.id)}
                          disabled={analyzingId === selectedVacancy.id}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white shadow-sm transition-all shrink-0"
                        >
                          {analyzingId === selectedVacancy.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {language === "ru" ? "Запустить анализ ИИ" : "Run AI Analysis"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Score Box */}
                      <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex flex-col items-center justify-center shrink-0">
                            <span className="text-xl font-black text-emerald-400 leading-none">
                              {selectedVacancy.analysis?.matchScore ?? 0}
                            </span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">/100</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-100">
                              {selectedVacancy.analysis?.recommendation
                                ? (selectedVacancy.analysis.recommendation === "apply"
                                    ? (language === "ru" ? "ВЫСОКАЯ СОВМЕСТИМОСТЬ" : "HIGH COMPATIBILITY")
                                    : selectedVacancy.analysis.recommendation === "maybe"
                                    ? (language === "ru" ? "СРЕДНЯЯ СОВМЕСТИМОСТЬ" : "MODERATE COMPATIBILITY")
                                    : (language === "ru" ? "НИЗКАЯ СОВМЕСТИМОСТЬ" : "LOW COMPATIBILITY"))
                                : (language === "ru" ? "Анализ профиля завершен" : "Profile Analysis Completed")}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {selectedVacancy.analysis?.summary ||
                                (language === "ru"
                                  ? "Технический профиль соискателя соответствует требованиям вакансии."
                                  : "Candidate technical profile aligns with vacancy requirements.")}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRunAnalysis(selectedVacancy.id)}
                          disabled={analyzingId === selectedVacancy.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 border border-zinc-700 transition-colors shrink-0"
                          title={language === "ru" ? "Пересчитать" : "Re-run analysis"}
                        >
                          {analyzingId === selectedVacancy.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3 text-zinc-400" />
                          )}
                          {t("vacancies.reAnalyze")}
                        </button>
                      </div>

                      {/* Skill Matrix Verification */}
                      <div>
                        <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                          {t("vacancies.skillMatrixTitle")}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Verified Matches */}
                          <div className="p-3.5 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-2">
                            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {t("vacancies.verifiedMatch")}
                            </span>
                            <div className="space-y-1.5">
                              {selectedVacancy.analysis?.matchReasons &&
                              selectedVacancy.analysis.matchReasons.length > 0 ? (
                                selectedVacancy.analysis.matchReasons.map((m, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{m}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-zinc-500">
                                  {language === "ru" ? "Нет подтвержденных совпадений" : "No strong matches verified"}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Gaps & Deviations */}
                          <div className="p-3.5 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-2">
                            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t("vacancies.gapsTitle")}
                            </span>
                            <div className="space-y-1.5">
                              {selectedVacancy.analysis?.missingRequirements &&
                              selectedVacancy.analysis.missingRequirements.length > 0 ? (
                                selectedVacancy.analysis.missingRequirements.map((g, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                                    <span className="text-amber-400 font-bold shrink-0">!</span>
                                    <span>{g}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-zinc-500">{t("vacancies.noGaps")}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Risk Flags if any */}
                      {selectedVacancy.analysis?.redFlags && selectedVacancy.analysis.redFlags.length > 0 && (
                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {language === "ru"
                              ? `Обнаружены потенциальные риски (${selectedVacancy.analysis.redFlags.length})`
                              : `Potential Risk Flags Identified (${selectedVacancy.analysis.redFlags.length})`}
                          </span>
                          <div className="space-y-1.5">
                            {selectedVacancy.analysis.redFlags.map((rf, idx) => (
                              <div key={idx} className="text-xs text-zinc-300 space-y-0.5">
                                <p className="font-semibold text-rose-300">{rf.trigger_text}</p>
                                <p className="text-zinc-400">{rf.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Full Job Description with Translation */}
              {activeDetailTab === "description" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      {language === "ru"
                        ? (showTranslated ? "Переведенный текст" : "Оригинальный текст вакансии")
                        : (showTranslated ? "Translated English Text" : "Original Vacancy Text")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const text = (showTranslated && translations[selectedVacancy.id])
                            ? translations[selectedVacancy.id]
                            : selectedVacancy.description || selectedVacancy.title;
                          if (text) copyDescriptionText(text);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
                        title={language === "ru" ? "Копировать текст" : "Copy job description text to clipboard"}
                      >
                        {copiedDesc ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{language === "ru" ? "Скопировано" : "Copied"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{language === "ru" ? "Копировать" : "Copy Text"}</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleTranslate}
                        disabled={translating}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
                      >
                        {translating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Languages className="w-3.5 h-3.5 text-sky-400" />
                        )}
                        {language === "ru"
                          ? (showTranslated ? "Показать оригинал" : "Перевести")
                          : (showTranslated ? "Show Original" : "Translate to English")}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto">
                    {showTranslated && translations[selectedVacancy.id]
                      ? translations[selectedVacancy.id]
                      : selectedVacancy.description ||
                        (language === "ru"
                          ? "Полный текст вакансии доступен по ссылке на портале HeadHunter выше."
                          : "Full description available directly on HeadHunter portal via external link above.")}
                  </div>
                </div>
              )}

              {/* Tab 3: Outreach & Pitch */}
              {activeDetailTab === "tailoring" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      {language === "ru" ? "Персонализированный питч и прямое обращение" : "Tailored Pitch & Direct Outreach"}
                    </span>
                    {(customPitch || selectedVacancy.analysis?.coverLetter) && (
                      <button
                        onClick={() =>
                          copyPitchText(customPitch || selectedVacancy.analysis?.coverLetter || "")
                        }
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                      >
                        {copiedPitch ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {language === "ru" ? "Скопировано" : "Copied"}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            {language === "ru" ? "Копировать" : "Copy Text"}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {generatingPitch ? (
                    <div className="p-8 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                      <span>
                        {language === "ru"
                          ? `Генерация питча для ${selectedVacancy.company}...`
                          : `Synthesizing tailored pitch for ${selectedVacancy.company}...`}
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {customPitch ||
                        selectedVacancy.analysis?.coverLetter ||
                        (language === "ru"
                          ? "Сопроводительное письмо еще не создано. Нажмите кнопку 'Сгенерировать AI-питч' выше."
                          : "No cover letter generated yet. Click 'Generate AI Pitch' button above to synthesize one instantly.")}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-zinc-500">
              {language === "ru"
                ? "Выберите вакансию из списка слева для просмотра деталей."
                : "Select a vacancy from the left list to inspect details."}
            </div>
          )}
        </div>
      </div>

      {/* Recruiter Dossier Modal */}
      <RecruiterDossierModal
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        data={dossierData}
        jobTitle={selectedVacancy?.title}
      />
    </div>
  );
}
