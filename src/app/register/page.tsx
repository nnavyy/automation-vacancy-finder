"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Briefcase,
  Sparkles,
  Sliders,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { BrandLogo } from "@/components/BrandLogo";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import TagInput from "@/components/ui/TagInput";
import { ROLES, SKILLS } from "@/lib/catalog/data";

interface TrackPreset {
  id: string;
  label: string;
  subtitle: string;
  roles: string[];
  keywordsEn: string[];
  keywordsRu: string[];
  requiredSkills: string[];
  niceToHaveSkills: string[];
}

const TRACK_PRESETS: TrackPreset[] = [
  {
    id: "fullstack",
    label: "Full Stack & Web Engineering",
    subtitle: "End-to-end web apps, APIs & modern frontend",
    roles: ["Fullstack Developer", "Frontend Developer", "Web Developer"],
    keywordsEn: ["full stack developer", "frontend developer", "react developer", "next.js developer"],
    keywordsRu: ["фулстек разработчик", "фронтенд разработчик", "веб разработчик", "react разработчик"],
    requiredSkills: ["React", "TypeScript", "JavaScript", "Next.js"],
    niceToHaveSkills: ["Node.js", "Tailwind CSS", "PostgreSQL", "Git"],
  },
  {
    id: "frontend",
    label: "Frontend & Interactive UI",
    subtitle: "React, Next.js, TypeScript & design systems",
    roles: ["Frontend Developer", "React Developer", "Next.js Developer"],
    keywordsEn: ["frontend developer", "react developer", "typescript developer", "next.js"],
    keywordsRu: ["фронтенд разработчик", "react разработчик", "верстальщик", "веб разработчик"],
    requiredSkills: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3"],
    niceToHaveSkills: ["Next.js", "Tailwind CSS", "Redux", "Figma"],
  },
  {
    id: "backend",
    label: "Backend & Systems Architecture",
    subtitle: "APIs, microservices, databases & cloud scale",
    roles: ["Backend Developer", "Software Engineer", "Node.js Developer", "Python Developer"],
    keywordsEn: ["backend developer", "node.js developer", "python developer", "software engineer"],
    keywordsRu: ["бэкенд разработчик", "backend разработчик", "программист", "инженер программист"],
    requiredSkills: ["Node.js", "Python", "PostgreSQL", "REST API"],
    niceToHaveSkills: ["Docker", "Redis", "TypeScript", "Microservices"],
  },
  {
    id: "design",
    label: "UI/UX & Website Design",
    subtitle: "Product design, Figma, Webflow, Framer & Tilda",
    roles: ["UI/UX Designer", "Product Designer", "Graphic Designer", "Web Developer"],
    keywordsEn: ["ui/ux designer", "product designer", "web designer", "webflow", "framer"],
    keywordsRu: ["ui/ux дизайнер", "веб дизайнер", "продуктовый дизайнер", "тильда", "дизайнер сайтов"],
    requiredSkills: ["Figma", "UI/UX", "Prototyping", "Web Design"],
    niceToHaveSkills: ["Framer", "Webflow", "HTML5", "CSS3"],
  },
  {
    id: "ai",
    label: "AI, Vibe Coding & Automation",
    subtitle: "LLMs, AI agents, prompt engineering & rapid shipping",
    roles: ["AI Engineer", "Prompt Engineer", "Fullstack Developer", "Python Developer"],
    keywordsEn: ["ai engineer", "llm engineer", "prompt engineer", "automation engineer", "full stack"],
    keywordsRu: ["ai разработчик", "инженер ии", "промпт инженер", "автоматизация", "python разработчик"],
    requiredSkills: ["Python", "TypeScript", "OpenAI API", "REST API"],
    niceToHaveSkills: ["Next.js", "React", "LangChain", "PostgreSQL"],
  },
  {
    id: "mobile",
    label: "Mobile App Development",
    subtitle: "React Native, Flutter, iOS & Android apps",
    roles: ["Mobile Developer", "React Native Developer", "Flutter Developer"],
    keywordsEn: ["mobile developer", "react native developer", "flutter developer", "ios", "android"],
    keywordsRu: ["мобильный разработчик", "react native разработчик", "flutter разработчик"],
    requiredSkills: ["React Native", "TypeScript", "JavaScript"],
    niceToHaveSkills: ["Flutter", "iOS", "Android", "REST API"],
  },
  {
    id: "data",
    label: "Data Science & Analytics",
    subtitle: "Data analysis, BI dashboards, SQL & ML models",
    roles: ["Data Analyst", "Data Scientist", "BI Analyst", "Machine Learning Engineer"],
    keywordsEn: ["data analyst", "data scientist", "bi analyst", "sql", "python"],
    keywordsRu: ["аналитик данных", "data analyst", "дата сайентист", "bi аналитик"],
    requiredSkills: ["SQL", "Python", "Data Analysis"],
    niceToHaveSkills: ["Power BI", "Tableau", "Pandas", "ClickHouse"],
  },
  {
    id: "product",
    label: "Product & Project Management",
    subtitle: "Product strategy, roadmaps, Agile & B2B/B2C delivery",
    roles: ["Product Manager", "Project Manager", "Business Analyst", "System Analyst"],
    keywordsEn: ["product manager", "project manager", "business analyst", "scrum master"],
    keywordsRu: ["продакт менеджер", "проектный менеджер", "бизнес аналитик", "системный аналитик"],
    requiredSkills: ["Product Management", "Agile", "Scrum", "Jira"],
    niceToHaveSkills: ["SQL", "A/B Testing", "B2B", "Figma"],
  },
];

const EXPERIENCE_CHOICES = [
  { value: "noExperience", label: "No Experience / Intern", sub: "Entry level & trainee roles" },
  { value: "between1And3", label: "1–3 Years", sub: "Junior to Mid-level" },
  { value: "between3And6", label: "3–6 Years", sub: "Mid to Senior level" },
  { value: "moreThan6", label: "6+ Years", sub: "Senior, Lead & Staff" },
];

const WORK_FORMAT_CHOICES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "office", label: "On-site / Office" },
];

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

export default function RegisterPage() {
  const router = useRouter();

  // Overall wizard step: "questions" (pre-signup profile setup) -> "account" (credentials) -> "otp" (email verification)
  const [step, setStep] = useState<"questions" | "account" | "otp">("questions");
  const [questionTab, setQuestionTab] = useState<1 | 2 | 3>(1);

  // Step 1: Pre-signup Questionnaire State
  const [selectedTracks, setSelectedTracks] = useState<string[]>(["fullstack"]);
  const [profileName, setProfileName] = useState("Full Stack & Web");
  const [targetRoles, setTargetRoles] = useState<string[]>(TRACK_PRESETS[0].roles);
  const [requiredSkills, setRequiredSkills] = useState<string[]>(TRACK_PRESETS[0].requiredSkills);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>(TRACK_PRESETS[0].niceToHaveSkills);
  const [experience, setExperience] = useState<string[]>(["noExperience", "between1And3"]);
  const [workFormat, setWorkFormat] = useState<string[]>(["remote"]);
  const [salaryMinimum, setSalaryMinimum] = useState<string>("");
  const [salaryCurrency, setSalaryCurrency] = useState<string>("RUR");
  const [resumeText, setResumeText] = useState<string>("");

  // Step 2: Account Credentials State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: OTP State
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Toggle specialization track and sync roles/skills automatically
  const handleToggleTrack = (trackId: string) => {
    setSelectedTracks((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];

      const activePresets = TRACK_PRESETS.filter((p) => next.includes(p.id));
      if (activePresets.length > 0) {
        setTargetRoles(uniqueStrings(activePresets.flatMap((p) => p.roles)));
        setRequiredSkills(uniqueStrings(activePresets.flatMap((p) => p.requiredSkills)));
        setNiceToHaveSkills(uniqueStrings(activePresets.flatMap((p) => p.niceToHaveSkills)));
        setProfileName(
          activePresets.length === 1
            ? activePresets[0].label.split("&")[0].trim()
            : `${activePresets[0].label.split("&")[0].trim()} + ${activePresets.length - 1}`
        );
      }
      return next;
    });
  };

  const toggleMultiChoice = (
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    setter(current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
  };

  const handleNextQuestion = () => {
    setError(null);
    if (questionTab === 1) {
      if (selectedTracks.length === 0 && targetRoles.length === 0) {
        setError("Please select at least one specialization track to continue.");
        return;
      }
      setQuestionTab(2);
    } else if (questionTab === 2) {
      if (targetRoles.length === 0) {
        setError("Please keep or add at least one target role.");
        return;
      }
      setQuestionTab(3);
    } else {
      if (experience.length === 0) {
        setError("Please select at least one experience level.");
        return;
      }
      if (workFormat.length === 0) {
        setError("Please select at least one work format.");
        return;
      }
      setStep("account");
    }
  };

  // Derive EN + RU search keywords from chosen tracks and target roles
  const buildOnboardingPayload = () => {
    const activePresets = TRACK_PRESETS.filter((p) => selectedTracks.includes(p.id));
    const keywordsEn = uniqueStrings([
      ...activePresets.flatMap((p) => p.keywordsEn),
      ...targetRoles.map((r) => r.toLowerCase()),
    ]);
    const keywordsRu = uniqueStrings(activePresets.flatMap((p) => p.keywordsRu));

    return {
      name: profileName.trim() || targetRoles[0] || "Default",
      targetRoles,
      searchKeywordsEn: keywordsEn,
      searchKeywordsRu: keywordsRu,
      requiredSkills,
      niceToHaveSkills,
      experience,
      workFormat,
      salaryMinimum: salaryMinimum.trim() ? parseInt(salaryMinimum.trim(), 10) || null : null,
      salaryCurrency,
      resumeText: resumeText.trim(),
    };
  };

  // Step 2: Create account with pre-configured profile and send 6-digit OTP email
  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(cleanEmail)) {
      setLoading(false);
      router.push("/");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          onboardingProfile: buildOnboardingPayload(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      // Clear any stale local settings cache so the new profile loads cleanly
      try {
        localStorage.removeItem("hh_settings_cache_v2");
      } catch {}

      setStep("otp");
      setResendCooldown(60);
    } catch {
      setError("Network error while creating your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify 6-digit OTP and sign straight into the dashboard
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      code: code.trim(),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error || "Invalid or expired verification code.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
      } else {
        setError(data.error || "Failed to resend verification code.");
      }
    } catch {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className={`w-full ${step === "questions" ? "max-w-xl" : "max-w-md"} relative z-10 transition-all duration-200`}>
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <BrandLogo size={44} className="mb-3 drop-shadow-md" />
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            {BRAND_NAME}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {step === "questions"
              ? `Step ${questionTab} of 3 — Tell us what you do so we can build your search profile`
              : step === "account"
              ? "Profile ready — create your account to launch your job copilot"
              : "Verify your email address to activate your account"}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-1.5 mt-4 w-48">
            <div className="h-1 flex-1 rounded-full bg-emerald-500" />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step !== "questions" || questionTab >= 2 ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step !== "questions" || questionTab >= 3 ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                step === "account" || step === "otp" ? "bg-emerald-500" : "bg-zinc-800"
              }`}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg font-medium leading-relaxed mb-4">
              {error}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 1: PRE-SIGNUP ONBOARDING QUESTIONNAIRE (3 SUB-STEPS)
              ═══════════════════════════════════════════════════════════ */}
          {step === "questions" && (
            <div className="space-y-5">
              {/* Sub-step 1: What do you do? */}
              {questionTab === 1 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Briefcase size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">
                        What do you do, and what field do you want to work in?
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Select one or more specializations. We will pre-fill your target roles, keywords, and tech stack automatically.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                    {TRACK_PRESETS.map((track) => {
                      const active = selectedTracks.includes(track.id);
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => handleToggleTrack(track.id)}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            active
                              ? "bg-emerald-500/10 border-emerald-500/50 text-zinc-100 shadow-sm"
                              : "bg-zinc-950/70 border-zinc-800/90 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold leading-snug">
                              {track.label}
                            </span>
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                active
                                  ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                                  : "border-zinc-700 bg-zinc-900"
                              }`}
                            >
                              {active && <Check size={11} strokeWidth={2.5} />}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                            {track.subtitle}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-step 2: Roles, Skills & What you want to work on */}
              {questionTab === 2 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">
                        What roles and skills match your profile?
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        We pre-filled these based on your selection. Add or remove any roles or skills to tailor your matches.
                      </p>
                    </div>
                  </div>

                  <TagInput
                    id="onboard-target-roles"
                    label="TARGET ROLES"
                    value={targetRoles}
                    onChange={setTargetRoles}
                    catalog={ROLES}
                    placeholder="Add target role (e.g. Frontend Developer)..."
                  />

                  <TagInput
                    id="onboard-required-skills"
                    label="CORE SKILLS & TECH STACK"
                    value={requiredSkills}
                    onChange={setRequiredSkills}
                    catalog={SKILLS}
                    placeholder="Add core skills (e.g. React, TypeScript, Python)..."
                  />

                  <TagInput
                    id="onboard-nice-skills"
                    label="BONUS / NICE-TO-HAVE SKILLS"
                    value={niceToHaveSkills}
                    onChange={setNiceToHaveSkills}
                    catalog={SKILLS}
                    placeholder="Add bonus skills (e.g. Docker, Figma, Node.js)..."
                  />

                  <div>
                    <label
                      htmlFor="onboard-resume-text"
                      className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                    >
                      WHAT DO YOU WANT TO WORK ON? (SHORT BIO / HIGHLIGHTS — OPTIONAL)
                    </label>
                    <textarea
                      id="onboard-resume-text"
                      rows={3}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Briefly describe your experience, key projects, or the type of company and product you want to build..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Sub-step 3: Experience, Work Format & Salary */}
              {questionTab === 3 && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <Sliders size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100">
                        How do you prefer to work?
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Set your experience level, preferred work format, and optional minimum salary filter.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      EXPERIENCE LEVEL
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXPERIENCE_CHOICES.map((opt) => {
                        const checked = experience.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleMultiChoice(experience, setExperience, opt.value)}
                            className={`text-left p-2.5 rounded-lg border transition-colors ${
                              checked
                                ? "bg-emerald-500/10 border-emerald-500/50 text-zinc-100"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{opt.label}</span>
                              {checked && <Check size={13} className="text-emerald-400" />}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{opt.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      PREFERRED WORK FORMAT
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {WORK_FORMAT_CHOICES.map((opt) => {
                        const checked = workFormat.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleMultiChoice(workFormat, setWorkFormat, opt.value)}
                            className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                              checked
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-300"
                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            }`}
                          >
                            {checked && <Check size={12} className="text-emerald-400" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label
                        htmlFor="onboard-profile-name"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        PROFILE NAME
                      </label>
                      <input
                        id="onboard-profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Full Stack & Web"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="onboard-salary"
                        className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5"
                      >
                        MINIMUM SALARY (OPTIONAL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="onboard-salary"
                          type="number"
                          value={salaryMinimum}
                          onChange={(e) => setSalaryMinimum(e.target.value)}
                          placeholder="e.g. 150000"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none"
                        />
                        <select
                          aria-label="Salary currency"
                          value={salaryCurrency}
                          onChange={(e) => setSalaryCurrency(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 text-xs text-zinc-200 focus:outline-none"
                        >
                          <option value="RUR">RUR</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questionnaire Navigation Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                {questionTab > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setQuestionTab((prev) => (prev === 3 ? 2 : 1));
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>Back</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500">
                    {selectedTracks.length} track{selectedTracks.length === 1 ? "" : "s"} selected
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg px-5 py-2.5 text-xs transition-colors shadow-sm shadow-emerald-950/50"
                >
                  <span>{questionTab === 3 ? "Continue to Account Setup" : "Next Question"}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 2: ACCOUNT CREDENTIALS
              ═══════════════════════════════════════════════════════════ */}
          {step === "account" && (
            <form onSubmit={handleSubmitAccount} className="space-y-4">
              {/* Pre-configured Profile Summary Bar */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-medium text-zinc-200 truncate">
                    Profile: <span className="text-emerald-400">{profileName || "Default"}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {targetRoles.length} roles · {requiredSkills.length} core skills · {workFormat.join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep("questions");
                  }}
                  className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] text-zinc-300 shrink-0 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div>
                <label htmlFor="reg-name" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block text-xs text-zinc-400 mb-1.5 font-medium cursor-pointer">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors shadow-sm shadow-emerald-950/50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Sending verification code…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Save Profile</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════
              STEP 3: 6-DIGIT EMAIL OTP VERIFICATION
              ═══════════════════════════════════════════════════════════ */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2.5 mb-1">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  We sent a 6-digit verification code to{" "}
                  <span className="font-semibold text-zinc-100">{email.trim().toLowerCase()}</span>.
                  Enter it below to activate your account and pre-configured profile.
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reg-otp" className="block text-xs text-zinc-400 font-medium cursor-pointer">
                    Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 transition-colors"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    id="reg-otp"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 text-sm transition-colors shadow-sm shadow-emerald-950/50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying & signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("account");
                    setCode("");
                    setError(null);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={12} />
                  Back to account details
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
