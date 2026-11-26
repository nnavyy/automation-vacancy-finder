import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import "@/components/public/public.css";
import { auth } from "@/lib/auth";
import type { BlogPostSlug } from "@/lib/blog-slugs";
import { BRAND_NAME } from "@/lib/brand";
import { siteOrigin } from "@/lib/site-url";

interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  category: string;
  summary: string;
  content: {
    sectionTitle: string;
    paragraphs: string[];
    codeSnippet?: string;
  }[];
}

const BLOG_POSTS = {
  "rss-vs-rest": {
    title: "Using HeadHunter RSS for Vacancy Discovery",
    date: "October 16, 2026",
    readTime: "6 min read",
    category: "Architecture",
    summary:
      "How HH Job Copilot builds vacancy searches from profile filters, reads HeadHunter RSS, and handles temporary fetch errors.",
    content: [
      {
        sectionTitle: "RSS and REST in the HeadHunter Workflow",
        paragraphs: [
          "HeadHunter offers a REST API and an RSS feed for vacancy discovery. API access and authentication requirements depend on the operation, so developers should consult HeadHunter's documentation for the endpoint they intend to use.",
          "Our vacancy worker uses the public search feed as an input. The feed provides a starting list of vacancies to match against a search profile.",
        ],
      },
      {
        sectionTitle: "Turning Profile Filters into Search Queries",
        paragraphs: [
          "The worker queries HeadHunter's vacancy feed using role keywords and profile filters such as experience or compensation.",
          "The worker limits pagination and backs off if HeadHunter responds with a rate limit or temporary service error. The number of results depends on the query and on what's available when it runs.",
        ],
      },
      {
        sectionTitle: "Handling Cyrillic Text Normalization",
        paragraphs: [
          "Unlike Western job boards (LinkedIn, Indeed), Russian IT postings mix Cyrillic and Latin alphabets seamlessly (e.g., 'Фронтенд разработчик (React 19 / TypeScript)').",
          "Our parser applies Unicode NFC normalization and bilingual regex dictionaries to accurately segment requirements, distinguish between gross (до вычета) and net (на руки) salaries, and extract employer contact heuristics.",
        ],
      },
    ],
  },
  "100-vacancy-guard": {
    title: "Keeping the Vacancy Queue Bounded with PostgreSQL",
    date: "October 12, 2026",
    readTime: "5 min read",
    category: "Database",
    summary:
      "How the collector makes room for fresh vacancies, recognizes listings that have gone offline, and deduplicates records per user.",
    content: [
      {
        sectionTitle: "The Problem with Unchecked Scraping",
        paragraphs: [
          "Repeated collections can accumulate listings over time, even after the employer archives an opening. That makes the dashboard harder to scan and adds database work.",
          "The collector tracks vacancy status so an unavailable or deprioritized listing can leave the active queue.",
        ],
      },
      {
        sectionTitle: "Keeping the Active Queue at Its Configured Limit",
        paragraphs: [
          "When the active queue reaches its configured limit, the collector can deprioritize lower-scoring listings the candidate has not acted on to make room for new opportunities.",
          "If the queue stays full, the collector skips new records and can continue updating vacancies it already knows about.",
        ],
        codeSnippet: `// After trying to make room for fresh listings:
if (!existing && activeVacancyCount >= MAX_VACANCIES_PER_USER) {
  return;
}`,
      },
      {
        sectionTitle: "Compound Indexing for Instant Lookups",
        paragraphs: [
          "To guarantee idempotent inserts across parallel background workers, we implemented a compound unique index: @@unique([userId, hhId]).",
          "The unique key keeps repeated discoveries for the same user from creating duplicate vacancy records.",
        ],
      },
    ],
  },
  "fast-tier-ai-scoring": {
    title: "Evaluating AI Synergy Scores: Fast-Tier LLMs vs Traditional Keyword Matching",
    date: "October 08, 2026",
    readTime: "8 min read",
    category: "AI & ML",
    summary:
      "How keyword filters and language models work together to evaluate vacancies against a candidate profile.",
    content: [
      {
        sectionTitle: "Why Traditional Keyword Matchers Fail",
        paragraphs: [
          "Simple keyword matching is brittle. If a job posting asks for 'Next.js App Router' and the resume lists 'Full-Stack React Framework Architectures', a regex matcher assigns a score of zero.",
          "Conversely, keyword stuffing fools basic ATS scanners while wasting candidate time on irrelevant postings.",
        ],
      },
      {
        sectionTitle: "Two-Tier AI Model Architecture",
        paragraphs: [
          "Rather than sending all text to expensive, high-latency models (like Claude Sonnet 3.7 or GPT-4o), our pipeline implements a two-tier router:",
          "Tier 1 (Fast-Tier): The model returns a match score on a 0–100 scale, flags potential concerns, and identifies missing skills. Response time depends on the provider and the input.",
          "Tier 2 (High-Reasoning): Only triggered when the candidate clicks 'Draft Cover Letter' or requests 'Recruiter Dossier Intelligence'. This reserves heavy compute strictly for user-demanded high-value outputs.",
        ],
      },
    ],
  },
  "recruiter-osint-intelligence": {
    title: "Engineering Recruiter Research for Targeted Outreach",
    date: "October 03, 2026",
    readTime: "7 min read",
    category: "Outreach",
    summary:
      "How Company Intel looks for public hiring contacts and why candidates should verify the evidence before sending an introduction.",
    content: [
      {
        sectionTitle: "Why Context Helps with Outreach",
        paragraphs: [
          "Popular listings can attract many applicants, and the person who owns the hiring process is not always named in the vacancy.",
          "Candidates can use company research to decide whether a relevant public contact is available. The employer's stated application instructions still apply.",
        ],
      },
      {
        sectionTitle: "Automated Entity Resolution & Direct Outreach",
        paragraphs: [
          "The Company Intel engine parses the employer's legal and trade names, extracts their primary digital domain, and queries Bing Web and OSINT endpoints to identify the specific Lead Tech Recruiter or Engineering Manager responsible for the department.",
          "The candidate should confirm the contact and review the introduction before sending it. The available contact evidence depends on what the company publishes.",
        ],
      },
    ],
  },
} satisfies Record<BlogPostSlug, BlogPost>;

interface BlogRouteProps {
  params: Promise<{ slug: string }>;
}

function isBlogPostSlug(slug: string): slug is BlogPostSlug {
  return Object.hasOwn(BLOG_POSTS, slug);
}

export async function generateMetadata({ params }: BlogRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isBlogPostSlug(slug)) notFound();
  const post = BLOG_POSTS[slug];
  return {
    title: `${post.title} | ${BRAND_NAME}`,
    description: post.summary,
    alternates: { canonical: new URL(`/blog/${slug}`, siteOrigin) },
  };
}

export default async function BlogPostPage({ params }: BlogRouteProps) {
  const { slug } = await params;
  if (!isBlogPostSlug(slug)) notFound();
  const post: BlogPost = BLOG_POSTS[slug];

  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <div lang="en" className="fw-public-theme min-h-screen bg-public-950 text-public-100 antialiased">
      <LandingHeader userEmail={userEmail} />

      <main className="pt-10 sm:pt-16 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-public-400 hover:text-public-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12 pb-8 border-b border-field-line">
          <div className="flex flex-wrap items-center gap-3 text-sm text-public-400 mb-4">
            <span className="font-mono px-2 py-0.5 rounded bg-public-900 border border-field-line text-public-300">
              {post.category}
            </span>
            <span>&middot;</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{post.date}</span>
            </div>
            <span>&middot;</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <h1 className="fw-public-title mb-6 !text-[clamp(2.4rem,5.5vw,4.6rem)] !leading-[1.05]">
            {post.title}
          </h1>

          <p className="text-base text-public-400 leading-relaxed mb-6 font-normal">
            {post.summary}
          </p>

          {/* Author Badge (Written by Nanda Zhafran / @nnavyy) */}
          <div className="flex items-center justify-between pt-4 border-t border-field-line">
            <Link href="/about" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                NZ
              </div>
              <div>
                <div className="text-xs font-semibold text-public-100 group-hover:text-emerald-700 transition-colors">
                  Nanda Zhafran (@nnavyy)
                </div>
                <div className="text-[11px] text-public-500">
                  Full-Stack Engineer &middot; Creator of HH Job Copilot
                </div>
              </div>
            </Link>

            <Link
              href="/about"
              className="text-xs text-public-400 hover:text-public-100 transition-colors inline-flex items-center gap-1"
            >
              <span>View Creator Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Article Body */}
        <article className="space-y-10 text-base text-public-300 leading-relaxed">
          {post.content.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl font-semibold text-public-100 tracking-tight">
                {sec.sectionTitle}
              </h2>

              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="leading-[1.8] text-public-300">
                  {p}
                </p>
              ))}

              {sec.codeSnippet && (
                <div className="mt-4 rounded-xl bg-field-panel border border-field-line p-5 font-mono text-xs text-public-300 overflow-x-auto">
                  <pre>{sec.codeSnippet}</pre>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-field-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-public-400 hover:text-public-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>More Engineering Articles</span>
          </Link>

          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-field-accent hover:bg-[#2c3bb7] transition-colors"
          >
            <span>Explore Live Dashboard Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
