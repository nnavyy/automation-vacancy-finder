# Nanda AI Job Assistant - Technical Documentation

> **Note:** For a guide on what this application does and its features, please see [README.md](./README.md).

This document outlines the technical architecture, technology stack, and local installation instructions for the Nanda AI Job Assistant. This project is a Next.js (App Router) application that integrates with external APIs, PostgreSQL, and background task schedulers.

---

## System Architecture

The application is built on a modern, serverless-first architecture:

1. **Frontend / Backend:** Next.js 15 (App Router) providing React Server Components (RSC) and API Routes.
2. **Database:** PostgreSQL hosted on NeonDB, managed via Prisma ORM.
3. **AI Layer:** Groq (LLaMA-3 70B) for high-speed primary analysis, with fallback to Google Gemini.
4. **Background Scheduler:** Local `n8n` instance for automated cron jobs (e.g., fetching from HH.ru every 3 hours).
5. **Notifications:** Telegram Bot API via standard webhook integrations.
6. **OSINT Engine:** Hybrid contact scraper using Hunter.io, Apollo.io, and a custom HTML-parsing proxy (Cheerio).

---

## Tech Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 15 (React 19) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Database** | PostgreSQL (NeonDB) |
| **ORM** | Prisma |
| **Workflow Automation** | n8n |
| **Web Scraping** | Cheerio |

---

## Detailed Project Structure

Below is the complete overview of the codebase and the purpose of each directory and file:

```text
automation-vacancy-finder/
├── prisma/
│   └── schema.prisma             ← Database schema definitions and relationships
├── src/
│   ├── app/                      ← Next.js App Router (Frontend Pages & Backend APIs)
│   │   ├── api/                  ← Backend API Endpoints
│   │   │   ├── auth/             ← NextAuth.js authentication endpoints
│   │   │   ├── company-intel/    ← Endpoints for OSINT scraping (Bing, Apollo, Hunter)
│   │   │   ├── cron/             ← Webhooks triggered by n8n for automated scraping
│   │   │   ├── settings/         ← Endpoints for user settings and HH sync
│   │   │   ├── telegram/         ← Webhook for Telegram bot interactions
│   │   │   └── vacancies/        ← Endpoints for CRUD operations on vacancies
│   │   ├── dashboard/            ← Authenticated user dashboard pages
│   │   │   ├── analytics/        ← Analytics and conversion rate page
│   │   │   ├── applied/          ← Jobs the user has applied to
│   │   │   ├── company-intel/    ← Company OSINT and contact search page
│   │   │   ├── saved/            ← Bookmarked vacancies
│   │   │   ├── settings/         ← Account and API key settings
│   │   │   └── vacancies/        ← Main vacancy feed and AI scoring results
│   │   ├── login/                ← Authentication UI (Login)
│   │   ├── register/             ← Authentication UI (Registration)
│   │   └── globals.css           ← Global Tailwind CSS styles
│   ├── components/               ← Reusable React Components
│   │   ├── ui/                   ← Base UI components (Buttons, Inputs, Skeletons)
│   │   ├── SidebarNav.tsx        ← Dashboard sidebar navigation
│   │   ├── VacancyCard.tsx       ← Component to display vacancy details
│   │   └── ...                   ← Other UI elements
│   ├── lib/                      ← Core Business Logic and Utilities
│   │   ├── aiAnalyzer.ts         ← AI prompt engineering and Groq/Gemini integration
│   │   ├── auth-helpers.ts       ← Helper functions for session management
│   │   ├── collectionPipeline.ts ← Logic for fetching and normalizing HH.ru data
│   │   ├── companyIntel.ts       ← OSINT logic for Bing/Apollo/Hunter scraping
│   │   ├── db.ts                 ← Prisma database singleton client
│   │   ├── hhPrivateClient.ts    ← Private HH.ru API client (for negotiations sync)
│   │   ├── hhPublicVacancyClient.ts ← Public HH.ru API client (for job search)
│   │   ├── redFlags.ts           ← Regex lists for identifying toxic job posts
│   │   ├── rules.ts              ← Hardcoded keyword rules for initial pre-screening
│   │   ├── scoring.ts            ← Math logic for final AI scoring
│   │   └── telegram.ts           ← Utility for sending Telegram messages
│   └── types/                    ← Global TypeScript interfaces
└── n8n/                          ← Automation workflows
    ├── README.md                 ← n8n specific setup instructions
    └── workflows/                ← Exported n8n JSON workflows
```

---

## Local Environment Setup

Follow these instructions to set up the development environment on your local Windows/macOS/Linux machine.

### Prerequisites

Ensure you have the following installed:
- **Node.js:** v18.x or v20.x (Recommended)
- **Git:** For version control
- **PostgreSQL Database:** We recommend a free tier account at [Neon.tech](https://neon.tech)
- **API Keys:**
  - [Groq API Key](https://console.groq.com) (Free)
  - [Telegram Bot Token](https://t.me/BotFather) (Free)
  - [Hunter.io API Key](https://hunter.io) (Optional, Free tier)
  - [Apollo.io API Key](https://apollo.io) (Optional, Free tier)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "automation vacancy finder"
```

### 2. Install Dependencies

Install all required Node.js packages using npm:

```bash
npm install
```

*(Note: Ensure you have installed specific packages like `cheerio` if you recently updated the codebase: `npm install cheerio`)*

### 3. Configure Environment Variables

Duplicate the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure the following critical variables:

```ini
# Database (NeonDB)
DATABASE_URL="postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-host.region.aws.neon.tech/neondb?sslmode=require"

# AI Configuration
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIzaSy..."

# Telegram Integrations
TELEGRAM_BOT_TOKEN="123456789:ABCDefghIJKLmnop..."
TELEGRAM_CHAT_ID="123456789"

# Security
CRON_SECRET="your_random_secure_string"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OSINT API Keys (Optional but recommended)
HUNTER_API_KEY="..."
APOLLO_API_KEY="..."
```

### 4. Database Initialization

Push the Prisma schema to your PostgreSQL database and generate the client:

```bash
npx prisma db push
npx prisma generate
```

*(Optional)* Seed the database with default preferences if you have a `seed.ts` file configured:
```bash
npm run db:seed
```

### 5. Running the Application

Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at:
- **Main App:** `http://localhost:3000`
- **Dashboard:** `http://localhost:3000/dashboard`

---

## Background Automation (n8n Setup)

The application relies on **n8n** to run background tasks like polling the HH.ru API automatically.

1. **Start n8n Locally:**
   Open a separate terminal window and run:
   ```bash
   npx n8n
   ```
2. **Access n8n Dashboard:**
   Navigate to `http://localhost:5678` in your browser.
3. **Configure n8n Environment:**
   Go to Settings > Environment Variables in n8n and add:
   - `CRON_SECRET` (matching your `.env.local`)
   - `TELEGRAM_BOT_TOKEN`
4. **Import Workflows:**
   Import the JSON workflow files located in the `n8n/workflows/` directory of this repository and activate them.

---

## Production & Deployment Considerations

If deploying to production (e.g., Vercel, Railway, Render):
- **Database Pooling:** Next.js Serverless functions exhaust database connections quickly. Append `?pgbouncer=true&connection_limit=1` to your `DATABASE_URL` if using NeonDB.
- **Webhooks:** Ensure your Telegram Webhook URL is updated from localhost/ngrok to your actual production domain.
- **n8n Hosting:** You cannot run `npx n8n` on serverless platforms like Vercel. You will need to host n8n on a VPS (e.g., DigitalOcean, Hetzner) or use n8n Cloud.
