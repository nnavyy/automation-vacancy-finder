// ============================================================
// Nanda AI Job Assistant — Shared TypeScript Types
// ============================================================

// ------------------------------------------------------------
// HH API Types
// ------------------------------------------------------------
export interface HHVacancy {
  id: string;
  name: string;
  employer?: { name: string; url?: string };
  area?: { name: string };
  salary?: HHSalary;
  url: string;
  alternate_url: string;
  apply_alternate_url?: string;
  experience?: { id: string; name: string };
  employment?: { id: string; name: string };
  schedule?: { id: string; name: string };
  work_format?: { id: string; name: string }[];
  snippet?: { requirement?: string; responsibility?: string };
  description?: string;
  published_at?: string;
  created_at?: string;
}

export interface HHSalary {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
}

export interface HHVacancyListResponse {
  items: HHVacancy[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
}

// ------------------------------------------------------------
// Normalized Vacancy
// ------------------------------------------------------------
export interface NormalizedVacancy {
  hhId: string;
  title: string;
  company?: string;
  area?: string;
  salary?: HHSalary;
  url?: string;
  applyUrl?: string;
  apiUrl?: string;
  experience?: string;
  employment?: string;
  schedule?: string;
  workFormat?: { id: string; name: string }[];
  snippet?: { requirement?: string; responsibility?: string };
  description?: string;
  descriptionHash?: string;
  rawData?: HHVacancy;
  sourceKeyword?: string;
}

// ------------------------------------------------------------
// AI Analysis Response (strict JSON from AI)
// ------------------------------------------------------------
export interface AIAnalysisResult {
  match_score: number;          // 0–100
  recommendation: "apply" | "maybe" | "skip";
  best_language: "english" | "russian";
  summary: string;
  match_reasons: string[];
  missing_requirements: string[];
  red_flags: RedFlag[];
  cover_letter: string;
  questions_to_recruiter: string[];
  confidence: number;           // 0–100
}

export interface RedFlag {
  trigger_text: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

// Fallback (short) analysis from AI when rate-limited
export interface AIFallbackResult {
  match_score: number;
  recommendation: "apply" | "maybe" | "skip";
  red_flags: { trigger_text: string; reason: string; severity: "low" | "medium" | "high" }[];
  short_reason: string;
  best_language: "english" | "russian";
}

// ------------------------------------------------------------
// Rule-Based Scoring
// ------------------------------------------------------------
export interface RuleScoreResult {
  score: number;
  reasons: string[];
  penalties: string[];
}

// ------------------------------------------------------------
// Search Preferences (from DB)
// ------------------------------------------------------------
export interface SearchPreferenceData {
  id: string;
  name: string;
  targetRoles: string[];
  searchKeywordsEn: string[];
  searchKeywordsRu: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
  experience: string[];
  workFormat: string[];
  salaryMinimum?: number;
  salaryCurrency: string;
  excludeKeywords: string[];
  redFlagKeywords: string[];
  minimumScoreToNotify: number;
  maxNotificationsPerDay: number;
  aiProviderOrder: string[];
  coverLetterLanguage: string;
  resumeText?: string | null;
  portfolioUrl?: string | null;
  isActive: boolean;

  hhToken?: string | null;
  hhResumeId?: string | null;
  hhResumeTitle?: string | null;
  hhProfileName?: string | null;
  hhProfileAvatar?: string | null;
  hhTotalApplications?: number | null;
}

// ------------------------------------------------------------
// Feedback Learning
// ------------------------------------------------------------
export interface SimilarFeedbackExample {
  title: string;
  company?: string;
  userAction: string;
  matchScore?: number;
  summary?: string;
}

// ------------------------------------------------------------
// Telegram
// ------------------------------------------------------------
export interface TelegramCallbackData {
  action: "approve" | "skip" | "save" | "edit_letter";
  vacancyId: string;
}

// ------------------------------------------------------------
// API Response types
// ------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ------------------------------------------------------------
// AI Provider config
// ------------------------------------------------------------
export type AIProvider = "groq" | "gemini" | "openrouter" | "openai" | "ollama" | "rule_based";

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

// ------------------------------------------------------------
// Vacancy status enum
// ------------------------------------------------------------
export type VacancyStatus =
  | "new"
  | "analyzed"
  | "notified"
  | "applied_manual"
  | "skipped"
  | "saved"
  | "ignored"
  | "low_priority";

export type AIStatus = "completed" | "pending_limit" | "failed" | "rule_based_only";
