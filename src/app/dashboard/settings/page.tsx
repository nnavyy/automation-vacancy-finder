"use client";

// ============================================================
// Nanda AI Job Assistant — Settings Page
// Client component — loads settings on mount, saves via POST
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Save, 
  RefreshCw,
  Target,
  Search,
  Wrench,
  Calendar,
  Building2,
  Bell,
  DollarSign,
  Ban,
  Bot,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface FormState {
  id?:                   string;
  name:                  string;
  targetRoles:           string;
  searchKeywordsEn:      string;
  searchKeywordsRu:      string;
  requiredSkills:        string;
  niceToHaveSkills:      string;
  experience:            string[];
  workFormat:            string[];
  minimumScoreToNotify:  number;
  maxNotificationsPerDay: string;
  excludeKeywords:       string;
  redFlagKeywords:       string;
  salaryMinimum:         string;
  salaryCurrency:         string;
  aiProviderOrder:       string;
  coverLetterLanguage:   string;
  resumeText:            string;
  portfolioUrl:          string;
  hhToken:               string;
  hhResumeId:            string;
  hhResumeTitle:         string;
  hhProfileName:         string;
  hhProfileAvatar:       string;
  hhTotalApplications:   number;
  hhSessionStatus:       string;
  hhLastVerifiedAt:      string;
  hhExpiresAt:           string;
}

interface Msg {
  text: string;
  type: "success" | "error" | "warn";
}

// ── Constants ─────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  name:                   "Default",
  targetRoles:            "",
  searchKeywordsEn:       "",
  searchKeywordsRu:       "",
  requiredSkills:         "",
  niceToHaveSkills:       "",
  experience:             [],
  workFormat:             [],
  minimumScoreToNotify:   70,
  maxNotificationsPerDay: "20",
  excludeKeywords:        "",
  redFlagKeywords:        "",
  salaryMinimum:          "",
  salaryCurrency:         "RUR",
  aiProviderOrder:        "groq, gemini, openrouter",
  coverLetterLanguage:    "English",
  resumeText:             "",
  portfolioUrl:           "",
  hhToken:                "",
  hhResumeId:             "",
  hhResumeTitle:          "",
  hhProfileName:          "",
  hhProfileAvatar:        "",
  hhTotalApplications:    0,
  hhSessionStatus:        "unknown",
  hhLastVerifiedAt:       "",
  hhExpiresAt:            "",
};

const EXPERIENCE_OPTIONS = [
  { label: "No Experience",  value: "noExperience"   },
  { label: "1–3 Years",      value: "between1And3"   },
  { label: "3–6 Years",      value: "between3And6"   },
  { label: "6+ Years",       value: "moreThan6"       },
];

const WORK_FORMAT_OPTIONS = [
  { label: "Remote",  value: "remote"  },
  { label: "Hybrid",  value: "hybrid"  },
  { label: "Office",  value: "office"  },
];

// ── Helpers ───────────────────────────────────────────────────

function toComma(arr: any): string {
  if (Array.isArray(arr)) return arr.join(", ");
  if (typeof arr === "string") return arr;
  return "";
}

function fromComma(str: any): string[] {
  if (typeof str !== "string") return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

function formatExpDate(dateStr?: string | Date | null): string {
  if (!dateStr) return "Sesi Aktif (~30 hari)";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sesi Aktif (~30 hari)";
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const dateFormatted = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (diffDays <= 0) return `${dateFormatted} (Sudah Expired)`;
  return `${dateFormatted} (${diffDays} hari lagi)`;
}

function formatRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "Belum pernah";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Belum pernah";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// ── Sub-components ────────────────────────────────────────────

function FormCard({
  title,
  icon: Icon,
  children,
}: {
  title:    string;
  icon?:    React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-4 backdrop-blur-sm shadow-sm transition-colors hover:border-zinc-700/60">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        {Icon && <Icon size={16} className="text-zinc-400" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label:        string;
  hint?:        string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? hint}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
      />
      {hint && (
        <p className="text-xs text-zinc-500 mt-1">{hint}</p>
      )}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label:    string;
  hint?:    string;
  value:    number;
  min:      number;
  max:      number;
  onChange: (v: number) => void;
}) {
  const id = `num-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(parseInt(e.target.value, 10) || min)
        }
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
      />
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const [form,    setForm]    = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<Msg | null>(null);

  const [translatingJson, setTranslatingJson] = useState(false);
  const [translateJsonEn, setTranslateJsonEn] = useState(false);
  const [uploadedJsonName, setUploadedJsonName] = useState<string | null>(null);
  const [testingPortfolio, setTestingPortfolio] = useState(false);
  
  const [validatingHH, setValidatingHH] = useState(false);
  const [syncingHH, setSyncingHH] = useState(false);
  const [hhResumes, setHhResumes] = useState<any[]>([]);
  const [browserLoggingIn, setBrowserLoggingIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(false);
  const [showManualCookie, setShowManualCookie] = useState(false);

  // ── Load current settings ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;
            setForm({
              id:                     d.id,
              name:                   d.name                           ?? "Default",
              targetRoles:            toComma(d.targetRoles            ?? []),
              searchKeywordsEn:       toComma(d.searchKeywordsEn       ?? []),
              searchKeywordsRu:       toComma(d.searchKeywordsRu       ?? []),
              requiredSkills:         toComma(d.requiredSkills         ?? []),
              niceToHaveSkills:       toComma(d.niceToHaveSkills       ?? []),
              experience:             d.experience                     ?? [],
              workFormat:             d.workFormat                     ?? [],
              minimumScoreToNotify:   d.minimumScoreToNotify           ?? 70,
              maxNotificationsPerDay: String(d.maxNotificationsPerDay ?? 20),
              excludeKeywords:        toComma(d.excludeKeywords        ?? []),
              redFlagKeywords:        toComma(d.redFlagKeywords        ?? []),
              salaryMinimum:          d.salaryMinimum != null ? String(d.salaryMinimum) : "",
              salaryCurrency:         d.salaryCurrency                 ?? "RUR",
              aiProviderOrder:        toComma(d.aiProviderOrder        ?? []),
              coverLetterLanguage:    d.coverLetterLanguage            ?? "English",
              resumeText:             d.resumeText                     ?? "",
              portfolioUrl:           d.portfolioUrl                   ?? "",
              hhToken:                d.hhToken                        ?? "",
              hhResumeId:             d.hhResumeId                     ?? "",
              hhResumeTitle:          d.hhResumeTitle                  ?? "",
              hhProfileName:          d.hhProfileName                  ?? "",
              hhProfileAvatar:        d.hhProfileAvatar                ?? "",
              hhTotalApplications:    d.hhTotalApplications            ?? 0,
              hhSessionStatus:        d.hhSessionStatus                ?? "unknown",
              hhLastVerifiedAt:       d.hhLastVerifiedAt               ? String(d.hhLastVerifiedAt) : "",
              hhExpiresAt:            d.hhExpiresAt                    ? String(d.hhExpiresAt) : "",
            });
          }
        } else if (res.status === 404) {
          setMsg({
            text: "No saved settings found — defaults loaded. Save to create your profile.",
            type: "warn",
          });
        } else {
          setMsg({ text: "Failed to load settings from server.", type: "warn" });
        }
      } catch {
        setMsg({ text: "Network error loading settings.", type: "warn" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Toggle checkbox arrays ───────────────────────────────
  const toggle = (field: "experience" | "workFormat", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        id:                     form.id,
        name:                   form.name,
        targetRoles:            fromComma(form.targetRoles),
        searchKeywordsEn:       fromComma(form.searchKeywordsEn),
        searchKeywordsRu:       fromComma(form.searchKeywordsRu),
        requiredSkills:         fromComma(form.requiredSkills),
        niceToHaveSkills:       fromComma(form.niceToHaveSkills),
        experience:             form.experience,
        workFormat:             form.workFormat,
        minimumScoreToNotify:   form.minimumScoreToNotify,
        maxNotificationsPerDay: parseInt(form.maxNotificationsPerDay, 10) || 20,
        excludeKeywords:        fromComma(form.excludeKeywords),
        redFlagKeywords:        fromComma(form.redFlagKeywords),
        salaryMinimum:
          form.salaryMinimum.trim() !== ""
            ? parseInt(form.salaryMinimum, 10) || null
            : null,
        salaryCurrency:         form.salaryCurrency,
        // aiProviderOrder is read-only, not sending it
        coverLetterLanguage:    form.coverLetterLanguage,
        resumeText:             form.resumeText,
        portfolioUrl:           form.portfolioUrl,
        hhToken:                form.hhToken,
        hhResumeId:             form.hhResumeId,
        hhResumeTitle:          form.hhResumeTitle,
        hhProfileName:          form.hhProfileName,
        hhProfileAvatar:        form.hhProfileAvatar,
        hhTotalApplications:    form.hhTotalApplications,
        hhSessionStatus:        form.hhSessionStatus,
        hhLastVerifiedAt:       form.hhLastVerifiedAt ? new Date(form.hhLastVerifiedAt) : null,
        hhExpiresAt:            form.hhExpiresAt ? new Date(form.hhExpiresAt) : null,
      };

      const res  = await fetch("/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMsg({ text: "Settings saved successfully!", type: "success" });
      } else {
        setMsg({
          text:  `${json.error ?? "Failed to save settings."}`,
          type:  "error",
        });
      }
    } catch {
      setMsg({ text: "Network error — please try again.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 6000);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Configure your job search preferences</p>
        </div>
        <div className="flex items-center gap-3 p-10 text-gray-500 text-sm">
          <RefreshCw size={16} className="animate-spin text-green-400" />
          Loading preferences…
        </div>
      </div>
    );
  }

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.endsWith(".json")) {
      setMsg({ text: "Invalid file type. Please upload a .json file.", type: "error" });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let content = ev.target?.result as string;

        // Optional: translate Russian JSON to English first
        if (translateJsonEn) {
          setTranslatingJson(true);
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: content, mode: "json" }),
            });
            const jsonRes = await res.json();
            if (jsonRes.success && jsonRes.text) {
              content = jsonRes.text;
            }
          } catch {
            // Translation failed, continue with original
          }
        }

        // ── Parse JSON safely ───────────────────────────────
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(content);
        } catch {
          setMsg({
            text: "Invalid JSON file. The file could not be parsed. Please check it is valid JSON.",
            type: "error",
          });
          e.target.value = "";
          setTranslatingJson(false);
          return;
        }

        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          setMsg({
            text: "Invalid format. The JSON file must be an object ({}), not an array or primitive.",
            type: "error",
          });
          e.target.value = "";
          setTranslatingJson(false);
          return;
        }

        // ── Smart field extraction (supports both formats) ──
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = data as any;

        const safeJoin = (v: unknown): string => {
          if (Array.isArray(v)) return v.filter(s => typeof s === "string").join(", ");
          if (typeof v === "string") return v;
          return "";
        };

        // Profile name
        const profileName =
          typeof d.profileName === "string" ? d.profileName :
          typeof d.name === "string" ? d.name : null;

        // Resume / bio text
        const resumeText =
          typeof d.coverLetterContext?.resumeBackgroundText === "string" ? d.coverLetterContext.resumeBackgroundText :
          typeof d.bio === "string" ? d.bio :
          typeof d.resumeText === "string" ? d.resumeText :
          typeof d.resume === "string" ? d.resume : null;

        // Portfolio URL
        const portfolioUrl =
          typeof d.portfolioUrl === "string" ? d.portfolioUrl :
          typeof d.portfolio_url === "string" ? d.portfolio_url :
          typeof d.coverLetterContext?.portfolioWebsiteUrl === "string" ? d.coverLetterContext.portfolioWebsiteUrl : null;

        // Target roles — from matchingRules.highPriorityMatch or targetRolesSummary or target_roles array
        let targetRoles: string = "";
        if (Array.isArray(d.targetRoles)) targetRoles = safeJoin(d.targetRoles);
        else if (Array.isArray(d.target_roles)) targetRoles = safeJoin(d.target_roles);
        else if (Array.isArray(d.matchingRules?.highPriorityMatch)) targetRoles = safeJoin(d.matchingRules.highPriorityMatch);
        else if (typeof d.targetRolesSummary === "string") targetRoles = d.targetRolesSummary;

        // Search keywords EN
        let keywordsEn: string = "";
        if (Array.isArray(d.searchKeywordsEn)) keywordsEn = safeJoin(d.searchKeywordsEn);
        else if (Array.isArray(d.searchKeywords?.english)) keywordsEn = safeJoin(d.searchKeywords.english);
        else if (Array.isArray(d.keywords_en)) keywordsEn = safeJoin(d.keywords_en);

        // Search keywords RU
        let keywordsRu: string = "";
        if (Array.isArray(d.searchKeywordsRu)) keywordsRu = safeJoin(d.searchKeywordsRu);
        else if (Array.isArray(d.searchKeywords?.russian)) keywordsRu = safeJoin(d.searchKeywords.russian);
        else if (Array.isArray(d.keywords_ru)) keywordsRu = safeJoin(d.keywords_ru);

        // Required skills
        let requiredSkills: string = "";
        if (Array.isArray(d.requiredSkills)) requiredSkills = safeJoin(d.requiredSkills);
        else if (Array.isArray(d.skills?.required)) requiredSkills = safeJoin(d.skills.required);
        else if (Array.isArray(d.skills) && typeof d.skills[0] === "string") requiredSkills = safeJoin(d.skills);

        // Nice-to-have skills
        let niceToHave: string = "";
        if (Array.isArray(d.niceToHaveSkills)) niceToHave = safeJoin(d.niceToHaveSkills);
        else if (Array.isArray(d.skills?.niceToHave)) niceToHave = safeJoin(d.skills.niceToHave);
        else if (Array.isArray(d.nice_to_have)) niceToHave = safeJoin(d.nice_to_have);

        // Exclude keywords
        let excludeKw: string = "";
        if (Array.isArray(d.excludeKeywords)) excludeKw = safeJoin(d.excludeKeywords);
        else if (d.exclusionFilters) {
          const enKw = Array.isArray(d.exclusionFilters.excludeKeywordsEnglish) ? d.exclusionFilters.excludeKeywordsEnglish : [];
          const ruKw = Array.isArray(d.exclusionFilters.excludeKeywordsRussian) ? d.exclusionFilters.excludeKeywordsRussian : [];
          excludeKw = safeJoin([...enKw, ...ruKw]);
        }

        // Red flag keywords
        let redFlagKw: string = "";
        if (Array.isArray(d.redFlagKeywords)) redFlagKw = safeJoin(d.redFlagKeywords);
        else if (d.redFlagKeywords && typeof d.redFlagKeywords === "object") {
          const enKw = Array.isArray(d.redFlagKeywords.english) ? d.redFlagKeywords.english : [];
          const ruKw = Array.isArray(d.redFlagKeywords.russian) ? d.redFlagKeywords.russian : [];
          redFlagKw = safeJoin([...enKw, ...ruKw]);
        }

        // Salary
        const salaryMin = d.salary?.minimumSalary ?? d.salaryMinimum ?? null;
        const salaryCurrency = typeof d.salary?.currency === "string" ? d.salary.currency :
          typeof d.salaryCurrency === "string" ? d.salaryCurrency : null;

        // Cover letter language
        const clLang =
          typeof d.coverLetterContext?.language === "string" ? d.coverLetterContext.language :
          typeof d.preferredLanguage === "string" ? d.preferredLanguage :
          typeof d.coverLetterLanguage === "string" ? d.coverLetterLanguage : null;

        // Work format
        const workFmtMap: Record<string, string> = {
          remote: "remote", hybrid: "hybrid", office: "office",
        };
        let workFormat: string[] = [];
        if (Array.isArray(d.workFormat)) {
          workFormat = d.workFormat.filter((v: string) => workFmtMap[v]);
        } else if (d.workFormat && typeof d.workFormat === "object") {
          if (d.workFormat.remote) workFormat.push("remote");
          if (d.workFormat.hybrid) workFormat.push("hybrid");
          if (d.workFormat.office) workFormat.push("office");
        }

        // Experience
        let experience: string[] = [];
        if (Array.isArray(d.experience)) {
          experience = d.experience;
        } else if (d.experienceLevel && typeof d.experienceLevel === "object") {
          if (d.experienceLevel.noExperience) experience.push("noExperience");
          if (d.experienceLevel.oneToThreeYears) experience.push("between1And3");
          if (d.experienceLevel.threeToSixYears) experience.push("between3And6");
          if (d.experienceLevel.sixPlusYears) experience.push("moreThan6");
        }

        // Notification settings
        const minScore = typeof d.notifications?.minimumScoreToNotify === "number"
          ? d.notifications.minimumScoreToNotify
          : typeof d.minimumScoreToNotify === "number" ? d.minimumScoreToNotify : null;
        const maxNotif = typeof d.notifications?.maxNotificationsPerDay === "number"
          ? d.notifications.maxNotificationsPerDay
          : typeof d.maxNotificationsPerDay === "number" ? d.maxNotificationsPerDay : null;

        // ── Track what was successfully imported ─────────────
        const imported: string[] = [];
        const skipped: string[] = [];

        // Apply all extracted values to form
        setForm((prev) => {
          const next = { ...prev };

          if (profileName) { next.name = profileName; imported.push("Profile Name"); }
          else skipped.push("Profile Name");

          if (resumeText) { next.resumeText = resumeText; imported.push("Resume/Bio Text"); }
          else skipped.push("Resume Text");

          if (portfolioUrl) { next.portfolioUrl = portfolioUrl; imported.push("Portfolio URL"); }
          else skipped.push("Portfolio URL");

          if (targetRoles) { next.targetRoles = targetRoles; imported.push("Target Roles"); }
          else skipped.push("Target Roles");

          if (keywordsEn) { next.searchKeywordsEn = keywordsEn; imported.push("English Keywords"); }
          else skipped.push("English Keywords");

          if (keywordsRu) { next.searchKeywordsRu = keywordsRu; imported.push("Russian Keywords"); }
          else skipped.push("Russian Keywords");

          if (requiredSkills) { next.requiredSkills = requiredSkills; imported.push("Required Skills"); }
          else skipped.push("Required Skills");

          if (niceToHave) { next.niceToHaveSkills = niceToHave; imported.push("Nice-to-Have Skills"); }
          else skipped.push("Nice-to-Have Skills");

          if (excludeKw) { next.excludeKeywords = excludeKw; imported.push("Exclude Keywords"); }
          if (redFlagKw) { next.redFlagKeywords = redFlagKw; imported.push("Red Flag Keywords"); }

          if (workFormat.length > 0) { next.workFormat = workFormat; imported.push("Work Format"); }
          if (experience.length > 0) { next.experience = experience; imported.push("Experience Level"); }

          if (salaryMin !== null && !isNaN(Number(salaryMin))) {
            next.salaryMinimum = String(salaryMin);
            imported.push("Minimum Salary");
          }
          if (salaryCurrency) next.salaryCurrency = salaryCurrency;
          if (clLang) { next.coverLetterLanguage = clLang; imported.push("Cover Letter Language"); }
          if (minScore !== null) next.minimumScoreToNotify = minScore;
          if (maxNotif !== null) next.maxNotificationsPerDay = String(maxNotif);

          return next;
        });

        setUploadedJsonName(file.name);

        const importedStr = imported.length > 0 ? imported.join(", ") : "none";
        const skippedStr = skipped.filter(s => ["Profile Name", "Resume Text", "Required Skills", "Target Roles"].includes(s));

        if (imported.length === 0) {
          setMsg({
            text: `JSON parsed but no recognizable fields found. Supported fields: profileName, skills, searchKeywords, portfolioUrl, etc.`,
            type: "warn",
          });
        } else if (skippedStr.length > 0) {
          setMsg({
            text: `Imported: ${importedStr}. Not found in JSON: ${skippedStr.join(", ")}. Click Save to apply.`,
            type: "warn",
          });
        } else {
          setMsg({
            text: `Successfully imported ${imported.length} fields from ${file.name}. Click Save to apply.`,
            type: "success",
          });
        }
      } catch (err) {
        console.error("[JSON Upload] Unexpected error:", err);
        setMsg({
          text: `Unexpected error while processing the file: ${err instanceof Error ? err.message : "Unknown error"}`,
          type: "error",
        });
      } finally {
        setTranslatingJson(false);
        e.target.value = ""; // reset file input
      }
    };
    reader.readAsText(file);
  };
  const handleValidateHH = async () => {
    if (!form.hhToken) {
      setMsg({ text: "Please enter your HH.ru Session Token (hhtoken) first.", type: "warn" });
      return;
    }
    setValidatingHH(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/validate-hh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.hhToken })
      });
      const json = await res.json();
      if (json.success && json.resumes) {
        setHhResumes(json.resumes);
        setMsg({ text: `Successfully loaded ${json.resumes.length} resumes! Please select one below.`, type: "success" });
        
        // Auto-select the first resume if none is set
        if (!form.hhResumeId && json.resumes.length > 0) {
          setForm(prev => ({ 
            ...prev, 
            hhResumeId: json.resumes[0].id,
            hhResumeTitle: json.resumes[0].title
          }));
        }
        
        if (json.profile) {
          setForm(prev => ({
            ...prev,
            hhSessionStatus: "active",
            hhLastVerifiedAt: new Date().toISOString(),
            hhProfileName: json.profile.name || "",
            hhProfileAvatar: json.profile.avatar || "",
            hhTotalApplications: json.profile.totalApplications || 0,
          }));
        } else {
          setForm(prev => ({
            ...prev,
            hhSessionStatus: "active",
            hhLastVerifiedAt: new Date().toISOString(),
          }));
        }
      } else {
        setForm(prev => ({ ...prev, hhSessionStatus: "expired" }));
        setMsg({ text: json.error ?? "Failed to validate token.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach the validation API.", type: "error" });
    } finally {
      setValidatingHH(false);
    }
  };

  const handleBrowserLogin = async () => {
    setBrowserLoggingIn(true);
    setMsg({
      text: "Membuka jendela browser Chrome/Edge... Silakan login ke akun HeadHunter kamu di jendela yang muncul.",
      type: "warn",
    });
    try {
      const res = await fetch("/api/settings/hh-browser-login", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({
          ...prev,
          hhToken: data.cookieString,
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date().toISOString(),
          hhExpiresAt: data.expiresAt ? String(data.expiresAt) : "",
          hhProfileName: data.profile.name || prev.hhProfileName,
          hhProfileAvatar: data.profile.avatar || prev.hhProfileAvatar,
          hhTotalApplications: data.profile.totalApplications || prev.hhTotalApplications,
          ...(data.resumes.length > 0 && !prev.hhResumeId ? {
            hhResumeId: data.resumes[0].id,
            hhResumeTitle: data.resumes[0].title,
          } : {}),
        }));
        if (data.resumes) setHhResumes(data.resumes);
        setMsg({
          text: `Berhasil terhubung ke akun HeadHunter: ${data.profile.name || "Akun Kamu"}! Sesi aktif dan tersimpan.`,
          type: "success",
        });
      } else {
        setMsg({
          text: data.error || "Gagal melakukan login via browser.",
          type: "error",
        });
      }
    } catch {
      setMsg({
        text: "Koneksi ke browser login gagal atau jendela browser ditutup sebelum login selesai.",
        type: "error",
      });
    } finally {
      setBrowserLoggingIn(false);
    }
  };

  const handleCheckSession = async () => {
    setCheckingSession(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/check-hh-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        if (data.status === "active") {
          setForm((prev) => ({
            ...prev,
            hhSessionStatus: "active",
            hhLastVerifiedAt: data.lastVerifiedAt ? String(data.lastVerifiedAt) : new Date().toISOString(),
            ...(data.profile?.name ? {
              hhProfileName: data.profile.name,
              hhProfileAvatar: data.profile.avatar,
              hhTotalApplications: data.profile.totalApplications,
            } : {}),
          }));
          if (data.resumes) setHhResumes(data.resumes);
          setMsg({
            text: "Status sesi HeadHunter AKTIF dan terverifikasi!",
            type: "success",
          });
        } else if (data.status === "expired") {
          setForm((prev) => ({
            ...prev,
            hhSessionStatus: "expired",
            hhLastVerifiedAt: data.lastVerifiedAt ? String(data.lastVerifiedAt) : new Date().toISOString(),
          }));
          setMsg({
            text: "Sesi HeadHunter kamu EXPIRED / logout! Silakan klik 'Login Otomatis via Browser'.",
            type: "error",
          });
        } else {
          setMsg({
            text: data.message || "Belum ada token/cookie yang dikonfigurasi.",
            type: "warn",
          });
        }
      } else {
        setMsg({ text: data.error || "Gagal memeriksa sesi.", type: "error" });
      }
    } catch {
      setMsg({ text: "Gagal menghubungi server untuk cek status sesi.", type: "error" });
    } finally {
      setCheckingSession(false);
    }
  };

  const handleSyncHistory = async () => {
    if (!form.hhToken) return;
    setSyncingHH(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/sync-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.hhToken })
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: json.message, type: "success" });
      } else {
        setMsg({ text: json.error ?? "Failed to sync history.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach the sync API.", type: "error" });
    } finally {
      setSyncingHH(false);
    }
  };

  const handleTestPortfolio = async () => {
    if (!form.portfolioUrl) {
      setMsg({ text: "Please enter a Portfolio URL first.", type: "warn" });
      return;
    }
    setTestingPortfolio(true);
    setMsg(null);
    try {
      const res = await fetch("/api/dashboard/test-crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.portfolioUrl })
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: json.message, type: "success" });
      } else {
        setMsg({ text: json.error ?? "Test failed.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach the test API.", type: "error" });
    } finally {
      setTestingPortfolio(false);
    }
  };

  // ── Main form ────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 pb-10">
      
      {/* ── Main Settings Column ── */}
      <div className="flex-1 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Settings</h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              Configure your job search preferences and profile matching
            </p>
          </div>
          <SaveButton saving={saving} onClick={handleSave} />
        </div>

        {/* ── Feedback message ── */}
        {msg && (
          <div
            className={`p-4 rounded-xl text-sm border backdrop-blur-sm transition-all ${
              msg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : msg.type === "warn"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* ── JSON Import ── */}
        <FormCard title="Import Profile via JSON" icon={FileText}>
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-400">
              Upload a JSON file to auto-fill your Name, Bio, Skills, Target Roles, and Portfolio URL.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <label
                htmlFor="json-file-input"
                className="flex items-center gap-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {translatingJson ? <RefreshCw size={14} className="animate-spin text-zinc-400" /> : <FileText size={14} className="text-zinc-400" />}
                {translatingJson ? "Processing..." : "Upload JSON"}
                <input
                  id="json-file-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleJsonUpload}
                  disabled={translatingJson}
                />
              </label>
              {uploadedJsonName && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  <Check size={12} /> {uploadedJsonName}
                </span>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <input
                  id="translate-json-toggle"
                  type="checkbox"
                  checked={translateJsonEn}
                  onChange={(e) => setTranslateJsonEn(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="translate-json-toggle" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Translate Russian to English
                </label>
              </div>
            </div>
          </div>
        </FormCard>

        {/* ── Profile Name ── */}
        <FormCard title="Profile Information" icon={Target}>
          <TextField
            label="Profile Name"
            value={form.name}
            onChange={(v) => setForm((p) => ({ ...p, name: v }))}
            hint="Name of this profile (e.g. Default, Web Developer, Backend Lead)"
          />
        </FormCard>

        {/* ── HH.ru Account Integration & Session Health ── */}
        <FormCard title="HH.ru Account & Session Sync" icon={Bot}>
          <div className="space-y-5">
            {/* Live Session Status Banner */}
            <div className={`p-4 rounded-xl border transition-all ${
              form.hhSessionStatus === "active"
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : form.hhSessionStatus === "expired"
                ? "bg-red-950/20 border-red-500/30 text-red-300"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-400"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    form.hhSessionStatus === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : form.hhSessionStatus === "expired"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {form.hhSessionStatus === "active" ? (
                      <CheckCircle2 size={20} />
                    ) : form.hhSessionStatus === "expired" ? (
                      <AlertTriangle size={20} />
                    ) : (
                      <Globe size={20} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100">
                        {form.hhSessionStatus === "active"
                          ? "Sesi HeadHunter: Aktif & Terhubung"
                          : form.hhSessionStatus === "expired"
                          ? "Sesi HeadHunter: Kadaluarsa / Logout"
                          : "Status Sesi: Belum Terhubung"}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                        form.hhSessionStatus === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : form.hhSessionStatus === "expired"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}>
                        {form.hhSessionStatus === "active" ? "Connected" : form.hhSessionStatus === "expired" ? "Expired" : "Idle"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {form.hhSessionStatus === "active"
                        ? `Akun: ${form.hhProfileName || "Terhubung"} • Kadaluarsa: ${formatExpDate(form.hhExpiresAt)}`
                        : form.hhSessionStatus === "expired"
                        ? "Sesi ditolak oleh HH.ru (403 / Logout). Otomasi dijeda sampai kamu login kembali."
                        : "Hubungkan akun HeadHunter untuk sinkronisasi riwayat lamaran dan 1-click apply."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleCheckSession}
                    disabled={checkingSession || !form.hhToken}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors border border-zinc-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cek apakah sesi cookie di HH.ru masih aktif atau sudah expired"
                  >
                    <RefreshCw size={12} className={checkingSession ? "animate-spin text-emerald-400" : "text-zinc-400"} />
                    {checkingSession ? "Memeriksa..." : "Cek Status Sesi"}
                  </button>
                </div>
              </div>

              {form.hhLastVerifiedAt && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Terakhir diverifikasi: {formatRelativeTime(form.hhLastVerifiedAt)}
                  </span>
                  <span>
                    Masa aktif: {formatExpDate(form.hhExpiresAt)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action: Browser Auto-Login */}
            <div className="bg-gradient-to-r from-emerald-950/30 to-teal-950/20 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Globe size={16} className="text-emerald-400" />
                    Login Otomatis via Browser (Chrome / Edge)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                    Klik tombol di samping untuk membuka browser resmi di komputermu. Kamu cukup login seperti biasa di jendela tersebut, dan sistem akan <strong>otomatis menangkap cookie &amp; tanggal kadaluarsa</strong> tanpa perlu buka DevTools.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBrowserLogin}
                  disabled={browserLoggingIn}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all shadow-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {browserLoggingIn ? <RefreshCw size={15} className="animate-spin" /> : <Globe size={15} />}
                  {browserLoggingIn ? "Menunggu Login..." : "Buka Browser Login"}
                </button>
              </div>

              {browserLoggingIn && (
                <div className="mt-3 p-3 rounded-lg bg-zinc-900/90 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
                  <RefreshCw size={14} className="animate-spin text-emerald-400 shrink-0" />
                  <span>Jendela browser sedang dibuka. Silakan lakukan login ke akun HeadHunter kamu di jendela browser tersebut...</span>
                </div>
              )}
            </div>

            {/* Resume Selection */}
            {hhResumes.length > 0 && (
              <div>
                <label htmlFor="hh-resume-select" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Pilih Resume untuk Auto-Apply
                </label>
                <select
                  id="hh-resume-select"
                  value={form.hhResumeId}
                  onChange={(e) => {
                    const r = hhResumes.find(x => x.id === e.target.value);
                    setForm(p => ({ ...p, hhResumeId: r?.id || "", hhResumeTitle: r?.title || "" }));
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
                >
                  <option value="" disabled>Pilih salah satu resume...</option>
                  {hhResumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.status?.name || "Active"})</option>
                  ))}
                </select>
              </div>
            )}
            {form.hhResumeTitle && hhResumes.length === 0 && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center gap-1.5">
                <Check size={13} /> Terhubung ke Resume: <strong>{form.hhResumeTitle}</strong>
              </p>
            )}

            {/* Collapsible Manual Cookie Option */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setShowManualCookie(!showManualCookie)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {showManualCookie ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>Opsi Lanjutan: Input String Cookie Manual</span>
              </button>

              {showManualCookie && (
                <div className="mt-3 space-y-3 pt-2">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <TextField
                        label="Full Cookie String"
                        value={form.hhToken}
                        onChange={(v) => setForm((p) => ({ ...p, hhToken: v }))}
                        placeholder="hhtoken=...; hhuid=...; _xsrf=..."
                        hint="Atau copy header Cookie dari browser DevTools (Network tab)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidateHH}
                      disabled={validatingHH || !form.hhToken}
                      className="flex items-center gap-2 px-4 py-2 mb-[22px] rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700"
                    >
                      {validatingHH ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      {validatingHH ? "Loading..." : "Load Resumes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FormCard>

        {/* ── Target Roles ── */}
        <FormCard title="Target Roles" icon={Target}>
          <TextField
            label="Job Titles"
            value={form.targetRoles}
            onChange={(v) => setForm((p) => ({ ...p, targetRoles: v }))}
            hint="Comma-separated. e.g. Frontend Developer, React Developer, Fullstack Engineer"
          />
        </FormCard>

        {/* ── Search Keywords ── */}
        <FormCard title="Search Keywords" icon={Search}>
          <TextField
            label="English Keywords"
            value={form.searchKeywordsEn}
            onChange={(v) => setForm((p) => ({ ...p, searchKeywordsEn: v }))}
            hint="Used when searching HH.ru in English"
          />
          <TextField
            label="Russian Keywords"
            value={form.searchKeywordsRu}
            onChange={(v) => setForm((p) => ({ ...p, searchKeywordsRu: v }))}
            hint="Used when searching HH.ru in Russian (Кириллица)"
          />
        </FormCard>

        {/* ── Skills ── */}
        <FormCard title="Skills" icon={Wrench}>
          <TextField
            label="Required Skills"
            value={form.requiredSkills}
            onChange={(v) => setForm((p) => ({ ...p, requiredSkills: v }))}
            hint="Must-have skills. e.g. React, TypeScript, Next.js, Node.js"
          />
          <TextField
            label="Nice-to-Have Skills"
            value={form.niceToHaveSkills}
            onChange={(v) => setForm((p) => ({ ...p, niceToHaveSkills: v }))}
            hint="Bonus skills that increase the match score"
          />
        </FormCard>

        {/* ── Experience + Work Format (2-col) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormCard title="Experience Level" icon={Calendar}>
            <div className="space-y-2.5">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const expId = `exp-option-${opt.value}`;
                return (
                  <div
                    key={opt.value}
                    className="flex items-center gap-3 group"
                  >
                    <input
                      id={expId}
                      type="checkbox"
                      checked={form.experience.includes(opt.value)}
                      onChange={() => toggle("experience", opt.value)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor={expId}
                      className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors cursor-pointer select-none"
                    >
                      {opt.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </FormCard>

          <FormCard title="Work Format" icon={Building2}>
            <div className="space-y-2.5">
              {WORK_FORMAT_OPTIONS.map((opt) => {
                const workId = `work-option-${opt.value}`;
                return (
                  <div
                    key={opt.value}
                    className="flex items-center gap-3 group"
                  >
                    <input
                      id={workId}
                      type="checkbox"
                      checked={form.workFormat.includes(opt.value)}
                      onChange={() => toggle("workFormat", opt.value)}
                      className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor={workId}
                      className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors cursor-pointer select-none"
                    >
                      {opt.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </FormCard>

        </div>

        {/* ── Notifications ── */}
        <FormCard title="Notifications" icon={Bell}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberField
              label="Minimum Score to Notify"
              value={form.minimumScoreToNotify}
              min={0}
              max={100}
              hint="Vacancies below this score will not trigger alerts (0–100)"
              onChange={(v) =>
                setForm((p) => ({ ...p, minimumScoreToNotify: v }))
              }
            />
            <NumberField
              label="Max Notifications Per Day"
              value={parseInt(form.maxNotificationsPerDay, 10) || 0}
              min={1}
              max={200}
              hint="Cap on daily notification alerts"
              onChange={(v) =>
                setForm((p) => ({ ...p, maxNotificationsPerDay: String(v) }))
              }
            />
          </div>
        </FormCard>

        {/* ── Salary ── */}
        <FormCard title="Salary" icon={DollarSign}>
          <div>
            <label htmlFor="salary-minimum-input" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
              Minimum Salary
            </label>
            <div className="flex gap-3">
              <input
                id="salary-minimum-input"
                type="number"
                min={0}
                placeholder="e.g. 50000 — leave empty for no minimum"
                value={form.salaryMinimum}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salaryMinimum: e.target.value }))
                }
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all tabular-nums"
              />
              <select
                id="salary-currency-select"
                aria-label="Salary Currency"
                value={form.salaryCurrency}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salaryCurrency: e.target.value }))
                }
                className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
              >
                <option value="RUR">RUR</option>
                <option value="KZT">KZT</option>
                <option value="BYN">BYN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Vacancies in other currencies are converted for comparison.
            </p>
          </div>
        </FormCard>

        {/* ── Filters ── */}
        <FormCard title="Exclusion Filters" icon={Ban}>
          <TextField
            label="Exclude Keywords"
            value={form.excludeKeywords}
            onChange={(v) => setForm((p) => ({ ...p, excludeKeywords: v }))}
            hint="Vacancies matching these words are skipped. e.g. 1С, PHP, .NET"
          />
          <TextField
            label="Red Flag Keywords"
            value={form.redFlagKeywords}
            onChange={(v) => setForm((p) => ({ ...p, redFlagKeywords: v }))}
            hint="Triggers a red flag warning in analysis. e.g. passport, deposit, OTP"
          />
        </FormCard>

        {/* ── Cover Letter Context ── */}
        <FormCard title="Cover Letter Context" icon={FileText}>
          <div className="space-y-4">
            <div>
              <label htmlFor="cover-letter-language-select" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                Language
              </label>
              <select
                id="cover-letter-language-select"
                value={form.coverLetterLanguage}
                onChange={(e) => setForm((p) => ({ ...p, coverLetterLanguage: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
              >
                <option value="English">English</option>
                <option value="Russian">Russian</option>
                <option value="Auto (Match Vacancy)">Auto (Match Vacancy)</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="resume-text-input" className="block text-xs text-zinc-400 font-medium cursor-pointer">
                  Resume / Background Text
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Ctrl+Enter to save
                </span>
              </div>
              <textarea
                id="resume-text-input"
                value={form.resumeText}
                onChange={(e) => setForm((p) => ({ ...p, resumeText: e.target.value }))}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder="Paste your resume or write a brief background so the AI knows your experience..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all min-h-32 custom-scrollbar"
              />
              <p className="mt-1.5 text-[11px] text-zinc-500">
                The AI uses this background to tailor personalized cover letters.
              </p>
            </div>
            <div>
              <label htmlFor="portfolio-url-input" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                Portfolio / Website URL
              </label>
              <div className="flex gap-2">
                <input
                  id="portfolio-url-input"
                  type="text"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleTestPortfolio}
                  disabled={testingPortfolio || !form.portfolioUrl}
                  className="flex items-center justify-center min-w-[130px] gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 rounded-lg text-sm font-medium text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingPortfolio ? <RefreshCw size={14} className="animate-spin text-zinc-400" /> : <Bot size={14} className="text-zinc-400" />}
                  {testingPortfolio ? "Testing..." : "Test Crawl"}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                AI extracts verified project evidence from this link when generating applications.
              </p>
            </div>
          </div>
        </FormCard>

        {/* ── AI Providers ── */}
        <FormCard title="AI Provider Order" icon={Bot}>
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-4 py-3 text-sm text-zinc-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 tracking-wider">PROVIDER PRIORITY (READ-ONLY)</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {form.aiProviderOrder.split(",").map((p, i) => (
                <span key={i} className="px-2.5 py-1 bg-zinc-800/80 text-emerald-400 rounded-md text-xs font-mono border border-emerald-500/20">
                  {i + 1}. {p.trim()}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              AI providers are managed by the automated failover cluster. The first available provider is used.
            </p>
          </div>
        </FormCard>

        {/* ── Telegram Link ── */}
        <TelegramLinkCard />


        {/* ── Legal ── */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Legal &amp; Open Source</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Nanda AI Job Assistant is open-source software. All data you enter is stored exclusively
            in your own database. The maintainers have no access to your information.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/legal/terms"
              target="_blank"
              className="text-xs text-zinc-300 border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/legal/privacy"
              target="_blank"
              className="text-xs text-zinc-300 border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
            >
              Privacy Policy
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-300 border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-700/60 hover:border-zinc-600 px-3 py-1.5 rounded-md transition-colors"
            >
              Source on GitHub
            </a>
          </div>
          <p className="text-[11px] text-zinc-600 mt-4">
            MIT License &middot; No telemetry &middot; Self-hosted
          </p>
        </div>

        {/* ── Bottom Save Button ── */}
        <div className="flex justify-end">
          <SaveButton saving={saving} onClick={handleSave} large />
        </div>

      </div> {/* End Main Column */}

      {/* ── Right Side Panel (Profile & Analytics) ── */}
      <div className="w-full lg:w-80 shrink-0 space-y-6">
        {form.hhProfileName ? (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm backdrop-blur-sm sticky top-6">
            <div className="h-24 bg-gradient-to-r from-emerald-600/80 to-teal-500/80"></div>
            <div className="px-5 pb-6 relative text-center">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-zinc-900 bg-zinc-800 -mt-10 overflow-hidden flex items-center justify-center shadow-md">
                {form.hhProfileAvatar && form.hhProfileAvatar !== "null" ? (
                  <img src={form.hhProfileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-zinc-400">
                    {form.hhProfileName ? form.hhProfileName.charAt(0).toUpperCase() : "?"}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-bold text-zinc-100">{form.hhProfileName}</h3>
              <p className="text-sm text-zinc-400">HeadHunter Profile</p>

              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  form.hhSessionStatus === "active" ? "bg-emerald-400 animate-pulse" : form.hhSessionStatus === "expired" ? "bg-red-400" : "bg-zinc-500"
                }`} />
                <span className={`text-xs font-medium ${
                  form.hhSessionStatus === "active" ? "text-emerald-400" : form.hhSessionStatus === "expired" ? "text-red-400" : "text-zinc-400"
                }`}>
                  {form.hhSessionStatus === "active" ? "Sesi Aktif" : form.hhSessionStatus === "expired" ? "Sesi Expired" : "Belum Dicek"}
                </span>
              </div>
              {form.hhExpiresAt && (
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {formatExpDate(form.hhExpiresAt)}
                </p>
              )}
              
              <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums tracking-tight text-emerald-400">{form.hhTotalApplications || 0}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Total Responses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black tabular-nums tracking-tight text-teal-400">{form.hhResumeId ? "1" : "0"}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-semibold">Active CV</div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={handleCheckSession}
                  disabled={checkingSession || !form.hhToken}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50 border border-zinc-700/80"
                >
                  <RefreshCw size={13} className={checkingSession ? "animate-spin text-emerald-400" : "text-zinc-400"} />
                  {checkingSession ? "Memeriksa Sesi..." : "Cek Status Sesi"}
                </button>

                <button
                  type="button"
                  onClick={handleSyncHistory}
                  disabled={syncingHH}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium transition-colors disabled:opacity-50 border border-emerald-500/30"
                >
                  {syncingHH ? (
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  ) : (
                    <RefreshCw size={13} className="text-emerald-400" />
                  )}
                  {syncingHH ? "Syncing History..." : "Sync History to Database"}
                </button>
                <p className="text-[11px] text-zinc-500 text-center">
                  Tarik riwayat lamaran HeadHunter ke database lokal.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-zinc-800/60 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center sticky top-6">
            <Bot size={32} className="text-zinc-600 mb-3" />
            <h3 className="text-zinc-400 font-medium">No Profile Loaded</h3>
            <p className="text-xs text-zinc-500 mt-2">Load your HH.ru account to view your profile and analytics dashboard.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ── SaveButton ────────────────────────────────────────────────

function SaveButton({
  saving,
  onClick,
  large = false,
}: {
  saving:   boolean;
  onClick:  () => void;
  large?:   boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
        large ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm"
      }`}
    >
      {saving ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Save size={15} />
      )}
      {saving ? "Saving..." : "Save Settings"}
    </button>
  );
}

// ── TelegramLinkCard ──────────────────────────────────────────

function TelegramLinkCard() {
  const [token, setToken] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/telegram/link")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setToken(json.data.token);
          setLinked(json.data.linked);
          setUsername(json.data.username);
        }
      })
      .catch((err) => console.error("Failed to load Telegram link:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setToken(json.data.token);
        setLinked(false);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(`/link ${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <FormCard title="Telegram Bot" icon={MessageSquare}>
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              linked ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span className="text-sm text-zinc-300">
            {loading
              ? "Checking..."
              : linked
              ? `Linked${username ? ` as @${username}` : ""}`
              : "Not linked"}
          </span>
        </div>

        {/* Token display */}
        {token && !linked && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-400 mb-2">
              Send this command to your Telegram bot:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-950 px-3 py-2 rounded text-sm text-emerald-400 font-mono border border-zinc-800/80">
                /link {token}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors border border-zinc-700/60"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Generate / Regenerate button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generating && <RefreshCw size={14} className="animate-spin text-emerald-400" />}
          {generating
            ? "Generating..."
            : token
            ? "Regenerate Token"
            : "Generate Telegram Token"}
        </button>

        <p className="text-xs text-zinc-500">
          Generate a token, then send it to your bot via{" "}
          <code className="text-zinc-400 font-mono">/link TOKEN</code> to connect.
        </p>
      </div>
    </FormCard>
  );
}


// ts recheck

// ts recheck again
