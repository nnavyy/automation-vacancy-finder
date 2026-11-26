import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import "@/components/public/public.css";
import { auth } from "@/lib/auth";
import type { BlogPostSlug } from "@/lib/blog-slugs";

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
  ] satisfies { id: BlogPostSlug; title: string; date: string; readTime: string; category: string; excerpt: string }[];

  return (
    <div className="fw-public-theme min-h-screen bg-public-950 text-public-100 antialiased">
      <LandingHeader userEmail={userEmail} />

      <main className="pt-10 sm:pt-16 pb-20 max-w-6xl mx-auto px-5 sm:px-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-public-400 hover:text-public-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-12 max-w-3xl">
          <h1 className="fw-public-title mb-4">
            Articles &amp; Architecture Notes
          </h1>
          <p className="text-base text-public-400 leading-relaxed">
            In-depth documentation, benchmark studies, and design rationale behind our autonomous vacancy finder and AI scoring pipelines.
          </p>
        </header>

        {/* Article Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art) => (
            <Link
              key={art.id}
              href={`/blog/${art.id}`}
              className="bg-field-panel border border-field-line rounded-2xl p-6 sm:p-7 hover:border-field-accent/50 hover:bg-field-raised transition-all flex flex-col justify-between group cursor-pointer block"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-public-400 mb-3">
                  <span className="font-mono px-2 py-0.5 rounded bg-public-900 border border-field-line text-public-300">
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h2 className="text-xl font-semibold tracking-tight text-public-100 group-hover:text-field-accent transition-colors mb-2.5 leading-snug">
                  {art.title}
                </h2>

                <p className="text-sm text-public-400 leading-relaxed mb-6 font-normal">
                  {art.excerpt}
                </p>
              </div>

              <div>
                <div className="text-xs text-public-400 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold text-[9px] flex items-center justify-center">
                    NZ
                  </span>
                  <span>Written by <strong className="text-public-300 font-medium">Nanda Zhafran (@nnavyy)</strong></span>
                </div>

                <div className="pt-3 border-t border-field-line flex items-center justify-between text-xs text-public-500">
                  <span>{art.date}</span>
                  <span className="inline-flex items-center gap-1 text-public-100 font-medium group-hover:translate-x-1 transition-transform">
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
