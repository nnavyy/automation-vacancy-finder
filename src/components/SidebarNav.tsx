"use client";

// ============================================================
// Sidebar navigation, client component for active link highlight
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
  Users,
  LucideIcon,
  ChevronDown,
  LogOut,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";

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
    <div className="flex flex-col h-full">
      {/* Brand and profile switcher */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <BrandLogo size={26} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 leading-tight tracking-tight truncate">
              {BRAND_NAME}
            </p>
            <p className="text-[11px] text-zinc-500 leading-tight truncate">{BRAND_SHORT}</p>
          </div>
        </div>

        {!loading && profiles.length > 0 && (
          <div className="relative">
            <select
              aria-label="Select active profile"
              value={activeProfile?.id || ""}
              onChange={(e) => {
                if (e.target.value === "new") handleCreateProfile();
                else handleSwitchProfile(e.target.value);
              }}
              className="w-full appearance-none bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-white/25 cursor-pointer transition-colors hover:bg-white/[0.05]"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="new">+ Create New Profile</option>
            </select>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500"
            />
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map(({ icon: Icon, labelKey, defaultLabel, href }) => {
          const isActive =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={() => onNavigate && onNavigate()}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 active:scale-[0.98] ${
                isActive ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                  className="absolute inset-0 rounded-lg bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]"
                />
              )}
              <Icon
                size={16}
                strokeWidth={1.5}
                className={`relative ${isActive ? "text-zinc-50" : "text-zinc-500"}`}
              />
              <span className="relative">{t(labelKey, defaultLabel)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: language, account */}
      <div className="p-3 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between px-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Globe size={12} strokeWidth={1.5} />
            <span className="font-mono uppercase text-[10px]">Lang</span>
          </div>
          <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]">
            {languages.map(({ code }) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLanguage(code);
                  fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ language: code }),
                  }).catch(() => {});
                }}
                className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-medium transition-colors ${
                  language === code
                    ? "bg-white/10 text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {userEmail && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-medium text-zinc-100 uppercase">
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
              className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors group"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut
                size={14}
                strokeWidth={1.5}
                className="text-zinc-500 group-hover:text-rose-400 transition-colors"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

