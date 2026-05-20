# Nanda AI Job Assistant

Semi-automated HH.ru job search and vacancy analysis assistant.

Collects data, filters according to specific criteria, performs AI analysis, sends notifications to Telegram, and requires user approval.

---

## Architecture

```
HH Public API (api.hh.ru/vacancies)
        ↓
n8n Scheduler (every 3h)
        ↓ calls
Next.js API (/api/cron/collect-vacancies)
        ↓
[Keyword Filter → Rule Score → AI Analysis (Groq)]
        ↓
NeonDB (PostgreSQL via Prisma)
        ↓
Telegram Bot (only high-score matches)
        ↓
User Interaction: Apply | Skip | Save | Edit Letter
```

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | NeonDB PostgreSQL + Prisma ORM |
| Scheduler | n8n (local via `npx n8n`) |
| Notifications | Telegram Bot API |
| AI Primary | Groq (llama-3.3-70b-versatile) |
| AI Fallback 1 | Gemini (gemini-1.5-flash) |
| AI Fallback 2 | OpenRouter (free models) |
| AI Fallback 3 | Rule-based scoring |
| Deployment | Vercel |

---

## Setup Requirements

Before you begin, ensure you have the following installed on your system:
- **Node.js**: Version 18.x or newer
- **Git**: For cloning the repository
- **NeonDB Account**: For PostgreSQL database hosting
- **API Keys**: Groq, Google Gemini, OpenRouter, and a Telegram Bot Token.

For Windows users, simply run `setup.bat` for an automated installation process.

---

## Setup Guide (Local)

### Step 1 — Clone & Install

```bash
cd nanda-job-assistant
npm install
```

### Step 2 — Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
DATABASE_URL=          ← from NeonDB console
DIRECT_URL=            ← from NeonDB console (same URL usually)
TELEGRAM_BOT_TOKEN=    ← from BotFather on Telegram
TELEGRAM_CHAT_ID=      ← your Telegram chat ID (message userinfobot)
GROQ_API_KEY=          ← from console.groq.com (free)
GEMINI_API_KEY=        ← from aistudio.google.com (free)
CRON_SECRET=           ← any random string, e.g. openssl rand -hex 32
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3 — Setup Database

```bash
npm run db:push        # push schema to NeonDB
npm run db:generate    # generate Prisma client
npm run db:seed        # seed default preferences for Nanda
```

### Step 4 — Start Next.js

```bash
npm run dev
# App runs at http://localhost:3000
# Dashboard at http://localhost:3000/dashboard
```

### Step 5 — Setup Telegram Bot

1. Message BotFather on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token → `TELEGRAM_BOT_TOKEN`
4. Message userinfobot to get your chat ID → `TELEGRAM_CHAT_ID`

**Register webhook** (so Telegram sends callbacks to your app):
```bash
# While running locally, use ngrok first:
npx ngrok http 3000

# Then register webhook:
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR-NGROK-URL.ngrok.io/api/telegram/webhook"}'
```

Or use n8n webhook instead (see `n8n/README.md`).

### Step 6 — Setup n8n

```bash
# In a separate terminal:
npx n8n

# n8n runs at http://localhost:5678
```

1. Open http://localhost:5678
2. Go to **Settings → Environment Variables**
3. Add: `CRON_SECRET` = same value as in your .env.local
4. Add: `TELEGRAM_BOT_TOKEN` = your bot token
5. Import workflows from `n8n/workflows/` folder
6. Activate all 3 workflows

See `n8n/README.md` for detailed n8n setup.

---

## Project Structure

```
nanda-job-assistant/
├── prisma/
│   └── schema.prisma          ← 6 DB models
├── src/
│   ├── types/
│   │   └── index.ts           ← all TypeScript types
│   ├── lib/
│   │   ├── db.ts              ← Prisma client singleton
│   │   ├── hhPublicVacancyClient.ts  ← fetches from HH API
│   │   ├── queryBuilder.ts    ← builds search queries
│   │   ├── ruleFilter.ts      ← pre-filter (saves AI quota)
│   │   ├── scoring.ts         ← rule-based scoring
│   │   ├── redFlags.ts        ← red flag detection
│   │   ├── aiProviderRouter.ts  ← Groq→Gemini→OpenRouter fallback
│   │   ├── aiAnalyzer.ts      ← main AI analysis orchestrator
│   │   ├── feedbackLearning.ts  ← feedback retrieval for personalization
│   │   ├── telegram.ts        ← Telegram notifications
│   │   └── seed.ts            ← seeds default preferences
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/collect-vacancies/route.ts  ← main pipeline
│   │   │   ├── vacancies/route.ts               ← list vacancies
│   │   │   ├── vacancies/analyze/route.ts        ← manual analyze
│   │   │   ├── vacancies/[id]/route.ts           ← single vacancy
│   │   │   ├── vacancies/[id]/mark-applied/
│   │   │   ├── vacancies/[id]/skip/
│   │   │   ├── vacancies/[id]/save/
│   │   │   ├── vacancies/[id]/regenerate-letter/
│   │   │   ├── telegram/webhook/route.ts         ← Telegram callbacks
│   │   │   └── settings/route.ts                 ← preferences CRUD
│   │   └── dashboard/
│   │       ├── page.tsx               ← overview + stats
│   │       ├── vacancies/page.tsx     ← vacancy list with filters
│   │       ├── vacancies/[id]/page.tsx ← vacancy detail
│   │       ├── analytics/page.tsx     ← analytics charts
│   │       └── settings/page.tsx      ← edit preferences
│   └── components/
│       ├── ui/
│       │   ├── Badge.tsx
│       │   └── ScoreBar.tsx
│       ├── SidebarNav.tsx
│       ├── RunCollectionButton.tsx
│       └── VacancyActions.tsx
└── n8n/
    ├── README.md
    └── workflows/
        ├── workflow1-auto-collect.json    ← cron every 3h
        ├── workflow2-telegram-webhook.json ← Telegram handler
        └── workflow3-ai-retry.json         ← retry AI-pending
```

---

## How It Works (DFD Level 1)

```
1. Load Preferences → 2. Build EN+RU Queries → 3. Fetch HH API
→ 4. Pagination Loop → 5. Normalize Data → 6. Duplicate Check
→ (if new) 7. Basic Rule Filter → (if passes) 8. Rule Pre-Score
→ (if score >= 30) 9. AI Analysis → 10. Red Flag Detection
→ 11. Generate Cover Letter → 12. Save to DB
→ (if score >= threshold) 13. Send Telegram Notification
→ User: Mark Applied | Skip | Save | Edit Letter
```

---

## AI Score Guide

| Score | Meaning | Action |
|---|---|---|
| 90-100 | Excellent fit | Apply immediately |
| 75-89 | Good fit | Apply |
| 60-74 | Possible fit | Review and apply |
| 40-59 | Weak fit | Apply with caution |
| 0-39 | Skip | Auto-skip |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | NeonDB connection string |
| `DIRECT_URL` | Yes | NeonDB direct URL |
| `TELEGRAM_BOT_TOKEN` | Yes | From BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Your chat ID |
| `GROQ_API_KEY` | Yes | Primary AI (free) |
| `GEMINI_API_KEY` | Partial | Fallback AI (free) |
| `OPENROUTER_API_KEY` | Partial | Fallback AI 2 |
| `CRON_SECRET` | Yes | Protects cron endpoint |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` |
| `HH_USER_AGENT` | Yes | Required by HH API |

---

## Obtaining API Keys

1. **Groq** → https://console.groq.com → Create API Key
2. **Gemini** → https://aistudio.google.com → Get API Key
3. **OpenRouter** → https://openrouter.ai → Sign up for free models
4. **NeonDB** → https://console.neon.tech → New project, copy connection string
5. **Telegram Bot** → https://t.me/BotFather → `/newbot`

---

## Roadmap

- [x] Phase 1: n8n + Telegram + AI + NeonDB (MVP)
- [x] Phase 2: Dashboard + Full API
- [ ] Phase 3: Analytics improvement
- [ ] Phase 4: Adaptive scoring weights from feedback
- [ ] Phase 5: ML model for personalized scoring
