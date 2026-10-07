# HH Job Copilot

A self-hosted, multi-user AI job search copilot for HH.ru. HH Job Copilot continuously gathers vacancies matching your customizable profile, screens them with deterministic filters and multi-provider AI (Groq, Gemini, OpenRouter), delivers instant interactive Telegram alerts with one-tap actions, and features company OSINT intelligence for recruiter outreach.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Automation & Cron](#automation-with-n8n)
- [Usage](#usage)
- [Testing](#testing)
- [License](#license)

---

## Overview

Traditional job search on HH.ru is manual and time-consuming. HH Job Copilot streamlines that workflow with an automated pipeline:

1. A background scheduler or cron fetches new vacancies matching your target roles and keywords.
2. A fast rule-based pre-filter discards obvious scams, unpaid work, and strict constraint mismatches.
3. An AI pipeline (configurable priority: Groq, Gemini, OpenRouter) analyzes job descriptions and generates a 0–100 match score with actionable insights.
4. High-scoring vacancies trigger an instant Telegram alert with interactive callbacks (`Approve`, `Skip`, `Save`, `Edit Letter`).
5. A dark, modern dashboard lets you review scored vacancies, translate Russian job descriptions, copy vacancy text with one click, manage multiple search profiles, and discover recruiter contacts.

All processing happens on your own infrastructure. No data is sent to the project maintainers.

---

## Key Features

### AI-Powered Evaluation

Every vacancy passes through a multi-stage AI pipeline before it reaches your dashboard.

- **Pre-screening** — Removes duplicates, spam, and irrelevant postings based on keyword exclusion rules.
- **Fit Scoring (0–100)** — The AI evaluates the match between your skills and the job requirements and produces a numeric score with a written rationale.
- **Red Flag Detection** — Automatically surfaces toxic phrases in job descriptions such as "stress tolerance," "must work overtime," or "startup hunger."
- **AI Pitch Generation** — One-click generation of a personalized pitch tailored to the specific vacancy using your resume context.
- **Translation** — Full job description translation for Russian-language postings.

### Smart Vacancy Dashboard

A split-panel interface for reviewing your entire job pipeline.

- Overview page with recent high-score matches and recruiter contact quick-actions.
- Vacancy split-view: left panel for browsing, right panel for full details, analysis, and outreach drafting.
- Hide/archive workflow that immediately removes irrelevant vacancies from the feed.
- Saved and Applied pipeline views for tracking application status.

### Company Intel (OSINT)

When a standard ATS application is insufficient, use the Contact Finder.

- Enter a company domain or name.
- The system queries Hunter.io, Apollo.io, and a custom Bing HTML scraper in parallel.
- Returns contact emails, names, roles, and LinkedIn profile links.
- One-click shortcuts for LinkedIn X-Ray, Google dork, and Glassdoor review searches.

### HH.ru Synchronization

- Connects via your HH.ru session cookie (no OAuth required).
- Syncs negotiation statuses (invited, rejected, viewed) into the local database.
- Application history is importable in bulk for historical analytics.

### Analytics Dashboard

- Tracks the full funnel: collected, reviewed, applied, invited, rejected.
- 14-day, 30-day, and all-time filter ranges.
- Response rate and score distribution charts.

### Telegram Integration

- Sends a formatted notification to your Telegram chat when a vacancy exceeds your configured minimum score threshold.
- Notification includes the job title, company, score, and a direct link to the dashboard.

---

## Architecture

```
Browser (Next.js React)
        |
        v
Next.js App Router (API Routes + Server Components)
        |
        +---> PostgreSQL (NeonDB via Prisma ORM)
        |
        +---> AI Provider Router
        |       |-- Groq (primary: LLaMA-3 70B)
        |       |-- Google Gemini (fallback)
        |       +-- OpenRouter (secondary fallback)
        |
        +---> HH.ru API (public + private cookie-auth)
        |
        +---> OSINT Layer
        |       |-- Hunter.io API
        |       |-- Apollo.io API
        |       +-- Bing HTML scraper (Cheerio)
        |
        +---> Telegram Bot API
        |
n8n Workflow Scheduler (self-hosted)
        +---> POST /api/cron/collect-vacancies  (every 30 min)
        +---> POST /api/cron/analyze-pending    (every 30 min)
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | v18.x or v20.x |
| PostgreSQL | Any (NeonDB free tier recommended) |
| n8n | v1.x (local or self-hosted) |

**Required API keys:**

| Service | Purpose | Cost |
|---|---|---|
| [Groq](https://console.groq.com) | Primary AI provider | Free tier |
| [Telegram BotFather](https://t.me/BotFather) | Push notifications | Free |
| [Google AI Studio](https://aistudio.google.com) | AI fallback | Free tier |

**Optional API keys (Company Intel feature):**

| Service | Purpose |
|---|---|
| [Hunter.io](https://hunter.io) | Email lookup |
| [Apollo.io](https://apollo.io) | Contact enrichment |

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/nanda-ai-job-assistant.git
cd nanda-ai-job-assistant
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values. See [Configuration](#configuration) for a full reference.

**4. Initialize the database**

```bash
npx prisma db push
npx prisma generate
```

**5. Start the development server**

```bash
npm run dev
```

The dashboard is available at `http://localhost:3000/dashboard`.

---

## Configuration

All configuration is done through the `.env` file. Below is a full reference.

```ini
# ── Database ──────────────────────────────────────────────────
# Connection string to your PostgreSQL database.
# NeonDB users: add ?sslmode=require to the end.
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# ── Authentication ────────────────────────────────────────────
# Random string used to sign NextAuth sessions.
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="replace-with-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"

# ── AI Providers ──────────────────────────────────────────────
# Groq is the primary provider. Gemini is the fallback.
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_API_KEY=""        # Optional secondary fallback

# Model identifiers (defaults shown)
AI_MODEL_GROQ="llama-3.3-70b-versatile"
AI_MODEL_GEMINI="gemini-2.0-flash"

# ── Telegram ──────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN="123456789:ABC..."
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# ── Security ──────────────────────────────────────────────────
# Shared secret used to authenticate cron webhook requests from n8n.
# Must match the value configured in n8n.
CRON_SECRET="replace-with-a-secure-random-string"

# ── Application URL ───────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── OSINT (Optional) ──────────────────────────────────────────
HUNTER_API_KEY=""
APOLLO_API_KEY=""
```

---

## Automation with n8n

n8n triggers the background data collection and AI analysis pipelines on a schedule.

**1. Start n8n locally**

```bash
npx n8n
```

n8n will be accessible at `http://localhost:5678`.

**2. Configure environment variables in n8n**

Go to **Settings > Variables** in the n8n UI and add:

| Variable | Value |
|---|---|
| `CRON_SECRET` | Must match the value in your `.env` |
| `APP_URL` | `http://localhost:3000` |

**3. Import workflows**

Import the JSON workflow files from the `n8n/workflows/` directory and activate them.

The default schedule is every 30 minutes for vacancy collection and analysis.

---

## Usage

### Initial Setup

1. Navigate to **Settings** and configure:
   - Your target job roles and required skills.
   - Your HH.ru session cookie (for synchronization).
   - Your resume text (used by the AI when generating pitches).
   - Your minimum score threshold for Telegram notifications.

2. Ensure n8n is running and workflows are activated.

3. Wait for the first collection cycle, or trigger it manually via the dashboard.

### Reviewing Vacancies

- Open **Vacancies** to see AI-scored jobs in the split-panel view.
- Click **Generate AI Pitch** to produce a personalized cover letter for the selected vacancy.
- Use **Translate** to read Russian-language descriptions in English.
- Click **Hide** to archive vacancies you are not interested in.

### Finding Recruiter Contacts

1. Open **Company Intel**.
2. Enter the company domain (e.g., `gojek.com`) or company name.
3. Review the list of contacts returned by Hunter.io, Apollo.io, and the OSINT scraper.
4. Copy the email or LinkedIn URL and use the AI Pitch from the vacancy page for outreach.

### Tracking Progress

- Open **Analytics** to view your collection-to-application funnel.
- Use the 14-day, 30-day, or all-time filters to review performance trends.

---

## Testing

The project includes automated unit test suites covering the profile autocomplete catalog, rule-based scorer, pre-filter heuristics, red flag detector, AI response parser, cryptographic helpers, rate limiting, and UI components using Vitest and React Testing Library:

```bash
# Run all unit test suites
npm run test

# Run tests in interactive watch mode
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage
```

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -m "feat: add your feature"`.
4. Push to your branch: `git push origin feature/your-feature-name`.
5. Open a pull request describing the change and its motivation.

**Reporting issues:** Open a GitHub issue. Include steps to reproduce, expected behavior, and actual behavior. Do not include personal API keys or session cookies in issue reports.

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for the full text.

---

> For technical architecture details, project structure, and production deployment notes, see [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md). For official HH.ru API registration instructions with Russian form templates, see [HH_DEV_REGISTRATION_GUIDE.md](./HH_DEV_REGISTRATION_GUIDE.md).
