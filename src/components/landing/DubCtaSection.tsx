"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Star, Github, Terminal, Shield, Sparkles } from "lucide-react";

export default function DubCtaSection() {
  return (
    <section className="relative bg-[#09090b] pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Curved Container Wrapper (Matching Screenshot 2) */}
      <div className="max-w-6xl mx-auto relative">
        {/* The Card with Inset Curved Top and Grid Lines */}
        <div className="relative rounded-3xl bg-[#0b0b0e] border border-white/10 overflow-hidden shadow-2xl">
          {/* Subtle Grid Lines Overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Radial Center Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Top Notch Accent Curve */}
          <div className="flex justify-center -mt-px">
            <div className="w-48 sm:w-64 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full" />
          </div>

          {/* Content Inside */}
          <div className="relative z-10 py-16 sm:py-20 px-6 sm:px-12 text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Supercharge your HeadHunter job search
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal max-w-xl mx-auto">
              See why HH Job Copilot is the local-first automation platform of choice for software engineers looking for high-synergy vacancies without subscription bloat.
            </p>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="#self-host"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-black bg-white hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-lg"
              >
                <span>Start Free Locally</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-medium text-white bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 hover:border-white/20 active:scale-[0.98] transition-all backdrop-blur-md"
              >
                <span>Explore Live Demo</span>
              </Link>
            </div>

            {/* Social Proof & Rating Metrics (Matching Dub.co Row) */}
            <div className="pt-10 border-t border-white/[0.06] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400">
              {/* GitHub Stars */}
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-white" />
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">Open Source</span>
              </div>

              {/* Product Hunt */}
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-500 text-white font-bold text-[9px] flex items-center justify-center">
                  P
                </span>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">Dev Community</span>
              </div>

              {/* Local Privacy Verified */}
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">100% On-Device</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
