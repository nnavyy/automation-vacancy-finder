"use client";

// ============================================================
// Sidebar navigation — client component for active link highlight
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  CheckCircle,
  BarChart2,
  Settings,
  Cpu,
  Users,
  GitFork,
  LucideIcon,
  ChevronDown,
  LogOut,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n";

interface NavItem {
  icon: LucideIcon;
  labelKey: string;
  defaultLabel: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.overview", defaultLabel: "Overview", href: "/dashboard" },
  { icon: Briefcase, labelKey: "nav.vacancies", defaultLabel: "Vacancies", href: "/dashboard/vacancies" },
  { icon: Bookmark, labelKey: "nav.saved", defaultLabel: "Saved", href: "/dashboard/saved" },
  { icon: CheckCircle, labelKey: "nav.applied", defaultLabel: "Applied", href: "/dashboard/applied" },
  { icon: Users, labelKey: "nav.companyIntel", defaultLabel: "Company Intel", href: "/dashboard/company-intel" },
  { icon: BarChart2, labelKey: "nav.analytics", defaultLabel: "Analytics", href: "/dashboard/analytics" },
  { icon: GitFork, labelKey: "nav.gitVisualizer", defaultLabel: "Git Visualizer", href: "/dashboard/git-visualizer" },
  { icon: Settings, labelKey: "nav.settings", defaultLabel: "Settings", href: "/dashboard/settings" },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { language, setLanguage, t, languages } = useLanguage();
  const [profiles, setProfiles] = useState<{id: string; name: string; isActive: boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profiles")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfiles(data.data);
        }
      })
      .finally(() => setLoading(false));

    // Fetch session to get user email
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUserEmail(data.user.email || null);
          setUserName(data.user.name || null);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchProfile = async (id: string) => {
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch", id })
    });
    window.location.reload();
  };

  const handleCreateProfile = async () => {
    const name = prompt("Enter new profile name:");
    if (!name) return;
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name })
    });
    window.location.reload();
  };

  const activeProfile = profiles.find(p => p.isActive);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Logo / Profile Switcher */}
      <div className="px-5 py-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <Cpu size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-tight">
              {BRAND_NAME}
            </p>
            <p className="text-xs text-zinc-500 leading-tight">
              {BRAND_SHORT}
            </p>
          </div>
        </div>

        {/* Profile Dropdown */}
        {!loading && profiles.length > 0 && (
          <div className="relative group">
            <select
              aria-label="Select active profile"
              value={activeProfile?.id || ""}
              onChange={(e) => {
                if (e.target.value === "new") handleCreateProfile();
                else handleSwitchProfile(e.target.value);
              }}
              className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer transition-colors"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? "(Active)" : ""}
                </option>
              ))}
              <option value="new">+ Create New Profile</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={13} className="text-zinc-500" />
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map(({ icon: Icon, labelKey, defaultLabel, href }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate && onNavigate()}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? "text-emerald-400" : "text-zinc-500"}
              />
              <span>{t(labelKey, defaultLabel)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — Language Switcher + User Email + Version */}
      <div className="p-4 border-t border-zinc-800/80 space-y-3">
        {/* Compact Language Selector */}
        <div className="flex items-center justify-between p-1 bg-zinc-950 border border-zinc-800/80 rounded-lg text-[11px]">
          <div className="flex items-center gap-1.5 px-2 text-zinc-400">
            <Globe size={12} className="text-zinc-500" />
            <span className="font-mono uppercase text-[10px] text-zinc-500">Lang</span>
          </div>
          <div className="flex items-center gap-1">
            {languages.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold transition-all ${
                  language === code
                    ? "bg-zinc-800 text-emerald-400 border border-zinc-700/80"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {userEmail && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">
                {(userName || userEmail)[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {userName && (
                <p className="text-xs text-zinc-200 font-medium truncate leading-tight">{userName}</p>
              )}
              <p className="text-[10px] text-zinc-500 truncate leading-tight">{userEmail}</p>
            </div>
            <button
              onClick={() => {
                window.location.href = "/api/auth/signout";
              }}
              className="p-1 rounded hover:bg-zinc-800 transition-colors group"
              title="Sign out"
            >
              <LogOut size={13} className="text-zinc-500 group-hover:text-rose-400 transition-colors" />
            </button>
          </div>
        )}
        <p className="text-[11px] text-zinc-600 text-center select-none font-mono">v0.1.0</p>
      </div>
    </div>
  );
}

