# Technical Guide & Architecture Reference

This document contains in-depth technical specifications, system architecture, database models, internal APIs, cryptographic standards, and production deployment considerations for **HH Job Copilot**.

For a high-level product overview and quickstart, see [README.md](./README.md). For official HeadHunter API registration and Russian moderation templates, see [HH_DEV_REGISTRATION_GUIDE.md](./HH_DEV_REGISTRATION_GUIDE.md).

---

## Table of Contents

- [Core Technology Stack](#core-technology-stack)
- [Directory Structure](#directory-structure)
- [Database Schema & Prisma Models](#database-schema--prisma-models)
- [Internal API Specifications](#internal-api-specifications)
- [AI Provider Router & Task-Specific BYOK](#ai-provider-router--task-specific-byok)
- [HeadHunter Client & Session Handling](#headhunter-client--session-handling)
- [Security & AES-256-GCM Cryptography](#security--aes-256-gcm-cryptography)
- [Background Workers & Automation](#background-workers--automation)
- [Production Deployment & Containerization](#production-deployment--containerization)

---

## Core Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.x | Full-stack server actions, route handlers, SSR |
| UI Runtime | React | 19.x | Modern concurrent rendering and hooks |
| Language | TypeScript | 5.x | Strict type-safety across client and server |
| Styling | Tailwind CSS | 3.x / PostCSS | Utility-first dark theme interface |
| Icons & Motion | Lucide React / Framer Motion | 0.468+ / 12.x | UI symbols and micro-animations |
| Database | PostgreSQL | 15+ / 16 (Alpine) | ACID-compliant relational data store |
| ORM | Prisma Client | 5.22.x | Schema migrations, connection pooling, typed queries |
| Authentication | NextAuth.js | 5.0.0-beta | Multi-user session management |
| Cryptography | Node.js `crypto` | Built-in | AES-256-GCM authenticated token encryption |
| AI Clients | Groq, Gemini, OpenAI, Anthropic | Latest SDKs | Multi-model reasoning and letter synthesis |
| Scraping Engine | Cheerio & Axios | 1.x / 1.7.x | Deterministic DOM parsing and RSS collection |
| Unit Testing | Vitest & Testing Library | 2.x | Automated unit, parser, and regression tests |

---

## Directory Structure

```text
hh-job-copilot/
├── docker-compose.yml          # Container configuration for 1-click self-hosting
├── Dockerfile                  # Production Next.js standalone container build
├── prisma/
│   └── schema.prisma           # Prisma models (User, SearchPreference, Vacancy, etc.)
├── extension/                  # Manifest V3 Chrome Extension (1-Click Session Sync)
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
├── src/
│   ├── app/                    # Next.js App Router (pages and endpoints)
│   │   ├── api/
│   │   │   ├── account/        # User account management and deletion
│   │   │   ├── auth/           # NextAuth handlers and OAuth callbacks
│   │   │   ├── catalog/        # Dynamic technology autocomplete API
│   │   │   ├── company-intel/  # OSINT recruiter contact retrieval
│   │   │   ├── cron/           # Background webhook triggers (collect, analyze, sync)
│   │   │   ├── dashboard/      # Overview analytics and status aggregation
│   │   │   ├── profiles/       # Multi-profile CRUD and active switching
│   │   │   ├── settings/       # Preferences, validation, and history sync
│   │   │   ├── telegram/       # Bot webhook handlers and linking
│   │   │   ├── translate/      # Russian-to-English translation endpoint
│   │   │   └── vacancies/      # Vacancy search, filtering, and status updates
│   │   ├── dashboard/          # Authenticated web dashboard
│   │   │   ├── analytics/      # Funnel metrics and conversion analytics
│   │   │   ├── applied/        # Synced applications and negotiation history
│   │   │   ├── company-intel/  # Recruiter search interface
│   │   │   ├── saved/          # Bookmarked vacancies
│   │   │   ├── settings/       # Search criteria, BYOK models, HH session sync
│   │   │   └── vacancies/      # Split-view vacancy browsing and scoring
│   │   ├── login/              # Sign-in page
│   │   ├── register/           # Registration page
│   │   └── globals.css         # Tailwind base stylesheet
│   ├── components/             # Reusable UI components
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── RecruiterDossierModal.tsx
│   │   ├── SidebarNav.tsx
│   │   ├── TagInput.tsx        # Autocomplete tag component
│   │   └── VacanciesSplitView.tsx
│   └── lib/                    # Core business logic and shared services
│       ├── aiAnalyzer.ts       # AI prompt composition and scoring logic
│       ├── aiProviderRouter.ts # Multi-provider routing, BYOK, cascade failover
│       ├── auth-helpers.ts     # Session retrieval and permission guards
│       ├── catalog/            # Dynamic tech stack suggestions database
│       ├── collectionPipeline.ts # Ingestion, deduplication, and persistence
│       ├── companyIntel.ts     # Hunter, Apollo, and Bing scraping orchestration
│       ├── crypto.ts           # AES-256-GCM token encryption and decryption
│       ├── db.ts               # Prisma singleton with connection pooling
│       ├── hhPrivateClient.ts  # Cookie-authenticated HeadHunter client
│       ├── hhPublicVacancyClient.ts # Public RSS and vacancy scraping client
│       ├── redFlags.ts         # Heuristic patterns for toxic job postings
│       ├── scoring.ts          # Deterministic candidate-job compatibility scoring
│       └── telegram.ts         # Bot notification formatting and dispatch
├── tests/                      # Automated Vitest unit test suites
└── public/                     # Static media assets
```

---

## Database Schema & Prisma Models

The schema is defined in `prisma/schema.prisma`. Primary models:

| Model | Purpose |
|---|---|
| `User` | User identity, credentials, registration timestamps |
| `SearchPreference` | Search criteria, keywords (EN/RU), skills, BYOK configuration, encrypted HH tokens, active resume data |
| `Vacancy` | Scraped postings, compensation, employer metadata, source URLs, and pipeline status (`new`, `saved`, `applied_manual`, `archived`) |
| `VacancyAnalysis` | Relation to `Vacancy`: compatibility score (0–100), technical rationale, detected red flags, and generated pitch |
| `TelegramLink` | One-time linking tokens mapping Telegram chat IDs to user accounts |
| `Account` / `Session` | NextAuth.js authentication and session state |

---

## Internal API Specifications

All endpoints reside under `/api/`. Cron webhooks require the `Authorization: Bearer <CRON_SECRET>` header.

| Route | Method | Access | Description |
|---|---|---|---|
| `/api/profiles` | GET | User | Lists all search profiles for the authenticated user |
| `/api/profiles` | POST | User | Multi-profile operations: `create`, `switch`, `rename`, `delete` |
| `/api/settings` | GET | User | Retrieves active preferences with decrypted token for display |
| `/api/settings` | POST | User | Saves updated search preferences and securely encrypts tokens |
| `/api/settings/validate-hh` | POST | User | Validates session cookies, fetches active resumes, auto-syncs history |
| `/api/settings/sync-history` | POST | User | Imports negotiations/applied jobs from HeadHunter to database |
| `/api/vacancies` | GET | User | Returns paginated vacancies with analysis data and filter options |
| `/api/vacancies/[id]` | PATCH | User | Updates vacancy status (`saved`, `archived`, `applied_manual`) |
| `/api/company-intel/search` | POST | User | Performs multi-source recruiter OSINT lookup |
| `/api/cron/collect-vacancies` | POST | Bearer Token | Background worker: queries HH.ru feeds for active profiles |
| `/api/cron/analyze-pending` | POST | Bearer Token | Background worker: scores unanalyzed jobs and sends Telegram alerts |
| `/api/cron/sync-negotiations`| POST | Bearer Token | Background worker: updates negotiation status changes |

---

## AI Provider Router & Task-Specific BYOK

`src/lib/aiProviderRouter.ts` implements a multi-provider router supporting:
- **Task Routing:** Dedicated assignment of engines to specific tasks:
  - Deep Context & Compatibility Scoring (e.g. DeepSeek R1, GPT-4o, Gemini 2.5 Pro)
  - Cover Letter Generation (e.g. Claude 3.7 Sonnet, Gemini 2.5 Flash)
- **Supported Providers:** DeepSeek, Google Gemini, OpenAI, Anthropic Claude, Groq, OpenRouter, and Custom/Local LLMs (Ollama, vLLM via OpenAI-compatible endpoints).
- **Cascade Failover:** If the assigned provider returns an HTTP error or rate limit, the router cascades down the user's failover priority list without dropping the evaluation.

---

## HeadHunter Client & Session Handling

The copilot interacts with HeadHunter through two distinct layers:

1. **Public Vacancy Client (`hhPublicVacancyClient.ts`):**
   - Ingests vacancies via public RSS feeds and endpoints.
   - Rotates compliant `User-Agent` headers (`HHJobCopilot/1.0`).
   - Normalizes salaries, requirements, and employer metadata.

2. **Private Session Client (`hhPrivateClient.ts`):**
   - Authenticates using user session cookies (`hhtoken`, `hhuid`, `_xsrf`, `__ddg*`).
   - Resolves canonical redirects to avoid header stripping.
   - Extracts candidate resumes, active titles, and user profile photos.
   - Automatically synchronizes applications from `/applicant/negotiations` into `prisma.vacancy` (`status: "applied_manual"`).

---

## Security & AES-256-GCM Cryptography

All user secrets stored in PostgreSQL (HeadHunter session tokens and user-provided BYOK API keys) are protected using AES-256-GCM authenticated encryption via `src/lib/crypto.ts`:

- **Key Derivation:** Configured via `ENCRYPTION_KEY` in `.env` (64-character hexadecimal string representing 32 bytes).
- **Initialization Vector:** Unique 12-byte IV generated per encryption operation.
- **Authentication Tag:** 16-byte GCM authentication tag verifies payload integrity before decryption, preventing tampering.
- **Storage Format:** Stored as `iv:authTag:ciphertext` hex strings.

---

## Background Workers & Automation

Background data ingestion and evaluation are decoupled from user requests:

1. **Scheduled Ingestion (`/api/cron/collect-vacancies`):** Queries keywords across all active search profiles, deduplicates against existing database records, and saves new records with `new` status.
2. **AI Batch Scoring (`/api/cron/analyze-pending`):** Fetches unscored vacancies, runs compatibility evaluation, records red flags, and alerts users via Telegram if the score exceeds `minimumScoreToNotify`.
3. **Status Synchronization (`/api/cron/sync-negotiations`):** Updates candidate application statuses when employers view, invite, or reject submissions.

---

## Production Deployment & Containerization

### Docker Compose Deployment

```bash
# Start application and database containers
docker compose up -d

# Check service logs
docker compose logs -f app
```

### Serverless & Cloud Database Considerations

When hosting on Vercel, Railway, or AWS Lambda with NeonDB / Supabase:
- Always append `?sslmode=require&pgbouncer=true` to `DATABASE_URL` to utilize transaction connection pooling.
- Use `DIRECT_URL` for running Prisma migrations (`npx prisma db push`).
- Ensure `ENCRYPTION_KEY` and `AUTH_SECRET` are configured in production environment secrets.
