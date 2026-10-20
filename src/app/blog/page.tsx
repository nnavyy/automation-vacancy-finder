import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ArrowRight, BookOpen } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Engineering Blog - HH Job Copilot",
  description:
    "Technical articles and deep-dives on job search automation, HeadHunter RSS protocols, AI evaluation models, and PostgreSQL concurrency.",
};

export default async function BlogPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  const articles = [
    {
      id: "rss-vs-rest",
      title: "Automating HeadHunter Job Scraping Without Rate Limits: Why RSS Beats REST",
      date: "October 16, 2026",
      readTime: "6 min read",
      category: "Architecture",
      excerpt:
        "HeadHunter's standard REST API imposes strict client-credential requirements, IP throttling, and employer-level verification. Discover how composite RSS feed queries provide reliable, rate-limit immune vacancy discovery.",
    },
    {
      id: "100-vacancy-guard",
      title: "The 100-Vacancy Guard: Preventing PostgreSQL Table Bloat with Compound Indexing",
      date: "October 12, 2026",
      readTime: "5 min read",
      category: "Database",
      excerpt:
        "Why unlimited vacancy scraping degrades database performance. An analysis of our 100-vacancy concurrency cap, automated 404 liveness purging, and [userId, hhId] compound indexing strategies.",
    },
    {
      id: "fast-tier-ai-scoring",
      title: "Evaluating AI Synergy Scores: Fast-Tier LLMs vs Traditional Keyword Matching",
      date: "October 08, 2026",
      readTime: "8 min read",
      category: "AI & ML",
      excerpt:
        "Traditional ATS filters fail on synonyms and nuance. By routing preliminary vacancy evaluations to sub-400ms fast-tier models (Groq Llama 3.3 and Gemini Flash), we score hundreds of vacancies with deep semantic understanding.",
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
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black antialiased">
      <LandingHeader userEmail={userEmail} />

      <main className="pt-32 pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-2xl mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Articles &amp; Architecture Notes
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            In-depth documentation, benchmark studies, and design rationale behind our autonomous vacancy finder and AI scoring pipelines.
          </p>
        </div>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art) => (
            <Link
              key={art.id}
              href={`/blog/${art.id}`}
              className="bg-[#0e0e11] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl hover:border-white/25 hover:bg-[#121217] transition-all flex flex-col justify-between group cursor-pointer block"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-3">
                  <span className="font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h2 className="text-base font-semibold text-white group-hover:text-zinc-200 transition-colors mb-2.5 leading-snug">
                  {art.title}
                </h2>

                <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-normal">
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
      </main>

      <LandingFooter />
    </div>
  );
}
