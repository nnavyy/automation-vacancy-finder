"use client";

import React, { useState } from "react";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  MapPin,
  Check,
  Sparkles,
  Bot,
  ExternalLink,
  BellRing,
  Briefcase,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectPreviewSimulator() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "vacancies" | "telegram" | "liveness">("pipeline");
  const [isSimulating, setIsSimulating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [showTelegramToast, setShowTelegramToast] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Default demo settings (pure client state, resets on refresh)
  const [demoRole, setDemoRole] = useState("React Full Stack / Next.js Architect");
  const [demoSalaryFloor, setDemoSalaryFloor] = useState("250,000 RUB");

  const simulateRun = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setShowTelegramToast(false);
    setPipelineStep(1);

    setTimeout(() => setPipelineStep(2), 500);
    setTimeout(() => setPipelineStep(3), 1000);
    setTimeout(() => setPipelineStep(4), 1500);
    setTimeout(() => {
      setPipelineStep(5);
      setIsSimulating(false);
      setShowTelegramToast(true);
    }, 2000);
  };

  const resetDemo = () => {
    setPipelineStep(0);
    setIsSimulating(false);
    setShowTelegramToast(false);
    setDemoRole("React Full Stack / Next.js Architect");
    setDemoSalaryFloor("250,000 RUB");
  };

  return (
    <section id="preview" className="py-20 md:py-28 bg-[#09090b] border-t border-white/[0.08] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Simulate the Autonomous Pipeline
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Test how the engine filters postings, computes AI compatibility scores, verifies vacancy liveness, and dispatches mock alerts to Telegram without affecting production databases.
          </p>
        </div>

        {/* Simulator Frame (Dub.co Dark Window with Framer Motion) */}
        <div className="bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Top Control Bar with Segmented Control */}
          <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#121216] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
              <span>Demo Profile:</span>
              <span className="text-white font-semibold">{demoRole}</span>
            </div>

            {/* Segmented Control */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl text-xs border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab("pipeline")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "pipeline"
                    ? "bg-white text-black font-medium shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Autonomous Cycle
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vacancies")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "vacancies"
                    ? "bg-white text-black font-medium shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Evaluated Stream
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("telegram")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "telegram"
                    ? "bg-white text-black font-medium shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Telegram Delivery
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("liveness")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === "liveness"
                    ? "bg-white text-black font-medium shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Liveness Daemon
              </button>
            </div>
          </div>

          {/* AnimatePresence for Tab Content */}
          <AnimatePresence mode="wait">
            {/* Tab 1: Autonomous Pipeline */}
            {activeTab === "pipeline" && (
              <motion.div
                key="pipeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Criteria Panel */}
                  <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Demo Configuration
                      </span>
                      <button
                        type="button"
                        onClick={resetDemo}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                        title="Reset demo parameters"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Target Role (Editable for testing):
                      </label>
                      <input
                        type="text"
                        value={demoRole}
                        onChange={(e) => setDemoRole(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] text-zinc-400 mb-1.5">
                        Core Tech Stack
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/[0.06]">
                          TypeScript
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/[0.06]">
                          React 19
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/[0.06]">
                          Next.js
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-white/[0.06]">
                          PostgreSQL
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Salary Floor:
                      </label>
                      <input
                        type="text"
                        value={demoSalaryFloor}
                        onChange={(e) => setDemoSalaryFloor(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                      <div className="text-[10px] text-zinc-500 mt-1">Format: Remote / Hybrid</div>
                    </div>

                    <div>
                      <div className="text-[11px] text-zinc-400 mb-1">
                        Hard Exclusions
                      </div>
                      <div className="text-[11px] text-rose-400 space-y-0.5">
                        <div>- Unpaid trial task</div>
                        <div>- Legacy 1C / Bitrix</div>
                        <div>- Strictly on-site office</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Pipeline Execution */}
                  <div className="lg:col-span-2 flex flex-col justify-between bg-zinc-900/30 border border-white/[0.06] rounded-xl p-5">
                    <div>
                      <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.08]">
                        <div>
                          <h3 className="text-xs font-semibold text-white">
                            Autonomous Cycle Execution
                          </h3>
                          <p className="text-[11px] text-zinc-400">
                            Deterministic filtering followed by fast-tier LLM evaluation
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={simulateRun}
                          disabled={isSimulating}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-200 active:scale-[0.97] transition-all shadow-sm disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>{isSimulating ? "Simulating..." : "Run Collection"}</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {/* Step 1 */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            pipelineStep >= 1
                              ? "bg-zinc-800/60 border-white/20"
                              : "bg-zinc-900/20 border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-semibold">
                                1
                              </span>
                              <div>
                                <div className="text-xs font-medium text-white">
                                  Ingest HeadHunter Public RSS Feeds
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Queries composite keyword variations without rate limits
                                </div>
                              </div>
                            </div>
                            {pipelineStep >= 1 && (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 32 Postings Scanned
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            pipelineStep >= 2
                              ? "bg-zinc-800/60 border-white/20"
                              : "bg-zinc-900/20 border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-semibold">
                                2
                              </span>
                              <div>
                                <div className="text-xs font-medium text-white">
                                  Deterministic Salary &amp; Keyword Filtering
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Filters out below {demoSalaryFloor} and toxic keywords
                                </div>
                              </div>
                            </div>
                            {pipelineStep >= 2 && (
                              <span className="text-[11px] text-zinc-300 font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> 18 Retained
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            pipelineStep >= 3
                              ? "bg-zinc-800/60 border-white/20"
                              : "bg-zinc-900/20 border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-semibold">
                                3
                              </span>
                              <div>
                                <div className="text-xs font-medium text-white">
                                  Multi-Tier AI Synergy Evaluation
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Fast-tier LLM evaluates compatibility (0–100)
                                </div>
                              </div>
                            </div>
                            {pipelineStep >= 3 && (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> 6 Matches (80+)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            pipelineStep >= 4
                              ? "bg-zinc-800/60 border-white/20"
                              : "bg-zinc-900/20 border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center font-semibold">
                                4
                              </span>
                              <div>
                                <div className="text-xs font-medium text-white">
                                  Liveness Verification &amp; 100-Cap Guard
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  HEAD probes check validity; enforces 100 vacancy limit
                                </div>
                              </div>
                            </div>
                            {pipelineStep >= 4 && (
                              <span className="text-[11px] text-zinc-300 font-medium flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Verified Valid
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div
                          className={`p-3 rounded-lg border transition-all ${
                            pipelineStep >= 5
                              ? "bg-emerald-950/40 border-emerald-500/40"
                              : "bg-zinc-900/20 border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-semibold">
                                5
                              </span>
                              <div>
                                <div className="text-xs font-medium text-white">
                                  Telegram Bot Instant Push Alert
                                </div>
                                <div className="text-[11px] text-zinc-400">
                                  Dispatches formatted vacancy card with direct HH.ru link
                                </div>
                              </div>
                            </div>
                            {pipelineStep >= 5 && (
                              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Delivered to Telegram
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Client-side sandbox · Resets on page reload</span>
                      <span>Cron Cadence: Every 2 Hours</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 2: Vacancy Stream */}
            {activeTab === "vacancies" && (
              <motion.div
                key="vacancies"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8 space-y-4"
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-zinc-400">
                    Evaluated against demo profile ({demoRole}):
                  </span>
                  <span className="font-medium text-emerald-400">
                    3 Open Postings · 0 Red Flags
                  </span>
                </div>

                {/* Card 1 (Interactive Click to Inspect) */}
                <div
                  onClick={() => setSelectedJob("yandex")}
                  className="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/30 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          Lead Full Stack Engineer (React 19 / Node.js)
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-white/[0.06]">
                          Click to Inspect
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                        <span className="text-zinc-200 font-medium">Yandex Cloud</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" /> Moscow / Remote
                        </span>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">
                          350,000–450,000 RUB
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pt-1 leading-relaxed">
                        Strong alignment with Next.js and TypeScript. Compensation exceeds the {demoSalaryFloor} floor.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">React 19</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Next.js</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">PostgreSQL</span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="text-xl font-bold leading-none">94</span>
                        <span className="text-[8px] uppercase tracking-wider font-medium mt-0.5">Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="p-5 rounded-xl bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          Senior Frontend Architect (Design Systems)
                        </h3>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                        <span className="text-zinc-200 font-medium">Ozon Marketplace</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" /> Fully Remote
                        </span>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">
                          300,000–380,000 RUB
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 pt-1 leading-relaxed">
                        Matches component design system and architecture profile.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">React</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Tailwind CSS</span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <span className="text-xl font-bold leading-none">88</span>
                        <span className="text-[8px] uppercase tracking-wider font-medium mt-0.5">Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 (Auto-rejected by rule filter) */}
                <div className="p-5 rounded-xl bg-zinc-900/20 border border-white/[0.04] opacity-70">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-300">
                          Full Stack Developer (Legacy Maintenance)
                        </h3>
                        <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Auto-Filtered
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                        <span>Outstaff Group</span>
                        <span>·</span>
                        <span>On-Site</span>
                        <span>·</span>
                        <span className="text-rose-400 font-medium">140,000 RUB</span>
                      </div>
                      <p className="text-xs text-rose-400/90 pt-1 leading-relaxed">
                        Filter Trigger: Below salary floor. Detected toxic term: &quot;Unpaid trial period prior to contract.&quot;
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="inline-flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <span className="text-xl font-bold leading-none">35</span>
                        <span className="text-[8px] uppercase tracking-wider font-medium mt-0.5">Score</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Telegram Alerts */}
            {activeTab === "telegram" && (
              <motion.div
                key="telegram"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8 flex justify-center bg-[#09090b]"
              >
                <div className="w-full max-w-md bg-[#121216] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                        <Send className="w-3.5 h-3.5 -rotate-45" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">HH Job Copilot</div>
                        <div className="text-[10px] text-zinc-400">@hh_copilot_bot · Operational</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500">Just now</span>
                  </div>

                  <div className="bg-zinc-900/60 rounded-xl p-4 border border-white/[0.06] space-y-3 text-xs">
                    <div className="text-emerald-400 font-medium text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>New High-Match Listing</span>
                    </div>

                    <div>
                      <strong className="text-white text-sm block">
                        Lead Full Stack Engineer (React 19 / Node.js)
                      </strong>
                      <span className="text-zinc-400 text-xs">Yandex Cloud · Moscow / Remote</span>
                    </div>

                    <div className="space-y-1 py-1.5 text-xs text-zinc-300 border-y border-white/[0.06]">
                      <div>Synergy Score: <strong className="text-emerald-400">94 / 100</strong></div>
                      <div>Compensation: <strong className="text-white">350,000–450,000 RUB</strong></div>
                      <div>Work Format: Remote available</div>
                    </div>

                    <div className="text-zinc-400 text-[11px] leading-relaxed">
                      AI Assessment: Strong alignment with full-stack Next.js profile. Team builds on React 19 architecture.
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button type="button" className="py-2 px-3 rounded-lg bg-zinc-800 text-white font-medium text-xs border border-white/10 hover:bg-zinc-700 transition-colors">
                        View on HH.ru
                      </button>
                      <button type="button" className="py-2 px-3 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 transition-colors">
                        Quick Apply
                      </button>
                      <button type="button" className="py-2 px-3 rounded-lg bg-zinc-800 text-white font-medium text-xs border border-white/10 hover:bg-zinc-700 transition-colors">
                        Draft Cover Letter
                      </button>
                      <button type="button" className="py-2 px-3 rounded-lg bg-zinc-800 text-white font-medium text-xs border border-white/10 hover:bg-zinc-700 transition-colors">
                        Recruiter Contacts
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 4: Liveness Daemon */}
            {activeTab === "liveness" && (
              <motion.div
                key="liveness"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6 sm:p-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900/40 border border-white/[0.06] p-5 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Liveness Verification Daemon</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Automated 404 &amp; Archived Audit
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Traditional boards retain outdated vacancies for months. Our standalone cron daemon periodically audits vacancy HTTP headers:
                    </p>
                    <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> HTTP 200: Retained in active stream
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> HTTP 200 + archived flag: Marked as archived
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> HTTP 404: Marked closed and skipped from Telegram
                      </li>
                    </ul>
                  </div>

                  <div className="bg-zinc-900/40 border border-white/[0.06] p-5 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-zinc-200 font-medium text-xs">
                      <RotateCcw className="w-4 h-4" />
                      <span>100-Vacancy Cap &amp; Purge</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      Zero Table Bloat
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Enforces maximum 100 vacancies per user. Older closed listings are automatically pruned to keep PostgreSQL fast:
                    </p>
                    <div className="bg-black/80 text-zinc-300 p-3 rounded-lg font-mono text-[11px] space-y-0.5 border border-white/10">
                      <div className="text-zinc-500">// Purge query:</div>
                      <div>DELETE FROM &quot;Vacancy&quot;</div>
                      <div>WHERE &quot;status&quot; = &apos;closed&apos;</div>
                      <div>AND &quot;updatedAt&quot; &lt; NOW() - INTERVAL &apos;7 days&apos;;</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simulated Telegram Push Alert Toast (Appears upon Run Collection) */}
          <AnimatePresence>
            {showTelegramToast && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="absolute bottom-5 right-5 z-40 max-w-sm bg-[#18181b] border border-emerald-500/30 rounded-2xl p-4 shadow-2xl flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BellRing className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Telegram Alert Dispatched</span>
                    <button
                      type="button"
                      onClick={() => setShowTelegramToast(false)}
                      className="text-zinc-500 hover:text-white"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-snug">
                    Simulated match delivered: <span className="text-white font-medium">Lead Full Stack Engineer</span> at <span className="text-emerald-400">Yandex Cloud</span> (Score: 94).
                  </p>
                  <div className="text-[10px] text-zinc-500 pt-0.5">
                    @hh_copilot_bot · Standalone 2-hr notification cron
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Logged-in Inspection Drawer (Full Feature Breakdown) */}
          <AnimatePresence>
            {selectedJob && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center cursor-pointer"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.25 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-3xl max-h-[85vh] bg-[#0e0e11] border border-white/10 rounded-2xl shadow-2xl overflow-y-auto cursor-default p-6 sm:p-8 space-y-6"
                >
                  {/* Top Bar with Close Button */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                        Live Authenticated View Breakdown
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        Lead Full Stack Engineer (React 19 / Node.js)
                      </h3>
                      <div className="text-xs text-zinc-400 flex items-center gap-2">
                        <span className="text-white font-medium">Yandex Cloud</span>
                        <span>&middot;</span>
                        <span>Moscow / Remote</span>
                        <span>&middot;</span>
                        <span className="text-emerald-400 font-semibold">350,000–450,000 RUB (Gross)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Feature Explanation 1: AI Synergy Score */}
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>AI Compatibility Rating: 94 / 100</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Top 5% Match
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Evaluated by Fast-Tier LLM in 340ms: Candidate demonstrates 4+ years of React architecture and TypeScript experience. Stated salary expectations (250,000 RUB floor) are comfortably within the employer&apos;s published range (350k–450k).
                    </p>
                  </div>

                  {/* Feature Explanation 2: Compliance Requirements Checklist */}
                  <div>
                    <h4 className="text-xs font-semibold text-white mb-2.5">
                      Deterministic Requirement Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] flex items-center gap-2 text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>React 19 &amp; Next.js: Verified in Portfolio</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] flex items-center gap-2 text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>PostgreSQL Schema Design: Matched</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] flex items-center gap-2 text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Remote Work Option: Fully Available</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-900/30 border border-white/[0.04] flex items-center gap-2 text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Zero Toxic Phrases Detected</span>
                      </div>
                    </div>
                  </div>

                  {/* Feature Explanation 3: Recruiter Intelligence Dossier */}
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] space-y-2">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-sky-400" />
                      <span>Company Dossier &amp; Recruiter Intel</span>
                    </div>
                    <div className="text-xs text-zinc-300 leading-relaxed space-y-1">
                      <div>Contact: <strong className="text-white">Elena Petrova</strong> &middot; Lead Tech Recruiter, Yandex Cloud</div>
                      <div className="text-zinc-400">Direct Corporate Domain: <span className="font-mono text-zinc-300">yandex-team.ru</span></div>
                      <div className="text-zinc-400">Department Stack: Next.js, Node.js, Go, PostgreSQL, ClickHouse</div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      Close Breakdown
                    </button>
                    <a
                      href="https://hh.ru"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-black bg-white hover:bg-zinc-200 transition-all shadow-sm"
                    >
                      <span>View Original on HH.ru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
