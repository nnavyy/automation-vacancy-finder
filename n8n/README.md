# n8n Workflows — Nanda AI Job Assistant

This directory contains the n8n automation workflows that act as schedulers and webhook handlers for the Nanda AI Job Assistant. All business logic is processed in the Next.js API; n8n is solely responsible for triggering endpoints on a schedule and routing Telegram callbacks.

---

## Workflows Overview

| File | Name | Trigger | Purpose |
|------|------|---------|---------|
| `workflow1-auto-collect.json` | Auto Collect Vacancies | Cron `0 */3 * * *` | Calls the collect-vacancies API every 3 hours |
| `workflow2-telegram-webhook.json` | Telegram Action Handler | Webhook POST | Routes Telegram inline-keyboard button presses to the correct API |
| `workflow3-ai-retry.json` | AI Limit Retry | Cron `0 */2 * * *` | Re-analyzes vacancies that failed due to AI rate limits |

---

## 1. Starting n8n Locally

```bash
npx n8n
```

n8n will start on **http://localhost:5678** by default.

> **Notice:** Keep both n8n and the Next.js app running simultaneously:
> - Terminal 1: `npx n8n` (inside any directory — n8n stores data in `~/.n8n`)
> - Terminal 2: `npm run dev` (inside `nanda-job-assistant/`)

---

## 2. Setting Environment Variables in n8n

n8n reads environment variables from the shell it was launched in, **or** you can set them via the n8n settings UI.

### Option A — Shell environment (recommended for local dev)

Set the variables before starting n8n:

**Windows (PowerShell):**
```powershell
$env:CRON_SECRET = "your-secret-here"
$env:TELEGRAM_BOT_TOKEN = "123456:ABC-your-bot-token"
$env:TELEGRAM_CHAT_ID = "your-chat-id"
npx n8n
```

**Windows (cmd):**
```cmd
set CRON_SECRET=your-secret-here
set TELEGRAM_BOT_TOKEN=123456:ABC-your-bot-token
set TELEGRAM_CHAT_ID=your-chat-id
npx n8n
```

**Linux / macOS / Git Bash:**
```bash
export CRON_SECRET="your-secret-here"
export TELEGRAM_BOT_TOKEN="123456:ABC-your-bot-token"
export TELEGRAM_CHAT_ID="your-chat-id"
npx n8n
```

### Option B — `.env` file via n8n config

Create `~/.n8n/.env` (or the path n8n reports on startup) and add:

```
CRON_SECRET=your-secret-here
TELEGRAM_BOT_TOKEN=123456:ABC-your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CRON_SECRET` | Shared secret between n8n and Next.js API. Must match the `.env.local` value in the Next.js project. | `super-secret-cron-key` |
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot API token from BotFather. | `123456789:ABCdef...` |
| `TELEGRAM_CHAT_ID` | Your personal Telegram chat ID (or group ID). Get it from userinfobot. | `987654321` |

> **Security note:** Never commit real secrets to version control. The values above are used only at runtime.

---

## 3. Setting Up Telegram Credentials in n8n

The Telegram nodes in workflows 1 and 3 use an n8n **Credential** called `Telegram Bot API`.

1. Open n8n at `http://localhost:5678`
2. Go to **Settings → Credentials → New Credential**
3. Search for **Telegram** and select **Telegram API**
4. Enter your **Bot Token** (from BotFather)
5. Name it exactly: `Telegram Bot API`
6. Click **Save**

> The credential name `Telegram Bot API` is referenced by all three workflow files. If you choose a different name, update the `credentials.telegramApi.name` field in each workflow JSON before importing.

---

## 4. Importing Workflows into n8n

### Method A — UI Import (easiest)

1. Open n8n at `http://localhost:5678`
2. Click **Workflows** in the left sidebar
3. Click **Add Workflow → Import from File**
4. Select each `.json` file from this folder:
   - `workflows/workflow1-auto-collect.json`
   - `workflows/workflow2-telegram-webhook.json`
   - `workflows/workflow3-ai-retry.json`
5. After importing each workflow, click **Save**

### Method B — CLI Import

```bash
# Import all three at once
npx n8n import:workflow --input=workflows/workflow1-auto-collect.json
npx n8n import:workflow --input=workflows/workflow2-telegram-webhook.json
npx n8n import:workflow --input=workflows/workflow3-ai-retry.json
```

### After Importing

- Each workflow is imported in **inactive** state (`"active": false`)
- Review each workflow and click the **Active** toggle to enable it
- For workflow 2 (Telegram Webhook), copy the webhook URL **before** activating (see section 5)

---

## 5. Webhook Setup (Workflow 2 — Telegram Action Handler)

Telegram needs a public HTTPS URL to deliver webhook updates. Since n8n runs locally, you need a tunnel.

### Step 1 — Expose n8n with a tunnel

**Using ngrok (recommended):**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5678
```

Copy the HTTPS URL it gives you, e.g.: `https://abc123.ngrok-free.app`

**Using localtunnel:**
```bash
npx localtunnel --port 5678
```

### Step 2 — Get the n8n Webhook URL

1. Import and open `workflow2-telegram-webhook.json` in n8n
2. Click on the **Webhook Trigger** node
3. Copy the **Production URL** — it will look like:
   ```
   https://abc123.ngrok-free.app/webhook/telegram-webhook
   ```

### Step 3 — Register the webhook with Telegram

Call Telegram's `setWebhook` API with your bot token and the n8n webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok-free.app/webhook/telegram-webhook"}'
```

Expected response:
```json
{ "ok": true, "result": true, "description": "Webhook was set" }
```

### Step 4 — Activate the workflow

Toggle **Active** on in the workflow. Telegram will now send all updates directly to n8n.

### To check webhook status:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### To remove the webhook (revert to Next.js handler):
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

---

## 6. Architecture Notes

```
┌─────────────────────────────────────────────────────┐
│                     n8n (port 5678)                  │
│                                                      │
│  ┌──────────────────┐   ┌───────────────────────┐   │
│  │ Workflow 1        │   │ Workflow 3             │   │
│  │ Cron every 3h     │   │ Cron every 2h          │   │
│  └────────┬─────────┘   └──────────┬────────────┘   │
│           │                        │                 │
│  ┌────────▼─────────┐   ┌──────────▼────────────┐   │
│  │ POST /api/cron/  │   │ GET /api/vacancies     │   │
│  │ collect-vacancies│   │ POST /api/vacancies/   │   │
│  └──────────────────┘   │ analyze                │   │
│                         └───────────────────────┘   │
│  ┌──────────────────┐                               │
│  │ Workflow 2        │                               │
│  │ Telegram Webhook  │                               │
│  └────────┬─────────┘                               │
│           │ callback_query                           │
│  ┌────────▼──────────────────────────────────────┐  │
│  │ Route: approve | skip | save | edit            │  │
│  │ → POST /api/vacancies/:id/mark-applied         │  │
│  │ → POST /api/vacancies/:id/skip                 │  │
│  │ → POST /api/vacancies/:id/save                 │  │
│  │ → POST /api/vacancies/:id/regenerate-letter    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Next.js (port 3000)  │
              │  All business logic   │
              └───────────────────────┘
```

### Webhook vs. Next.js Telegram handler

You have **two options** for handling Telegram button clicks:

| Option | How | When to use |
|--------|-----|-------------|
| **Next.js webhook** | Register `http://localhost:3000/api/telegram/webhook` with Telegram | When using a tunnel pointed at port 3000 |
| **n8n webhook** (Workflow 2) | Register the n8n webhook URL with Telegram | When using a tunnel pointed at n8n (port 5678); useful if you want to see request logs in n8n UI |

Only register **one** webhook at a time. Use `deleteWebhook` before switching.

---

## 7. Troubleshooting

### n8n can't reach `localhost:3000`
Make sure the Next.js app is running (`npm run dev`) before executing workflows manually.

### `$env.CRON_SECRET` is empty
Ensure the environment variable is set in the same shell session where you ran `npx n8n`. Restart n8n after setting new env vars.

### Telegram credential not found after import
Re-create the credential in **Settings → Credentials** and name it `Telegram Bot API`. Then open each workflow, click the Telegram nodes, and re-select the credential from the dropdown.

### Webhook not receiving updates
- Confirm the tunnel is still running (ngrok sessions expire)
- Verify the registered URL matches the n8n **Production** webhook URL (not the test URL)
- Run `getWebhookInfo` to see the currently registered URL and any error counts
