"use client";

import React, { useState } from "react";
import { Rss, Filter, Cpu, Send, Shield, Database, ArrowRight, CheckCircle2, Server, Lock, Layers, Eye, Maximize2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkflowSection() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"stages" | "blueprint">("stages");
  const [isZoomed, setIsZoomed] = useState(false);

  const stages = [
    {
      id: 1,
      name: "Ingestion Engine",
      sub: "HeadHunter RSS Discovery",
      icon: Rss,
      tag: "Deterministic I/O",
      color: "from-amber-500/20 to-orange-500/20",
      accent: "text-amber-400",
      details: [
        "Polls public HeadHunter RSS endpoints with composite search queries",
        "Bypasses employer API keys and user-agent rate limiting via jittered delays",
        "Extracts raw XML payload containing vacancy IDs, titles, and company metadata",
      ],
      output: "Raw Vacancy Stream (30+ postings / cycle)",
    },
    {
      id: 2,
      name: "Toxicity & Salary Filter",
      sub: "Rule-Based Pre-Screening",
      icon: Filter,
      tag: "Zero-Cost Rule Gate",
      color: "from-yellow-500/20 to-amber-500/20",
      accent: "text-yellow-400",
      details: [
        "Enforces mandatory gross salary floor (e.g., min. 250,000 RUB)",
        "Applies negative regex to eliminate unpaid trial periods and predatory 6-day weeks",
        "Discards irrelevant non-remote listings before invoking AI tokens",
      ],
      output: "Retained High-Value Candidates (15-20 postings)",
    },
    {
      id: 3,
      name: "Multi-Tier AI Scorer",
      sub: "Task-Specific LLM Router",
      icon: Cpu,
      tag: "Sub-400ms Inference",
      color: "from-emerald-500/20 to-teal-500/20",
      accent: "text-emerald-400",
      details: [
        "Fast-tier models (Groq Llama 3.3 / Gemini Flash) evaluate resume alignment",
        "Generates 0–100 compatibility score with bulleted match reasoning",
        "Identifies missing skills vs. strong core competency highlights",
      ],
      output: "Scored Synergy Dossiers (80+ threshold)",
    },
    {
      id: 4,
      name: "Liveness Daemon & Cap",
      sub: "Automated 404 Purging",
      icon: Shield,
      tag: "PostgreSQL Guard",
      color: "from-blue-500/20 to-indigo-500/20",
      accent: "text-blue-400",
      details: [
        "Executes lightweight HTTP HEAD requests to verify if posting is still open",
        "Instantly marks 404 and archived listings as closed to prevent dead applications",
        "Enforces maximum 100 active vacancies per user to maintain low query latency",
      ],
      output: "Clean Idempotent Database Record",
    },
    {
      id: 5,
      name: "Telegram Dispatch",
      sub: "Instant Actionable Push",
      icon: Send,
      tag: "Real-Time Hook",
      color: "from-sky-500/20 to-cyan-500/20",
      accent: "text-sky-400",
      details: [
        "Delivers formatted card with company info, salary, and synergy rating",
        "Includes one-click direct application URL to open the exact listing on hh.ru",
        "Provides draft cover letter context based on candidate portfolio",
      ],
      output: "Actionable Notification in Chat",
    },
  ];

  return (
    <section id="pipeline" className="py-20 md:py-28 bg-[#09090b] border-t border-white/[0.08] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            Autonomous Pipeline Workflow
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            A deterministic 5-stage engineering architecture designed for continuous vacancy discovery, AI compatibility scoring, and zero noise.
          </p>
        </div>

        {/* Blueprint & Workflow Card */}
        <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl mb-12 relative overflow-hidden">
          {/* Top Bar with Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/[0.08] gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mt-1">
                Local Distributed Pipeline Stages
              </h3>
            </div>

            {/* Toggle: Interactive Stages vs Visual Flowchart */}
            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/[0.06] text-[11px] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("stages")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  viewMode === "stages"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Stages Inspector
              </button>
              <button
                type="button"
                onClick={() => setViewMode("blueprint")}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === "blueprint"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>System Flowchart</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "stages" ? (
              <motion.div
                key="stages-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Horizontal Step Buttons with Spring Physics */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                  {stages.map((stage, idx) => {
                    const Icon = stage.icon;
                    const isSelected = activeStage === idx;
                    return (
                      <motion.button
                        key={stage.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveStage(idx)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                          isSelected
                            ? "bg-zinc-800/90 border-white/40 shadow-xl"
                            : "bg-zinc-900/40 border-white/[0.06] hover:border-white/20 hover:bg-zinc-900/70"
                        }`}
                      >
                        {isSelected && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${stage.color} opacity-40 pointer-events-none`} />
                        )}
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <span className="text-[11px] font-mono font-bold text-zinc-500">
                            0{stage.id}
                          </span>
                          <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-white truncate relative z-10">
                          {stage.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5 relative z-10">
                          {stage.sub}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Active Stage Deep Dive Inspector (Slide Up with Spring) */}
                <motion.div
                  key={activeStage}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-950/70 border border-white/[0.08] rounded-xl p-6 relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-zinc-500">
                        STAGE 0{stages[activeStage].id}
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {stages[activeStage].name} &middot; {stages[activeStage].sub}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/[0.06] self-start sm:self-auto">
                      {stages[activeStage].tag}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2.5">
                      <div className="text-xs font-medium text-zinc-400 mb-2">
                        Technical Specifications:
                      </div>
                      {stages[activeStage].details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 mb-1">
                          Stage Deliverable
                        </div>
                        <div className="text-xs font-medium text-white">
                          {stages[activeStage].output}
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-500 pt-3 border-t border-white/[0.06] flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" />
                        <span>Runs locally in background daemon</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="blueprint-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black group">
                  <img
                    src="/system_workflow_complete.jpg"
                    alt="HH Job Copilot System Architecture Workflow Complete"
                    className="w-full h-auto object-cover max-h-[500px] transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute top-4 right-4 bg-black/80 px-3 py-1.5 rounded-lg border border-white/20 text-xs font-mono text-zinc-300 backdrop-blur-md flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Complete System Blueprint</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                  <span>Decomposed RSS XML Parsing &rarr; Zero-Cost Rule Gate &rarr; Fast-Tier LLM Evaluation &rarr; PostgreSQL Sync &rarr; Telegram Bot</span>
                  <a
                    href="/architecture"
                    className="text-white hover:underline flex items-center gap-1 font-medium shrink-0"
                  >
                    <span>Read Architecture Deep-Dive</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
