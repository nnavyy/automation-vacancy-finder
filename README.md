# HH Job Copilot

A self-hosted, multi-user AI job search copilot engineered for the HeadHunter (HH.ru) ecosystem and international tech markets. HH Job Copilot continuously collects vacancies matching customizable candidate profiles, screens them with deterministic filters and multi-provider AI reasoning (DeepSeek, Gemini, OpenAI, Claude, Groq, OpenRouter, and local Ollama models), delivers instant interactive Telegram notifications, and features company OSINT intelligence for direct recruiter outreach.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Multi-Profile System & JSON Auto-Fill](#multi-profile-system--json-auto-fill)
  - [Multi-Provider AI Strategy & BYOK Task Routing](#multi-provider-ai-strategy--byok-task-routing)
  - [HeadHunter (HH.ru) Session & Application Sync](#headhunter-hhru-session--application-sync)
  - [Smart Vacancy Feed & Split-View](#smart-vacancy-feed--split-view)
  - [Recruiter Intelligence & Company OSINT](#recruiter-intelligence--company-osint)
  - [Interactive Telegram Bot](#interactive-telegram-bot)
  - [Analytics & Application Funnel](#analytics--application-funnel)
  - [Interactive Git Visualizer & Diagnostic Report](#interactive-git-visualizer--diagnostic-report)
  - [Localization (English & Russian)](#localization-english--russian)
  - [Security & AES-256-GCM Encryption](#security--aes-256-gcm-encryption)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker & Docker Compose Deployment](#docker--docker-compose-deployment)
- [Configuration Reference](#configuration-reference)
- [Profile System & JSON Workflow](#profile-system--json-workflow)
- [Automation & Scheduled Background Jobs](#automation--scheduled-background-jobs)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Traditional job hunting on HeadHunter (HH.ru) involves repetitive manual searches, navigating noisy postings, and manually tailoring cover letters across dozens of applications. HH Job Copilot automates this end-to-end workflow on your own self-hosted infrastructure:

1. **Scheduled Retrieval:** Background cron workers fetch new vacancies matching your active profile criteria via public RSS feeds and HeadHunter APIs.
2. **Rule-Based Pre-Filtering:** Deterministic filters instantly reject postings violating strict constraints (e.g. minimum compensation, unwanted contract types, or excluded keywords).
3. **Multi-Model AI Scoring:** Dedicated AI engines evaluate compatibility between candidate resumes and vacancy requirements, returning a 0–100 match score with detailed technical rationales and red-flag detection.
4. **Negotiation History Sync:** Historical applications and employer responses (views, invitations, rejections) are synced from HH.ru into your local database.
5. **Interactive Outbox:** Generate tailored, human-sounding cover letters adapted to your portfolio context, or uncover direct recruiter contact details (email, LinkedIn) for high-priority opportunities.
6. **Self-Hosted Privacy:** All credentials, cookies, resume text, and search preferences remain securely stored in your own PostgreSQL instance.

---

## Key Features

### Multi-Profile System & JSON Auto-Fill

- **Multiple Candidate Personas:** Create and switch between distinct search profiles (e.g., "Frontend Developer", "Full Stack Remote", "UI/UX Designer") from the dashboard.
- **Dedicated Search Profiles:** Each profile maintains its own target roles, English/Russian keyword clusters, required and optional skills, experience levels, and salary expectations.
- **Profile JSON Import/Export:** Import your complete candidate profile from structured JSON (`my_resume_profile_en.json`) or export existing preferences with one click.
- **Bilingual Profile Translation:** Automatically translate Russian resume profiles into English search parameters upon import.
- **Dynamic Catalog Autocomplete:** Autocomplete suggestions powered by a curated, dynamic database of Russian and international technology stacks.

### Multi-Provider AI Strategy & BYOK Task Routing

- **Bring Your Own Key (BYOK):** Configure your own API keys for top AI providers directly from the Settings interface.
- **Task-Specific Routing:** Assign different AI models to specialized tasks based on their architectural strengths:
  - **Deep Context & Scoring Analysis:** Use high-reasoning engines (e.g., DeepSeek R1/V3, OpenAI o3-mini, Gemini 2.5 Pro) to analyze nuanced job descriptions and verify candidate qualifications.
  - **Cover Letter Generation:** Use nuanced drafting engines (e.g., Claude 3.7 Sonnet, GPT-4o, Gemini 2.5 Flash) to write personalized, professional outreach letters.
- **Local LLM Integration:** Connect local or self-hosted models running on Ollama, vLLM, or LM Studio via OpenAI-compatible endpoints.
- **Cascade Failover Priority:** Automatic fallback ensures evaluations never fail if a primary provider experiences rate limits or network degradation.

### HeadHunter (HH.ru) Session & Application Sync

- **Session Authentication:** Authenticate via HeadHunter session token or cookie string, or connect using official OAuth 2.0 credentials.
- **Resume & Avatar Extraction:** Automatically fetches candidate resumes from HeadHunter, selecting the active CV and extracting the candidate profile photo.
- **Historical Applications Sync:** Synchronizes negotiation history (active responses, invitations, rejections) into the local database, populating the Applied pipeline view.
- **1-Click Sync Chrome Extension:** Includes a lightweight Chrome extension (`extension/`) for instant session capture without manual DevTools navigation.
- **Session Verification:** Live session validation and refresh button to monitor cookie health and remaining validity.

### Smart Vacancy Feed & Split-View

- **Split-Panel Layout:** Browse candidate vacancies on the left panel while viewing full translated descriptions, company metadata, and AI match assessments on the right panel.
- **Red Flag Detector:** Automatically surfaces warning indicators in postings, such as unpaid trial periods, extreme overtime requirements, or vague compensation terms.
- **One-Click Application Status:** Mark vacancies as Saved, Applied, or Archived with immediate UI feedback and local database synchronization.

### Recruiter Intelligence & Company OSINT

- **Direct Recruiter Finder:** Look up hiring teams and tech leads by querying company domains across Hunter.io, Apollo.io, and Bing OSINT scrapers.
- **Recruiter Dossier Modal:** View discovered recruiter contacts, email addresses, LinkedIn URLs, and confidence scores.
- **Cold Outreach Drafting:** Automatically generate personalized recruiter emails referencing specific vacancy requirements and candidate portfolio links.

### Interactive Telegram Bot

- **Instant High-Score Alerts:** Receive real-time Telegram notifications when a scraped vacancy exceeds your configured minimum match threshold.
- **Direct Deep-Links:** Alerts provide vacancy metadata, salary ranges, match scores, and direct links to open the job on HH.ru or in your local dashboard.

### Analytics & Application Funnel

- **Conversion Tracking:** Monitor your entire pipeline: Collected -> Evaluated -> Saved -> Applied -> Interview Invitations.
- **Timeframe Filtering:** Analyze trends over 14-day, 30-day, and all-time windows.
- **Score Distribution:** Visualize match score distributions across different keyword clusters and target roles.

### Interactive Git Visualizer & Diagnostic Report

- **5-Zone Lifecycle Model:** Visual representation of Stash, Workspace, Staging Area, Local Repository, and Remote Repository.
- **Directional Command Transitions:** Explores how commands (git add, git commit, git push, git restore, git reset, git stash, etc.) move state between Git storage areas.
- **Interactive Sandbox Simulation:** Step-through sandbox allowing developers to simulate file edits, staging, commits, and stashes with animated state transitions.
- **Live Repository Diagnostics:** Real-time integration querying local Git health, active branch, upstream tracking parity, pending modifications, and recent commit history.
- **Contextual CLI Recommendations:** Automated diagnostic recommendations with copyable terminal snippets based on current working tree state.

### Localization (English & Russian)

- **Dual-Language Dashboard:** Seamless toggle between English (default) and Russian (Русский), tailored for CIS and global tech markets.
- **Bilingual Search Heuristics:** Searches both English and Russian job titles and technologies on HH.ru to maximize coverage across CIS employers.

### Security & AES-256-GCM Encryption

- **Authenticated Token Encryption:** Sensitive credentials, including HeadHunter session cookies and user BYOK API keys, are encrypted at rest using AES-256-GCM authenticated encryption.
- **Zero Third-Party Telemetry:** No user data, vacancy records, or session tokens are transmitted to external telemetry servers.

---

## Architecture

```
Browser (Next.js 16 React Dashboard)
        |
        v
Next.js App Router (API Routes, SSR, Middleware)
        |
        +---> PostgreSQL Database (Prisma ORM, encrypted credentials)
        |
        +---> AI Provider Router (Task-Specific Routing & Cascade Failover)
        |       |-- DeepSeek (V3 / R1 Reasoning)
        |       |-- Google Gemini (Gemini 2.5 Flash / Pro)
        |       |-- OpenAI (GPT-4o / o3-mini)
        |       |-- Anthropic Claude (Sonnet 3.7 / Haiku)
        |       |-- Groq (Llama-3.3-70b Versatile)
        |       |-- OpenRouter (Universal Multi-Model Gateway)
        |       +-- Custom / Local LLM (Ollama, vLLM via OpenAI-compatible API)
        |
        +---> HeadHunter Clients
        |       |-- Public Vacancy Client (RSS + Public API with custom User-Agent)
        |       +-- Private Client (Cookie/Token session auth for resumes & negotiations)
        |
        +---> Company Intel & OSINT Layer
        |       |-- Hunter.io API
        |       |-- Apollo.io API
        |       +-- Bing HTML Scraper (Cheerio)
        |
        +---> Telegram Bot API (Push alerts & interactive callbacks)
        |
Background Workers / Scheduled Cron
        +---> POST /api/cron/collect-vacancies   (Scrapes vacancies for active profiles)
        +---> POST /api/cron/analyze-pending     (Performs AI scoring & notification dispatch)
        +---> POST /api/cron/sync-negotiations   (Synchronizes HH.ru application statuses)
```

---

## Getting Started

### Prerequisites

| Component | Minimum Version | Recommendation |
|---|---|---|
| Node.js | v20.x or v22.x LTS | Active LTS |
| PostgreSQL | 15+ | NeonDB (serverless) or local PostgreSQL |
| Docker (optional) | 24+ | For 1-click containerized deployment |

### Local Development Setup

**1. Clone the repository:**

```bash
git clone https://github.com/your-username/hh-job-copilot.git
cd "hh-job-copilot"
```

**2. Install dependencies:**

```bash
npm install
```

**3. Configure environment variables:**

```bash
cp .env.example .env
```

Generate secure secrets for encryption and authentication:

```bash
# Generate AUTH_SECRET (Base64 32 bytes)
openssl rand -base64 32

# Generate ENCRYPTION_KEY (Hex 32 bytes / 64 characters)
openssl rand -hex 32
```

Add these values along with your `DATABASE_URL` into `.env`. See [Configuration Reference](#configuration-reference) below.

**4. Synchronize database schema:**

```bash
npx prisma db push
npx prisma generate
```

*(Optional) Seed default technology catalogs and test records:*

```bash
npm run db:seed
```

**5. Start the development server:**

```bash
npm run dev
```

Visit `http://localhost:3000/dashboard` to access the application.

---

### Docker & Docker Compose Deployment

The repository includes a production-ready `Dockerfile` and `docker-compose.yml` for single-command deployment with an automated PostgreSQL container.

**1. Start the stack:**

```bash
docker compose up -d
```

This starts:
- `hh-job-copilot-db`: PostgreSQL 16 Alpine container with persistent storage in `postgres_data`.
- `hh-job-copilot-app`: Next.js standalone application running on port 3000.

**2. Verify container logs:**

```bash
docker compose logs -f app
```

---

## Configuration Reference

The application is configured using environment variables defined in `.env` or `.env.local`:

```ini
# Database Configuration
# Connection string to your PostgreSQL instance
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Security & Encryption (CRITICAL)
# NextAuth session signing key (openssl rand -base64 32)
AUTH_SECRET="your-32-byte-base64-auth-secret"

# AES-256-GCM key for encrypting HH tokens and BYOK API keys (openssl rand -hex 32)
ENCRYPTION_KEY="your-64-character-hex-encryption-key"

# Secret token for authenticating automated cron webhooks
CRON_SECRET="your-random-cron-secret-key"

# Application URLs
APP_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Providers (Default Fallback Keys)
# Note: Users can override these with their own keys via Settings UI
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_API_KEY="sk-or-v1-..."
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Default AI cascade order
AI_PROVIDER_PRIMARY="groq"
AI_PROVIDER_FALLBACK_1="gemini"
AI_PROVIDER_FALLBACK_2="openrouter"

# Telegram Bot Integration (Optional)
TELEGRAM_BOT_TOKEN="123456789:ABC..."
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# HeadHunter Client Identification
# ============================================================
# HeadHunter public API requires a descriptive User-Agent header
HH_USER_AGENT="HHJobCopilot/1.0 (contact@yourdomain.com)"

# Recruiter OSINT (Optional)
HUNTER_API_KEY=""
APOLLO_API_KEY=""
```

---

## Profile System & JSON Workflow

### Managing Multiple Search Profiles

Navigate to **Settings** (`/dashboard/settings`) to manage your search profiles:

1. **Active Profile Selection:** Choose which profile is currently driving your vacancy feed and collection workers.
2. **Creating New Profiles:** Create dedicated profiles with distinct role titles (e.g., "React Native Mobile" vs. "Full Stack Next.js").
3. **Role & Skill Autocomplete:** Type technology terms to select from hundreds of pre-indexed Russian and international technology tags.

### JSON Import and Export

You can export or import your complete profile settings using standard JSON:

1. Click **Export Profile JSON** to backup your current parameters to disk.
2. Click **Upload JSON** (or select `my_resume_profile_en.json`) to populate all fields automatically.
3. Toggle **Translate RU -> EN on import** to automatically translate Russian job titles and skill descriptions into English equivalents.

---

## Automation & Scheduled Background Jobs

HH Job Copilot includes background API routes that can be triggered by self-hosted workflow engines (such as n8n), GitHub Actions, or system cron schedulers:

### Webhook Endpoints

All webhook endpoints require the `Authorization: Bearer <CRON_SECRET>` header:

| Endpoint | Frequency | Description |
|---|---|---|
| `POST /api/cron/collect-vacancies` | Every 30 minutes | Collects new vacancies matching all active profiles |
| `POST /api/cron/analyze-pending` | Every 15 minutes | Evaluates unscored vacancies with AI and dispatches Telegram notifications |
| `POST /api/cron/sync-negotiations` | Every 4 hours | Synchronizes HeadHunter application status updates |

### Trigger Example via cURL

```bash
curl -X POST https://your-domain.com/api/cron/collect-vacancies \
  -H "Authorization: Bearer your-random-cron-secret-key"
```

---

## Testing

The codebase includes an automated test suite executed with **Vitest** and **React Testing Library**, verifying cryptographic routines, candidate scoring, rate limiting, catalog dynamics, and UI components:

```bash
# Run all unit and integration test suites
npm run test

# Run tests in interactive watch mode
npm run test:watch

# Run tests with code coverage analysis
npm run test:coverage
```

To verify TypeScript typing across the entire project without emitting JavaScript:

```bash
npx tsc --noEmit
```

---

## Contributing

Contributions and pull requests are welcome:

1. Fork the repository.
2. Create a dedicated feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes with clear messages: `git commit -m "feat: add feature description"`.
4. Run tests and type checks: `npm run test && npx tsc --noEmit`.
5. Push to your fork: `git push origin feature/your-feature-name`.
6. Open a pull request against the `main` branch.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

For detailed architecture specifications and developer notes, see [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md). For HeadHunter OAuth application registration details, refer to [HH_DEV_REGISTRATION_GUIDE.md](./HH_DEV_REGISTRATION_GUIDE.md).
