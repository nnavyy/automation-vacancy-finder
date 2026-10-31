"use client";

import React from "react";
import Link from "next/link";
import { ArrowUp, Github, Globe, Mail, Instagram } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#09090b] border-t border-white/[0.08] pt-16 pb-12 text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Columns Grid: Brand + Product + Solutions + Compare + Resources + Creator */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 pb-14 border-b border-white/[0.08]">
          {/* Brand Identity & Social Column */}
          <div className="col-span-2 md:col-span-1 space-y-4 pr-2">
            <div className="flex items-center gap-2.5 text-white font-semibold text-xs tracking-tight">
              <BrandLogo size={28} variant="dark" showBackground={true} className="rounded-lg border border-white/10" />
              <span>HH Job Copilot</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Autonomous AI job search, compatibility scoring, and real-time alerts for the HeadHunter (hh.ru) ecosystem.
            </p>

            {/* Social Icons for Creator Nanda (@nnavyy) */}
            <div className="flex items-center gap-2.5 pt-1 text-zinc-400">
              <a
                href="https://github.com/nnavyy"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] hover:text-white hover:border-white/20 transition-all"
                title="GitHub @nnavyy"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://nandaz-portofolio.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] hover:text-white hover:border-white/20 transition-all"
                title="Portfolio"
              >
                <Globe className="w-3.5 h-3.5" />
              </a>
              <a
                href="mailto:nandazhafran@gmail.com"
                className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] hover:text-white hover:border-white/20 transition-all"
                title="Email"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.instagram.com/rrqac_zsyons/"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] hover:text-white hover:border-white/20 transition-all"
                title="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Product
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="#pipeline" className="hover:text-white transition-colors">
                  Autonomous Engine
                </Link>
              </li>
              <li>
                <Link href="#pipeline" className="hover:text-white transition-colors">
                  AI Synergy Scorer
                </Link>
              </li>
              <li>
                <Link href="#pipeline" className="hover:text-white transition-colors">
                  Telegram Dispatch
                </Link>
              </li>
              <li>
                <Link href="#pipeline" className="hover:text-white transition-colors">
                  Liveness Daemon
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-white transition-colors">
                  100-Vacancy Guard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/company-intel" className="hover:text-white transition-colors">
                  Company Dossier
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Solutions
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/dashboard/vacancies" className="hover:text-white transition-colors">
                  React &amp; Next.js Roles
                </Link>
              </li>
              <li>
                <Link href="/dashboard/vacancies" className="hover:text-white transition-colors">
                  Full Stack Engineers
                </Link>
              </li>
              <li>
                <Link href="/dashboard/vacancies" className="hover:text-white transition-colors">
                  Python &amp; AI Developers
                </Link>
              </li>
              <li>
                <Link href="/dashboard/vacancies" className="hover:text-white transition-colors">
                  High-Salary Filter
                </Link>
              </li>
              <li>
                <Link href="/dashboard/vacancies" className="hover:text-white transition-colors">
                  Remote-Only Stream
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Compare / Competitors (Requested by User) */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Compare
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <div className="text-white font-medium">vs LoopCV</div>
                <div className="text-[10px] text-zinc-500">100% Free vs $39–$129/mo</div>
              </li>
              <li>
                <div className="text-white font-medium">vs LazyApply</div>
                <div className="text-[10px] text-zinc-500">Zero Daily Application Limits</div>
              </li>
              <li>
                <div className="text-white font-medium">vs Sonara &amp; Huntr</div>
                <div className="text-[10px] text-zinc-500">Native HeadHunter (hh.ru) RSS</div>
              </li>
              <li>
                <div className="text-white font-medium">vs Cloud SaaS</div>
                <div className="text-[10px] text-zinc-500">100% Local PostgreSQL &amp; Private</div>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Resources
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/demo" className="hover:text-white transition-colors font-medium text-emerald-400">
                  Live Sandbox Demo
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors font-medium text-white">
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link href="/architecture" className="hover:text-white transition-colors">
                  Technical Architecture
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Creator (Links to dedicated /about page) */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white">
              Creator
            </div>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/about" className="hover:text-white transition-colors font-medium text-white">
                  About Creator (@nnavyy)
                </Link>
              </li>
              <li>
                <a href="https://nandaz-portofolio.vercel.app" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Live Portfolio
                </a>
              </li>
              <li>
                <a href="https://github.com/nnavyy" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  GitHub Profile
                </a>
              </li>
              <li>
                <a href="mailto:nandazhafran@gmail.com" className="hover:text-white transition-colors">
                  Contact Direct
                </a>
              </li>
              <li>
                <a href="https://github.com/nnavyy" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Creator Projects
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar without fake status badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div className="text-zinc-500">
            Hosted HeadHunter job search. Free Analytics. Company Intel is $3 per month.
          </div>

          <div className="flex items-center gap-4 text-zinc-500">
            <span>&copy; {new Date().getFullYear()} HH Job Copilot &middot; Built by Nanda (@nnavyy)</span>
            <button
              onClick={scrollToTop}
              className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] transition-all active:scale-95"
              title="Back to top"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
