"use client";

// ============================================================
// Nanda AI Job Assistant — Company Intel & Contact Finder Page
// ============================================================

import { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  AlertCircle,
  Star,
  UserCheck,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

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

interface CompanyIntel {
  id: string;
  companyName: string;
  domain?: string;
  industry?: string;
  size?: string;
  description?: string;
  vacancyId?: string;
  contacts: CompanyContact[];
  createdAt: string;
}

// ── Seniority Badge ──────────────────────────────────────────

function SeniorityBadge({ seniority }: { seniority?: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    "C-Level": {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: <Star className="w-3 h-3" />,
    },
    VP: {
      color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      icon: <ShieldCheck className="w-3 h-3" />,
    },
    Director: {
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      icon: <UserCheck className="w-3 h-3" />,
    },
    Manager: {
      color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      icon: <Briefcase className="w-3 h-3" />,
    },
    IC: {
      color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      icon: <Users className="w-3 h-3" />,
    },
  };

  const cfg = config[seniority ?? ""] ?? {
    color: "bg-gray-700/50 text-gray-400 border-gray-600/30",
    icon: <Users className="w-3 h-3" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}
    >
      {cfg.icon}
      {seniority ?? "Other"}
    </span>
  );
}

// ── Contact Card ─────────────────────────────────────────────

function ContactCard({
  contact,
  companyName,
  jobTitle,
}: {
  contact: CompanyContact;
  companyName: string;
  jobTitle?: string;
}) {
  const [emailContent, setEmailContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const generateEmail = async () => {
    setGenerating(true);
    setShowEmail(true);
    try {
      const res = await fetch("/api/company-intel/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contact.name,
          contactRole: contact.role,
          companyName,
          jobTitle,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEmailContent(json.data.email);
      } else {
        setEmailContent("Failed to generate email. Please try again.");
      }
    } catch {
      setEmailContent("Error generating email.");
    } finally {
      setGenerating(false);
    }
  };

  const copyEmail = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600/50 transition-all duration-200">
      {/* Contact Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {contact.name}
            </h4>
            <SeniorityBadge seniority={contact.seniority} />
          </div>
          <p className="text-xs text-gray-400 mb-0.5">{contact.role}</p>
          {contact.department && (
            <p className="text-xs text-gray-500">{contact.department}</p>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex flex-wrap gap-2 mb-3">
        {contact.email && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyEmail(contact.email!, setCopied)}
              className="flex items-center gap-1.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 hover:text-white transition-all duration-150 group"
            >
              {copied ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300" />
              )}
              <span className="truncate max-w-[160px]">{contact.email}</span>
              {contact.emailVerified && (
                <span className="text-emerald-400 ml-1">✓</span>
              )}
            </button>
          </div>
        )}

        {contact.linkedinUrl && (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-all duration-150"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
        )}
      </div>

      {/* Generate Email Section */}
      <div className="border-t border-gray-700/50 pt-3">
        <button
          onClick={generateEmail}
          disabled={generating}
          className="flex items-center gap-2 text-xs font-medium text-violet-400 hover:text-violet-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {generating
            ? "Generating..."
            : emailContent
            ? "Regenerate Email"
            : "Generate Outreach Email"}
        </button>

        {showEmail && (
          <div className="mt-3">
            {generating ? (
              <div className="bg-gray-900/50 rounded-lg p-3 h-24 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              </div>
            ) : emailContent ? (
              <div className="relative">
                <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {emailContent}
                </div>
                <button
                  onClick={() => copyEmail(emailContent, setEmailCopied)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-600/50 transition-all duration-150"
                >
                  {emailCopied ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Company Intel Card ────────────────────────────────────────

function CompanyIntelCard({
  intel,
  onDelete,
  jobTitle,
}: {
  intel: CompanyIntel;
  onDelete: (id: string) => void;
  jobTitle?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [allEmailsCopied, setAllEmailsCopied] = useState(false);

  const allEmails = intel.contacts
    .filter((c) => c.email)
    .map((c) => c.email)
    .join(", ");

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/company-intel/${intel.id}`, { method: "DELETE" });
      onDelete(intel.id);
    } catch {
      setDeleting(false);
    }
  };

  const copyAllEmails = async () => {
    await navigator.clipboard.writeText(allEmails);
    setAllEmailsCopied(true);
    setTimeout(() => setAllEmailsCopied(false), 2000);
  };

  const seniorityOrder: Record<string, number> = {
    "C-Level": 0,
    VP: 1,
    Director: 2,
    Manager: 3,
    IC: 4,
    Other: 5,
  };

  const sortedContacts = [...intel.contacts].sort(
    (a, b) =>
      (seniorityOrder[a.seniority ?? "Other"] ?? 5) -
      (seniorityOrder[b.seniority ?? "Other"] ?? 5)
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Company Header */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">
                {intel.companyName}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                {intel.domain && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Globe className="w-3 h-3" />
                    {intel.domain}
                  </span>
                )}
                {intel.industry && (
                  <span className="text-xs text-gray-500">{intel.industry}</span>
                )}
                {intel.size && (
                  <span className="text-xs text-gray-500">{intel.size}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  {intel.contacts.length} contact
                  {intel.contacts.length !== 1 ? "s" : ""} found
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allEmails && (
              <button
                onClick={copyAllEmails}
                title="Copy all emails"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-xs text-gray-300 hover:text-white transition-all duration-150"
              >
                {allEmailsCopied ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                {allEmailsCopied ? "Copied!" : "Copy All Emails"}
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all duration-150"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all duration-150 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contacts Grid */}
      {expanded && (
        <div className="p-5">
          {sortedContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                No contacts found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Try adding your Hunter.io and Apollo.io API keys in your .env
                file.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  companyName={intel.companyName}
                  jobTitle={jobTitle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";

// ── Main Page ─────────────────────────────────────────────────

function CompanyIntelContent() {
  const searchParams = useSearchParams();
  const [intels, setIntels] = useState<CompanyIntel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [companyName, setCompanyName] = useState(searchParams.get("company") ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState("");

  const fetchIntels = useCallback(async () => {
    try {
      const res = await fetch("/api/company-intel");
      const json = await res.json();
      if (json.success) setIntels(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntels();
  }, [fetchIntels]);

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

      if (json.success) {
        setIntels((prev) => [json.data, ...prev]);
        setCompanyName("");
        setJobTitle("");
      } else {
        setError(json.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = (id: string) => {
    setIntels((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Company Intel</h1>
              <p className="text-sm text-gray-400">
                Find key people to reach out to after applying
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-5 bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
            <p className="text-xs text-violet-300 font-medium mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Pro Strategy
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Right after hitting apply, send a personalized email directly to
              the hiring manager or director. This bypasses ATS and puts you
              ahead of thousands of applicants. Use this tool to find their
              contact info, then generate a personalized email with AI.
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-400" />
            Find Company Contacts
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                id="company-name-input"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name (e.g. Google, Yandex, Grab...)"
                disabled={searching}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150 disabled:opacity-50"
              />
            </div>
            <div className="sm:w-64">
              <input
                id="job-title-input"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title applied for (optional)"
                disabled={searching}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150 disabled:opacity-50"
              />
            </div>
            <button
              id="find-contacts-btn"
              type="submit"
              disabled={searching || !companyName.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-violet-500/20 whitespace-nowrap"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Contacts
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* API key notice */}
          {!process.env.NEXT_PUBLIC_HAS_CONTACT_API && (
            <p className="mt-3 text-xs text-gray-500 flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              Add{" "}
              <code className="text-gray-400 bg-gray-800 px-1 rounded">
                HUNTER_API_KEY
              </code>{" "}
              and{" "}
              <code className="text-gray-400 bg-gray-800 px-1 rounded">
                APOLLO_API_KEY
              </code>{" "}
              to your .env for contact data. Domain lookup works without API
              keys.
            </p>
          )}
        </form>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        ) : intels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">
              No searches yet
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Enter a company name above to discover key contacts and start
              your direct outreach.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {intels.length} Compan{intels.length !== 1 ? "ies" : "y"} searched
            </p>
            {intels.map((intel) => (
              <CompanyIntelCard
                key={intel.id}
                intel={intel}
                onDelete={handleDelete}
                jobTitle={jobTitle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompanyIntelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      }
    >
      <CompanyIntelContent />
    </Suspense>
  );
}
