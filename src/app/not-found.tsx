// ============================================================
// wingkiiy Job Copilot — Global 404 Route Not Found Page
// Premium dark obsidian interface with interactive route matrix
// ============================================================

import Link from "next/link";
import {
  Compass,
  LayoutDashboard,
  Briefcase,
  Sliders,
  Building2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

const NAVIGATION_TARGETS = [
  {
    title: "Executive Dashboard",
    description: "Real-time metrics, collection telemetry, and high-match vacancy cards.",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Primary",
  },
  {
    title: "Job Vacancies Feed",
    description: "Browse categorized vacancies, AI compatibility scores, and quick apply.",
    href: "/dashboard/vacancies",
    icon: Briefcase,
    badge: "Feed",
  },
  {
    title: "Company Intelligence",
    description: "Corporate dossiers, verified decision makers, and personalized outreach.",
    href: "/dashboard/company-intel",
    icon: Building2,
    badge: "Intel",
  },
  {
    title: "AI Engine & Settings",
    description: "Configure search criteria, HeadHunter browser sync, and AI models.",
    href: "/dashboard/settings",
    icon: Sliders,
    badge: "System",
  },
];

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.06),rgba(24,24,27,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a0a_1px,transparent_1px),linear-gradient(to_bottom,#27272a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-sm tracking-wider text-white shadow-inner group-hover:border-zinc-700 transition-colors">
            W
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {BRAND_NAME}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Job Intelligence Copilot
            </span>
          </div>
        </Link>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>ROUTING_EXCEPTION // 404</span>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col justify-center">
        <div className="space-y-8">

          {/* Heading Module */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
              <Compass size={13} className="shrink-0" />
              <span>HTTP 404 // ROUTE_UNRESOLVED</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Requested Endpoint Not Located
            </h1>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl">
              The path you navigated to does not map to any active view or resource in this application. The link may have changed, or the target vacancy or item was archived.
            </p>
          </div>

          {/* Navigation Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {NAVIGATION_TARGETS.map((target) => {
              const Icon = target.icon;
              return (
                <Link
                  key={target.href}
                  href={target.href}
                  className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-lg hover:shadow-black/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800/80">
                      {target.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <span>{target.title}</span>
                      <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {target.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Fallback Action */}
          <div className="pt-2 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-sm font-medium transition-all shadow-sm"
            >
              <LayoutDashboard size={15} />
              <span>Return to Dashboard</span>
            </Link>

            <Link
              href="javascript:history.back()"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Previous Page</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
        <span>
          © {new Date().getFullYear()} {BRAND_NAME}. Intelligent job discovery platform.
        </span>
        <div className="flex items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-zinc-300 transition-colors">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-zinc-300 transition-colors">
            Terms
          </Link>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-zinc-400">SOC 2 Type II Safeguarded</span>
        </div>
      </footer>
    </div>
  );
}
