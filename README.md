<div align="center">

# HH Job Copilot

<p><strong>Self-Hosted AI Job Search Automation & Outreach Copilot for HeadHunter (HH.ru)</strong></p>

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
  <a href="#quickstart">Quickstart</a> &bull;
  <a href="#key-features">Key Features</a> &bull;
  <a href="#configuration">Configuration</a> &bull;
  <a href="#documentation-map">Documentation Map</a> &bull;
  <a href="#license">License</a>
</p>

</div>

---

## Overview

HH Job Copilot automates the entire job-hunting lifecycle on HeadHunter (HH.ru). It continuously collects postings matching your candidate criteria, scores them with multi-model AI reasoning (DeepSeek, Gemini, GPT-4o, Claude, Groq, or local Ollama models), detects toxic red flags, synchronizes your negotiation history into a local database, and features recruiter OSINT intelligence for direct outreach.

All credentials, tokens, and candidate data remain strictly on your own self-hosted infrastructure.

---

## Key Features

- **Multi-Profile Management:** Create and switch between distinct candidate personas (e.g. Frontend Developer, Full Stack Remote, UI/UX) with dedicated keywords, skills, and scoring thresholds.
- **Profile JSON Auto-Fill:** One-click import and export of structured candidate profiles (`my_resume_profile_en.json`) with automatic Russian-to-English translation.
- **BYOK Multi-AI Task Routing:** Assign specialized AI models to dedicated tasks (DeepSeek R1 for reasoning compatibility vs. Claude/GPT-4o for cover letter drafting) with automatic cascade failover.
- **HeadHunter (HH.ru) Synchronization:** Link via session cookies (or official OAuth 2.0) to auto-extract active resumes, retrieve candidate avatars, and sync historical applications directly into the database.
- **Smart Split-View Dashboard:** Side-by-side vacancy browsing with 0–100 match scoring, red-flag warnings, and one-click Russian description translation.
- **Recruiter OSINT Dossier:** Extract direct recruiter emails, hiring manager names, and LinkedIn URLs via Hunter.io, Apollo.io, and Bing scraping.
- **Real-Time Telegram Alerts:** Push notifications for high-matching vacancies with direct links to HeadHunter and your dashboard.
- **Security by Default:** AES-256-GCM authenticated encryption for all stored session tokens and API keys.

---

## Quickstart

### Option A: 1-Click Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/hh-job-copilot.git
cd "hh-job-copilot"

# 2. Configure environment
cp .env.example .env

# 3. Start PostgreSQL and Application
docker compose up -d
```

Access the dashboard at `http://localhost:3000`.

---

### Option B: Local Node.js Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# Generate required secrets:
# openssl rand -base64 32  --> set as AUTH_SECRET
# openssl rand -hex 32     --> set as ENCRYPTION_KEY

# 3. Push database schema
npx prisma db push
npx prisma generate

# 4. Start development server
npm run dev
```

---

## Configuration

Configure application secrets in `.env`:

```ini
# Database (PostgreSQL 15+)
DATABASE_URL="postgresql://user:password@localhost:5432/hh_copilot?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/hh_copilot?schema=public"

# Security & Encryption (Required)
AUTH_SECRET="your-32-byte-base64-auth-secret"
ENCRYPTION_KEY="your-64-character-hex-encryption-key"
CRON_SECRET="your-random-cron-secret-key"

# Application URLs
APP_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Provider Keys (Fallback defaults; overrideable via Settings UI)
GROQ_API_KEY="gsk_..."
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_API_KEY="sk-or-v1-..."
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Telegram Notifications (Optional)
TELEGRAM_BOT_TOKEN="123456789:ABC..."
TELEGRAM_CHAT_ID="your-telegram-chat-id"

# HeadHunter API Client Identifier
HH_USER_AGENT="HHJobCopilot/1.0 (contact@yourdomain.com)"
```

---

## Documentation Map

To keep this README focused and concise, in-depth architectural and developer documentation is organized into dedicated guides:

| Document | Description |
|---|---|
| [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md) | **Deep Architecture:** Project directory layout, Prisma database models, internal API routes, AI cascade failover router, AES-256-GCM cryptographic standards, and production scaling. |
| [HH_DEV_REGISTRATION_GUIDE.md](./HH_DEV_REGISTRATION_GUIDE.md) | **Official API Registration:** Step-by-step instructions for `dev.hh.ru`, including pre-written Russian application form templates tailored to pass manual HeadHunter moderation review. |

---

## Testing

```bash
# Run all 54 automated unit and integration tests
npm run test

# Type verification
npx tsc --noEmit
```

---

## License

This project is licensed under the [MIT License](./LICENSE).
