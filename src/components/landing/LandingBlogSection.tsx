"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, BookOpen } from "lucide-react";

export default function LandingBlogSection() {
  const articles = [
    {
      id: "rss-vs-rest",
      title: "Automating HeadHunter Job Scraping Without Rate Limits: Why RSS Beats REST",
      date: "October 16, 2026",
      readTime: "6 min read",
      category: "Architecture",
      excerpt:
        "HeadHunter's standard REST API imposes strict client-credential requirements, IP throttling, and employer-level verification. Discover how composite RSS feed queries provide reliable vacancy discovery.",
    },
    {
      id: "fast-tier-ai-scoring",
      title: "Evaluating AI Synergy Scores: Fast-Tier LLMs vs Traditional Keyword Matching",
      date: "October 08, 2026",
      readTime: "8 min read",
      category: "AI & ML",
      excerpt:
        "Traditional ATS filters fail on synonyms and nuance. By routing preliminary vacancy evaluations to sub-400ms fast-tier models, we score hundreds of vacancies with deep semantic understanding.",
    },
    {
      id: "recruiter-osint-intelligence",
      title: "Bypassing the 300+ Applicant Queue: Engineering Recruiter OSINT Dossiers",
      date: "October 03, 2026",
      readTime: "7 min read",
      category: "Outreach",
      excerpt:
        "How automated corporate domain resolution and executive email heuristics enable direct candidate outreach to engineering leads and tech recruiters before listings are flooded.",
    },
  ];

  return (
    <section className="relative bg-[#09090b] text-white py-20 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Engineering Notes &amp; Benchmarks
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Real architectural decisions, benchmark findings, and reverse-engineered protocols behind the autonomous vacancy copilot.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white hover:text-zinc-300 transition-colors"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3-Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <Link
              key={art.id}
              href={`/blog/${art.id}`}
              className="bg-[#0e0e12] border border-white/10 rounded-2xl p-6 shadow-xl hover:border-white/25 hover:bg-[#121217] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-3">
                  <span className="font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors mb-2 leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-zinc-400 leading-relaxed font-normal mb-6">
                  {art.excerpt}
                </p>
              </div>

              <div>
                <div className="text-[11px] text-zinc-500 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[9px] flex items-center justify-center">
                    NZ
                  </span>
                  <span>Written by <strong className="text-zinc-300 font-medium">Nanda Zhafran (@nnavyy)</strong></span>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
                  <span>{art.date}</span>
                  <span className="inline-flex items-center gap-1 text-white font-medium group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
