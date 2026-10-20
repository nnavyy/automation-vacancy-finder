"use client";

import React from "react";
import {
  Server,
  Lock,
  Layers,
  Search,
  Cpu,
  Chrome,
  Globe2,
  ShieldAlert,
} from "lucide-react";

export default function ArchitectureSection() {
  const specs = [
    {
      icon: Cpu,
      title: "Task-Specific BYOK AI Router",
      subtitle: "Multi-Model Cost & Latency Optimization",
      desc: "Assigns low-latency models (Groq Llama 3.3, Gemini 2.5 Flash) for rapid 300ms batch scoring, while reserving high-reasoning engines (Claude 3.7 Sonnet, GPT-4o) exclusively for customized cover letters and recruiter dossiers.",
    },
    {
      icon: Lock,
      title: "AES-256-GCM Cryptography",
      subtitle: "Authenticated Encryption for Sensitive Keys",
      desc: "All HeadHunter session cookies, OAuth tokens, and user-provided AI keys are encrypted at rest with AES-256-GCM using unique initialization vectors. Encryption keys never touch browser storage.",
    },
    {
      icon: Server,
      title: "PostgreSQL & Prisma Schema",
      subtitle: "Relational Isolation & Compound Indexing",
      desc: "Strict multi-user architecture with compound index [userId, hhId] guarantees idempotent vacancy ingestion. Cascading foreign keys ensure zero orphaned records upon profile or account deletion.",
    },
    {
      icon: Layers,
      title: "Bounded Concurrency Pool",
      subtitle: "High-Throughput without Rate Limits",
      desc: "Network and AI operations are throttled through a bounded worker pool (5 concurrent workers) with exponential backoff and jitter. Prevents HTTP 429 rate limit errors from HeadHunter and LLM APIs.",
    },
    {
      icon: Search,
      title: "Recruiter OSINT Intelligence",
      subtitle: "Direct Outreach to Hiring Managers",
      desc: "Automated entity resolution queries Apollo, Hunter, and Bing APIs to extract verified recruiter and engineering manager contacts (LinkedIn, verified corporate emails), bypassing the 300+ applicant queue.",
    },
    {
      icon: Chrome,
      title: "One-Click Chrome Extension",
      subtitle: "Instant Session & Cookie Capture",
      desc: "Includes a lightweight Manifest V3 Chrome extension that extracts your active HeadHunter session cookies in a single click, eliminating manual DevTools copy-pasting.",
    },
    {
      icon: Globe2,
      title: "Bilingual English & Russian Pipeline",
      subtitle: "Automated Cross-Market Translation",
      desc: "Parses Cyrillic job descriptions, extracts Russian tech idioms, and translates profiles seamlessly between English and Russian without losing nuance or domain-specific terminology.",
    },
    {
      icon: ShieldAlert,
      title: "Heuristic Red Flag Detector",
      subtitle: "Pattern Recognition for Toxic Listings",
      desc: "Scans vacancy descriptions for predatory indicators including unpaid trial periods, uncompensated test tasks, mandatory 6-day work weeks, and below-market wage structures.",
    },
  ];

  return (
    <section id="architecture" className="py-20 md:py-28 bg-[#09090b] border-t border-white/[0.08] relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            System Specifications &amp; Architecture
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Engineered with the precision and reliability of local-first distributed systems. Every component is inspectable and auditable.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {specs.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-5 hover:border-white/20 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-semibold text-white tracking-tight mb-1">
                    {item.title}
                  </h3>
                  <div className="text-[11px] text-zinc-500 mb-2.5 font-normal">
                    {item.subtitle}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
