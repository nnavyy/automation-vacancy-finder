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
  LucideIcon,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Briefcase, label: "Vacancies", href: "/dashboard/vacancies" },
  { icon: Bookmark, label: "Saved", href: "/dashboard/saved" },
  { icon: CheckCircle, label: "Applied", href: "/dashboard/applied" },
  { icon: BarChart2, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
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
      {/* Logo / Profile Switcher */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
            <Cpu size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              wingkiiy Job AI
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              HH.ru Assistant
            </p>
          </div>
        </div>

        {/* Profile Dropdown */}
        {!loading && profiles.length > 0 && (
          <div className="relative group">
            <select
              value={activeProfile?.id || ""}
              onChange={(e) => {
                if (e.target.value === "new") handleCreateProfile();
                else handleSwitchProfile(e.target.value);
              }}
              className="w-full appearance-none bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-green-400/60 cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isActive ? "(Active)" : ""}
                </option>
              ))}
              <option value="new">+ Create New Profile</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown size={14} className="text-gray-500" />
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate && onNavigate()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-green-500/10 text-green-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
              }`}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? "text-green-400" : "text-gray-500"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — User Email + Version */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        {userEmail && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-green-400 uppercase">
                {(userName || userEmail)[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {userName && (
                <p className="text-xs text-gray-300 font-medium truncate leading-tight">{userName}</p>
              )}
              <p className="text-[10px] text-gray-500 truncate leading-tight">{userEmail}</p>
            </div>
            <button
              onClick={() => {
                window.location.href = "/api/auth/signout";
              }}
              className="p-1 rounded hover:bg-gray-800 transition-colors group"
              title="Sign out"
            >
              <LogOut size={13} className="text-gray-600 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        )}
        <p className="text-xs text-gray-700 text-center select-none">v0.1.0</p>
      </div>
    </div>
  );
}

