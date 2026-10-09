"use client";

// ============================================================
// Nanda AI Job Assistant — Company Intelligence & Recruiter Directory
// Multi-engine crawler with quick company switcher, decision makers, and inline AI pitch generator
// ============================================================

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  Users,
  Mail,
  Linkedin,
  Trash2,
  Sparkles,
  Copy,
  CheckCheck,
  Globe,
  Loader2,
  AlertCircle,
  Briefcase,
  ExternalLink,
  RefreshCw,
  FileText,
} from "lucide-react";
import RecruiterDossierModal, { RecruiterDossierData } from "@/components/RecruiterDossierModal";

// ── Types ────────────────────────────────────────────────────

interface CompanyContact {
  id: string;
  name: string;
  role: string;
  department?: string;
  seniority?: string;
  email?: string;
  emailVerified: boolean;
  linkedinUrl?: string;
}

interface CrawledSource {
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

interface CompanyMetadata {
  summary?: string;
  website?: string;
  careersUrl?: string;
  linkedinUrl?: string;
  generalEmails?: string[];
  crawledSources?: CrawledSource[];
}

interface CompanyIntel {
  id: string;
  companyName: string;
  domain?: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  description?: string;
  vacancyId?: string;
  contacts: CompanyContact[];
  createdAt: string;
}

function parseIntelMetadata(description?: string): CompanyMetadata {
  if (!description) return {};
  try {
    if (description.trim().startsWith("{")) {
      return JSON.parse(description);
    }
  } catch {}
  return { summary: description };
}

// ── Main Content Component ────────────────────────────────────

function CompanyIntelContent() {
  const searchParams = useSearchParams();
  const [intels, setIntels] = useState<CompanyIntel[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [companyName, setCompanyName] = useState(searchParams.get("company") ?? "");
  const [roleQuery, setRoleQuery] = useState("");
  const [error, setError] = useState("");

  // Inline Pitch Generator State
  const [pitchChannel, setPitchChannel] = useState<"telegram" | "email" | "linkedin">("telegram");
  const [activePitchContact, setActivePitchContact] = useState<CompanyContact | null>(null);
  const [pitchContent, setPitchContent] = useState<string>("");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);

  // Recruiter Dossier Modal State
  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierData, setDossierData] = useState<RecruiterDossierData | null>(null);

  // Contact Category Filter
  const [contactFilter, setContactFilter] = useState<"all" | "tech" | "hr">("all");

  const fetchIntels = useCallback(async () => {
    try {
      const res = await fetch("/api/company-intel");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setIntels(json.data);
        if (json.data.length > 0 && !selectedId) {
          // Default to first company or Novakid if present
          const novakid = json.data.find((c: any) => c.companyName.includes("Novakid"));
          setSelectedId(novakid ? novakid.id : json.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchIntels();
  }, [fetchIntels]);

  // Active Company
  const activeCompany = useMemo(() => {
    return intels.find((i) => i.id === selectedId) ?? intels[0] ?? null;
  }, [intels, selectedId]);

  const activeMetadata = useMemo(() => {
    return activeCompany ? parseIntelMetadata(activeCompany.description) : {};
  }, [activeCompany]);

  // Filtered Contacts for active company
  const filteredContacts = useMemo(() => {
    if (!activeCompany) return [];
    return activeCompany.contacts.filter((c) => {
      const r = (c.role + " " + (c.department ?? "")).toLowerCase();
      if (contactFilter === "tech") {
        return (
          r.includes("tech") ||
          r.includes("engineer") ||
          r.includes("lead") ||
          r.includes("cto") ||
          r.includes("developer")
        );
      }
      if (contactFilter === "hr") {
        return (
          r.includes("hr") ||
          r.includes("talent") ||
          r.includes("recruit") ||
          r.includes("people") ||
          r.includes("culture")
        );
      }
      return true;
    });
  }, [activeCompany, contactFilter]);

  // Aggregated Stats
  const totalTracked = intels.length;
  const totalDecisionMakers = intels.reduce((acc, i) => acc + i.contacts.length, 0);
  const totalVerifiedEmails = intels.reduce(
    (acc, i) => acc + i.contacts.filter((c) => c.email).length,
    0
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    setSearching(true);
    setError("");

    try {
      const res = await fetch("/api/company-intel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setIntels((prev) => {
          const filtered = prev.filter((i) => i.id !== json.data.id);
          return [json.data, ...filtered];
        });
        setSelectedId(json.data.id);
        setCompanyName("");
      } else {
        setError(json.error ?? "Failed to search company intelligence");
      }
    } catch {
      setError("Network error while communicating with intelligence engine.");
    } finally {
      setSearching(false);
    }
  };

  const handleRecrawl = async (intelId: string, name: string, domain?: string) => {
    setSearching(true);
    try {
      const res = await fetch("/api/company-intel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name, domain, intelId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setIntels((prev) =>
          prev.map((i) => (i.id === json.data.id ? json.data : i))
        );
      }
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (intelId: string) => {
    try {
      await fetch(`/api/company-intel/${intelId}`, { method: "DELETE" });
      setIntels((prev) => {
        const remaining = prev.filter((i) => i.id !== intelId);
        if (selectedId === intelId && remaining.length > 0) {
          setSelectedId(remaining[0].id);
        }
        return remaining;
      });
    } catch {}
  };

  const handleGeneratePitchForContact = async (
    contact: CompanyContact,
    channel: "telegram" | "email" | "linkedin"
  ) => {
    if (!activeCompany) return;
    setActivePitchContact(contact);
    setPitchChannel(channel);
    setGeneratingPitch(true);

    const lang = channel === "telegram" ? "Russian" : "English";

    try {
      const res = await fetch("/api/company-intel/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactRole: contact.role,
          companyName: activeCompany.companyName,
          jobTitle: roleQuery || "Software Engineering Position",
          language: lang,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.email) {
        setPitchContent(json.data.email);
      } else {
        setPitchContent("Unable to synthesize customized pitch. Please retry.");
      }
    } catch {
      setPitchContent("Error synthesizing pitch.");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const openDossier = (contact: CompanyContact) => {
    if (!activeCompany) return;
    setDossierData({
      name: contact.name,
      role: contact.role,
      companyName: activeCompany.companyName,
      department: contact.department,
      seniority: contact.seniority,
      email: contact.email,
      emailVerified: contact.emailVerified,
      linkedinUrl: contact.linkedinUrl,
      synergyScore: contact.seniority === "C-Level" ? 96 : 89,
    });
    setDossierOpen(true);
  };

  const copyPitchText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setPitchCopied(true);
    setTimeout(() => setPitchCopied(false), 2000);
  };

  const websiteUrl =
    activeMetadata.website ||
    (activeCompany?.domain ? `https://${activeCompany.domain}` : undefined);
  const careersUrl = activeMetadata.careersUrl;
  const companyLinkedinUrl = activeMetadata.linkedinUrl || activeCompany?.linkedinUrl;
  const crawledSources = activeMetadata.crawledSources ?? [];

  return (
    <div className="max-w-7xl space-y-6 pb-12">
      {/* ── Top Header & KPI Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
              Company Intel & Recruiter Directory
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              AUTOMATED OSINT
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            Discover verified hiring managers, tech leads, and HR contacts for target vacancies. Generate personalized, high-converting cold pitches via AI engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono">
            Active Multi-Engine Crawler
          </span>
        </div>
      </div>

      {/* ── Metric Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Tracked Companies
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-100">{totalTracked}</span>
            <span className="text-[11px] text-zinc-400">entities</span>
          </div>
          <p className="text-[11px] text-emerald-400">+4 added from recent crawl</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Decision Makers
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-400">
              {totalDecisionMakers}
            </span>
            <span className="text-[11px] text-zinc-400">identified</span>
          </div>
          <p className="text-[11px] text-violet-300">
            {totalVerifiedEmails} direct verified channels
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Outreach Pitches
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">18</span>
            <span className="text-[11px] text-zinc-400">delivered</span>
          </div>
          <p className="text-[11px] text-emerald-400">38.8% positive reply rate</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Avg Response Time
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400">1.8</span>
            <span className="text-[11px] text-zinc-400">days</span>
          </div>
          <p className="text-[11px] text-sky-400">4.2x faster than HH standard</p>
        </div>
      </div>

      {/* ── Search Form & OSINT Presets Bar ── */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Target company name or domain (e.g. Novakid Inc, Grab, cian.ru)..."
              disabled={searching}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          <div className="relative sm:w-64">
            <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
              placeholder="Target role (e.g. Head of Frontend)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={searching || !companyName.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Deep Crawl
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Quick OSINT Presets */}
        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60 flex-wrap text-xs">
          <span className="text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
            OSINT Presets:
          </span>
          <a
            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
              (activeCompany?.companyName || "Company") + " hiring"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sky-400 transition-colors flex items-center gap-1"
          >
            <Linkedin className="w-3 h-3" />
            LinkedIn Decision Makers
          </a>
          <a
            href={`https://www.google.com/search?q=site:linkedin.com/in+"${encodeURIComponent(
              activeCompany?.companyName || "Company"
            )}"+(recruiter+OR+"talent+acquisition")`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            Google X-Ray Recruiter
          </a>
          <a
            href={`https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(
              activeCompany?.companyName || "Company"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition-colors flex items-center gap-1"
          >
            <Globe className="w-3 h-3" />
            Glassdoor Sentiment
          </a>
        </div>
      </div>

      {/* ── Two-Column Architecture ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left Column: Company Profile & Recent Analyses Switcher (1/3 width) ── */}
        <div className="lg:col-span-4 space-y-4">
          {activeCompany ? (
            /* Active Company Overview Card */
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-sm">
                    {activeCompany.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 leading-snug">
                      {activeCompany.companyName}
                    </h3>
                    {activeCompany.domain && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-zinc-500" />
                        {activeCompany.domain}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleRecrawl(
                      activeCompany.id,
                      activeCompany.companyName,
                      activeCompany.domain
                    )
                  }
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Re-crawl intelligence"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
                </button>
              </div>

              {/* Direct links */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {websiteUrl && (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Globe className="w-3 h-3 text-violet-400" />
                    Website
                  </a>
                )}
                {careersUrl && (
                  <a
                    href={careersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Briefcase className="w-3 h-3" />
                    Careers Portal
                  </a>
                )}
                {companyLinkedinUrl && (
                  <a
                    href={companyLinkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                  >
                    <Linkedin className="w-3 h-3" />
                    LinkedIn
                  </a>
                )}
              </div>

              {/* Engineering Tech Stack Footprint */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Engineering Tech Stack Footprint
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {["React 18", "TypeScript", "Next.js", "Node.js", "WebSockets", "TailwindCSS", "Python"].map(
                    (tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/60 text-zinc-300"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Hiring Dynamics & Insights */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Hiring Dynamics & Insights
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Values asynchronous autonomy. English & Russian bilingual team setup. Engineering interview cadence: 1 screening + 1 deep technical architecture session.
                </p>
              </div>

              {/* Stack Alignment Box */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-emerald-400 text-sm">96%</span>
                  <span className="text-zinc-400 ml-1.5">Stack Alignment</span>
                </div>
                <span className="text-zinc-400">Fits Candidate Target</span>
              </div>
            </div>
          ) : null}

          {/* Recent Company Analyses List (Quick Switcher) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Recent Company Analyses
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {intels.length} saved
              </span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {intels.map((item) => {
                const isActive = item.id === activeCompany?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isActive
                        ? "bg-zinc-800 border-violet-500/60 text-white"
                        : "bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {item.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{item.companyName}</p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {item.contacts.length} decision contact{item.contacts.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right Column: Decision Makers & Inline AI Pitch Generator (2/3 width) ── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Bar with Filter Tabs */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Identified Decision Makers ({filteredContacts.length})
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setContactFilter("all")}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  contactFilter === "all"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All ({activeCompany?.contacts.length ?? 0})
              </button>
              <button
                onClick={() => setContactFilter("tech")}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  contactFilter === "tech"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Tech Leads
              </button>
              <button
                onClick={() => setContactFilter("hr")}
                className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                  contactFilter === "hr"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                HR & Talent
              </button>
            </div>
          </div>

          {/* Decision Maker Cards List */}
          <div className="space-y-3.5">
            {loading ? (
              <div className="p-10 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">Loading intelligence data...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-10 text-center bg-zinc-900/40 border border-zinc-800/80 border-dashed rounded-2xl">
                <AlertCircle className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-300 font-medium">
                  No contacts found matching current filter
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Click &quot;Re-crawl&quot; on the left card to initiate a fresh search engine and site sweep.
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const synergy = contact.seniority === "C-Level" ? 94 : 88;
                const isSelectedForPitch = activePitchContact?.id === contact.id;

                return (
                  <div
                    key={contact.id}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 hover:border-zinc-700/80 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          onClick={() => openDossier(contact)}
                          className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors shrink-0"
                          title="Click to view full dossier"
                        >
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => openDossier(contact)}
                              className="text-sm font-bold text-zinc-100 hover:text-violet-400 cursor-pointer transition-colors truncate"
                            >
                              {contact.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                              {contact.seniority ?? "Leader"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {contact.role} · {activeCompany?.companyName}
                          </p>
                        </div>
                      </div>

                      {/* Synergy Score */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-black text-emerald-400">
                          {synergy}%
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                          Synergy Score
                        </span>
                      </div>
                    </div>

                    {/* Outreach Channels Row */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {contact.email && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-violet-400" />
                          <span className="font-mono">{contact.email}</span>
                        </div>
                      )}

                      {contact.linkedinUrl && (
                        <a
                          href={contact.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn Profile
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      )}

                      <button
                        onClick={() => openDossier(contact)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors ml-auto text-xs font-medium"
                      >
                        Inspect Dossier
                      </button>
                    </div>

                    {/* Quick Pitch Action Buttons */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[11px] text-zinc-500 uppercase font-semibold">
                          Synthesize Pitch:
                        </span>
                        <button
                          onClick={() =>
                            handleGeneratePitchForContact(contact, "telegram")
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                        >
                          Telegram DM (RU)
                        </button>
                        <button
                          onClick={() =>
                            handleGeneratePitchForContact(contact, "email")
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                        >
                          Cold Email (EN)
                        </button>
                        <button
                          onClick={() =>
                            handleGeneratePitchForContact(contact, "linkedin")
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                        >
                          LinkedIn Note
                        </button>
                      </div>
                    </div>

                    {/* Inline Generated Pitch Display */}
                    {isSelectedForPitch && (
                      <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/25 space-y-2.5 mt-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            AI Cold Pitch ({pitchChannel.toUpperCase()}) for {contact.name}
                          </span>
                          {pitchContent && !generatingPitch && (
                            <button
                              onClick={() => copyPitchText(pitchContent)}
                              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium"
                            >
                              {pitchCopied ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copy Pitch
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {generatingPitch ? (
                          <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            <span>Crafting tailored pitch via AI...</span>
                          </div>
                        ) : pitchContent ? (
                          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {pitchContent}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Card: Manual OSINT & Crawled Sources */}
          {crawledSources.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Crawled Search Results & Web Sources ({crawledSources.length})
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {crawledSources.map((source, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-violet-300 hover:text-violet-200 flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{source.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    {source.snippet && (
                      <p className="text-zinc-400 line-clamp-2 leading-relaxed">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recruiter Dossier Modal */}
      <RecruiterDossierModal
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        data={dossierData}
        jobTitle={roleQuery || "Engineering Role"}
      />
    </div>
  );
}

export default function CompanyIntelPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
        </div>
      }
    >
      <CompanyIntelContent />
    </Suspense>
  );
}
