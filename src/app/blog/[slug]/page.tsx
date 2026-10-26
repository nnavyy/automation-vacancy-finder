import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, User, ArrowRight, Share2, CheckCircle2 } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { auth } from "@/lib/auth";

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

const BLOG_POSTS: Record<string, BlogPost> = {
  "rss-vs-rest": {
    title: "Automating HeadHunter Job Scraping Without Rate Limits: Why RSS Beats REST",
    date: "October 16, 2026",
    readTime: "6 min read",
    category: "Architecture",
    summary:
      "HeadHunter's standard REST API imposes strict client-credential requirements, IP throttling, and employer-level verification. Discover how composite RSS feed queries provide reliable, rate-limit immune vacancy discovery.",
    content: [
      {
        sectionTitle: "The HeadHunter REST API Bottleneck",
        paragraphs: [
          "Developers attempting to automate job discovery on HeadHunter (hh.ru) typically start with the official REST API (/vacancies endpoint). Within hours, they run into aggressive rate limits: HTTP 429 Too Many Requests, mandatory OAuth 2.0 application verification, and daily IP call caps that throttle rapid batch scanning.",
          "Furthermore, employer-level token verification requires official business registrations in the CIS region, creating an impassable barrier for individual software engineers looking to automate their own job hunts.",
        ],
      },
      {
        sectionTitle: "The Hidden Power of Composite RSS Feeds",
        paragraphs: [
          "HeadHunter maintains public RSS endpoints (hh.ru/rss/vacancies) designed for syndication readers. These feeds accept standard query parameters (text, search_field, experience, salary, only_with_salary) without requiring authorization headers or API bearer tokens.",
          "By decomposing target titles into composite keyword matrices (e.g., 'React Full Stack' OR 'Next.js Architect' OR 'Frontend Lead') and polling through a jittered delay pool (800ms ± 30%), the copilot scrapes 30+ postings per cycle without triggering anti-bot firewalls.",
        ],
        codeSnippet: `// Example Jittered RSS Polling Routine
const QUERY_DELAY_MS = 800;

export async function fetchCompositeRss(query: string): Promise<string> {
  const jitter = (Math.random() * 0.6 + 0.7); // 0.7x to 1.3x variation
  await sleep(Math.floor(QUERY_DELAY_MS * jitter));

  const url = \`https://hh.ru/rss/vacancies?text=\${encodeURIComponent(query)}&search_field=name\`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/rss+xml, application/xml"
    }
  });

  if (!res.ok) throw new Error(\`RSS Fetch Failed: HTTP \${res.status}\`);
  return res.text();
}`,
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
    title: "The 100-Vacancy Guard: Preventing PostgreSQL Table Bloat with Compound Indexing",
    date: "October 12, 2026",
    readTime: "5 min read",
    category: "Database",
    summary:
      "Why unlimited vacancy scraping degrades database performance. An analysis of our 100-vacancy concurrency cap, automated 404 liveness purging, and [userId, hhId] compound indexing strategies.",
    content: [
      {
        sectionTitle: "The Problem with Unchecked Scraping",
        paragraphs: [
          "In initial prototypes, background daemons scraped hundreds of vacancies every day without retention limits. Within two weeks, the local PostgreSQL database swelled to over 40,000 rows. Query response times for full-text filtering degraded from 12ms to over 380ms.",
          "Worse, 70% of those stored listings were already archived or deleted on hh.ru, cluttering the user interface with ghost openings.",
        ],
      },
      {
        sectionTitle: "Enforcing the 100-Vacancy Concurrency Cap",
        paragraphs: [
          "We instituted a hard ceiling: MAX_VACANCIES_PER_USER = 100. Before committing any newly scraped posting to the database, the collection pipeline verifies the count of active (non-closed and non-ignored) vacancies.",
          "If the user already has 100 active vacancies, the ingestion skips saving lower-priority listings until older ones are acted upon, archived, or purged by the liveness daemon.",
        ],
        codeSnippet: `// 100-Vacancy Guard Enforcement
const activeCount = await prisma.vacancy.count({
  where: {
    userId,
    status: { notIn: ["closed", "ignored"] }
  }
});

if (activeCount >= 100) {
  console.log(\`[Pipeline] User \${userId} reached active cap of 100 vacancies. Skipping.\`);
  return;
}`,
      },
      {
        sectionTitle: "Compound Indexing for Instant Lookups",
        paragraphs: [
          "To guarantee idempotent inserts across parallel background workers, we implemented a compound unique index: @@unique([userId, hhId]).",
          "This ensures that duplicate discoveries across different composite RSS queries are rejected at the database engine level with zero application-side mutex locking.",
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
      "Traditional ATS filters fail on synonyms and nuance. By routing preliminary vacancy evaluations to sub-400ms fast-tier models (Groq Llama 3.3 and Gemini Flash), we score hundreds of vacancies with deep semantic understanding.",
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
          "Tier 1 (Fast-Tier): Uses Groq Llama 3.3 70B or Gemini 2.5 Flash to compute 0-100 compatibility scores, identify red flags, and extract missing skills in under 350ms per vacancy.",
          "Tier 2 (High-Reasoning): Only triggered when the candidate clicks 'Draft Cover Letter' or requests 'Recruiter Dossier Intelligence'. This reserves heavy compute strictly for user-demanded high-value outputs.",
        ],
      },
    ],
  },
  "recruiter-osint-intelligence": {
    title: "Bypassing the 300+ Applicant Queue: Engineering Recruiter OSINT Dossiers",
    date: "October 03, 2026",
    readTime: "7 min read",
    category: "Outreach",
    summary:
      "How automated corporate domain resolution and executive email heuristics enable direct candidate outreach to engineering leads and tech recruiters before listings are flooded.",
    content: [
      {
        sectionTitle: "The '300 Applicants in 2 Hours' Problem",
        paragraphs: [
          "On major job boards like HeadHunter, high-paying remote React and Python positions receive between 200 and 500 applicants within the first 120 minutes of publication.",
          "Standard applications submitted through the web button sit buried at the bottom of the recruiter's ATS inbox, with less than an 8% open rate.",
        ],
      },
      {
        sectionTitle: "Automated Entity Resolution & Direct Outreach",
        paragraphs: [
          "The Company Intel engine parses the employer's legal and trade names, extracts their primary digital domain, and queries Bing Web and OSINT endpoints to identify the specific Lead Tech Recruiter or Engineering Manager responsible for the department.",
          "By generating polite, concise, and technically grounded direct emails, candidates achieve response rates exceeding 42% compared to standard button applications.",
        ],
      },
    ],
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS[slug];

  if (!post) {
    notFound();
  }

  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black antialiased">
      <LandingHeader userEmail={userEmail} />

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12 pb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-xs text-zinc-500 mb-4">
            <span className="font-mono px-2 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">
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

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base text-zinc-400 leading-relaxed mb-6 font-normal">
            {post.summary}
          </p>

          {/* Author Badge (Written by Nanda Zhafran / @nnavyy) */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <Link href="/about" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                NZ
              </div>
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Nanda Zhafran (@nnavyy)
                </div>
                <div className="text-[11px] text-zinc-500">
                  Full-Stack Engineer &middot; Creator of HH Job Copilot
                </div>
              </div>
            </Link>

            <Link
              href="/about"
              className="text-xs text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>View Creator Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Article Body */}
        <article className="space-y-10 text-sm text-zinc-300 leading-relaxed">
          {post.content.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {sec.sectionTitle}
              </h2>

              {sec.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed text-zinc-400">
                  {p}
                </p>
              ))}

              {sec.codeSnippet && (
                <div className="mt-4 rounded-xl bg-[#0e0e11] border border-white/10 p-5 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <pre>{sec.codeSnippet}</pre>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>More Engineering Articles</span>
          </Link>

          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-black bg-white hover:bg-zinc-200 transition-all shadow-md"
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
