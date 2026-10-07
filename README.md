<div align="center">

# HH Job Copilot

<p><strong>Self-Hosted AI Job Search Automation & Outreach Copilot for HeadHunter (HH.ru) and International Tech Markets</strong></p>

[![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript 5](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL_16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma ORM](https://img.shields.io/badge/Prisma_5-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker Ready](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)

[![Vitest Tests](https://img.shields.io/badge/Vitest-54%2F54_Passed-22c55e?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev)
[![AI Providers](https://img.shields.io/badge/AI_Engines-DeepSeek_|_GPT--4o_|_Claude_|_Gemini_|_Groq_|_Ollama-7c3aed?style=flat-square)](https://github.com)
[![Platform](https://img.shields.io/badge/Platform-HeadHunter_(HH.ru)-d92525?style=flat-square)](https://hh.ru)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)

<p>
  <a href="#quick-demo--visual-showcase">Quick Demo</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#key-features">Key Features</a> &bull;
  <a href="#getting-started">Getting Started</a> &bull;
  <a href="#connecting-your-headhunter-hhru-account">Connect HH.ru</a> &bull;
  <a href="#docker-deployment">Docker</a> &bull;
  <a href="#configuration-reference">Configuration</a>
</p>

</div>

---

## Quick Demo & Visual Showcase

> Place your demonstration GIFs or screenshots inside `docs/assets/` to display interactive walkthroughs directly on your repository.

<div align="center">
  <img src="docs/assets/dashboard_preview.gif" alt="HH Job Copilot Interactive Dashboard" width="95%" />
  <p><em>Real-time split-panel vacancy scoring, Russian-to-English translation, red-flag analysis, and AI cover letter drafting.</em></p>
</div>

<details>
<summary><strong>Recommended Demo Recordings for This Repository</strong></summary>

1. **Split-View Screening & Scoring:** Showing a candidate browsing scraped jobs, reviewing an 85%+ compatibility score, viewing red-flag warnings, and translating Russian job descriptions.
2. **AI Model Strategy & BYOK Task Routing:** Demonstrating model selection between DeepSeek R1 for deep analysis and Claude/GPT-4o for tailored cover letters.
3. **HeadHunter Session Sync:** Showing 1-click token connection, auto-fetching the active resume and candidate avatar, and syncing historical applications into the database.
4. **Company OSINT & Recruiter Dossier:** Searching a company domain to extract hiring contacts, email addresses, and LinkedIn URLs.

</details>

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Framework & Core** | **Next.js 16 (App Router)** | Full-stack architecture, React Server Components, Route Handlers, SSR |
| **UI & Styling** | **React 19, Tailwind CSS, Lucide Icons, Framer Motion** | High-performance dark dashboard, responsive split-views, micro-interactions |
| **Database & ORM** | **PostgreSQL 16, Prisma ORM** | Type-safe schema migrations, connection pooling, persistent historical data |
| **AI Routing & BYOK** | **DeepSeek, OpenAI, Claude, Gemini, Groq, OpenRouter, Ollama** | Task-specific model assignment, cascade failovers, local LLM compatibility |
| **Job Scraping** | **HeadHunter Public RSS + API, Cheerio** | Continuous vacancy collection, deterministic pre-filtering, User-Agent rotation |
| **Session & Auth** | **AES-256-GCM, NextAuth.js** | Authenticated token encryption at rest, secure multi-user credential storage |
| **Recruiter OSINT** | **Hunter.io, Apollo.io, Bing HTML Scraper** | Recruiter dossier generation, corporate domain lookups, LinkedIn discovery |
| **Notifications** | **Telegram Bot API** | Real-time candidate alerts, match score broadcasts, deep-link navigation |
| **Containerization** | **Docker, Docker Compose** | 1-click self-hosting with automated PostgreSQL service and health checks |
| **Testing** | **Vitest, React Testing Library** | Unit testing, crypto validation, parser testing, UI component regression checks |

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

### Localization (English & Russian)

- **Dual-Language Dashboard:** Seamless toggle between English (default) and Russian (`Русский`), tailored for CIS and global tech markets.
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

### Docker Deployment

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

## Connecting Your HeadHunter (HH.ru) Account

Connecting your HeadHunter account links your candidate profile, enables real-time resume extraction, pulls your profile avatar, and automatically synchronizes application history (views, interview invitations, and rejections) into `/dashboard/applied`.

You can connect your session using one of three methods:

### Method 1: 1-Click Chrome Extension (Recommended)

The repository includes a ready-to-use Manifest V3 Chrome Extension located in the `extension/` directory:

1. Open Google Chrome (or any Chromium browser like Brave, Edge, or Arc).
2. Navigate to `chrome://extensions/` and enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the `extension/` folder from this repository.
4. Sign in to your account on [hh.ru](https://hh.ru).
5. Click the **HH Job Copilot** extension icon in your browser toolbar and click **Sync Session with Dashboard**.
6. Your session cookies will be safely transmitted to your local dashboard, validating your active resume and syncing your applications automatically.

---

### Method 2: Browser DevTools (Cookie String / Token)

If you prefer not to install the extension, you can copy your cookie string manually in under 30 seconds:

1. Open [hh.ru](https://hh.ru) in your desktop browser and ensure you are logged in.
2. Press `F12` (or `Ctrl + Shift + I` / `Cmd + Option + I`) to open Developer Tools.
3. Switch to the **Network** tab and refresh the page (`F5`).
4. Click on any document request (such as `hh.ru` or `resumes`).
5. In the right panel, scroll down to **Request Headers** and locate the `Cookie:` entry.
6. Right-click and copy the entire cookie string (it contains `hhtoken=...; hhuid=...; _xsrf=...; __ddg*=...`).
   - *Alternative:* Open the **Application** tab > **Cookies** > `https://hh.ru`, and copy the value of `hhtoken`.
7. Navigate to your dashboard at `/dashboard/settings`.
8. In the **HH.ru Account & Session Sync** section, paste the copied string into the **Session Token / Cookie String** field.
9. Click **Connect Session**.

> **What happens upon connection:**
> - The copilot validates your session against HeadHunter.
> - Your active resume (e.g., `Fullstack-разработчик`) is detected.
> - Your candidate avatar and full profile name are retrieved and displayed on your user card.
> - Your past negotiations and submitted applications are automatically imported into the local database and visible on `/dashboard/applied`.
> - The token is securely stored using AES-256-GCM encryption in your local PostgreSQL database.

---

### Method 3: Official HeadHunter OAuth 2.0 Flow

For enterprise or registered developer accounts with official API access:

1. Register an application on the [HeadHunter Developer Portal](https://dev.hh.ru/).
2. Set your redirect URI to `http://localhost:3000/api/auth/hh/callback` (or your domain equivalent).
3. Add your `HH_CLIENT_ID` and `HH_CLIENT_SECRET` into `.env`.
4. In **Settings > HH.ru Account & Session Sync**, switch to the **Official OAuth** tab and click **Connect via Official OAuth**.
5. Approve the permission prompt on `hh.ru` to authorize the integration.

---

## Configuration Reference

The application is configured using environment variables defined in `.env` or `.env.local`:

```ini
# Database Configuration
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

## How to Record Demo GIFs for GitHub

Top open-source repositories use short, fluid GIFs to showcase real product workflows. Here is the recommended workflow to generate high-quality GIFs for this project:

1. **Recording Tools:**
   - **ScreenToGif (Windows):** Free, open-source tool that records a selected screen area and includes a built-in frame editor to crop, speed up, or compress GIF files.
   - **OBS Studio:** Record in 1080p 60fps MP4, then convert to GIF/WebP using ffmpeg.
   - **CleanShot X (macOS) / ShareX (Windows):** Built-in instant screen-to-GIF recording.

2. **Optimization Settings:**
   - **Resolution:** 1280x720 or 1440x900 (720p is ideal for GitHub load times).
   - **Frame Rate:** 20 to 30 FPS (keeps file size under 10MB while preserving smooth scrolling).
   - **File Size:** Keep each GIF under 15MB for fast loading across mobile and desktop.

3. **Placing in Repository:**
   Save your recorded file to `docs/assets/dashboard_preview.gif`, commit, and push. GitHub will automatically render it in the header section of this README.

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
