"use client";

// ============================================================
// Nanda AI Job Assistant — Settings Page
// Client component — loads settings on mount, saves via POST
// ============================================================

import { useState, useEffect } from "react";
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
  Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────

interface FormState {
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        {Icon && <Icon size={16} className="text-gray-400" />}
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
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? hint}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-400/60 focus:outline-none transition-colors"
      />
      {hint && (
        <p className="text-xs text-gray-600 mt-1">{hint}</p>
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
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          onChange(parseInt(e.target.value, 10) || min)
        }
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-400/60 focus:outline-none transition-colors"
      />
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
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
            });
          }
        } else if (res.status === 404) {
          setMsg({
            text: "No saved settings found — defaults loaded. Save to create your profile.",
            type: "warn",
          });
        } else {
          setMsg({ text: "⚠️ Failed to load settings from server.", type: "warn" });
        }
      } catch {
        setMsg({ text: "⚠️ Network error loading settings.", type: "warn" });
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
      };

      const res  = await fetch("/api/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        setMsg({ text: "✅ Settings saved successfully!", type: "success" });
      } else {
        setMsg({
          text:  `❌ ${json.error ?? "Failed to save settings."}`,
          type:  "error",
        });
      }
    } catch {
      setMsg({ text: "❌ Network error — please try again.", type: "error" });
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

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let content = ev.target?.result as string;
        if (translateJsonEn) {
          setTranslatingJson(true);
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: content, mode: "json" }),
          });
          const jsonRes = await res.json();
          if (jsonRes.success && jsonRes.text) {
            content = jsonRes.text;
          }
        }

        const data = JSON.parse(content);
        setForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          resumeText: data.bio || data.resumeText || prev.resumeText,
          requiredSkills: data.skills ? data.skills.join(", ") : prev.requiredSkills,
          niceToHaveSkills: data.nice_to_have ? data.nice_to_have.join(", ") : prev.niceToHaveSkills,
          portfolioUrl: data.portfolio_url || data.portfolioUrl || prev.portfolioUrl,
          targetRoles: data.target_roles ? data.target_roles.join(", ") : prev.targetRoles,
        }));
        setUploadedJsonName(file.name);
        setMsg({ text: `✅ Profile imported successfully from ${file.name}!`, type: "success" });
      } catch (err) {
        setMsg({ text: "❌ Failed to parse JSON file.", type: "error" });
      } finally {
        setTranslatingJson(false);
        e.target.value = ""; // reset
      }
    };
    reader.readAsText(file);
  };

  const handleTestPortfolio = async () => {
    if (!form.portfolioUrl) {
      setMsg({ text: "⚠️ Please enter a Portfolio URL first.", type: "warn" });
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
        setMsg({ text: `✅ ${json.message}`, type: "success" });
      } else {
        setMsg({ text: `❌ ${json.error}`, type: "error" });
      }
    } catch {
      setMsg({ text: "❌ Failed to reach the test API.", type: "error" });
    } finally {
      setTestingPortfolio(false);
    }
  };

  // ── Main form ────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-6 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure your job search preferences
          </p>
        </div>
        <SaveButton saving={saving} onClick={handleSave} />
      </div>

      {/* ── Feedback message ── */}
      {msg && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            msg.type === "success"
              ? "bg-green-400/10 border-green-400/30 text-green-400"
              : msg.type === "warn"
              ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
              : "bg-red-400/10 border-red-400/30 text-red-400"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ── JSON Import ── */}
      <FormCard title="Import Profile via JSON" icon={FileText}>
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400">
            Upload a JSON file to auto-fill your Name, Bio, Skills, Target Roles, and Portfolio URL.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {translatingJson ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />}
              {translatingJson ? "Processing..." : "Upload JSON"}
              <input type="file" accept=".json" className="hidden" onChange={handleJsonUpload} disabled={translatingJson} />
            </label>
            {uploadedJsonName && (
              <span className="text-xs text-green-400 flex items-center gap-1 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                <Check size={12} /> {uploadedJsonName}
              </span>
            )}
            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input 
                type="checkbox" 
                checked={translateJsonEn} 
                onChange={(e) => setTranslateJsonEn(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-xs text-gray-300">Translate Russian to English</span>
            </label>
          </div>
        </div>
      </FormCard>

      {/* ── Profile Name ── */}
      <FormCard title="Profile Information" icon={Target}>
        <TextField
          label="Profile Name"
          value={form.name}
          onChange={(v) => setForm((p) => ({ ...p, name: v }))}
          hint="Name of this profile (e.g. Nanda, Web Developer, Backend)"
        />
      </FormCard>

      {/* ── Target Roles ── */}
      <FormCard title="Target Roles" icon={Target}>
        <TextField
          label="Job Titles"
          value={form.targetRoles}
          onChange={(v) => setForm((p) => ({ ...p, targetRoles: v }))}
          hint="Comma-separated. e.g. Frontend Developer, React Developer"
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
          hint="Must-have skills. e.g. React, TypeScript, JavaScript"
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
            {EXPERIENCE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={form.experience.includes(opt.value)}
                  onChange={() => toggle("experience", opt.value)}
                  className="w-4 h-4 rounded accent-green-400 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </FormCard>

        <FormCard title="Work Format" icon={Building2}>
          <div className="space-y-2.5">
            {WORK_FORMAT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={form.workFormat.includes(opt.value)}
                  onChange={() => toggle("workFormat", opt.value)}
                  className="w-4 h-4 rounded accent-green-400 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
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
            hint="Vacancies below this score won't trigger a Telegram alert (0–100)"
            onChange={(v) =>
              setForm((p) => ({ ...p, minimumScoreToNotify: v }))
            }
          />
          <NumberField
            label="Max Notifications Per Day"
            value={parseInt(form.maxNotificationsPerDay, 10) || 0}
            min={1}
            max={200}
            hint="Cap on daily Telegram messages to avoid spam"
            onChange={(v) =>
              setForm((p) => ({ ...p, maxNotificationsPerDay: String(v) }))
            }
          />
        </div>
      </FormCard>

      {/* ── Salary ── */}
      <FormCard title="Salary" icon={DollarSign}>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            Minimum Salary
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              placeholder="e.g. 50000 — leave empty for no minimum"
              value={form.salaryMinimum}
              onChange={(e) =>
                setForm((p) => ({ ...p, salaryMinimum: e.target.value }))
              }
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-400/60 focus:outline-none transition-colors"
            />
            <select
              value={form.salaryCurrency}
              onChange={(e) =>
                setForm((p) => ({ ...p, salaryCurrency: e.target.value }))
              }
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-400/60 focus:outline-none transition-colors"
            >
              <option value="RUR">RUR</option>
              <option value="KZT">KZT</option>
              <option value="BYN">BYN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Vacancies in other currencies will be automatically converted for comparison.
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
          hint="Triggers a red flag warning in AI analysis. e.g. паспорт, залог, OTP"
        />
      </FormCard>

      {/* ── Cover Letter Context ── */}
      <FormCard title="Cover Letter Context" icon={FileText}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              Language
            </label>
            <select
              value={form.coverLetterLanguage}
              onChange={(e) => setForm((p) => ({ ...p, coverLetterLanguage: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-400/50"
            >
              <option value="English">English</option>
              <option value="Russian">Russian</option>
              <option value="Auto (Match Vacancy)">Auto (Match Vacancy)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              Resume / Background Text
            </label>
            <textarea
              value={form.resumeText}
              onChange={(e) => setForm((p) => ({ ...p, resumeText: e.target.value }))}
              placeholder="Paste your resume or write a brief background so the AI knows your experience..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-400/50 min-h-32 custom-scrollbar"
            />
            <p className="mt-1.5 text-[10px] text-gray-500">
              The AI will use this to generate highly personalized cover letters.
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              Portfolio / Website URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.portfolioUrl}
                onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                placeholder="https://yoursite.com"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-green-400/60 focus:outline-none transition-colors"
              />
              <button
                onClick={handleTestPortfolio}
                disabled={testingPortfolio || !form.portfolioUrl}
                className="flex items-center justify-center min-w-[120px] gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
              >
                {testingPortfolio ? <RefreshCw size={14} className="animate-spin" /> : <Bot size={14} />}
                Test Crawl
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              AI will automatically crawl this URL to extract your projects when generating cover letters.
            </p>
          </div>
        </div>
      </FormCard>

      {/* ── AI Providers ── */}
      <FormCard title="AI Provider Order" icon={Bot}>
        <div className="bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-500">PROVIDER PRIORITY (READ-ONLY)</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {form.aiProviderOrder.split(",").map((p, i) => (
              <span key={i} className="px-2 py-1 bg-gray-800 text-green-400 rounded-md text-xs font-mono border border-green-400/20">
                {i + 1}. {p.trim()}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            AI providers are managed by the system. The first available provider is used.
          </p>
        </div>
      </FormCard>

      {/* ── Telegram Link ── */}
      <TelegramLinkCard />

      {/* ── Bottom Save Button ── */}
      <div className="flex justify-end">
        <SaveButton saving={saving} onClick={handleSave} large />
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
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        large ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm"
      }`}
    >
      {saving ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Save size={15} />
      )}
      {saving ? "Saving…" : "Save Settings"}
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
              linked ? "bg-green-400" : "bg-yellow-400"
            }`}
          />
          <span className="text-sm text-gray-300">
            {loading
              ? "Checking..."
              : linked
              ? `Linked${username ? ` as @${username}` : ""}`
              : "Not linked"}
          </span>
        </div>

        {/* Token display */}
        {token && !linked && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">
              Send this command to your Telegram bot:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-green-400 font-mono">
                /link {token}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Generate / Regenerate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
        >
          {generating
            ? "Generating..."
            : token
            ? "Regenerate Token"
            : "Generate Telegram Token"}
        </button>

        <p className="text-xs text-gray-600">
          Generate a token, then send it to your bot via{" "}
          <code className="text-gray-400">/link TOKEN</code> to connect.
        </p>
      </div>
    </FormCard>
  );
}

