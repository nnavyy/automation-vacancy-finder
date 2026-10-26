"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Cpu,
  Bot,
  Send,
  ShieldCheck,
  Database,
  Briefcase,
  Sparkles,
  ArrowRight,
  BookOpen,
  User,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { CompanyBubbleLogo } from "./CompanyLogos";

interface LandingHeaderProps {
  userEmail?: string | null;
}

export default function LandingHeader({ userEmail }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMouseEnter = (menu: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#09090b]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl py-3"
          : "bg-[#09090b]/70 backdrop-blur-md border-b border-white/[0.04] py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <BrandLogo
              size={32}
              variant="dark"
              showBackground={true}
              className="rounded-xl border border-white/10 shadow-sm transition-transform duration-200 group-hover:scale-105 active:scale-95"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                HH Job Copilot
              </span>
              <span className="text-[11px] text-zinc-400 font-normal leading-tight">
                IT Vacancy Analytics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 relative">
            {/* Capabilities Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("features")}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeDropdown === "features"
                    ? "text-white bg-white/[0.08]"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>Capabilities</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === "features" ? "rotate-180 text-white" : "text-zinc-500"
                  }`}
                />
              </button>

              {/* Mega-Menu Panel */}
              <AnimatePresence>
                {activeDropdown === "features" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                    className="absolute top-full left-0 mt-3 w-[680px] bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-6 text-xs"
                  >
                    {/* Top 3-Column Grid */}
                    <div className="grid grid-cols-3 gap-6 pb-6 border-b border-white/[0.08]">
                      {/* Column 1: Autonomous Automation */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-3.5">
                          Autonomous Automation
                        </div>
                        <ul className="space-y-3.5">
                          <li>
                            <Link
                              href="/dashboard/vacancies"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-violet-400 transition-colors">
                                <Bot className="w-3.5 h-3.5 text-violet-400" />
                                <span>Feed Ingestion Stream</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                Rate-limit immune composite queries across HeadHunter.
                              </p>
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/dashboard/vacancies"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-emerald-400 transition-colors">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Multi-Tier AI Scoring</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                0–100 compatibility evaluation with clear match breakdowns.
                              </p>
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="#pipeline"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-sky-400 transition-colors">
                                <Send className="w-3.5 h-3.5 text-sky-400" />
                                <span>Telegram Bot Alerts</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                Standalone 2-hour notification cron for high-synergy leads.
                              </p>
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Column 2: Health & Intelligence */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-3.5">
                          Engine &amp; Telemetry
                        </div>
                        <ul className="space-y-3.5">
                          <li>
                            <Link
                              href="/architecture"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-emerald-400 transition-colors">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Liveness Verification</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                HTTP HEAD probes systematically close archived 404 postings.
                              </p>
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/architecture"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-amber-400 transition-colors">
                                <Database className="w-3.5 h-3.5 text-amber-400" />
                                <span>100-Vacancy Guard</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                Bounded table limit to maintain low database latency.
                              </p>
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/dashboard/company-intel"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-fuchsia-400 transition-colors">
                                <Briefcase className="w-3.5 h-3.5 text-fuchsia-400" />
                                <span>Company Dossier</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                Recruiter contacts, corporate tech stacks, and domain intel.
                              </p>
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Column 3: Live Workspace & Articles */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-3.5">
                          Workspace &amp; Insights
                        </div>
                        <ul className="space-y-3.5">
                          <li>
                            <Link
                              href="/demo"
                              onClick={() => setActiveDropdown(null)}
                              className="group block p-3 rounded-xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/20 transition-all"
                            >
                              <div className="flex items-center gap-1.5 text-white font-medium text-xs mb-1">
                                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Live Sandbox Demo</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-normal">
                                Explore the master-detail vacancy inspection feed, Hunter Engine, and AI dossier writer.
                              </p>
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/blog"
                              onClick={() => setActiveDropdown(null)}
                              className="group block"
                            >
                              <div className="flex items-center gap-2 text-white font-medium group-hover:text-white transition-colors">
                                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Engineering Articles</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                                Technical deep dives into RSS protocols and fast-tier LLMs.
                              </p>
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Banner with Target Companies */}
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-semibold text-white">
                          Top Company Feeds
                        </span>
                        <span className="text-[11px] text-zinc-400 hidden sm:inline">
                          Continuous scanning across premier employers
                        </span>
                      </div>

                      {/* Floating Bubbles */}
                      <div className="flex items-center -space-x-1.5">
                        <CompanyBubbleLogo name="yandex" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="sber" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="tinkoff" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="vk" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="avito" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="ozon" size={26} className="border-2 border-[#0e0e11]" />
                        <CompanyBubbleLogo name="hh" size={26} className="border-2 border-[#0e0e11]" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Architecture Link (Links to dedicated /architecture page) */}
            <Link
              href="/architecture"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Architecture
            </Link>

            {/* Live Demo Link (Links to dedicated /demo page) */}
            <Link
              href="/demo"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Live Demo
            </Link>

            {/* Blog Link (Links to /blog) */}
            <Link
              href="/blog"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              Blog
            </Link>

            {/* About Creator Link (Directs to /about) */}
            <Link
              href="/about"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              About Creator
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {userEmail ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-200 active:scale-[0.97] transition-all shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-200 active:scale-[0.97] transition-all shadow-sm"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-[#0e0e11] border border-white/10 rounded-2xl space-y-3 shadow-2xl">
            <Link
              href="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-emerald-400 hover:text-white py-1"
            >
              Live Interactive Demo
            </Link>
            <Link
              href="/architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-200 hover:text-white py-1"
            >
              System Architecture
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-200 hover:text-white py-1"
            >
              Engineering Blog
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-zinc-200 hover:text-white py-1"
            >
              About Creator (@nnavyy)
            </Link>
            <div className="pt-3 border-t border-white/[0.08]">
              <Link
                href={userEmail ? "/dashboard" : "/login"}
                className="w-full py-2.5 text-center text-xs font-medium rounded-full bg-white text-black flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <span>{userEmail ? "Go to Dashboard" : "Sign In to App"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
