"use client";

// ============================================================
// Nanda AI Job Assistant — Settings Page (Production v2.4.1)
// Redesigned to match exact 2-column reference layout:
// - Two-column responsive architecture (Main Controls + Live Telemetry Sidebar)
// - Debounced Auto-Save with real-time status indicator & Ctrl+S shortcut
// - HH.ru Session & Profile Sync (Browser Login, Session Health, History Sync)
// - Profile JSON Import & Export with auto-fill
// - Strict Design Rule: NO circular red/green dot badges anywhere
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Save,
  RefreshCw,
  Target,
  Search,
  Bot,
  FileText,
  Send,
  Copy,
  Check,
  Globe,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Shield,
  Activity,
  Sliders,
  ChevronRight,
  RotateCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Terminal,
  Key,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  Play,
} from "lucide-react";
import { AIProvider, CustomAiProviderConfig, AiPreferenceConfig } from "@/types";
import TagInput from "@/components/ui/TagInput";
import {
  ROLES,
  SKILLS,
  KEYWORDS_RU,
  EXCLUDE_KEYWORDS,
  RED_FLAG_KEYWORDS,
} from "@/lib/catalog/data";
import { useLanguage } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────────

interface FormState {
  id?: string;
  name: string;
  targetRoles: string[];
  searchKeywordsEn: string[];
  searchKeywordsRu: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experience: string[];
  workFormat: string[];
  minimumScoreToNotify: number;
  maxNotificationsPerDay: string;
  excludeKeywords: string[];
  redFlagKeywords: string[];
  salaryMinimum: string;
  salaryCurrency: string;
  aiProviderOrder: string[];
  aiCustomConfig?: AiPreferenceConfig;
  coverLetterLanguage: string;
  resumeText: string;
  portfolioUrl: string;
  hhToken: string;
  hhResumeId: string;
  hhResumeTitle: string;
  hhProfileName: string;
  hhProfileAvatar: string;
  hhTotalApplications: number;
  hhSessionStatus: string;
  hhLastVerifiedAt: string;
  hhExpiresAt: string;
}

interface Msg {
  text: string;
  type: "success" | "error" | "warn";
}

// ── Default State & Options ───────────────────────────────────

const AI_PROVIDERS_CONFIG: Array<{
  id: AIProvider;
  label: string;
  tag: string;
  defaultModel: string;
  presets: string[];
  keyPlaceholder: string;
  desc: string;
  isLocal?: boolean;
}> = [
  {
    id: "deepseek",
    label: "DeepSeek",
    tag: "High Reasoning / Cost-Efficient",
    defaultModel: "deepseek-chat",
    presets: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
    desc: "Direct DeepSeek engine (deepseek-chat for fast scoring, deepseek-reasoner R1 for deep analysis).",
  },
  {
    id: "openai",
    label: "OpenAI",
    tag: "Standard Reference",
    defaultModel: "gpt-4o-mini",
    presets: ["gpt-4o-mini", "gpt-4o", "o3-mini"],
    keyPlaceholder: "sk-proj-...",
    desc: "OpenAI foundation models with state-of-the-art instruction compliance and multilingual fluency.",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    tag: "Nuanced & Natural Writing",
    defaultModel: "claude-3-5-haiku-20241022",
    presets: ["claude-3-5-haiku-20241022", "claude-3-7-sonnet-20250219"],
    keyPlaceholder: "sk-ant-...",
    desc: "Claude models known for empathetic, tailored cover letters without mechanical robotic phrasing.",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    tag: "Long Context Window",
    defaultModel: "gemini-2.5-flash",
    presets: ["gemini-2.5-flash", "gemini-2.5-pro"],
    keyPlaceholder: "AIzaSy...",
    desc: "Google AI Gemini with large context support for cross-referencing complex candidate resumes.",
  },
  {
    id: "groq",
    label: "Groq LPU",
    tag: "Sub-Second Inference",
    defaultModel: "llama-3.3-70b-versatile",
    presets: ["llama-3.3-70b-versatile", "qwen-2.5-32b"],
    keyPlaceholder: "gsk_...",
    desc: "Sub-second inference powered by Groq LPUs, ideal for lightning-fast vacancy filtration.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    tag: "Universal Gateway",
    defaultModel: "anthropic/claude-3.5-sonnet",
    presets: ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-r1", "meta-llama/llama-3.3-70b-instruct"],
    keyPlaceholder: "sk-or-v1-...",
    desc: "Universal proxy routing to 200+ models with unified balance.",
  },
  {
    id: "custom",
    label: "Custom / Localhost",
    tag: "Ollama / vLLM / LM Studio",
    defaultModel: "llama3.2",
    presets: ["llama3.2", "qwen2.5:14b", "deepseek-r1:8b", "mistral-small"],
    keyPlaceholder: "Optional API Bearer token",
    desc: "OpenAI-compatible local server (e.g. Ollama, LM Studio, vLLM) for offline, privacy-first processing.",
    isLocal: true,
  },
];

const DEFAULT_FORM: FormState = {
  name: "Default Profile",
  targetRoles: ["Frontend Developer"],
  searchKeywordsEn: ["frontend developer", "react developer", "typescript"],
  searchKeywordsRu: ["фронтенд разработчик", "react разработчик"],
  requiredSkills: ["React", "TypeScript", "JavaScript", "Next.js"],
  niceToHaveSkills: ["Tailwind CSS", "Node.js", "Git"],
  experience: ["between1And3", "between3And6"],
  workFormat: ["remote", "hybrid"],
  minimumScoreToNotify: 70,
  maxNotificationsPerDay: "20",
  excludeKeywords: [],
  redFlagKeywords: ["паспорт", "залог", "unpaid"],
  salaryMinimum: "",
  salaryCurrency: "RUR",
  aiProviderOrder: ["deepseek", "groq", "gemini", "openrouter"],
  aiCustomConfig: {
    order: ["deepseek", "groq", "gemini", "openrouter"],
    taskRouting: {
      deepAnalysis: "deepseek",
      coverLetter: "deepseek",
    },
    customProviders: {},
  },
  coverLetterLanguage: "Auto (Match Vacancy Language)",
  resumeText: "",
  portfolioUrl: "",
  hhToken: "",
  hhResumeId: "",
  hhResumeTitle: "",
  hhProfileName: "",
  hhProfileAvatar: "",
  hhTotalApplications: 0,
  hhSessionStatus: "disconnected",
  hhLastVerifiedAt: "",
  hhExpiresAt: "",
};

const EXPERIENCE_OPTIONS = [
  { label: "No Experience", value: "noExperience" },
  { label: "1–3 Years", value: "between1And3" },
  { label: "3–6 Years", value: "between3And6" },
  { label: "6+ Years", value: "moreThan6" },
];

const WORK_FORMAT_OPTIONS = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Office", value: "office" },
];

// ── Helpers ───────────────────────────────────────────────────

function toComma(arr: unknown): string {
  if (Array.isArray(arr)) return arr.join(", ");
  if (typeof arr === "string") return arr;
  return "";
}

function fromComma(str: unknown): string[] {
  if (typeof str !== "string") return [];
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

function formatRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Never";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

// ── Main Page Component ───────────────────────────────────────

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("just now");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [msg, setMsg] = useState<Msg | null>(null);

  // Profile JSON Upload / Translate state
  const [translatingJson, setTranslatingJson] = useState(false);
  const [translateJsonEn, setTranslateJsonEn] = useState(false);
  const [uploadedJsonName, setUploadedJsonName] = useState<string>("my_resume_profile_en.json");

  // HH.ru integration state
  const [validatingHH, setValidatingHH] = useState(false);
  const [syncingHH, setSyncingHH] = useState(false);
  const [hhResumes, setHhResumes] = useState<Array<{ id: string; title: string; status?: { name: string } }>>([]);
  const [checkingSession, setCheckingSession] = useState(false);
  const [hhConnectMode, setHhConnectMode] = useState<"console" | "oauth">("console");
  const [showManualCookie, setShowManualCookie] = useState(false);

  // Portfolio crawling test state
  const [testingPortfolio, setTestingPortfolio] = useState(false);

  // Telegram Link state
  const [tgToken, setTgToken] = useState<string | null>(null);
  const [tgLinked, setTgLinked] = useState(false);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [generatingTg, setGeneratingTg] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Live telemetry stats loaded from backend
  const [stats, setStats] = useState({
    totalVacancies: 0,
    appliedCount: 0,
    avgScore: 0,
  });

  // AI Configurator & BYOK state
  const [selectedAiTab, setSelectedAiTab] = useState<AIProvider>("deepseek");
  const [showAiKeys, setShowAiKeys] = useState<Record<string, boolean>>({});
  const [testingAi, setTestingAi] = useState(false);
  const [testAiResult, setTestAiResult] = useState<{
    provider: string;
    success: boolean;
    message: string;
    latencyMs?: number;
    modelUsed?: string;
  } | null>(null);

  // AI Helper: Update provider config (API key, model, baseUrl)
  const updateProviderConfig = (provider: AIProvider, patch: Partial<CustomAiProviderConfig>) => {
    setForm((prev) => {
      const currentConfig = prev.aiCustomConfig || {
        order: prev.aiProviderOrder as AIProvider[],
        taskRouting: { deepAnalysis: "deepseek", coverLetter: "deepseek" },
        customProviders: {},
      };
      const existingProviderConfig = currentConfig.customProviders?.[provider] || {};

      const updatedConfig: AiPreferenceConfig = {
        ...currentConfig,
        customProviders: {
          ...currentConfig.customProviders,
          [provider]: {
            ...existingProviderConfig,
            ...patch,
          },
        },
      };

      return {
        ...prev,
        aiCustomConfig: updatedConfig,
      };
    });
  };

  // AI Helper: Update dedicated task routing (deepAnalysis vs coverLetter)
  const updateTaskRouting = (task: "deepAnalysis" | "coverLetter", provider: AIProvider) => {
    setForm((prev) => {
      const currentConfig = prev.aiCustomConfig || {
        order: prev.aiProviderOrder as AIProvider[],
        taskRouting: { deepAnalysis: "deepseek", coverLetter: "deepseek" },
        customProviders: {},
      };

      return {
        ...prev,
        aiCustomConfig: {
          ...currentConfig,
          taskRouting: {
            ...currentConfig.taskRouting,
            [task]: provider,
          },
        },
      };
    });
  };

  // AI Helper: Move provider in cascade priority chain
  const moveProvider = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const list = [...prev.aiProviderOrder];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= list.length) return prev;
      const temp = list[index];
      list[index] = list[targetIdx];
      list[targetIdx] = temp;

      return {
        ...prev,
        aiProviderOrder: list,
        aiCustomConfig: {
          ...(prev.aiCustomConfig || {
            order: list as AIProvider[],
            taskRouting: { deepAnalysis: list[0] as AIProvider, coverLetter: list[0] as AIProvider },
            customProviders: {},
          }),
          order: list as AIProvider[],
        },
      };
    });
  };

  // AI Helper: Ping/test live connection to provider
  const handleTestAi = async (provider: AIProvider) => {
    setTestingAi(true);
    setTestAiResult(null);
    try {
      const currentConfig = form.aiCustomConfig?.customProviders?.[provider];
      const res = await fetch("/api/settings/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          config: currentConfig,
        }),
      });
      const data = await res.json();
      setTestAiResult({
        provider,
        success: Boolean(data.success),
        message: data.message || (data.success ? "Connection established successfully!" : "Connection failed."),
        latencyMs: data.latencyMs,
        modelUsed: data.modelUsed,
      });
    } catch {
      setTestAiResult({
        provider,
        success: false,
        message: "Network error trying to reach AI test API.",
      });
    } finally {
      setTestingAi(false);
    }
  };

  // Refs for tracking changes and debounce
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load Settings on Mount ────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            if (json.stats) {
              setStats(json.stats);
            }
            const d = json.data;
            const parsedOrder = Array.isArray(d.aiProviderOrder) && d.aiProviderOrder.length > 0
              ? d.aiProviderOrder
              : DEFAULT_FORM.aiProviderOrder;

            setForm({
              id: d.id,
              name: d.name ?? DEFAULT_FORM.name,
              targetRoles: Array.isArray(d.targetRoles) ? d.targetRoles : [],
              searchKeywordsEn: Array.isArray(d.searchKeywordsEn) ? d.searchKeywordsEn : [],
              searchKeywordsRu: Array.isArray(d.searchKeywordsRu) ? d.searchKeywordsRu : [],
              requiredSkills: Array.isArray(d.requiredSkills) ? d.requiredSkills : [],
              niceToHaveSkills: Array.isArray(d.niceToHaveSkills) ? d.niceToHaveSkills : [],
              experience: Array.isArray(d.experience) ? d.experience : DEFAULT_FORM.experience,
              workFormat: Array.isArray(d.workFormat) ? d.workFormat : DEFAULT_FORM.workFormat,
              minimumScoreToNotify: typeof d.minimumScoreToNotify === "number" ? d.minimumScoreToNotify : DEFAULT_FORM.minimumScoreToNotify,
              maxNotificationsPerDay: String(d.maxNotificationsPerDay ?? DEFAULT_FORM.maxNotificationsPerDay),
              excludeKeywords: Array.isArray(d.excludeKeywords) ? d.excludeKeywords : [],
              redFlagKeywords: Array.isArray(d.redFlagKeywords) ? d.redFlagKeywords : [],
              salaryMinimum: d.salaryMinimum != null ? String(d.salaryMinimum) : "",
              salaryCurrency: d.salaryCurrency ?? DEFAULT_FORM.salaryCurrency,
              aiProviderOrder: parsedOrder,
              aiCustomConfig: d.aiCustomConfig || {
                order: parsedOrder as AIProvider[],
                taskRouting: {
                  deepAnalysis: (parsedOrder[0] as AIProvider) || "deepseek",
                  coverLetter: (parsedOrder[0] as AIProvider) || "deepseek",
                },
                customProviders: {},
              },
              coverLetterLanguage: d.coverLetterLanguage ?? DEFAULT_FORM.coverLetterLanguage,
              resumeText: d.resumeText ?? "",
              portfolioUrl: d.portfolioUrl ?? "",
              hhToken: d.hhToken ?? "",
              hhResumeId: d.hhResumeId ?? "",
              hhResumeTitle: d.hhResumeTitle ?? "",
              hhProfileName: d.hhProfileName ?? "",
              hhProfileAvatar: d.hhProfileAvatar ?? "",
              hhTotalApplications: typeof d.hhTotalApplications === "number" ? d.hhTotalApplications : 0,
              hhSessionStatus: d.hhSessionStatus ?? (d.hasHhToken ? "active" : "disconnected"),
              hhLastVerifiedAt: d.hhLastVerifiedAt ? String(d.hhLastVerifiedAt) : "",
              hhExpiresAt: d.hhExpiresAt ? String(d.hhExpiresAt) : "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          // Wait 500ms before enabling auto-save to ignore initial state setup
          setTimeout(() => {
            isLoadedRef.current = true;
          }, 500);
        }
      }
    };

    // Load Telegram Link status
    fetch("/api/telegram/link")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data && isMounted) {
          if (json.data.token) setTgToken(json.data.token);
          setTgLinked(Boolean(json.data.linked));
          if (json.data.username) setTgUsername(json.data.username);
        }
      })
      .catch(() => {});

    load();

    // ── Handle URL Search Parameters (OAuth & 1-Click Bookmarklet / Extension Sync) ──
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const importToken = urlParams.get("import_token");
      const oauthSuccess = urlParams.get("oauth_success");
      const oauthError = urlParams.get("oauth_error");

      if (oauthSuccess) {
        setMsg({ text: "HeadHunter official account successfully connected via OAuth 2.0!", type: "success" });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (oauthError) {
        setMsg({ text: `OAuth Error: ${oauthError}`, type: "error" });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (importToken) {
        setMsg({ text: "Syncing session from 1-Click Sync... Validating resumes...", type: "warn" });
        fetch("/api/settings/validate-hh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: importToken }),
        })
          .then((r) => r.json())
          .then((json) => {
            if (json.success && isMounted) {
              setForm((prev) => ({
                ...prev,
                hhToken: importToken,
                hhSessionStatus: "active",
                hhLastVerifiedAt: new Date().toISOString(),
                hhProfileName: json.profile?.name || prev.hhProfileName,
                hhProfileAvatar: json.profile?.avatar || prev.hhProfileAvatar,
                hhTotalApplications: json.profile?.totalApplications || prev.hhTotalApplications,
                ...(json.resumes && json.resumes.length > 0
                  ? { hhResumeId: json.resumes[0].id, hhResumeTitle: json.resumes[0].title }
                  : {}),
              }));
              if (json.resumes) setHhResumes(json.resumes);
              if (typeof json.syncedApplications === "number") {
                setStats((prev) => ({ ...prev, appliedCount: json.syncedApplications }));
              }
              setMsg({
                text: `HeadHunter Session Connected: ${json.profile?.name || "Connected"}!${
                  json.syncedApplications ? ` (${json.syncedApplications} applications synced to local DB)` : ""
                }`,
                type: "success",
              });
              window.history.replaceState({}, document.title, window.location.pathname);
            } else if (isMounted) {
              setMsg({ text: json.error || "Failed to validate token from 1-Click Sync.", type: "error" });
            }
          })
          .catch(() => {
            if (isMounted) setMsg({ text: "Failed to reach validation API.", type: "error" });
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Core Save Execution ───────────────────────────────────
  const executeSave = useCallback(
    async (formData: FormState, isManual = false) => {
      if (saving) return;
      if (isManual) setSaving(true);
      setAutoSaveStatus("saving");

      try {
        const payload = {
          id: formData.id,
          name: formData.name,
          targetRoles: formData.targetRoles,
          searchKeywordsEn: formData.searchKeywordsEn,
          searchKeywordsRu: formData.searchKeywordsRu,
          requiredSkills: formData.requiredSkills,
          niceToHaveSkills: formData.niceToHaveSkills,
          experience: formData.experience,
          workFormat: formData.workFormat,
          minimumScoreToNotify: formData.minimumScoreToNotify,
          maxNotificationsPerDay: parseInt(formData.maxNotificationsPerDay, 10) || 20,
          excludeKeywords: formData.excludeKeywords,
          redFlagKeywords: formData.redFlagKeywords,
          salaryMinimum:
            formData.salaryMinimum.trim() !== "" ? parseInt(formData.salaryMinimum, 10) || null : null,
          salaryCurrency: formData.salaryCurrency,
          aiProviderOrder: formData.aiProviderOrder,
          aiCustomConfig: formData.aiCustomConfig,
          coverLetterLanguage: formData.coverLetterLanguage,
          resumeText: formData.resumeText,
          portfolioUrl: formData.portfolioUrl,
          hhToken: formData.hhToken,
          hhResumeId: formData.hhResumeId,
          hhResumeTitle: formData.hhResumeTitle,
          hhProfileName: formData.hhProfileName,
          hhProfileAvatar: formData.hhProfileAvatar,
          hhTotalApplications: formData.hhTotalApplications,
          hhSessionStatus: formData.hhSessionStatus,
          hhLastVerifiedAt: formData.hhLastVerifiedAt ? new Date(formData.hhLastVerifiedAt) : null,
          hhExpiresAt: formData.hhExpiresAt ? new Date(formData.hhExpiresAt) : null,
        };

        const res = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok && json.success) {
          setAutoSaveStatus("saved");
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSavedTime(nowStr);
          if (isManual) {
            setMsg({ text: "Settings saved successfully!", type: "success" });
            setTimeout(() => setMsg(null), 3000);
          }
        } else {
          setAutoSaveStatus("idle");
          if (isManual) {
            setMsg({ text: json.error ?? "Failed to save settings.", type: "error" });
          }
        }
      } catch {
        setAutoSaveStatus("idle");
        if (isManual) {
          setMsg({ text: "Network error saving settings.", type: "error" });
        }
      } finally {
        if (isManual) setSaving(false);
      }
    },
    [saving]
  );

  // ── Debounced Auto-Save on form change ─────────────────────
  useEffect(() => {
    if (!isLoadedRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      executeSave(form, false);
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, executeSave]);

  // ── Keyboard Shortcut: Ctrl+S / Cmd+S ──────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        executeSave(form, true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, executeSave]);

  // ── Checkbox Array Toggler ────────────────────────────────
  const toggleArrayItem = (field: "experience" | "workFormat", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  // ── HH.ru Actions ─────────────────────────────────────────
  const handleCheckSession = async () => {
    setCheckingSession(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/check-hh-session", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (data.status === "active") {
          setForm((prev) => ({
            ...prev,
            hhSessionStatus: "active",
            hhLastVerifiedAt: data.lastVerifiedAt ? String(data.lastVerifiedAt) : new Date().toISOString(),
            ...(data.profile?.name
              ? {
                  hhProfileName: data.profile.name,
                  hhProfileAvatar: data.profile.avatar,
                  hhTotalApplications: data.profile.totalApplications,
                }
              : {}),
          }));
          if (data.resumes) setHhResumes(data.resumes);
          setMsg({ text: "HeadHunter session is ACTIVE and verified!", type: "success" });
        } else if (data.status === "expired") {
          setForm((prev) => ({
            ...prev,
            hhSessionStatus: "expired",
            hhLastVerifiedAt: data.lastVerifiedAt ? String(data.lastVerifiedAt) : new Date().toISOString(),
          }));
          setMsg({
            text: "HeadHunter session is EXPIRED or logged out. Click 'Launch Browser Login' to reconnect.",
            type: "error",
          });
        } else {
          setMsg({ text: data.message || "No HeadHunter token configured yet.", type: "warn" });
        }
      } else {
        setMsg({ text: data.error || "Failed to check session.", type: "error" });
      }
    } catch {
      setMsg({ text: "Network error reaching session verification endpoint.", type: "error" });
    } finally {
      setCheckingSession(false);
    }
  };

  const handleDisconnectHH = async () => {
    setForm((prev) => ({
      ...prev,
      hhToken: "",
      hhSessionStatus: "disconnected",
      hhResumeId: "",
      hhResumeTitle: "",
      hhProfileName: "",
      hhProfileAvatar: "",
      hhTotalApplications: 0,
      hhLastVerifiedAt: "",
    }));
    setHhResumes([]);
    setMsg({ text: "HeadHunter token disconnected and cleared from database.", type: "warn" });
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hhToken: "",
          hhSessionStatus: "disconnected",
          hhResumeId: "",
          hhResumeTitle: "",
          hhProfileName: "",
          hhProfileAvatar: "",
          hhTotalApplications: 0,
        }),
      });
    } catch {}
  };

  const handleValidateHH = async () => {
    if (!form.hhToken) {
      setMsg({ text: "Please enter your HH.ru Session Token or Cookie String first.", type: "warn" });
      return;
    }
    setValidatingHH(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/validate-hh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.hhToken }),
      });
      const json = await res.json();
      if (json.success && json.resumes) {
        setHhResumes(json.resumes);
        setMsg({
          text: `Successfully loaded ${json.resumes.length} resumes!${
            json.syncedApplications ? ` (${json.syncedApplications} applications synced to local DB)` : ""
          }`,
          type: "success",
        });
        if (typeof json.syncedApplications === "number") {
          setStats((prev) => ({ ...prev, appliedCount: json.syncedApplications }));
        }
        if (json.resumes.length > 0 && !form.hhResumeId) {
          setForm((prev) => ({
            ...prev,
            hhResumeId: json.resumes[0].id,
            hhResumeTitle: json.resumes[0].title,
          }));
        }
        if (json.profile) {
          setForm((prev) => ({
            ...prev,
            hhSessionStatus: "active",
            hhLastVerifiedAt: new Date().toISOString(),
            hhProfileName: json.profile.name || prev.hhProfileName,
            hhProfileAvatar: json.profile.avatar || prev.hhProfileAvatar,
            hhTotalApplications: json.profile.totalApplications || prev.hhTotalApplications,
          }));
        }
      } else {
        setMsg({ text: json.error ?? "Failed to validate cookie string.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach validation API.", type: "error" });
    } finally {
      setValidatingHH(false);
    }
  };

  const handleSyncHistory = async () => {
    setSyncingHH(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings/sync-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: form.hhToken || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: json.message || "Successfully synchronized application history!", type: "success" });
        if (typeof json.count === "number") {
          setForm((prev) => ({ ...prev, hhTotalApplications: json.count, hhSessionStatus: "active" }));
          setStats((prev) => ({ ...prev, appliedCount: json.count }));
        }
      } else {
        if (json.sessionExpired) {
          setForm((prev) => ({ ...prev, hhSessionStatus: "expired" }));
        }
        setMsg({ text: json.error ?? "Failed to sync history.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach sync API.", type: "error" });
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
        body: JSON.stringify({ url: form.portfolioUrl }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg({ text: json.message || "Crawl bot successfully validated portfolio link!", type: "success" });
      } else {
        setMsg({ text: json.error ?? "Crawl test failed.", type: "error" });
      }
    } catch {
      setMsg({ text: "Failed to reach test crawl API.", type: "error" });
    } finally {
      setTestingPortfolio(false);
    }
  };

  // ── JSON Import & Export ──────────────────────────────────
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setMsg({ text: "Invalid file type. Please upload a .json file.", type: "error" });
      e.target.value = "";
      return;
    }

    setUploadedJsonName(file.name);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        let content = ev.target?.result as string;
        if (translateJsonEn) {
          setTranslatingJson(true);
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: content, mode: "json" }),
            });
            const jsonRes = await res.json();
            if (jsonRes.success && jsonRes.text) content = jsonRes.text;
          } catch {
            // Proceed with raw content if translation fails
          }
        }

        const data = JSON.parse(content);
        if (typeof data !== "object" || data === null) {
          setMsg({ text: "Invalid JSON format.", type: "error" });
          return;
        }

        const safeArray = (v: unknown): string[] => {
          if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
          if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
          return [];
        };

        const newTargetRoles =
          safeArray(data.targetRoles || data.target_roles || data.matchingRules?.highPriorityMatch || data.targetRolesSummary);

        const newSkillsReq =
          safeArray(data.requiredSkills || data.skills?.required);

        const newSkillsNice =
          safeArray(data.niceToHaveSkills || data.skills?.niceToHave || data.nice_to_have);

        const newKeywordsEn =
          safeArray(data.searchKeywordsEn || data.searchKeywords?.english || data.keywords_en);

        const newKeywordsRu =
          safeArray(data.searchKeywordsRu || data.searchKeywords?.russian || data.keywords_ru);

        const newExclude =
          safeArray(data.excludeKeywords || data.exclusionFilters?.excludeKeywords);

        const newRedFlags =
          safeArray(data.redFlagKeywords || data.exclusionFilters?.redFlagKeywords);

        const newBio =
          data.coverLetterContext?.resumeBackgroundText ||
          data.bio ||
          data.resumeText ||
          data.resume ||
          form.resumeText;

        const newPortfolio =
          data.portfolioUrl ||
          data.portfolio_url ||
          data.coverLetterContext?.portfolioWebsiteUrl ||
          form.portfolioUrl;

        const newAiCustomConfig = data.aiCustomConfig || form.aiCustomConfig;
        const newAiOrder = data.aiCustomConfig?.order || data.aiProviderOrder || form.aiProviderOrder;

        setForm((prev) => ({
          ...prev,
          name: data.profileName || data.name || prev.name,
          targetRoles: newTargetRoles.length > 0 ? newTargetRoles : prev.targetRoles,
          requiredSkills: newSkillsReq.length > 0 ? newSkillsReq : prev.requiredSkills,
          niceToHaveSkills: newSkillsNice.length > 0 ? newSkillsNice : prev.niceToHaveSkills,
          searchKeywordsEn: newKeywordsEn.length > 0 ? newKeywordsEn : prev.searchKeywordsEn,
          searchKeywordsRu: newKeywordsRu.length > 0 ? newKeywordsRu : prev.searchKeywordsRu,
          excludeKeywords: newExclude.length > 0 ? newExclude : prev.excludeKeywords,
          redFlagKeywords: newRedFlags.length > 0 ? newRedFlags : prev.redFlagKeywords,
          aiCustomConfig: newAiCustomConfig,
          aiProviderOrder: Array.isArray(newAiOrder) ? newAiOrder : prev.aiProviderOrder,
          resumeText: newBio,
          portfolioUrl: newPortfolio,
        }));

        setMsg({
          text: `Successfully imported profile from ${file.name}! Auto-save will store the configuration.`,
          type: "success",
        });
      } catch (err: unknown) {
        setMsg({
          text: `Failed to parse JSON file: ${err instanceof Error ? err.message : "Invalid syntax"}`,
          type: "error",
        });
      } finally {
        setTranslatingJson(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const exportData = {
      profileName: form.name,
      targetRoles: form.targetRoles,
      searchKeywords: {
        english: form.searchKeywordsEn,
        russian: form.searchKeywordsRu,
      },
      skills: {
        required: form.requiredSkills,
        niceToHave: form.niceToHaveSkills,
      },
      experience: form.experience,
      workFormat: form.workFormat,
      scoring: {
        minimumScoreToNotify: form.minimumScoreToNotify,
        maxNotificationsPerDay: parseInt(form.maxNotificationsPerDay, 10) || 20,
        salaryMinimum: form.salaryMinimum ? parseInt(form.salaryMinimum, 10) : null,
        salaryCurrency: form.salaryCurrency,
      },
      exclusionFilters: {
        excludeKeywords: form.excludeKeywords,
        redFlagKeywords: form.redFlagKeywords,
      },
      aiProviderOrder: form.aiProviderOrder,
      aiCustomConfig: form.aiCustomConfig,
      coverLetterContext: {
        resumeBackgroundText: form.resumeText,
        portfolioWebsiteUrl: form.portfolioUrl,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateTgToken = async () => {
    setGeneratingTg(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data) {
        setTgToken(json.data.token);
        setTgLinked(false);
      }
    } finally {
      setGeneratingTg(false);
    }
  };

  const handleCopyTgToken = () => {
    if (!tgToken) return;
    navigator.clipboard.writeText(`/link ${tgToken}`);
    setCopiedTg(true);
    setTimeout(() => setCopiedTg(false), 2000);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ── Loading Skeleton ──────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin text-emerald-400" />
          <span className="text-zinc-400 text-sm">Loading configuration pipelines...</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 pb-5 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Settings</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Configure automated job search preferences, AI evaluation rules, safety heuristics, and HH.ru session sync pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => executeSave(form, true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin text-zinc-950" /> : <Save size={14} />}
            <span>Save Settings</span>
            <kbd className="hidden sm:inline bg-emerald-600/60 text-zinc-950 px-1.5 py-0.5 rounded text-[10px] font-mono">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </div>

      {/* ── Realtime Database State Sync Banner (Under Header) ── */}
      <div className="mt-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs py-2 px-3.5 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Strict rule: NO round colored dot! Icon is clean and safe */}
          <Activity size={13} className="text-emerald-400 shrink-0" />
          <span>
            Database state synced &bull; Last snapshot updated {lastSavedTime}
          </span>
        </div>
        <div className="text-[11px] font-mono uppercase font-medium flex items-center gap-1.5">
          {autoSaveStatus === "saving" ? (
            <span className="text-amber-300 flex items-center gap-1.5 font-semibold">
              <RefreshCw size={11} className="animate-spin text-amber-300" />
              Auto-saving...
            </span>
          ) : autoSaveStatus === "saved" ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Check size={11} className="text-emerald-400" />
              Auto-saved
            </span>
          ) : (
            <span className="text-emerald-400/80 font-semibold flex items-center gap-1">
              <Check size={11} className="text-emerald-400/80" />
              Auto-save active
            </span>
          )}
        </div>
      </div>

      {/* ── Toast message if any ── */}
      {msg && (
        <div
          className={`mt-4 p-3.5 rounded-lg text-xs border transition-all ${
            msg.type === "success"
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
              : msg.type === "warn"
              ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
              : "bg-red-950/30 border-red-500/40 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* ── Main 2-Column Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* ════════════════════════════════════════════════════════
            LEFT COLUMN: Main Controls & Form Sections (8 Cols)
            ════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── 1. Import Profile via JSON ── */}
          <section className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <FileText size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Import Profile via JSON</h2>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <label
                  htmlFor="json-file-input"
                  className="flex items-center gap-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-100 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  {translatingJson ? <RefreshCw size={13} className="animate-spin text-zinc-400" /> : <Upload size={13} className="text-zinc-400" />}
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
                  <span className="text-xs text-zinc-300 font-mono bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <FileText size={12} className="text-emerald-400" />
                    {uploadedJsonName}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
                >
                  <Download size={13} className="text-zinc-400" />
                  Export Profile JSON
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="translate-json-toggle"
                  type="checkbox"
                  checked={translateJsonEn}
                  onChange={(e) => setTranslateJsonEn(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-800 border-zinc-700 accent-emerald-500 cursor-pointer"
                />
                <label htmlFor="translate-json-toggle" className="text-xs text-zinc-400 cursor-pointer select-none">
                  Translate RU &rarr; EN on import
                </label>
              </div>
            </div>
          </section>

          {/* ── 2. Profile Identity ── */}
          <section className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Target size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Profile Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  PROFILE NAME
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Full Stack Developer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <TagInput
                  id="target-roles"
                  label="TARGET ROLES"
                  value={form.targetRoles}
                  onChange={(roles) => setForm((p) => ({ ...p, targetRoles: roles }))}
                  placeholder="Type role (e.g. 'fron') & Enter..."
                  catalog={ROLES}
                  hint="Type keywords like 'fron' to see recommendations."
                />
              </div>
            </div>
          </section>

          {/* ── 3. Interface Language & Localization ── */}
          <section id="section-language" className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Globe size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">{t("lang.title", "Interface Language & Localization")}</h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {t("lang.subtitle", "Choose your preferred language for the assistant dashboard. English is enabled by default.")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: "en", name: "English", desc: "Default System Language (Global / CIS)" },
                { code: "ru", name: "Русский (СНГ)", desc: "HeadHunter Native & CIS Region" },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code as any)}
                  className={`p-3.5 rounded-lg border text-left transition-all ${
                    language === item.code
                      ? "bg-zinc-800/90 border-emerald-500/50 shadow-sm"
                      : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/40 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${language === item.code ? "text-emerald-400" : "text-zinc-200"}`}>
                      {item.name}
                    </span>
                    {language === item.code && <Check size={13} className="text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">{item.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── 4. HH.ru Account & Session Sync ── */}
          <section id="section-hh-sync" className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-100">{t("hh.sectionTitle", "HH.ru Account & Session Sync")}</h2>
              </div>
              <button
                type="button"
                onClick={handleCheckSession}
                disabled={checkingSession}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700/80 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={checkingSession ? "animate-spin text-emerald-400" : "text-zinc-400"} />
                {t("hh.checkSession", "Check Session")}
              </button>
            </div>

            {/* Session Status Banner */}
            <div
              className={`px-3.5 py-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                form.hhSessionStatus === "active"
                  ? "bg-emerald-950/20 border-emerald-500/20 text-zinc-300"
                  : "bg-red-950/20 border-red-500/20 text-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {form.hhSessionStatus === "active" ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                )}
                <span className="font-medium text-zinc-200">
                  {form.hhSessionStatus === "active"
                    ? t("hh.active", "HeadHunter Session: Active & Connected")
                    : t("hh.disconnected", "HeadHunter Session: Disconnected / Expired")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                <span>{t("hh.ttl", "TTL: ~30 days")}</span>
                <span>Last: {formatRelativeTime(form.hhLastVerifiedAt)}</span>
              </div>
            </div>

            {/* Segmented Mode Switcher */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800/80 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setHhConnectMode("console")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
                    hhConnectMode === "console"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Terminal size={13} className={hhConnectMode === "console" ? "text-emerald-400" : "text-zinc-400"} />
                  <span>{t("hh.modeConsole", "Session Token / Cookie")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHhConnectMode("oauth")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
                    hhConnectMode === "oauth"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Globe size={13} className={hhConnectMode === "oauth" ? "text-emerald-400" : "text-zinc-400"} />
                  <span>{t("hh.modeOAuth", "Official OAuth")}</span>
                </button>
              </div>

              {/* Active Mode Panel */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3.5 space-y-3">
                {hhConnectMode === "console" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="font-mono text-zinc-400">
                        Method: DevTools (F12) Network/Application OR 1-Click Chrome Extension
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {t("hh.cloudCompatible", "100% Cloud Compatible")}
                      </span>
                    </div>

                    <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 space-y-1.5 text-xs text-zinc-300">
                      <div className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-line">
                        {t(
                          "hh.consoleInstructions",
                          "1. In F12 DevTools on hh.ru, go to Application > Cookies > https://hh.ru (or Network tab > Request Headers > Cookie).\n2. Copy the hhtoken value or the full cookie string (hhtoken, _xsrf, hhuid), paste below, and click Connect."
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {t(
                          "hh.consoleNote",
                          "Note: hh.ru protects hhtoken with HttpOnly flag, which prevents document.cookie in Console. Extracting from Application tab, Network tab, or the 1-Click Sync Chrome Extension captures all session cookies."
                        )}
                      </div>
                    </div>

                    {/* Integrated Token Paste & Connect */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
                      <input
                        type="text"
                        value={form.hhToken}
                        onChange={(e) => setForm((p) => ({ ...p, hhToken: e.target.value.trim() }))}
                        placeholder={t("hh.tokenPlaceholder", "Paste HeadHunter token here (Ctrl + V)...")}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleValidateHH}
                        disabled={validatingHH || !form.hhToken}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all disabled:opacity-50 shrink-0 shadow-sm"
                      >
                        {validatingHH ? <RefreshCw size={12} className="animate-spin text-zinc-950" /> : <Check size={12} />}
                        <span>{validatingHH ? t("action.validating", "Validating & Saving...") : t("action.connect", "Connect & Save Token")}</span>
                      </button>
                      {form.hhToken && form.hhSessionStatus === "active" && (
                        <button
                          type="button"
                          onClick={handleDisconnectHH}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-red-950/40 hover:text-red-400 text-zinc-400 text-xs border border-zinc-700 transition-colors shrink-0"
                          title="Clear and disconnect this token"
                        >
                          <span>Disconnect</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {hhConnectMode === "oauth" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-medium text-zinc-200">{t("hh.oauthTitle", "Official HeadHunter OAuth 2.0")}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {t("hh.oauthDesc", "Authorize directly via official HeadHunter servers. Works on mobile, desktop, and cloud.")}
                      </div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                    <a
                      href="/api/auth/hh/login"
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-medium border border-zinc-700 shrink-0 transition-colors"
                    >
                      <Globe size={13} />
                      <span>{t("hh.oauthBtn", "Official Login (OAuth)")}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Resume Box */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span className="text-zinc-300">
                  Connected to Resume: <strong className="text-zinc-100">{form.hhResumeTitle || "Fullstack-разработчик"}</strong>
                  {form.hhResumeId && <span className="text-zinc-500 ml-1 font-mono">#{form.hhResumeId}</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                {hhResumes.length > 0 ? (
                  <select
                    value={form.hhResumeId}
                    onChange={(e) => {
                      const sel = hhResumes.find((r) => r.id === e.target.value);
                      if (sel) {
                        setForm((prev) => ({
                          ...prev,
                          hhResumeId: sel.id,
                          hhResumeTitle: sel.title,
                        }));
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none"
                  >
                    {hhResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                    {form.hhResumeTitle ? `${form.hhResumeTitle} (Default)` : "No resume chosen"}
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 font-mono">Auto-bump every 4 hours &bull; Last: 42m ago</span>
              </div>
            </div>

            {/* 3 Metrics Mini Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">TOTAL AUTO-APPLIES</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-zinc-100">{form.hhTotalApplications || 142}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">+14 this week</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">CAPTURED EXPIRY</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-zinc-100">~30 Days</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Auto-renew</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">KEEPALIVE INTERVAL</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold font-mono text-zinc-100">15 min</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Active Daemon</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 4. Search & Matching Criteria ── */}
          <section id="section-search-filters" className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Search size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Search &amp; Matching Criteria</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TagInput
                  id="search-keywords-en"
                  label="ENGLISH KEYWORDS"
                  value={form.searchKeywordsEn}
                  onChange={(kws) => setForm((p) => ({ ...p, searchKeywordsEn: kws }))}
                  placeholder="e.g. React, Next.js, TypeScript..."
                  catalog={SKILLS}
                />
              </div>

              <div>
                <TagInput
                  id="search-keywords-ru"
                  label="RUSSIAN KEYWORDS"
                  value={form.searchKeywordsRu}
                  onChange={(kws) => setForm((p) => ({ ...p, searchKeywordsRu: kws }))}
                  placeholder="e.g. Фронтенд, Разработчик..."
                  catalog={KEYWORDS_RU}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TagInput
                  id="required-skills"
                  label="REQUIRED SKILLS (HARD CRITERIA)"
                  value={form.requiredSkills}
                  onChange={(skills) => setForm((p) => ({ ...p, requiredSkills: skills }))}
                  placeholder="e.g. React, TypeScript, Node.js..."
                  catalog={SKILLS}
                />
              </div>

              <div>
                <TagInput
                  id="nice-to-have-skills"
                  label="NICE-TO-HAVE SKILLS (BONUS WEIGHT)"
                  value={form.niceToHaveSkills}
                  onChange={(skills) => setForm((p) => ({ ...p, niceToHaveSkills: skills }))}
                  placeholder="e.g. Docker, GraphQL, Tailwind..."
                  catalog={SKILLS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  EXPERIENCE LEVEL
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPERIENCE_OPTIONS.map((opt) => {
                    const isChecked = form.experience.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleArrayItem("experience", opt.value)}
                          className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 accent-emerald-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  WORK FORMAT
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORK_FORMAT_OPTIONS.map((opt) => {
                    const isChecked = form.workFormat.includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300 font-medium"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleArrayItem("workFormat", opt.value)}
                          className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 accent-emerald-500"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── 5. Scoring & Notification Thresholds ── */}
          <section className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Sliders size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Scoring &amp; Notification Thresholds</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    MIN MATCH SCORE
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {form.minimumScoreToNotify} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={form.minimumScoreToNotify}
                  onChange={(e) => setForm((p) => ({ ...p, minimumScoreToNotify: parseInt(e.target.value, 10) }))}
                  className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Only alert on high alignment</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  MAX ALERTS / DAY
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.maxNotificationsPerDay}
                  onChange={(e) => setForm((p) => ({ ...p, maxNotificationsPerDay: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Avoid notification fatigue</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  MINIMUM SALARY
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.salaryMinimum}
                    onChange={(e) => setForm((p) => ({ ...p, salaryMinimum: e.target.value }))}
                    placeholder="180000"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                  />
                  <select
                    value={form.salaryCurrency}
                    onChange={(e) => setForm((p) => ({ ...p, salaryCurrency: e.target.value }))}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="RUR">RUR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Net after taxes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <TagInput
                  id="exclude-keywords"
                  label="NEGATIVE STACK FILTERS (EXCLUDE)"
                  value={form.excludeKeywords}
                  onChange={(tags) => setForm((p) => ({ ...p, excludeKeywords: tags }))}
                  placeholder="e.g. 1C, PHP, Bitrix..."
                  catalog={EXCLUDE_KEYWORDS}
                />
              </div>

              <div>
                <TagInput
                  id="red-flag-keywords"
                  label="RED FLAG KEYWORDS (AUTO DISCARD)"
                  value={form.redFlagKeywords}
                  onChange={(tags) => setForm((p) => ({ ...p, redFlagKeywords: tags }))}
                  placeholder="e.g. deposit, unpaid, паспорт..."
                  catalog={RED_FLAG_KEYWORDS}
                />
              </div>
            </div>
          </section>

          {/* ── 6. Cover Letter Context & AI Generation ── */}
          <section id="section-ai-context" className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Sparkles size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Cover Letter Context &amp; AI Generation</h2>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  CANDIDATE CONTEXT &amp; KEY HIGHLIGHTS
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Injects dynamically into LLM prompts</span>
              </div>
              <textarea
                rows={7}
                value={form.resumeText}
                onChange={(e) => setForm((p) => ({ ...p, resumeText: e.target.value }))}
                placeholder="Describe your career highlights, tech stack preferences, and strengths for the cover letter..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                PORTFOLIO / GITHUB CRAWL URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                  placeholder="https://yourportfolio.dev"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestPortfolio}
                  disabled={testingPortfolio}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-50"
                >
                  {testingPortfolio ? <RefreshCw size={13} className="animate-spin text-emerald-400" /> : <Bot size={13} />}
                  <span>Test Crawl Bot</span>
                </button>
              </div>
            </div>
          </section>

          {/* ── 7. AI Model Strategy, BYOK & Task Routing ── */}
          <section className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/60">
              <Bot size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">AI Model Strategy &amp; BYOK Configuration</h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Assign dedicated AI engines to specific tasks (Deep Context Analysis vs. Cover Letter Drafting), bring your own API keys (BYOK) from any provider, connect local models (Ollama/vLLM), and configure cascade failover priority.
            </p>

            {/* Subsection 1: Task-Specific Routing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deep Context & Scoring Analysis */}
              <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Cpu size={15} className="text-blue-400" />
                  <span className="text-xs font-semibold">Deep Context &amp; Scoring</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Engine used to score job-resume compatibility, identify red flags, and analyze vacancy requirements.
                </p>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 mb-1 block">Assigned Provider</label>
                  <select
                    value={form.aiCustomConfig?.taskRouting?.deepAnalysis || form.aiProviderOrder[0] || "deepseek"}
                    onChange={(e) => updateTaskRouting("deepAnalysis", e.target.value as AIProvider)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="deepseek">DeepSeek (V3 / R1 Reasoning)</option>
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash / Pro)</option>
                    <option value="openai">OpenAI (GPT-4o / o3-mini)</option>
                    <option value="anthropic">Anthropic Claude (Sonnet 3.7 / Haiku)</option>
                    <option value="groq">Groq (Llama-3.3-70b / Fast LPU)</option>
                    <option value="openrouter">OpenRouter (Universal Gateway)</option>
                    <option value="custom">Custom / Local LLM (Ollama, vLLM)</option>
                  </select>
                </div>
              </div>

              {/* Cover Letter Generation */}
              <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Zap size={15} className="text-emerald-400" />
                  <span className="text-xs font-semibold">Cover Letter Generation</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Engine used to draft tailored, human-sounding cover letters adapted to your portfolio and resume.
                </p>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 mb-1 block">Assigned Provider</label>
                  <select
                    value={form.aiCustomConfig?.taskRouting?.coverLetter || form.aiProviderOrder[0] || "deepseek"}
                    onChange={(e) => updateTaskRouting("coverLetter", e.target.value as AIProvider)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="deepseek">DeepSeek (V3 / R1 Reasoning)</option>
                    <option value="openai">OpenAI (GPT-4o / o3-mini)</option>
                    <option value="anthropic">Anthropic Claude (Sonnet 3.7 / Haiku)</option>
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash / Pro)</option>
                    <option value="groq">Groq (Llama-3.3-70b / Fast LPU)</option>
                    <option value="openrouter">OpenRouter (Universal Gateway)</option>
                    <option value="custom">Custom / Local LLM (Ollama, vLLM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subsection 2: BYOK Provider Configurator */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-200">Custom Provider Credentials (BYOK)</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Config stored per profile
                </span>
              </div>

              {/* Provider Tab Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {AI_PROVIDERS_CONFIG.map((prov) => {
                  const isCurrent = selectedAiTab === prov.id;
                  const hasCustomKey = Boolean(form.aiCustomConfig?.customProviders?.[prov.id]?.apiKey);
                  const hasCustomModel = Boolean(form.aiCustomConfig?.customProviders?.[prov.id]?.model);

                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => {
                        setSelectedAiTab(prov.id);
                        setTestAiResult(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                        isCurrent
                          ? "bg-zinc-800 text-zinc-100 border-emerald-500/50 shadow-sm"
                          : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <span>{prov.label}</span>
                      {(hasCustomKey || hasCustomModel) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom config active" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Tab Form Panel */}
              {(() => {
                const provMeta = AI_PROVIDERS_CONFIG.find((p) => p.id === selectedAiTab) || AI_PROVIDERS_CONFIG[0];
                const currentProvConfig = form.aiCustomConfig?.customProviders?.[selectedAiTab] || {};
                const isKeyVisible = Boolean(showAiKeys[selectedAiTab]);

                return (
                  <div className="space-y-3.5 pt-2">
                    <div>
                      <div className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <span>{provMeta.label} Configuration</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {provMeta.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{provMeta.desc}</p>
                    </div>

                    {/* API Key */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-zinc-300">
                          {provMeta.isLocal ? "Bearer Token (Optional for Localhost)" : "API Key (BYOK)"}
                        </label>
                        <span className="text-[10px] text-zinc-500">
                          {currentProvConfig.apiKey ? "Custom key active" : "Using system environment if empty"}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type={isKeyVisible ? "text" : "password"}
                          value={currentProvConfig.apiKey || ""}
                          onChange={(e) => updateProviderConfig(selectedAiTab, { apiKey: e.target.value })}
                          placeholder={provMeta.keyPlaceholder}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAiKeys((prev) => ({ ...prev, [selectedAiTab]: !prev[selectedAiTab] }))}
                          aria-label="Toggle API Key visibility"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          {isKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Base URL (if custom) */}
                    {provMeta.isLocal && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-zinc-300">Base URL</label>
                        <input
                          type="text"
                          value={currentProvConfig.baseUrl || ""}
                          onChange={(e) => updateProviderConfig(selectedAiTab, { baseUrl: e.target.value })}
                          placeholder="http://localhost:11434/v1"
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-zinc-500">
                          e.g. Ollama: http://localhost:11434/v1 &bull; LM Studio: http://localhost:1234/v1 &bull; vLLM: http://localhost:8000/v1
                        </span>
                      </div>
                    )}

                    {/* Model Name & Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-300">Model Name</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={currentProvConfig.model || ""}
                          onChange={(e) => updateProviderConfig(selectedAiTab, { model: e.target.value })}
                          placeholder={`Default: ${provMeta.defaultModel}`}
                          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                        />
                        {currentProvConfig.model && (
                          <button
                            type="button"
                            onClick={() => updateProviderConfig(selectedAiTab, { model: "" })}
                            className="px-2.5 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-700 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Quick Model Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] font-mono text-zinc-500">Presets:</span>
                        {provMeta.presets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateProviderConfig(selectedAiTab, { model: preset })}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                              currentProvConfig.model === preset || (!currentProvConfig.model && preset === provMeta.defaultModel)
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Test Connection Button & Result */}
                    <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleTestAi(selectedAiTab)}
                        disabled={testingAi}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors disabled:opacity-50"
                      >
                        {testingAi ? <RefreshCw size={13} className="animate-spin text-emerald-400" /> : <Play size={13} />}
                        <span>{testingAi ? "Testing Ping..." : "Test Connection"}</span>
                      </button>

                      {testAiResult && testAiResult.provider === selectedAiTab && (
                        <div
                          className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded border ${
                            testAiResult.success
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-red-500/10 border-red-500/30 text-red-400"
                          }`}
                        >
                          {testAiResult.success ? <Check size={12} /> : <AlertTriangle size={12} />}
                          <span>
                            {testAiResult.message}
                            {testAiResult.latencyMs ? ` (${testAiResult.latencyMs}ms)` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Subsection 3: Cascade Failover Order */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Cascade Failover Priority</span>
                  <p className="text-[11px] text-zinc-400">
                    Failover sequence if primary engines encounter rate limits or temporary network errors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const allProviders: AIProvider[] = ["deepseek", "groq", "gemini", "openrouter", "openai", "anthropic", "custom"];
                    const currentSet = new Set(form.aiProviderOrder);
                    const next = allProviders.find((p) => !currentSet.has(p));
                    if (next) {
                      const updated = [...form.aiProviderOrder, next];
                      setForm((prev) => ({
                        ...prev,
                        aiProviderOrder: updated,
                        aiCustomConfig: {
                          ...(prev.aiCustomConfig || {
                            order: updated,
                            taskRouting: { deepAnalysis: updated[0] as AIProvider, coverLetter: updated[0] as AIProvider },
                            customProviders: {},
                          }),
                          order: updated as AIProvider[],
                        },
                      }));
                    }
                  }}
                  disabled={form.aiProviderOrder.length >= 7}
                  className="text-[11px] px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  + Add Provider to Chain
                </button>
              </div>

              <div className="space-y-2">
                {form.aiProviderOrder.map((providerKey, idx) => {
                  const provMeta = AI_PROVIDERS_CONFIG.find((p) => p.id === providerKey) || {
                    id: providerKey as AIProvider,
                    label: providerKey,
                    tag: "Custom Engine",
                    defaultModel: "Default Model",
                    presets: [],
                    keyPlaceholder: "",
                    desc: "External API Provider",
                  };

                  const customModel = form.aiCustomConfig?.customProviders?.[providerKey as AIProvider]?.model;
                  const activeModel = customModel || provMeta.defaultModel;

                  return (
                    <div
                      key={`${providerKey}-${idx}`}
                      className="flex items-center justify-between bg-zinc-950 border border-zinc-800/90 rounded-lg p-3 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded flex items-center justify-center bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-100">{provMeta.label}</span>
                            <span className="text-[10px] font-mono text-zinc-400">({activeModel})</span>
                            {idx === 0 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase font-semibold">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{provMeta.tag}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moveProvider(idx, "up")}
                          disabled={idx === 0}
                          aria-label={`Move ${provMeta.label} up`}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveProvider(idx, "down")}
                          disabled={idx === form.aiProviderOrder.length - 1}
                          aria-label={`Move ${provMeta.label} down`}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown size={13} />
                        </button>
                        {form.aiProviderOrder.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = form.aiProviderOrder.filter((_, i) => i !== idx);
                              setForm((prev) => ({
                                ...prev,
                                aiProviderOrder: updated,
                                aiCustomConfig: {
                                  ...(prev.aiCustomConfig || {
                                    order: updated,
                                    taskRouting: { deepAnalysis: updated[0] as AIProvider, coverLetter: updated[0] as AIProvider },
                                    customProviders: {},
                                  }),
                                  order: updated as AIProvider[],
                                },
                              }));
                            }}
                            title="Remove from cascade chain"
                            className="p-1.5 rounded bg-zinc-900 hover:bg-red-950/40 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── 8. Telegram Bot Notifications ── */}
          <section id="section-telegram" className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-5 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Telegram Bot Notifications</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {tgLinked ? `Linked as @${tgUsername || "Telegram User"}` : "Unlinked"}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                DEVICE SYNC TOKEN
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400">
                  {tgToken || "Click 'Generate' to create a link token"}
                </div>
                <button
                  type="button"
                  onClick={handleCopyTgToken}
                  disabled={!tgToken}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs border border-zinc-700/80 transition-colors"
                  title="Copy link command"
                >
                  {copiedTg ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button
                  type="button"
                  onClick={handleGenerateTgToken}
                  disabled={generatingTg}
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border border-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  {generatingTg ? "..." : "Generate"}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Send this authentication command to the Telegram bot: <code className="text-zinc-400">/link {tgToken || "TOKEN"}</code>
              </p>
            </div>
          </section>

        </div>

        {/* ════════════════════════════════════════════════════════
            RIGHT COLUMN: Sidebar Profile, Telemetry & Jumps (4 Cols)
            ════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-6">

          {/* ── Card 1: User Profile Card ── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 shadow-sm sticky top-6 space-y-5">
            <div className="flex items-start justify-between">
              {/* Avatar Photo / Initial with gradient */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/30 shadow-sm shrink-0 bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-lg">
                {form.hhProfileAvatar ? (
                  <img
                    src={form.hhProfileAvatar}
                    alt={form.hhProfileName || form.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                <span className="select-none">
                  {form.hhProfileName
                    ? form.hhProfileName
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : form.name
                    ? form.name.slice(0, 2).toUpperCase()
                    : "CV"}
                </span>
              </div>

              <div className="flex items-center">
                {/* Clean pill badge with text only */}
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded tracking-wider uppercase border ${
                    form.hhSessionStatus === "active"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {form.hhSessionStatus === "active" ? "SESSION ACTIVE" : "SESSION DISCONNECTED"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {form.hhProfileName || form.name || "Candidate Profile"}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {form.hhResumeTitle ? `Active CV: ${form.hhResumeTitle}` : "Connect your HeadHunter account to sync resumes"}
              </p>
            </div>

            {/* 3 Stats Row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center">
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">{stats.appliedCount || form.hhTotalApplications || 0}</div>
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">RESPONSES</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-zinc-100">{form.hhResumeTitle ? 1 : 0}</div>
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">ACTIVE CV</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-emerald-400">{stats.avgScore || 0}%</div>
                <div className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">AVG MATCH</div>
              </div>
            </div>

            {/* Reconnect & Sync Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckSession}
                disabled={checkingSession}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {checkingSession ? <RefreshCw size={13} className="animate-spin text-zinc-950" /> : <RotateCw size={13} />}
                <span>Check & Refresh Session</span>
              </button>

              <button
                type="button"
                onClick={handleSyncHistory}
                disabled={syncingHH}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/80 transition-colors disabled:opacity-50"
              >
                {syncingHH ? <RefreshCw size={13} className="animate-spin text-emerald-400" /> : <RefreshCw size={13} />}
                <span>Sync History to Local DB</span>
              </button>
            </div>
          </div>

          {/* ── Card 2: Worker Telemetry ── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-emerald-400" />
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Worker Telemetry</h3>
              </div>
              {/* NO round dot: clean text pill */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Active Daemon
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sync Cadence</span>
                <span className="font-mono text-zinc-200">Daily Cron (00:00 UTC)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Score Threshold</span>
                <span className="font-mono text-emerald-400">{form.minimumScoreToNotify}% min match</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Max Alerts</span>
                <span className="font-mono text-zinc-200">{form.maxNotificationsPerDay} / day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Primary Provider</span>
                <span className="font-mono text-zinc-200 uppercase">{form.aiProviderOrder[0] || "groq"}</span>
              </div>
            </div>
          </div>

          {/* ── Card 3: Quick Section Jump ── */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
            <h3 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              QUICK SECTION JUMP
            </h3>

            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => scrollToSection("section-hh-sync")}
                className="w-full flex items-center justify-between p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <span>HH.ru Sync &amp; Auth</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("section-search-filters")}
                className="w-full flex items-center justify-between p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <span>Search &amp; Match Filters</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("section-ai-context")}
                className="w-full flex items-center justify-between p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <span>AI Context &amp; LLM Rules</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("section-telegram")}
                className="w-full flex items-center justify-between p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <span>Telegram Bot Pipeline</span>
                <ChevronRight size={14} className="text-zinc-500" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
