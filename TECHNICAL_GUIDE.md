# Technical Reference — Nanda AI Job Assistant

> For a product overview, features, and usage guide, see [README.md](./README.md).

This document covers the technical architecture, project structure, environment variables, database schema, and production deployment considerations.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI Provider Router](#ai-provider-router)
- [Background Collection Pipeline](#background-collection-pipeline)
- [Local Environment Setup](#local-environment-setup)
- [Production Deployment](#production-deployment)

---

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | Lucide React | 0.468+ |
| Animation | Framer Motion | 12.x |
| Database | PostgreSQL (NeonDB) | — |
| ORM | Prisma | 5.x |
| Authentication | NextAuth.js v5 (beta) | 5.0.0-beta |
| Primary AI | Groq SDK (LLaMA-3 70B) | 0.7.x |
| Fallback AI | Google Generative AI (Gemini) | 0.21.x |
| Web Scraping | Cheerio | 1.x |
| Workflow Automation | n8n (self-hosted) | 1.x |
| HTTP Client | Axios | 1.7.x |
| Date Utilities | date-fns | 4.x |

---

## Project Structure

```text
nanda-ai-job-assistant/
├── prisma/
│   └── schema.prisma              Database schema: models, relations, enums
│
├── n8n/
│   ├── README.md                  n8n-specific setup instructions
│   └── workflows/                 Exported n8n workflow JSON files
│
├── src/
│   ├── app/                       Next.js App Router
│   │   ├── api/                   Backend API routes
│   │   │   ├── account/           Account management endpoints
│   │   │   ├── auth/              NextAuth.js authentication handlers
│   │   │   ├── company-intel/     OSINT contact-finding endpoints
│   │   │   ├── cron/              Webhook endpoints triggered by n8n
│   │   │   │   ├── collect-vacancies/   Fetches and stores new HH.ru vacancies
│   │   │   │   └── analyze-pending/     Runs AI scoring on unanalyzed vacancies
│   │   │   ├── dashboard/         Dashboard data aggregation endpoints
│   │   │   ├── settings/          User settings CRUD + HH.ru token validation
│   │   │   ├── telegram/          Telegram bot webhook + token linking
│   │   │   ├── translate/         Text translation via AI provider router
│   │   │   └── vacancies/         Vacancy CRUD: fetch, update, hide, apply
│   │   │
│   │   ├── dashboard/             Authenticated dashboard pages
│   │   │   ├── analytics/         Funnel analytics with time-range filtering
│   │   │   ├── applied/           Applied vacancies tracker
│   │   │   ├── company-intel/     Company OSINT search interface
│   │   │   ├── saved/             Bookmarked vacancy list
│   │   │   ├── settings/          Profile, matching config, legal links
│   │   │   └── vacancies/         Main vacancy split-view
│   │   │
│   │   ├── legal/
│   │   │   ├── terms/             Terms of Service page
│   │   │   └── privacy/           Privacy Policy page
│   │   │
│   │   ├── login/                 Authentication: login screen
│   │   ├── register/              Authentication: registration screen
│   │   └── globals.css            Global CSS reset and Tailwind base
│   │
│   ├── components/                Shared React components
│   │   ├── AnalyticsDashboard.tsx Client-side analytics with filter state
│   │   ├── RecruiterDossierModal.tsx  OSINT contact detail modal
│   │   ├── SidebarNav.tsx         Dashboard navigation sidebar
│   │   ├── SyncCadenceTimer.tsx   Live countdown and last-sync display
│   │   ├── VacanciesSplitView.tsx Main vacancy browse + detail panel
│   │   └── ui/                    Base primitives (buttons, skeletons, etc.)
│   │
│   └── lib/                       Core business logic
│       ├── aiAnalyzer.ts          AI prompt construction and scoring logic
│       ├── aiProviderRouter.ts    Provider abstraction with automatic fallback
│       ├── auth-helpers.ts        Session retrieval and auth utilities
│       ├── collectionPipeline.ts  HH.ru fetch, normalize, dedup, store pipeline
│       ├── companyIntel.ts        Hunter / Apollo / Bing OSINT orchestrator
│       ├── db.ts                  Prisma client singleton
│       ├── hhPrivateClient.ts     Cookie-auth HH.ru client (negotiations)
│       ├── hhPublicVacancyClient.ts  Public HH.ru search API client
│       ├── redFlags.ts            Regex library for toxic job-post detection
│       ├── rules.ts               Hardcoded pre-screening keyword rules
│       ├── scoring.ts             Numeric scoring aggregation logic
│       └── telegram.ts            Telegram message dispatch utility
│
└── public/                        Static assets
```

---

## Database Schema

The Prisma schema is located at `prisma/schema.prisma`. Key models:

| Model | Purpose |
|---|---|
| `UserProfile` | Stores all user preferences: skills, keywords, thresholds, HH.ru token, resume text |
| `Vacancy` | Stores scraped job postings: title, employer, description, source URL, status |
| `VacancyAnalysis` | One-to-one relation with Vacancy: AI score, pros, cons, red flags, generated pitch |
| `AppliedVacancy` | Tracks vacancies the user has applied to with HH.ru negotiation status |
| `TelegramLink` | Maps a Telegram chat ID to the local user account via a one-time token |
| `Account`, `Session`, `User` | NextAuth.js standard adapter tables |

---

## API Reference

All API routes are under `/api/`. Routes marked as `[CRON]` are intended to be called by n8n and require the `Authorization: Bearer <CRON_SECRET>` header.

| Route | Method | Description |
|---|---|---|
| `/api/cron/collect-vacancies` | POST | `[CRON]` Fetches new vacancies from HH.ru and stores them |
| `/api/cron/analyze-pending` | POST | `[CRON]` Runs AI scoring on vacancies without an analysis record |
| `/api/vacancies` | GET | Returns paginated vacancy list with analysis data |
| `/api/vacancies/[id]` | PATCH | Updates vacancy status (hidden, saved, applied) |
| `/api/settings` | GET / POST | Retrieves and saves UserProfile preferences |
| `/api/settings/validate-hh` | POST | Validates HH.ru cookie and returns available resumes |
| `/api/settings/sync-history` | POST | Imports HH.ru negotiation history into the database |
| `/api/translate` | POST | Translates text via the AI provider router |
| `/api/company-intel/search` | POST | Runs OSINT search for a given company |
| `/api/dashboard/collect-status` | GET | Returns last sync time and interval metadata |
| `/api/telegram/link` | GET / POST | Generates and retrieves Telegram linking tokens |
| `/api/account` | GET / DELETE | Account data and deletion |

---

## AI Provider Router

`src/lib/aiProviderRouter.ts` provides a unified `callAI(prompt, options)` function that abstracts provider selection behind a priority queue.

**Default order:** Groq > Google Gemini > OpenRouter

If the primary provider returns an error or is rate-limited, the router automatically retries with the next provider in the queue. The active order is persisted in `UserProfile.aiProviderOrder` and displayed (read-only) in the Settings page.

---

## Background Collection Pipeline

`src/lib/collectionPipeline.ts` orchestrates the full vacancy ingestion flow:

1. **Keyword search** — Calls the HH.ru public API with each configured English and Russian keyword.
2. **Deduplication** — Checks existing vacancy `externalId` values before inserting.
3. **Exclusion filter** — Applies `excludeKeywords` from the user profile; matching vacancies are skipped immediately.
4. **Storage** — Saves new vacancies with status `PENDING_ANALYSIS`.
5. **AI analysis trigger** — The separate `/api/cron/analyze-pending` webhook picks up `PENDING_ANALYSIS` vacancies and runs the AI scoring pipeline.
6. **Notification** — Vacancies scoring above `minimumScoreToNotify` trigger a Telegram message.

---

## Local Environment Setup

### Prerequisites

- Node.js v18.x or v20.x
- A PostgreSQL database (NeonDB free tier is sufficient for development)
- n8n (run locally via `npx n8n`)

### Step-by-Step

**1. Clone**

```bash
git clone https://github.com/your-username/nanda-ai-job-assistant.git
cd nanda-ai-job-assistant
```

**2. Install**

```bash
npm install
```

**3. Environment**

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `CRON_SECRET`. See the full reference in [README.md](./README.md#configuration).

**4. Database**

```bash
npx prisma db push
npx prisma generate
```

**5. Run**

```bash
npm run dev        # Development server at http://localhost:3000
npx n8n            # n8n scheduler at http://localhost:5678
```

---

## Production Deployment

### Vercel / Railway / Render

- Set all environment variables in the platform's dashboard.
- The `build` script (`prisma generate && next build`) is already configured in `package.json`.
- **Database connections:** Serverless functions can exhaust PostgreSQL connection limits quickly. For NeonDB, append `?pgbouncer=true&connection_limit=1` to `DATABASE_URL`.

### n8n

n8n cannot run on serverless platforms. Options:

| Option | Notes |
|---|---|
| VPS (Hetzner, DigitalOcean, Linode) | Most control; cheapest for always-on workloads |
| [n8n Cloud](https://n8n.io/cloud) | Managed hosting; no self-management required |
| Railway / Render (container) | Use the official n8n Docker image |

After deploying, update the webhook URLs in your n8n workflows from `http://localhost:3000` to your production domain, and ensure `CRON_SECRET` matches between your application and n8n environment variables.

### HTTPS and Telegram Webhooks

If you expose the application publicly, configure HTTPS. The Telegram bot receives updates via webhook (`/api/telegram/webhook`); this endpoint must be accessible over HTTPS. Update the webhook URL via the Telegram BotFather API after deployment.

---

> For feature documentation and usage instructions, see [README.md](./README.md).
