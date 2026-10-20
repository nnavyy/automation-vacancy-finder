# HH Job Copilot: Detailed Review and Fix Guide

Scope: `README.md`, `prisma/schema.prisma`, `src/lib/*` (including in-depth audit of `verificationCode.ts`, `telegram.ts`, `hhPrivateClient.ts`), `src/app/api/*` (cron, settings, vacancies, telegram, auth, dashboard), `src/proxy.ts`, `vercel.json`, `package.json`, and dashboard/settings architecture. Skipped: `.next`, `.vercel`, `.qodo`, `tools`, `docs`, `scripts`, `n8n`, `node_modules`, `vc low code`, and landing/demo/blog pages.

No code was changed and nothing was executed. Every issue below uses the same format:

- **Problem**: what the code does today, with file and line.
- **Why it matters**: the concrete failure scenario.
- **Fix**: exact steps, with code where it helps.
- **Verify**: how to confirm the fix works.

Priority: **P0** = before public launch (Oct 24-26), **P1** = next sprint, **P2** = later.

Line numbers are from the files as read in this review. Re-check them before editing.

---

## Contents

1. [Security and privacy](#1-security-and-privacy)
   - 1.1–1.10 [Core security, tenant isolation, secrets, SSRF, rate limiting]
   - 1.11 [P0] Plaintext OTP Code Storage in DB (`verificationCode.ts`)
   - 1.12 [P1] Production Log Leaks of Verification Codes & Hardcoded Gmail SMTP (`verificationCode.ts`)
   - 1.13 [P1] Multi-Tenant Leakage: Telegram Global `TELEGRAM_CHAT_ID` Fallback (`telegram.ts`)
2. [Correctness bugs](#2-correctness-bugs)
   - 2.1–2.15 [Counters, pending_ai, scoring, status, transactions]
   - 2.16 [P0] HeadHunter Client Auth Mismatch: Cookie Scraping vs Official OAuth Bearer Tokens (`hhPrivateClient.ts`)
   - 2.17 [P1] Telegram HTML Tag Slicing & Unescaped Formatting Errors (`telegram.ts`)
3. [Efficiency: DB, AI cost, speed, bundle](#3-efficiency)
4. [UX fidelity](#4-ux-fidelity)
5. [Features worth adding](#5-features-worth-adding)
6. [Code quality](#6-code-quality)
7. [Testing and CI](#7-testing-and-ci)
8. [README corrections](#8-readme-corrections)
9. [HeadHunter Auth Architecture: Open-Source vs. Hosted Strategy](#9-headhunter-auth-architecture-open-source-vs-hosted-strategy)
10. [Suggested order of work](#10-suggested-order-of-work)

---

## 1. Security and privacy

### 1.1 [P0] Manual analysis can use another user's profile and API keys

**Problem.** [analyze/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/vacancies/analyze/route.ts) L83-87:

```ts
const pref = await prisma.searchPreference.findFirst({
  where: { userId: user.id, isActive: true },
}) || await prisma.searchPreference.findFirst({
  where: { isActive: true },          // no userId filter
});
```

The second query has no `userId`, so it returns the first active profile of *any* user.

**Why it matters.** A user with no active profile (new account, or after deactivating all profiles) clicks "Analyze". The server then:
- scores the vacancy against someone else's resume, skills and salary expectations;
- calls the AI with that other user's BYOK key (`aiProviderOrder.customProviders[*].apiKey`), so the other user pays;
- may send the Telegram alert to the wrong place if `TELEGRAM_CHAT_ID` is set (L132).

**Fix.** Remove the second query and return a clear error:

```ts
const pref = await prisma.searchPreference.findFirst({
  where: { userId: user.id, isActive: true },
});
if (!pref) {
  return NextResponse.json(
    { success: false, error: "No active search profile. Create one in Settings first." },
    { status: 400 }
  );
}
const prefData = toSearchPrefData(pref);
```

Also at L132 remove the `|| process.env.TELEGRAM_CHAT_ID` fallback. That env var is the deployer's personal chat, and in a multi-user app it should never receive another user's vacancies.

**Verify.** Add a test: create users A (with active profile and a BYOK key) and B (no profile). Call the route as B. Expect HTTP 400 and zero calls to the AI mock.

---

### 1.2 [P0] Telegram webhook accepts forged requests when the secret is unset

**Problem.** [webhook/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/telegram/webhook/route.ts) L281-282:

```ts
const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
if (process.env.TELEGRAM_WEBHOOK_SECRET && secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET) { ...reject }
```

If `TELEGRAM_WEBHOOK_SECRET` is not set, the check is skipped. [setup-webhook](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/telegram/setup-webhook/route.ts) also only registers `secret_token` when the variable exists. The README does not list the variable, so a deployer following the README ends up with no protection.

**Why it matters.** The handler trusts `message.chat.id` / `callback_query.message.chat.id` from the body to find the linked user (`telegramLink.findFirst({ telegramChatId })`). Anyone who knows the webhook URL can POST `{"callback_query":{"data":"approve:<vacancyId>","message":{"chat":{"id":<victim chat id>}}}}` and trigger apply/skip/save as that user. Chat IDs are not secret (they appear in forwarded messages and bot logs).

**Fix.**

1. Fail closed (new file `src/lib/timingSafe.ts`):

```ts
import { timingSafeEqual } from "crypto";
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
```

2. In the webhook POST:

```ts
const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!expected) {
  console.error("[Webhook] TELEGRAM_WEBHOOK_SECRET is not configured");
  return NextResponse.json({ ok: false }, { status: 503 });
}
const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
if (!safeEqual(got, expected)) {
  return NextResponse.json({ ok: false }, { status: 401 });
}
```

3. In `setup-webhook`, throw if the variable is missing instead of registering without a secret.
4. Add `TELEGRAM_WEBHOOK_SECRET` (random 32+ chars, only `A-Za-z0-9_-` are allowed by Telegram) to `.env.example` and the README config table. Re-run `/api/telegram/setup-webhook` after deploy.

**Verify.** POST without the header: 401. POST with the correct header: 200. Unset env: 503.

---

### 1.3 [P0] BYOK API keys are stored unencrypted (README says they are encrypted)

**Problem.** [settings/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/settings/route.ts) L239-247 saves the client's `aiCustomConfig` as-is into the `search_preferences.aiProviderOrder` JSON column:

```ts
jsonFields.aiProviderOrder = {
  order: ...,
  taskRouting: body.aiCustomConfig.taskRouting || {},
  customProviders: body.aiCustomConfig.customProviders || {},   // contains { apiKey, model, baseUrl }
};
```

Only `hhToken` goes through `encrypt()` (it is the only place `encrypt(` is called besides validate-hh, hh-browser-login and the HH OAuth callback, all for HH tokens). The README says "user BYOK API keys are encrypted at rest using AES-256-GCM".

**Why it matters.** Anyone with read access to the database (a leaked backup, a Neon console screenshot, a SQL injection elsewhere) gets working OpenAI/Anthropic/DeepSeek keys for every user. The README makes a security claim that is not true.

**Fix.**

1. Add helpers (new file `src/lib/aiKeys.ts`):

```ts
import { encrypt, decrypt } from "@/lib/crypto";
import type { AiPreferenceConfig } from "@/types";

const MASK = "••••";

export function encryptProviderKeys(
  incoming: AiPreferenceConfig["customProviders"] = {},
  stored: AiPreferenceConfig["customProviders"] = {}
) {
  const out: NonNullable<AiPreferenceConfig["customProviders"]> = {};
  for (const [name, cfg] of Object.entries(incoming)) {
    const key = cfg.apiKey ?? "";
    out[name] = {
      ...cfg,
      // Masked value from the UI means "unchanged": keep what is stored.
      apiKey: !key ? "" : key.includes(MASK) ? (stored[name]?.apiKey ?? "") : encrypt(key),
    };
  }
  return out;
}

export function decryptProviderKeys(cfgs: AiPreferenceConfig["customProviders"] = {}) {
  return Object.fromEntries(
    Object.entries(cfgs).map(([n, c]) => [n, { ...c, apiKey: c.apiKey ? decrypt(c.apiKey) : "" }])
  );
}

export function maskProviderKeys(cfgs: AiPreferenceConfig["customProviders"] = {}) {
  return Object.fromEntries(
    Object.entries(cfgs).map(([n, c]) => [
      n,
      { ...c, apiKey: c.apiKey ? `${MASK}${decrypt(c.apiKey).slice(-4)}` : "" },
    ])
  );
}
```

2. Settings POST: load the existing row first, then `customProviders: encryptProviderKeys(body.aiCustomConfig.customProviders, existingConfig.customProviders)`.
3. Settings GET/POST response (`serializePref`): return `maskProviderKeys(...)`, never raw keys (see 1.4).
4. `analyzeVacancy` (aiAnalyzer.ts L453-457) and the regenerate-letter and test-ai routes: call `decryptProviderKeys` before passing `customConfig` to `callAI`. The `decrypt` helper already returns legacy plaintext values unchanged (no `enc:` prefix), so old rows keep working until migrated.
5. One-off migration script: loop all `searchPreference` rows with an object-shaped `aiProviderOrder`, encrypt any `apiKey` that does not start with `enc:`, and update.

**Verify.** After saving a key in the UI, run `select "aiProviderOrder" from search_preferences` and confirm the value starts with `enc:`. Run an analysis and confirm the provider still works.

---

### 1.4 [P0] Secrets are returned to the browser in plaintext

**Problem.** `serializePref()` in settings/route.ts L50-91 does:

```ts
decryptedHhToken = decrypt(pref.hhToken);
return { ...clean, hhToken: decryptedHhToken, hasHhToken, ..., aiCustomConfig: pref.aiProviderOrder /* with raw keys */ };
```

It is used by both GET and POST, so every settings load sends the full HH session cookie and all BYOK keys to the client.

**Why it matters.** The HH cookie gives full access to the user's HH account (resume, applications, messages). It now sits in browser memory, the network tab, any browser extension with page access, and any XSS payload. The browser never needs it: the server uses it.

**Fix.**

```ts
const { hhToken: _omit, ...clean } = pref;
return {
  ...clean,
  hasHhToken: Boolean(pref.hhToken),   // UI shows "Connected", never the value
  aiCustomConfig: { ...config, customProviders: maskProviderKeys(config.customProviders) },
  ...
};
```

Before removing `hhToken` from the response, search the settings page for places that read it (`grep -n "hhToken" src/app/dashboard/settings/page.tsx`) and switch them to `hasHhToken`. The POST already ignores a token containing `***` (L218), so a masked value coming back from the form will not overwrite the real one.

**Verify.** Open DevTools, reload settings, search the JSON response for the cookie string and for `sk-`: no matches.

---

### 1.5 [P1] SSRF protection is string-based and misses common bypasses

**Problem.** [security.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/security.ts) `isSafePublicUrl` only inspects the hostname text. It is used for `portfolioUrl` (collectionPipeline.ts L109, aiAnalyzer.ts L76). It does not catch:
- a public domain whose DNS points to `10.x`, `127.0.0.1` or `169.254.169.254` (DNS rebinding, or just `attacker.com A 127.0.0.1`);
- non-dotted IPv4 forms: `http://2130706433`, `http://0x7f000001`, `http://0177.0.0.1`;
- IPv4-mapped IPv6: `http://[::ffff:127.0.0.1]`;
- redirects: `fetch` follows a 302 from a public URL to an internal one.

Separately, `callCustomEndpoint` (aiProviderRouter.ts L329-368) sends requests to a user-provided `baseUrl` with **no** validation at all.

**Why it matters.** On Vercel, a user can make the server request internal addresses or cloud metadata endpoints. The response text of `portfolioUrl` even flows into the AI prompt, so partial data could be echoed back in a cover letter.

**Fix.**

```ts
import { lookup } from "dns/promises";
import net from "net";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const l = ip.toLowerCase();
  return l === "::1" || l.startsWith("fc") || l.startsWith("fd") ||
         l.startsWith("fe80") || l.startsWith("::ffff:");
}

export async function assertSafeFetchUrl(raw: string): Promise<URL> {
  if (!isSafePublicUrl(raw)) throw new Error("Blocked URL");
  const url = new URL(raw);
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.length === 0 || addrs.some(a => isPrivateIp(a.address))) throw new Error("Blocked address");
  return url;
}

export async function safeFetchText(raw: string, maxBytes = 200_000, timeoutMs = 4000) {
  let url = await assertSafeFetchUrl(raw);
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertSafeFetchUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.text()).slice(0, maxBytes);
  }
  throw new Error("Too many redirects");
}
```

Replace the two `fetch(pref.portfolioUrl ...)` calls with `safeFetchText`. Hosted mode: also run `assertSafeFetchUrl` on the custom AI `baseUrl` when it is saved, and allow `localhost` only when `process.env.ALLOW_LOCAL_LLM === "true"` (self-hosters running Ollama).

Note: the DNS lookup and the actual `fetch` can still race (rebinding between the two). For a stronger guarantee, pin the resolved IP with a custom `undici` Agent `connect.lookup`. For this app the check above removes the practical attacks.

**Verify.** Unit tests for `http://2130706433`, `http://[::ffff:127.0.0.1]`, a mocked DNS returning `10.0.0.5`, and a mocked 302 to `http://169.254.169.254`.

---

### 1.6 [P1] Encryption key fallback chain can silently destroy stored tokens

**Problem.** [crypto.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/crypto.ts) L6-19 derives the key from the first available of `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, `AUTH_SECRET`, `DATABASE_URL`, or a hard-coded literal (outside production). On decrypt failure it logs and returns `""`.

**Why it matters.**
- If someone later sets `ENCRYPTION_KEY`, or rotates `AUTH_SECRET`, every stored HH token and key stops decrypting. The user sees an empty token and an unexplained "session expired".
- Using `DATABASE_URL` as key material means the database password doubles as the encryption key, which defeats the purpose of encrypting data in that database.
- Dev data encrypted with the literal key silently differs from prod.

**Fix.**
1. Require `ENCRYPTION_KEY` everywhere except `NODE_ENV === "test"`; throw a clear error on first use.
2. Add a version prefix: write `enc:v1:iv:tag:cipher`. Keep a `ENCRYPTION_KEY_PREVIOUS` env var; on decrypt try the current key, then the previous one. This gives rotation without downtime.
3. Make `decrypt` throw a typed `DecryptError` (not return `""`). Callers show "Reconnect HeadHunter" in the UI, and `sync-negotiations` marks `hhSessionStatus = "expired"` instead of calling HH with an empty token.

**Verify.** Test: encrypt with key A, rotate to key B with `PREVIOUS=A`: decrypt works. Remove A: `DecryptError`.

---

### 1.7 [P1] A GET endpoint that starts a 300-second paid job

**Problem.** [dashboard/collect/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/dashboard/collect/route.ts) exports `GET`, calls `runCollectionPipeline`, and has `maxDuration = 300`. `rateLimit()` is not applied.

**Why it matters.** Any page the logged-in user visits can embed `<img src="https://yourapp/api/dashboard/collect">`. The browser sends the session cookie and triggers a full run that burns AI quota and HH requests. GET requests are also prefetched by some tools and can be retried by proxies.

**Fix.**
1. Rename to `POST`. Update the caller in [RunCollectionButton.tsx](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/components/RunCollectionButton.tsx) to `fetch(url, { method: "POST" })`.
2. Return immediately and run in the background (Next 15+/16: `import { after } from "next/server"`; Vercel: `waitUntil`):

```ts
export async function POST() {
  const user = await getApiUser();
  if (!user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const rl = await rateLimit(`collect:${user.id}`, 3, 10 * 60_000);   // see 1.8
  if (!rl.success) return NextResponse.json({ success: false, error: "Too many runs", retryAfter: rl.retryAfter }, { status: 429 });
  after(() => runCollectionPipeline(user.id));        // keeps running after the response
  return NextResponse.json({ success: true, started: true }, { status: 202 });
}
```

The button then polls `/api/dashboard/collect-status` (already exists) for progress.

**Verify.** `curl -X GET` returns 405. POST twice quickly returns 202 then the lock message (the pipeline's `running` lock already handles this).

---

### 1.8 [P1] The rate limiter does not work on Vercel

**Problem.** [rate-limit.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/rate-limit.ts) stores counters in a module-level `Map`.

**Why it matters.** Each serverless instance has its own memory and instances are recycled constantly. An attacker hitting `/api/auth/send-login-otp` (limit: 5 per 10 min) gets a fresh counter on each cold instance, so email-bombing and OTP brute force are not actually limited. `getClientIp` also trusts the first `x-forwarded-for` entry, which a client can set.

**Fix.** Use a shared store. Smallest change with Upstash Redis:

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();
const limiters = new Map<string, Ratelimit>();

export async function rateLimit(id: string, limit: number, windowMs: number) {
  const k = `${limit}:${windowMs}`;
  let rl = limiters.get(k);
  if (!rl) limiters.set(k, rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`) }));
  const r = await rl.limit(id);
  return { success: r.success, remaining: r.remaining, retryAfter: Math.ceil((r.reset - Date.now()) / 1000) };
}
```

No Redis? Add a `RateLimit(key, count, resetAt)` Prisma table and do an `upsert`/increment in one SQL statement. Update all call sites (register, forgot-password, reset-password, send-login-otp) to `await`. On Vercel, read the IP from `x-real-ip` / `x-vercel-forwarded-for` instead of the raw `x-forwarded-for`.

Add limits that are missing: `/api/vacancies/analyze` (AI cost), `/api/vacancies/[id]/regenerate-letter`, `/api/settings/test-ai`, `/api/translate`, company-intel search. Key by `userId`.

---

### 1.9 [P1] Maintenance mode and tester emails are hard-coded

**Problem.** [maintenance.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/maintenance.ts) holds `IS_MAINTENANCE_LOCKDOWN = true` and four personal email addresses in source.

**Why it matters.** Opening the site on Oct 24 needs a code change and deploy. Tester emails are committed to git history (visible if the repo goes public).

**Fix.**

```ts
export const IS_MAINTENANCE_LOCKDOWN = process.env.MAINTENANCE_MODE === "true";
const ALLOWED = (process.env.ALPHA_EMAILS ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
export const isEmailWhitelisted = (e?: string | null) => !!e && ALLOWED.includes(e.trim().toLowerCase());
```

Set both in the Vercel dashboard. Because `proxy.ts` runs on every request, env reads are fine (they are build/runtime constants). Note `/api/register` is allowed during lockdown (proxy.ts L53), so anyone can still create an account; add the whitelist check inside the register route if you want closed signup.

---

### 1.10 [P2] Smaller security items

| Problem | Fix |
|---|---|
| Cron routes compare `authHeader !== \`Bearer ${cronSecret}\`` (not constant time) | Use `safeEqual` from 1.2 in a shared `assertCron(req)` helper; it also removes four copies of the same check |
| Telegram messages interpolate `v.title`, `v.company` raw into `parse_mode: "HTML"` (webhook L573 and telegram.ts) | Add `escapeHtml()` (`& < >`) for every third-party string (see 2.17) |
| `VerificationCode.code` is stored as plain text in the schema | Stored as raw plaintext in `verification_codes`; see full [P0] fix in 1.11 below |
| `proxy.ts` exports `default`, `proxy` and `middleware` for the same handler | Keep the one your Next version loads (`proxy` for Next 16) |
| `.env` is present locally | It is gitignored. Run `git log --all -p -- .env` once; if it ever appeared, rotate every key in it |
| Error bodies from providers are thrown and stored in `AiUsageLog.errorMessage` (`OpenAI HTTP ...: ${body}`) | Truncate and strip anything that looks like a key (`/sk-[A-Za-z0-9_-]{10,}/`) before saving |

---

### 1.11 [P0] Plaintext OTP code storage in DB (`src/lib/verificationCode.ts`)

**Problem.** In [verificationCode.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/verificationCode.ts) L53-60 and L101:

```ts
// createVerificationCode (L53-60)
await prisma.verificationCode.create({
  data: {
    email: normalizedEmail,
    code, // raw 6-digit numeric string e.g. "492815"
    purpose,
    expiresAt,
  },
});

// verifySubmittedCode (L101)
if (record.code !== cleanCode) { ... }
```

The 6-digit OTP code is stored as raw plaintext in PostgreSQL (`verification_codes` table).

**Why it matters.** If database access is exposed (via read-only replica credentials, accidental log dump, unencrypted backup, or SQL injection elsewhere), an attacker can immediately read live, active OTP codes. Since `purpose` includes `"reset_password"` and `"sign_in"`, an attacker can hijack any user account before the 10-minute expiry window lapses.

**Fix.** Store salted cryptographic hashes instead of plaintext codes using HMAC-SHA256:

```ts
import crypto from "crypto";

function hashVerificationCode(email: string, code: string): string {
  const pepper = process.env.ENCRYPTION_KEY || "hh-copilot-otp-salt";
  return crypto.createHmac("sha256", pepper)
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("hex");
}

export async function createVerificationCode(
  email: string,
  purpose: CodePurpose,
  expiryMinutes = 10
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  await prisma.verificationCode.updateMany({
    where: { email: normalizedEmail, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const rawCode = generateNumericOTP();
  const hashedCode = hashVerificationCode(normalizedEmail, rawCode);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      email: normalizedEmail,
      code: hashedCode,
      purpose,
      expiresAt,
    },
  });

  return rawCode; // return raw code to send via email
}

export async function verifySubmittedCode(
  email: string,
  code: string,
  purpose: CodePurpose
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const submittedHash = hashVerificationCode(normalizedEmail, code);

  const record = await prisma.verificationCode.findFirst({
    where: { email: normalizedEmail, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { success: false, error: "No active verification code found." };
  if (record.attempts >= 5) return { success: false, error: "Too many failed attempts. Code invalidated." };
  if (new Date() > record.expiresAt) return { success: false, error: "Verification code has expired." };

  if (record.code !== submittedHash) {
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = 5 - (record.attempts + 1);
    return { success: false, error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}` };
  }

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}
```

**Verify.** Call `createVerificationCode("test@example.com", "sign_in")`. Inspect DB: `select code from verification_codes` must show a 64-character hex hash, never 6 digits. Verifying with the correct 6-digit number succeeds; wrong digits increment `attempts`.

---

### 1.12 [P1] Production log leaks of verification codes & hardcoded Gmail SMTP (`src/lib/verificationCode.ts`)

**Problem.** In [verificationCode.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/verificationCode.ts) L18-28 and L135-138:

```ts
// L135-138
if (!transporter) {
  console.warn("[Mail] EMAIL_USER or EMAIL_PASS not configured. Code for testing:", code);
  return { success: false, error: "Email service is not configured on the server." };
}

// L18-28
function getMailer() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}
```

1. If a deployer has not configured email yet, the plain OTP code is logged directly to server stdout via `console.warn`. On Vercel or cloud logging aggregators (Datadog, Papertrail, Logflare), these logs are ingested and stored.
2. The mailer is hardcoded to `smtp.gmail.com:465`. Modern transactional email providers (Resend, SendGrid, Mailgun, AWS SES, or custom self-hosted SMTP) cannot be configured because host, port, and security options are locked in code.

**Why it matters.** 
- Leaking OTPs into centralized production logs violates security compliance and lets anyone with log viewer access intercept password resets and sign-in codes.
- Deployers who do not use Gmail (or whose corporate networks block outbound port 465 to Gmail) cannot send emails.

**Fix.**
1. Redact the OTP in production logs. Only print the code if `process.env.NODE_ENV === "development"`:
```ts
if (!transporter) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[Mail Dev] SMTP not configured. Development test OTP:", code);
  } else {
    console.error("[Mail] SMTP is not configured. Email delivery aborted.");
  }
  return { success: false, error: "Email service is currently unavailable. Please contact support." };
}
```
2. Make SMTP transport configurable with sensible defaults:
```ts
function getMailer() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}
```

**Verify.** In `NODE_ENV=production` without SMTP configured, verify stdout logs: only `[Mail] SMTP is not configured` appears without the code.

---

### 1.13 [P1] Multi-tenant leakage: Telegram global `TELEGRAM_CHAT_ID` fallback (`src/lib/telegram.ts`)

**Problem.** In [telegram.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/telegram.ts) L78-87:

```ts
export async function sendMessage(
  text: string,
  replyMarkup?: object,
  customChatId?: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) { ... return false; }
  ...
}
```

If a caller invokes `sendMessage` without `customChatId` (e.g. from an unlinked user in `analyze/route.ts` L132 or an incomplete multi-user context), it falls back to `process.env.TELEGRAM_CHAT_ID`.

**Why it matters.** `process.env.TELEGRAM_CHAT_ID` belongs to the system deployer. In a multi-tenant environment, an unlinked user or orphaned job notification sends confidential applicant job search data (match reasons, salary expectations, recruiter questions, and target skills) directly into the deployer's personal Telegram chat.

**Fix.** Remove the default fallback in shared functions. Require an explicit `chatId` for multi-user notifications:

```ts
export async function sendMessage(
  text: string,
  replyMarkup?: object,
  targetChatId?: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // Multi-user isolation: only send if explicit targetChatId is provided, or in single-user dev mode
  const isMultiUser = process.env.NODE_ENV === "production" || process.env.MULTI_USER_MODE === "true";
  const chatId = targetChatId || (!isMultiUser ? process.env.TELEGRAM_CHAT_ID : undefined);

  if (!botToken || !chatId) {
    if (!chatId) {
      console.warn("[Telegram] Notification skipped: no target chatId provided for user.");
    }
    return false;
  }
  ...
}
```

**Verify.** Call `sendMessage("Test message")` in production without a `customChatId`. Confirm message is rejected and not delivered to `TELEGRAM_CHAT_ID`.

---

## 2. Correctness bugs

### 2.1 [P1] Progress counter and "analyzed" count are wrong

**Problem.** In [collectionPipeline.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/collectionPipeline.ts), `summary.analyzed++` runs at L345 (after the rule-based score is saved) and again at L376 (after the AI result). Every AI-analyzed vacancy counts twice. Also, `summary.processed++` is called in three different places (existing row, new row, catch), but not for vacancies that return early on the cap or deadline, so `processed` never reaches `total`.

**Why it matters.** The dashboard progress bar and the final summary show impossible numbers (e.g. 18 analyzed of 12 total).

**Fix.** Decide one definition: `processed` = vacancies the worker finished with (any outcome), incremented exactly once in a `finally` inside `processSingleVacancy`; `analyzed` = vacancies that got a final analysis row, incremented once at the end.

```ts
const processSingleVacancy = async (v: NormalizedVacancy) => {
  if (Date.now() > deadline) return;
  try {
    const outcome = await handleVacancy(v);   // returns "saved" | "ignored" | "low" | "analyzed" | "notified" | "capped"
    summary[outcome]++;                        // typed counters
  } catch (err) {
    summary.errors++;
  } finally {
    summary.processed++;
    await reportProgress();
  }
};
```

Splitting the 200-line closure into a `handleVacancy` function also makes it unit-testable (see section 7).

---

### 2.2 [P1] Vacancies stay "rule-based only" forever and may still be notified

**Problem.** The pipeline saves a rule-based analysis and sets `status: "analyzed"` (L328-344) *before* the AI call. If the AI call fails, `analyzeVacancy` returns `buildRuleBasedResult` with `aiStatus: "rule_based_only"`, which is saved with status `analyzed` as well. No code path ever retries these rows. `notify-pending` later selects `status: "analyzed"` with `matchScore >= threshold` and sends them.

**Why it matters.** During an AI outage or rate-limit burst, a whole run produces keyword-only scores. They look like normal analyses in the UI (no badge), may trigger Telegram alerts, and never get upgraded. The fallback cover letter is a generic template.

**Fix.**
1. Add a status `pending_ai`. Pipeline: after the rule score, set `pending_ai`; after a **successful** AI result (`aiStatus === "completed"`) set `analyzed`. If the AI fell back, leave `pending_ai`.
2. Add a retry cron (or extend `notify-pending`): select `status: "pending_ai"` ordered by `ruleScore desc`, limit 20 per run, call `analyzeVacancy`, update. Cap attempts with a new `aiAttempts Int @default(0)` column so permanently failing rows stop retrying after 3 tries.
3. In `notify-pending`, add `analysis: { aiStatus: "completed", matchScore: { gte: scoreThreshold } }`.
4. Optional user setting "Notify on keyword-only score" (default off).

**Verify.** Mock `callAI` to return empty content. Run the pipeline. Expect rows in `pending_ai`, zero Telegram messages. Switch the mock to success, run the retry job, expect `analyzed` and a message.

---

### 2.3 [P1] `avgScore` is a hard-coded 78

**Problem.** [settings/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/settings/route.ts) L182: `avgScore: totalVacancies > 0 ? 78 : 0`.

**Why it matters.** Every user sees "78" regardless of their data.

**Fix.** Add to the `Promise.all` at L118:

```ts
prisma.vacancyAnalysis.aggregate({
  where: { vacancy: { userId: user.id } },
  _avg: { matchScore: true },
}),
...
avgScore: Math.round(avg._avg.matchScore ?? 0),
```

---

### 2.4 [P1] "Applied" count uses a status the app never writes

**Problem.** settings/route.ts L128 counts `status: "applied"`. The code that records applications writes `applied_manual` (`feedbackLearning.ts` statusMap L183-186, webhook `/applied` at L562). Status strings are free text across the codebase.

**Why it matters.** The settings stat shows 0 applications even after the user applied to many.

**Fix.** Define the vocabulary once in `src/types/index.ts`:

```ts
export const VACANCY_STATUS = {
  new: "new", pendingAi: "pending_ai", analyzed: "analyzed", notified: "notified",
  saved: "saved", skipped: "skipped", applied: "applied_manual",
  ignored: "ignored", lowPriority: "low_priority", closed: "closed",
} as const;
export type VacancyStatus = (typeof VACANCY_STATUS)[keyof typeof VACANCY_STATUS];
```

Replace all string literals with the constants (grep `status:` in `src`). Then migrate to a Prisma `enum VacancyStatus` so typos fail at compile time. Run `update vacancies set status='applied_manual' where status='applied'` first.

---

### 2.5 [P1] Rule scoring and filtering disagree about "senior"

**Problem.**
- [scoring.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/scoring.ts) L282: `candidateIsSenior = pref.experience.some(e => e.includes("6+") || e.includes("3-6"))`.
- [ruleFilter.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/ruleFilter.ts) L179: `e.includes("6+") || e.includes("more6")`.
- The real HH IDs, used in the defaults (`settings/route.ts` L24) and `SENIOR_EXPERIENCE_IDS`, are `noExperience`, `between1And3`, `between3And6`, `moreThan6`.

`"between3And6".includes("3-6")` is false and `"moreThan6".includes("more6")` is false (the string is `moreThan6`, not `more6...`). So both checks are always false for real data.

**Why it matters.** A candidate who selected "3-6 years" or "6+ years" still gets -30 on every vacancy mentioning "senior" or "5+ years", and the filter rejects `moreThan6` vacancies for them.

**Fix.** Put the IDs in one module and use exact matches:

```ts
// src/lib/experience.ts
export const EXPERIENCE = { none: "noExperience", junior: "between1And3", mid: "between3And6", senior: "moreThan6" } as const;
export const isSeniorProfile = (exp: string[] = []) => exp.includes(EXPERIENCE.senior) || exp.includes(EXPERIENCE.mid);
```

Use `isSeniorProfile(pref.experience)` in both files. Also change `SENIOR_EXPERIENCE_IDS` to `["moreThan6"]`, and update the existing tests in `ruleFilter.test.ts` and `scoring.test.ts` to use real IDs.

---

### 2.6 [P1] Keyword matching differs between the filter and the scorer

**Problem.** `ruleFilter.ts` L157-176 uses `combinedText.includes(k)` for exclude and red-flag keywords. `scoring.ts` uses `matchesWordBoundary` for the same lists.

**Why it matters.** An exclude keyword `java` removes every "JavaScript" vacancy; `ios` removes "bios", "radios", "studios"; `go` removes everything containing "go". The filter runs first and marks the vacancy `ignored`, so the user never sees why.

**Fix.** Move `matchesWordBoundary` and `matchesAny` from scoring.ts into `src/lib/textMatch.ts`, export them, and use them in the filter for rules 1 and 2. Cache compiled regexes per keyword (`Map<string, RegExp>`) because the current code recompiles one for every vacancy x keyword.

---

### 2.7 [P2] The citizenship rule is disabled by an unrelated phrase

**Problem.** ruleFilter.ts L193-196 skips the citizenship rule if the text contains "не требуется" or "не имеет значения" **anywhere** (for example "опыт работы не требуется").

**Why it matters.** A posting that says "Требуется гражданство РФ" and "опыт не требуется" passes the filter.

**Fix.** Check only near the match:

```ts
const idx = combinedText.indexOf(matchedPattern);
const window = combinedText.slice(Math.max(0, idx - 40), idx + matchedPattern.length + 40);
const negated = /не\s+(требуется|обязательно|имеет значения)/.test(window);
```

---

### 2.8 [P1] The role blacklist assumes the user is a developer

**Problem.** ruleFilter.ts L57-112 rejects titles containing "менеджер по продажам", "модератор", "smm", "копирайтер", "контент-менеджер", "системный администратор", "диспетчер" and many more. The only escape is `targetRoles` containing support/sales/operator words (L235-245). `scoring.ts` defaults to developer title keywords when the profile has none.

**Why it matters.** The README advertises profiles such as "UI/UX Designer". A designer searching "UI/UX" can lose valid jobs, and a user who wants a content, SMM, or admin job has everything silently dropped as `ignored`.

**Fix.** Make the blacklist profile-aware: skip any pattern that shares a word with a target role or keyword:

```ts
const wanted = [...pref.targetRoles, ...pref.searchKeywordsRu, ...pref.searchKeywordsEn].join(" ").toLowerCase();
const blocked = IRRELEVANT_ROLE_PATTERNS.filter(p => !wanted.includes(p.split(" ")[0]));
```

Longer term, move the list into a profile field `irrelevantRoles` (editable in Settings, prefilled by a developer preset). Always store `filterReason` (already done) and expose it in the UI (see 4.2).

---

### 2.9 [P2] Salary scoring ignores currency and rewards low salaries

**Problem.** scoring.ts L257-265: if `salaryMinimum` is set and the vacancy has `salary.from`, it compares raw numbers regardless of currency; if the vacancy only has `salary.to`, the `else if` branch gives "+10 Salary is specified" even when it is below the minimum. `parseSalaryString` maps every non-USD/EUR currency to `RUR`.

**Fix.**
1. Normalize both sides to one currency with a small static rate table (refresh monthly) or the CBR daily rate endpoint cached for 24 h.
2. Compare `max(from, to)` to the minimum:

```ts
const top = Math.max(vacancy.salary?.from ?? 0, vacancy.salary?.to ?? 0);
if (pref.salaryMinimum && top) {
  if (toRub(top, vacancy.salary.currency) >= toRub(pref.salaryMinimum, pref.salaryCurrency)) score += 10;
  else { score -= 10; penalties.push("-10 Salary below minimum"); }
} else if (top) { score += 5; }       // salary shown but no minimum to compare
```

3. Extend `parseSalaryString` to detect `₸/kzt`, `сум/uzs`, `br/byn`.

---

### 2.10 [P2] Fallback cover letter prints an array

**Problem.** aiAnalyzer.ts L386: `const candidateSkills = pref?.requiredSkills || "..."`, then it is interpolated in a template string. `requiredSkills` is an array, so the letter says "With my background in React,TypeScript,JavaScript".

**Fix.** `const candidateSkills = pref?.requiredSkills?.length ? pref.requiredSkills.slice(0, 4).join(", ") : "software development";`

---

### 2.11 [P1] Default AI provider order differs from the docs

**Problem.** aiProviderRouter.ts L416-420 falls back to deepseek, groq, gemini, openrouter, openai. The README, `PREF_DEFAULTS` (settings route) and `.env.example` say groq, gemini, openrouter.

**Why it matters.** A deployer without a DeepSeek key still logs a failed attempt (and an `AiUsageLog` write) for it on every vacancy.

**Fix.** One constant `DEFAULT_PROVIDER_ORDER` in `src/types` used by the router, the settings defaults and the UI. Also skip providers that have no credentials (see 3.5).

---

### 2.12 [P1] Multi-step writes are not atomic

**Problem.**
- Telegram `/profiles` switch (webhook L662-663): `updateMany(... isActive:false)` then `update(... isActive:true)` as two calls.
- `saveFeedback` (feedbackLearning.ts L163-194): feedback row, log row, status update as three calls; the function swallows errors.
- Pipeline `create` then `update` of status.

**Why it matters.** A failure or timeout between the calls leaves a user with zero active profiles (collection stops and the dashboard shows "no profile") or a vacancy with a feedback row but the old status.

**Fix.** Wrap in `prisma.$transaction([...])`. For `saveFeedback` also stop swallowing the error: rethrow so the caller can show "could not save".

---

### 2.13 [P2] Schema issues

| Problem | Why it matters | Fix |
|---|---|---|
| `Vacancy.status` is a free String | Typos (2.4) | Prisma enum |
| `SearchPreference` stores 10 string arrays as `Json` | Cannot index or query; shape guards (`Array.isArray(...) ? : []`) repeated in 3 files | `String[]` columns |
| `aiProviderOrder` holds either an array or an object | Shape sniffing in `serializePref`, `analyzeVacancy`, router, settings POST | Replace with `aiConfig Json` (object only) plus a `AiProviderKey` table (see 1.3) |
| `AiUsageLog` has no `userId`, `createdAt` index, retention; token columns never filled | Cannot attribute cost per user; table grows forever | Add `userId`, `@@index([createdAt])`, store tokens from the API usage field, delete rows older than 30 days in a cron |
| `CompanyIntel.vacancyId` is a plain string | Orphan rows after a vacancy is deleted | Add `Vacancy` relation with `onDelete: SetNull` |
| List queries `orderBy: { analysis: { matchScore: "desc" } }` | Prisma joins and sorts the relation; slow with many rows | Add `Vacancy.matchScore Int?` (denormalized, written with the analysis) and `@@index([userId, status, matchScore])` |
| `SearchPreference` stores HH tokens, collection progress and profile settings in one row that has `@updatedAt` | Progress updates (every second during a run) rewrite the whole wide row | Move `collectionStatus` into its own table `CollectionRun` |
| `findFirst({ hhId, userId })` per vacancy | Schema already has `@@unique([userId, hhId])` | Use `findUnique({ where: { userId_hhId: {...} } })` or batch (see 3.1) |

Ship these with `prisma migrate dev` migrations (the README only mentions `db push`).

---

### 2.14 [P2] `withRetry` is applied to a few call sites only

**Problem.** [db.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/db.ts) provides `withRetry` for Neon cold starts. It is used in `vacancyService.ts`, dashboard pages and one API route. The pipeline, webhook, crons and most API routes call `prisma.*` directly.

**Fix.** Apply it once with a client extension so no call site needs wrapping:

```ts
const base = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
export const prisma = base.$extends({
  query: { $allOperations({ args, query }) { return withRetry(() => query(args)); } },
});
```

Note: retrying writes is only safe for idempotent errors (connection refused before the statement ran). The listed patterns in `RETRYABLE_ERRORS` are connection-level, which is what you want. Also use Neon's pooled `DATABASE_URL` (`-pooler` host) for the app and `DIRECT_URL` for migrations.

---

### 2.15 [P2] The same helpers are copy-pasted

`toNormalizedVacancy` exists in analyze/route.ts, notify-pending/route.ts, and webhook/route.ts. The create and update blocks in the pipeline (L227-248 vs L251-273) are the same 20 lines. Move the mapper to `vacancyService.ts`, and build the data object once:

```ts
const data = vacancyToDb(vacancy);          // one mapper
existing ? await prisma.vacancy.update({ where: { id: existing.id }, data: { ...data, status: "new" } })
         : await prisma.vacancy.create({ data: { userId, ...data, status: "new" } });
```

---

### 2.16 [P0] HeadHunter client auth mismatch: Cookie scraping vs Official OAuth Bearer tokens (`src/lib/hhPrivateClient.ts`)

**Problem.** In [hhPrivateClient.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/hhPrivateClient.ts) L24-37, L649-652, and throughout `checkHHSession`, `fetchMyResumes`, `syncHHHistory`:

```ts
// formatHHCookies (L30-33)
if (!clean.includes("=") && !clean.includes(";")) {
  return `hhtoken=${clean}`;
}

// applyToVacancy (L649-652)
const clean = formatHHCookies(tokenOrCookie);
if (!clean.includes(";") && clean.length > 40 && !clean.includes("hhtoken=")) {
  // Official OAuth Bearer API call (api.hh.ru/negotiations)
}
```

1. In `applyToVacancy`, `formatHHCookies(tokenOrCookie)` is called first. If an OAuth token (e.g. `USER_...`) without `=` or `;` is passed, `formatHHCookies` automatically turns it into `hhtoken=USER_...`. Immediately on line 652, `!clean.includes("hhtoken=")` evaluates to **false**. The OAuth API branch is completely unreachable, and execution falls through to the web scraper endpoint (`https://hh.ru/applicant/vacancy_response`), which rejects it.
2. In all other functions (`fetchMyResumes`, `checkHHSession`, `fetchHHProfile`, `syncHHHistory`), the client only queries web scraping endpoints (`https://hh.ru/applicant/resumes`, `https://hh.ru/applicant/negotiations`) with `Cookie: formatHHCookies(...)`. When a user authenticates via official OAuth (via `api/auth/hh/login` -> `api/auth/hh/callback`), their OAuth access token is stored in `SearchPreference.hhToken`. When `checkHHSession` or `fetchMyResumes` runs, it sends `Cookie: hhtoken=<oauth_token>` to `hh.ru`. The web server rejects OAuth tokens as invalid cookies and redirects to `/account/login`.

**Why it matters.** Official OAuth authentication is completely broken for profile synchronization, resume loading, session status checks, and vacancy application. The app marks valid OAuth accounts as "Session expired" immediately after connection.

**Fix.** Build a clean dual-mode client adapter that inspects the credential format upfront:

```ts
export type HHAuthType = "oauth_bearer" | "cookie_session";

export function detectHHAuthType(tokenOrCookie: string): HHAuthType {
  const clean = tokenOrCookie.trim();
  if (clean.startsWith("oauth:") || (!clean.includes(";") && !clean.includes("=") && clean.length >= 32)) {
    return "oauth_bearer";
  }
  return "cookie_session";
}

export function getCleanOAuthToken(token: string): string {
  return token.replace(/^oauth:/i, "").trim();
}
```

Then branch explicitly in each method:
- When `detectHHAuthType` is `"oauth_bearer"`:
  - `fetchMyResumes`: Call `GET https://api.hh.ru/resumes/mine` with `headers: { Authorization: "Bearer " + token, "User-Agent": API_USER_AGENT }`.
  - `fetchHHProfile`: Call `GET https://api.hh.ru/me` with `headers: { Authorization: "Bearer " + token }`.
  - `syncHHHistory`: Call `GET https://api.hh.ru/negotiations` with `headers: { Authorization: "Bearer " + token }`.
  - `applyToVacancy`: Call `POST https://api.hh.ru/negotiations` with `headers: { Authorization: "Bearer " + token }`.
- When `detectHHAuthType` is `"cookie_session"`:
  - Use the existing HTML/SSR scraping endpoints with `getWebHeaders(cookie)`.

**Verify.** Authenticate with an official OAuth token. Call `checkHHSession(oauthToken)`. It must call `api.hh.ru/resumes/mine` and return `active: true` with resumes. Connect via Chrome extension cookies: verify it uses the web scraper without errors.

---

### 2.17 [P1] Telegram HTML tag slicing & unescaped formatting errors (`src/lib/telegram.ts`)

**Problem.** In [telegram.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/telegram.ts) L253 and L276-278:

```ts
// L253: unescaped salary
`<b>${isRu ? "Зарплата:" : "Salary:"}</b> ${formatSalary(vacancy.salary, lang)}`,

// L276-278: slicing across HTML tags
if (message.length > 4000) {
  message = `${message.slice(0, 3950)}…\n<i>(truncated)</i>`;
}
```

1. If the generated message exceeds 4,000 characters, `message.slice(0, 3950)` cuts the string at an arbitrary character index. If this cut falls in the middle of a tag (e.g. `<b` or `<a href="..."`), or leaves an open tag (`<b>`, `<i>`) without its closing tag (`</b>`, `</i>`), the Telegram Bot API rejects the message with `HTTP 400 Bad Request: can't parse entities: Unclosed start-tag`.
2. When this error occurs, `sendMessage` catches it on line 117 (`body.includes("can't parse")`) and retries by stripping `parse_mode: "HTML"`. As a result, the user receives an unformatted text dump with raw literal HTML tags (`<b>`, `<i>`, `<a href=...>`) visible in their Telegram chat.
3. `formatSalary` output is inserted directly without `escapeHtml`.

**Why it matters.** Detailed job vacancies with extensive cover letter previews or recruiter questions get cut off, fail HTML parsing, and display broken, raw HTML markup in the user's Telegram notifications.

**Fix.** 
1. Truncate user-generated content fields (such as `coverPreview`, `matchReasonsText`, `missingText`, `redFlagsText`) *before* composing the HTML string, never slice raw HTML:
```ts
// Truncate fields before wrapping in HTML
const safeCoverPreview = coverLetterStr.length > 300 
  ? `${coverLetterStr.slice(0, 300)}…` 
  : coverLetterStr;

// Escape all interpolated fields
`<b>${isRu ? "Зарплата:" : "Salary:"}</b> ${escapeHtml(formatSalary(vacancy.salary, lang))}`
```
2. If emergency fallback truncation is ever required on the composed string, use a tag-balancer that closes any unclosed open HTML tags before sending, or fall back to sending clean Markdown/plain text without raw tags.

**Verify.** Create a test vacancy with a 4,500 character description and long cover letter. Call `sendVacancyNotification`. Confirm the message is accepted on the first attempt with `parse_mode: "HTML"` and no raw markup appears.

---

## 3. Efficiency

### 3.1 [P1] Pipeline makes about 10 DB round trips per vacancy

**Problem.** For each vacancy `processSingleVacancy` runs:
1. `vacancy.count` for the cap (L204), including `NOT startsWith`;
2. `vacancy.findFirst` (L217);
3. `create` or `update`;
4. `update` for status in each branch (ignored / low_priority / enrichment / analyzed);
5. `getSimilarFeedbackExamples`: a 200-row query with `vacancy` and `analysis` joins (feedbackLearning.ts L71);
6. two `vacancyAnalysis.upsert` calls and two `vacancy.update` calls;
7. `reportProgress` update every second (updates the wide `search_preferences` row).

With 100 vacancies that is on the order of 1,000 queries against a serverless DB with 5 workers.

**Why it matters.** Most of the 300 s budget goes to round trips, not AI. It also causes a race: five workers pass the cap check at the same time, so the cap of 100 is overshot.

**Fix (in order of payoff).**

1. **Hoist the cap count.** Compute once, track locally:

```ts
let activeCount = await prisma.vacancy.count({ where: {...} });
// in the worker, before creating:
if (activeCount >= MAX_VACANCIES_PER_USER) return "capped";
activeCount++;                                  // single-threaded JS: safe between awaits
```

2. **Load all known vacancies in one query:**

```ts
const known = await prisma.vacancy.findMany({
  where: { userId, hhId: { in: vacancies.map(v => v.hhId) } },
  select: { id: true, hhId: true, status: true, descriptionHash: true },
});
const knownById = new Map(known.map(k => [k.hhId, k]));
```

Then skip already-handled vacancies before any per-vacancy work. This also lets you do `createMany({ data: newOnes, skipDuplicates: true })` once.

3. **Load feedback once per run.** Split `getSimilarFeedbackExamples` into `loadFeedbackPool(userId)` (one query, called once before the loop) and `pickSimilar(pool, vacancy)` (pure, in memory, keywords extracted once per pool item).
4. **Batch status writes.** Collect ids for `ignored` and `low_priority` and write with two `updateMany` calls at the end (or every 20 items).
5. **One analysis upsert** per vacancy: do not write the rule-based row first (unless you adopt `pending_ai`, 2.2, then it is one `create` with `aiStatus: "pending_ai"`).
6. **Progress**: write at most every 3-5 s, or only when `processed % 5 === 0`, and into a `CollectionRun` row (2.13).

**Verify.** Enable Prisma query logging (`log: ["query"]`) for one run before and after and compare counts. Target: under 5 queries per vacancy.

---

### 3.2 [P1] Every analysis pays for a full cover letter

**Problem.** `buildAnalysisPrompt` always asks for `cover_letter`, `questions_to_recruiter`, `match_reasons`, `red_flags` with `maxTokens: 2048`. This is done for every vacancy that passes the rule gates (>= 20 points), including those that score 30. The README advertises per-task routing (`coverLetter` vs `deepAnalysis`), and `callAI` supports `requestType: "cover_letter"`, but the pipeline never uses it. `regenerate-letter` exists as a separate route.

**Why it matters.** Output tokens are the expensive part. Most vacancies will never be applied to, so their letters are wasted.

**Fix.** Two-stage flow:

Stage 1 (every vacancy), small prompt, `maxTokens: 400`:
```json
{"match_score":0,"recommendation":"apply|maybe|skip","summary":"","match_reasons":[],"missing_requirements":[],"red_flags":[],"confidence":0}
```
Remove "cover letter must sound natural..." and the `questions_to_recruiter` field from this prompt.

Stage 2 (only when `score >= minimumScoreToNotify`, or when the user clicks Apply/Regenerate): call `callAI({ requestType: "cover_letter", ... })` with the vacancy plus analysis summary. This is where `taskRouting.coverLetter` finally takes effect.

Implementation points:
- `analyzeVacancy` returns `analysis` without `cover_letter`; add `generateCoverLetter(vacancy, analysis, pref)` in aiAnalyzer.ts reusing `regenerate-letter` logic (move the prompt out of the route).
- The Telegram message already shows a "cover letter preview"; call stage 2 right before sending.
- Keep the stage-1 prompt's static candidate block first. Providers (OpenAI, Anthropic, Gemini) cache identical prompt prefixes, which cuts input cost for the 100 calls in one run.

Expected saving: most of the output tokens for low-score vacancies (my estimate: 60-80% of output tokens per run, depending on the score distribution).

---

### 3.3 [P1] Parse failures and fragile JSON handling

**Problem.** `parseAIResponse` strips `<think>` tags, fences, and finds the outer braces. On parse failure it regex-extracts a score from prose and invents `confidence: 65` (L271-295).

**Fix.** Ask providers for JSON natively:
- OpenAI, DeepSeek, Groq, OpenRouter (compatible): `response_format: { type: "json_object" }` in the request body.
- Gemini: `generationConfig: { responseMimeType: "application/json" }`.
- Anthropic: use a tool-use call with an input schema, or prefill the assistant turn with `{`.

Validate the result with zod (`z.object({ match_score: z.coerce.number().min(0).max(100), ... })`) instead of manual coercion. When validation fails, retry once on the **same** provider with "return valid JSON only" before falling back to rules. Keep the fence/think stripping for providers without JSON mode (local models).

---

### 3.4 [P1] Router timeouts do not cancel requests, and failing providers are retried for every vacancy

**Problem** ([aiProviderRouter.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/aiProviderRouter.ts) L480-524):
1. `Promise.race([handler.fn(), timeout])`: when the timer wins, the HTTP request keeps running (and is billed). The `setTimeout` is never cleared, so each call leaks a timer for 25 s.
2. `callGroq` loops over up to 5 models *inside* the 25 s window.
3. Providers without a key still run, throw "API key is not configured", and write an `AiUsageLog` row.
4. After a 429, the very next vacancy tries the same provider first again. With 5 workers x many vacancies you hammer a rate-limited provider.

**Fix.**
1. Pass an `AbortSignal` to every provider function:

```ts
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 25_000);
try { return await handler.fn(ctrl.signal); } finally { clearTimeout(timer); }
```
In `fetch` calls add `signal`; the Groq SDK accepts `{ signal }` in request options; Gemini SDK accepts `{ signal }` in `generateContent` request options.

2. Build the chain from providers that are actually usable:

```ts
const hasCreds = (p: string) => Boolean(customProviders[p]?.apiKey || process.env[`${p.toUpperCase()}_API_KEY`] || p === "custom");
const providerChain = deduped.filter(hasCreds);
```

3. Add a process-level circuit breaker:

```ts
const cooldown = new Map<string, number>();            // provider -> retry-after timestamp
// before trying a provider
if ((cooldown.get(provider) ?? 0) > Date.now()) continue;
// on 429 / quota error
cooldown.set(provider, Date.now() + 60_000);           // or parse the Retry-After header
```

4. Reduce Groq's inner model fan-out to the one configured model plus one fallback, and share the single abort budget.
5. Skip the DB log write for "not configured" errors, and batch usage logs (one `createMany` at the end of the run).
6. Collapse the four copy-pasted OpenAI-compatible functions into one:

```ts
async function callOpenAICompatible(baseUrl: string, apiKey: string, model: string, o: CallAIOptions, signal: AbortSignal, extraHeaders = {}) { ... }
```
OpenAI, DeepSeek, OpenRouter and custom differ only by URL, headers and the `reasoning` field name. This removes about 100 lines. The `openai` package in `package.json` is not imported anywhere and can be removed.

---

### 3.5 [P1] Cron fan-out starves users and wastes the function budget

**Problem.** [collect-vacancies/route.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/api/cron/collect-vacancies/route.ts) loops users sequentially in one 300 s invocation with a per-user budget of `remaining / usersLeft`. `distinct: ["userId"]` has no `orderBy`, so the order is whatever Postgres returns, usually the same every run. When time runs out the remaining users are skipped and nothing records that.

**Why it matters.** With about 10+ users the last ones are never collected. Also `vercel.json` runs this once a day, so users wait up to 24 h for new vacancies.

**Fix.**
- Short term (a few lines): order by the oldest finished run so skipped users go first next time:

```ts
const prefs = await prisma.searchPreference.findMany({
  where: { isActive: true },
  select: { userId: true, collectionStatus: true },
  orderBy: { updatedAt: "asc" },
});
```
  and raise the schedule to every 30-60 minutes (Vercel Pro) or call it from GitHub Actions / cron-job.org (free).
- Proper: the cron only enqueues. For each user call `POST /api/cron/collect-user` (secured with the cron secret) via QStash/Vercel Queues, or `fetch` without awaiting plus `waitUntil`. Each user then gets its own 300 s budget and failures are isolated.

Also: `sync-negotiations` has no `maxDuration`, no deadline, loops users sequentially, and does a `findFirst` plus `create` per history item (L43-60); give it the same deadline and batch pattern. Add `/api/cron/sync-negotiations` (and `db-ping` if you want Neon kept warm) to `vercel.json` (see section 8).

---

### 3.6 [P1] Collection fetches too many pages and parses RSS with regexes

**Problem** ([hhPublicVacancyClient.ts](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/hhPublicVacancyClient.ts)):
- Each run fetches 3 pages x all queries and does not stop at items already seen. `pubDate` is parsed but never used.
- Full descriptions come from scraping `<script type="application/ld+json">` from the vacancy HTML page, one request each (4 s timeout) while holding a worker.
- `parseRSSItems` uses regexes: `/<title>(.*?)<\/title>/` fails when the title contains a newline or CDATA.
- `HH_USER_AGENT` from the README is not read; a fixed Chrome UA is used.

**Fix.**
1. Store `lastCollectedAt` on the profile. Stop paginating a query when an item's `pubDate` is older than `lastCollectedAt - 1h`.
2. Only enrich after the pre-score passes (already done) and after the dedupe against the batch lookup from 3.1.
3. Prefer the official API `GET https://api.hh.ru/vacancies/{id}` (JSON, no scraping, includes `description`, `key_skills`, `experience.id`, `schedule.id`, `salary` with proper currency). It requires an `HH-User-Agent` header (the README's `HH_USER_AGENT`), not an OAuth token, for public vacancy reads. This also gives the structured fields (`experience`, `schedule`, `workFormat`) that `scoring.ts` and `ruleFilter.ts` expect but the RSS path never fills (they are `undefined` for RSS vacancies, so rules 3 and the experience score never fire).
4. Replace regex parsing with `cheerio.load(xml, { xmlMode: true })` (`cheerio` is already installed).
5. Decide on the User-Agent policy and document it: honest UA plus the API, or browser UA plus the ToS risk.

---

### 3.7 [P1] The vacancies page ships far more data than it displays

**Problem.** [vacancies/page.tsx](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/dashboard/vacancies/page.tsx) L94-122 selects `description`, `rawData`, and the full analysis (including `coverLetter`) for every row on the page and passes it to the client component `VacanciesSplitView` (65 KB). The page also runs five `count` queries and performs **writes during render** (L165-191, fire-and-forget `upsert`/`update`).

**Why it matters.**
- Payload: 20-50 rows x (full description up to several KB + raw JSON) is serialized into the HTML/RSC payload.
- Writes during render can be cut off when the serverless response ends, repeat on every prefetch/re-render, and hide bugs.

**Fix.**
1. List query selects only: `id, title, company, area, salary, status, createdAt` and `analysis { matchScore, recommendation, aiStatus, summary }`.
2. Load details lazily when a row is selected: `GET /api/vacancies/[id]` (exists) returning description, analysis details, cover letter. Cache with SWR/`useSWR`.
3. Replace the five counts with one `groupBy`:

```ts
const grouped = await prisma.vacancy.groupBy({ by: ["status"], where: baseGenuineFilter, _count: true });
```
and derive total/active/skipped in JS.
4. Remove the render-time `upsert`: the pipeline already writes an analysis for every vacancy it keeps (L328). For legacy rows without an analysis, run a one-time backfill script. In the page, compute the fallback score in memory only (as it does) and do not persist.
5. Remove the `any` casts (L59-66, L147) using `Prisma.VacancyGetPayload`.

---

### 3.8 [P1] Big client components and unused dependencies

| Item | Problem | Fix |
|---|---|---|
| [settings/page.tsx](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/app/dashboard/settings/page.tsx) (147 KB, one `"use client"` file) | The whole page hydrates, even sections the user never opens | Split into section components (`HhConnectionSection`, `AiProvidersSection`, `TelegramSection`, `ProfileSection`, `ProfileJsonSection`), each in its own file; load the heavy ones with `next/dynamic` and render them in tabs so only the visible tab mounts. Use one `useSettings()` hook (SWR) for shared state |
| `VacanciesSplitView.tsx` (65 KB) | List, detail, filters and actions in one file | Split into `VacancyList`, `VacancyDetail`, `VacancyFilters`; keep the detail pane dynamic |
| [i18n.tsx](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/src/lib/i18n.tsx) (36 KB) | Both languages ship to every client | Keep dictionaries in `locales/en.json`, `locales/ru.json`; load the active one with a dynamic `import()` or switch to `next-intl` with server-side messages |
| Public pages (`demo` 58 KB, `architecture` 37 KB, `ProjectPreviewSimulator` 44 KB) | Not part of the product but compiled in the same app | Keep, but make them static (`export const dynamic = "force-static"`) and lazy-load simulators below the fold |
| Unused deps | `openai`, `node-telegram-bot-api`, `date-fns`, `clsx`, `tailwind-merge`: no `from "<pkg>"` import found in `src` (the webhook uses raw `fetch`). Re-run a search on `scripts/` and `tests/` before deleting | `npm uninstall` them and their `@types` |
| `puppeteer-core` | A production dependency used only by `hhBrowserLogin.ts`, a local-only flow that cannot run on Vercel | Move to `devDependencies`/`optionalDependencies`, load with a dynamic `import()` behind an `IS_LOCAL` check |
| `axios` and `fetch` both used | Two HTTP stacks | Standardize on `fetch` (`AbortSignal.timeout`) |

---

### 3.9 [P2] Smaller performance items

- `feedbackLearning.extractKeywords` and `matchesWordBoundary` rebuild regexes on every call; cache them.
- `calculateRuleScore` runs twice per vacancy (before and after enrichment, L296 and L320). Fine, but the first run can reuse `fullText` lowercasing; compute `toLowerCase` once.
- `dashboard/page.tsx` fires several queries with `withRetry`; check they are in a single `Promise.all` (L52 shows one) and wrap slow widgets in `<Suspense>` so the shell paints first.
- `src/app/template.tsx` plus `PageTransition` re-mounts the page tree with a framer-motion animation on every navigation; keep it for marketing pages only.

---

## 4. UX fidelity

Each item names the file to change and what to render.

### 4.1 Make the collection run understandable

**Problem.** `RunCollectionButton` blocks on a request that can run 300 s; progress uses the miscounted `analyzed/total` (2.1); `total` is the number of RSS items, not the number that will be analyzed, so the bar jumps.

**Fix.**
- The button starts the job (POST, 202, see 1.7) and polls `collect-status` every 2 s.
- Show stages with counts: *Searching HH (queries 3/8) -> Filtering (ignored 41) -> Scoring (12/19) -> Notifying (3)*. The server already knows these numbers: extend `collectionStatus` with `{ stage, queriesDone, queriesTotal, ignored, lowPriority, analyzed, toAnalyze, notified }`.
- On finish show a summary toast: "12 new, 41 filtered out, 3 sent to Telegram" with a link to the filtered list.
- If the lock rejects ("already in progress"), show the existing run's progress instead of an error.

### 4.2 Explain hidden vacancies

**Problem.** The default list excludes `ignored`, `low_priority`, `skipped` (vacancies/page.tsx L52). `filterReason` is stored (e.g. `Contains excluded keyword: "java"`) but not shown anywhere I could find.

**Fix.** Add a "Filtered out (N)" tab listing these with the reason and a **Restore** button (sets status `new`, saves `feedback: restore`). Show a hint under the empty state: "Most results were removed by: *excluded keyword 'java'* (28)". Compute with `groupBy filterReason`. This is the single best fix for "why do I get so few results" complaints and lets users tune profiles.

### 4.3 Show where a score comes from

**Problem.** A keyword-only score (`aiStatus: "rule_based_only"`) looks identical to an AI score.

**Fix.** On the card and detail pane show a small label: `AI · deepseek-chat · 86% confidence` or `Keyword score only (AI unavailable)` with a **Re-analyze** button (calls `/api/vacancies/analyze`). Data is already in `analysis.aiStatus`, `modelUsed`, `confidence`. Add the `matchReasons` / penalties list (`+25 Title matches...`, `-30 Requires senior`) as a collapsible "Why this score".

### 4.4 Settings and onboarding

- **Guided first run** (replace "everything on one page"): step 1 import resume/JSON or pick roles; step 2 skills and work format from the catalog autocomplete; step 3 connect HH (optional); step 4 connect Telegram with the deep link. Show a checklist on the dashboard until complete (data: `hasProfile`, `hasHhToken`, telegram link present).
- **JSON import**: validate with a zod schema, show a preview diff (field, old -> new), then confirm. Unknown fields are currently dropped silently by `pick()`.
- **AI providers**: show per-provider state ("Tested OK 2 h ago / Failed: invalid key"), persisted from `test-ai`; mark "Server key" vs "Your key" (`getServerConfiguredProviders` has this). If no provider is usable, show a banner "AI is off: scores are keyword-only".
- **HH session**: show `hhExpiresAt` as a dashboard banner ("HH session expires in 2 days. Reconnect") and mark `hhSessionStatus = "expired"` automatically when `sync-negotiations` fails.
- **Notifications**: add quiet hours and timezone, and a digest option. The daily limit currently uses server midnight (`setHours(0,0,0,0)` in pipeline L162 and notify-pending L102), not the user's day. Add `timezone String @default("UTC")` to the profile and compute the day start with it.

### 4.5 Telegram experience

- After Approve/Skip/Save, edit the original message (`editMessageReplyMarkup` to remove buttons and `editMessageText` to append "✓ Saved") instead of sending a new message. Less clutter, and prevents double-taps.
- When the daily cap is hit, send one message "5 more matches waiting; open the dashboard" instead of silently stopping.
- "Edit manually" (`edit_man`) asks the user to reply to a message containing the vacancy id and parses it from text. Store the pending state in a table `PendingEdit(chatId, vacancyId, expiresAt)` and treat the next plain message as the letter. Text parsing breaks if the user forwards or edits.
- `approve` calls `handleApprove`; the README calls the button "Mark Applied". Make the labels honest: "Apply on HH" (sends the application, needs a valid session) vs "I applied" (only records). Confirm the action with a second tap for the HH send.
- Escape third-party strings (1.10).
- Webhook always returns `{ ok: true }` on error. Keep that for Telegram retries, but also send the user "Something went wrong, try again" in the callback branch.
- Add `/lang`, `/help` to the README command table.

### 4.6 List ergonomics

- Sort options: Best match, Newest, Highest salary. Today it is `matchScore desc` always, so a fresh 80 sits below a stale 95.
- "New since last visit" dot (store `lastSeenAt` on the user, update when the list is opened).
- Multi-select with bulk Skip/Save/Archive, undo toast (5 s) after Skip.
- Keyboard shortcuts in the split view: `j/k` move, `s` save, `x` skip, `a` applied, `/` search.
- Salary shows the original currency and an approximate RUB value; filter by minimum in the user's currency.

### 4.7 Accessibility and motion

- Collection progress and toasts: wrap in `aria-live="polite"`.
- Score is conveyed by color alone in several places (`ScoreBar`, badges): add text ("86/100, apply").
- Honor `prefers-reduced-motion` in `PageTransition` and framer-motion usages (`useReducedMotion`).
- Focus management in the split view: when a row is selected, move focus to the detail heading; Esc returns to the list on mobile.
- Use `Skeleton.tsx` inside `<Suspense>` boundaries for the list and stats.

---

## 5. Features worth adding

Each has a concrete first step.

1. **Application timeline.** The schema has `VacancyFeedback.recruiterReply/interview/rejected` and `sync-negotiations` pulls HH statuses, but nothing writes or shows them. First step: when sync sees "invitation" or "discard", create a feedback row and show a timeline on the vacancy page; send a Telegram message on invitation.
2. **Better learning loop.** `getSimilarFeedbackExamples` matches title words only. Step 1: on Skip, ask for a reason (buttons: *salary, stack, company, location, other*) and store `userReason`. Step 2: when one reason repeats 5+ times for the same keyword, suggest "Add 'X' to excluded keywords?". Step 3 (optional): embeddings with pgvector for similarity.
3. **Company blocklist UI.** `block-company` API exists. Add a list under Settings with unblock, and apply it in the filter step, not after the fact.
4. **Duplicate detection.** Same company + near-identical title/description (`descriptionHash` is an MD5, so only exact duplicates match; use a normalized hash: lowercase, strip digits/punctuation) to hide reposts.
5. **Resume tailoring.** Reuse the stage-2 call (3.2) to suggest 3 resume bullets per vacancy.
6. **Admin page.** Aggregates from `AiUsageLog` (success rate, rate-limit count per provider), last cron results, number of users stuck in `pending_ai`.
7. **Data export and deletion.** `api/account` exists; verify it removes `AiUsageLog` rows (no `userId`, so currently impossible: see 2.13), Telegram links, company intel, and add a JSON export.
8. **Source abstraction.** The `manual-` hhId prefix hack appears in three queries. Add `source String @default("hh")` on `Vacancy` and filter by `source` instead; later add other sources behind a `VacancySource` interface.

---

## 6. Code quality

| Problem | Where | Fix |
|---|---|---|
| `any` in core paths | `pref as any` (pipeline L114, L385), `(pref as any)?.language`, `rawData as any` | Add `language`, `cachedPortfolioContent`, `aiCustomConfig` to `SearchPreferenceData`; validate DB JSON with zod in `toSearchPrefData` |
| Swallowed errors | `catch {}` in `reportProgress`, `fetchVacancyJsonLd`, `.catch(() => {})` in vacancies page | Log with `logger.warn` and context (userId, vacancyId) |
| Noisy logs | `console.log` per vacancy and per AI call | Use `logger.ts` with levels; `debug` only in dev |
| Mixed names | "Nanda AI Job Assistant", "wingkiiy Job AI", "Vacancy AI Assistant", "HH Job Copilot" across file headers; comments in `aiAnalyzer.ts` and `feedbackLearning.ts` describe a fixed "Nanda" profile and a Groq -> Gemini -> OpenRouter chain | Replace headers with `BRAND_NAME`-neutral wording; update comments to the multi-user, multi-provider behavior |
| Leftovers | `// ts recheck` at the end of `settings/route.ts`; `tsconfig.tsbuildinfo` and `__pycache__` at repo root; `README.coming-soon*.md` | Delete or gitignore (`*.tsbuildinfo` is already ignored, check it is not tracked: `git ls-files | findstr tsbuildinfo`) |
| Inconsistent API shapes | `{success,error}`, `{error}`, `{ok}` | One helper `apiError(status, message)` and a response type; validate bodies with zod; wrap handlers: `withUser(handler)` that does auth, rate limit, try/catch |
| Auth coverage | Each route calls `getApiUser` manually | Wrapper above, plus a test that lists `src/app/api/**/route.ts` and asserts each (except public/cron/webhook) uses the wrapper |
| Giant file | `webhook/route.ts` (34 KB, 717 lines) | Move handlers to `src/lib/telegramHandlers.ts` and keep the route to auth, parse, dispatch |

---

## 7. Testing and CI

**Problem.** [.gitignore](file:///c:/Users/akung/Desktop/hh.jobs/automation%20vacancy%20finder/.gitignore) lists `tests/`, `/tests`, `vitest.config.mts`, `*test*.*`, `test*.*`, `scratch/`, `scripts/`, `docs/`. The README tells contributors to run `npm run test`.

**Why it matters.** Tests are not committed, so the public repo has none and CI cannot run them. The glob `*test*.*` also hides any file with "test" in the name (e.g. `latest-vacancies.ts`).

**Fix.**
1. Remove `tests/`, `/tests`, `vitest.config.mts`, `*test*.*`, `test*.*` from `.gitignore`. Keep the specific scratch entries (`/test_*.ts`, `scratch/`).
2. Add `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx prisma validate
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm test
```
   `prisma validate` needs `DATABASE_URL`/`DIRECT_URL` set to dummy values in `env:`.
3. Add tests that would have caught issues in this report:
   - tenant isolation: user B cannot analyze, read, skip or apply on user A's vacancy; no-profile user gets 400 (1.1);
   - webhook: 503 without secret, 401 with wrong secret, ownership check on `approve` (1.2);
   - `parseAIResponse` with fenced JSON, `<think>` prefix, string numbers, garbage;
   - `callAI`: provider 1 times out (fake timers) -> provider 2 used; 429 puts provider on cooldown (3.4);
   - `handleVacancy` (after 2.1): cap, dedupe, filter, deadline, `pending_ai` flow (2.2);
   - experience IDs in `scoring` and `ruleFilter` use real HH values (2.5);
   - `isSafePublicUrl`/`safeFetchText` bypass cases (1.5).
4. Use `prisma migrate` migrations committed to git for production; document `prisma migrate deploy` in the README instead of `db push`.
5. Add `/api/health` (DB ping, which providers have keys, webhook secret present) and Sentry on cron and webhook routes (both currently fail silently).
6. Add `engines: { node: ">=20" }` and `.nvmrc`.

---

## 8. README corrections

| README says | Actual (verified) | Fix |
|---|---|---|
| `POST /api/cron/collect-vacancies` every 30 min | Route exports `GET`; `vercel.json` schedule `0 0 * * *` (daily) | Update docs, or change the schedule and use `GET` in the examples |
| `POST /api/cron/analyze-pending` every 15 min | No such route; the existing route is `notify-pending` (every 2 h) | Replace with `notify-pending`, or build the AI retry job from 2.2 and name it `analyze-pending` |
| `POST /api/cron/sync-negotiations` every 4 h | Route exists as `GET`, not in `vercel.json` | Add to `vercel.json`: `{ "path": "/api/cron/sync-negotiations", "schedule": "0 */4 * * *" }` |
| BYOK keys encrypted with AES-256-GCM | Only HH tokens are encrypted | Fix code (1.3), then the claim is true |
| Default order groq -> gemini -> openrouter | Router: deepseek, groq, gemini, openrouter, openai | See 2.11 |
| `HH_USER_AGENT` env var | Never read; fixed browser UA | Use it (3.6) or remove from docs |
| Task routing for deep analysis vs cover letter | Cover letter type is never requested by the pipeline | Implement 3.2 |
| Buttons "Mark Applied", "Type Manual" | Callbacks `approve`, `edit_man`; `approve` may apply on HH | Align labels (4.5) |
| Config table | Missing `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`, SMTP vars used by `verificationCode.ts` (nodemailer), `AI_MODEL_*`/`*_MODEL` overrides, `MAINTENANCE_MODE`/`ALPHA_EMAILS` (after 1.9) | Add them, mark required vs optional |
| `npm run test` | Tests are gitignored (section 7) | Fix `.gitignore` |
| Telegram "Webhook Setup for Deployers" in the TOC | Only a collapsed section exists | Fix the TOC anchor |
| Several READMEs + `TECHNICAL_GUIDE.md` + `PRD.md` | Likely to drift | Keep one canonical English README and link the rest |

---

---

## 9. HeadHunter Auth Architecture: Open-Source vs. Hosted Strategy

### 9.1 Context and Strategic Decision

The developer possesses official HeadHunter API developer credentials (`HH_CLIENT_ID` and `HH_CLIENT_SECRET`), but **will not publicly expose or use these keys for the public hosted version**.

This is the correct architectural decision for three critical reasons:
1. **HeadHunter Terms of Service & Anti-Abuse Risk**: HeadHunter strictly forbids multi-tenant automated bot software from channeling hundreds of end-users' automated applications through a single registered application. Violating this leads to permanent revocation of the developer application, blacklisting of the developer's personal account, and IP blocking of the hosting server.
2. **Aggressive API Rate Limits**: Official HeadHunter API keys are subject to strict per-app and per-IP query rate limits. If a single developer key is shared across multiple concurrent users on a public deployment, the quota is quickly exhausted (HTTP 429), disabling the service for everyone.
3. **Open-Source Integrity & Security**: In an open-source repository, developer keys must never be committed to git, bundled in client distributions, or exposed via public endpoints.

---

### 9.2 The Dual-Mode Architecture

The application must support two distinct, cleanly separated operating modes:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HeadHunter Auth Strategy                        │
├───────────────────────────────────┬────────────────────────────────────┤
│   Mode A: Public Hosted / Zero-Key│   Mode B: Self-Hosted BYOK Mode    │
│   (Default for Open Source / Web) │   (Docker / Private VPS Deploy)    │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Zero server API keys required   │ • User registers personal dev app  │
│ • No HH_CLIENT_ID / SECRET in .env│   at dev.hh.ru/admin               │
│ • User connects via Chrome Ext    │ • HH_CLIENT_ID & SECRET in .env    │
│   or 1-click DevTools snippet     │ • Standard OAuth2 3-legged flow    │
│ • Scrapes & applies via session   │ • REST API calls via api.hh.ru     │
│   cookies (hhPrivateClient.ts)    │   with Authorization: Bearer       │
│ • Official OAuth button disabled/ │ • Official OAuth button fully      │
│   badged as "Self-Hosted Only"    │   enabled in Settings UI           │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

### 9.3 Implementation Details & Graceful Degradation

#### 1. Server Environment Check & API Guard
In `src/app/api/auth/hh/login/route.ts`:

```ts
export async function GET(req: Request) {
  const clientId = process.env.HH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        success: false,
        error: "Official HeadHunter OAuth is not enabled on this public instance. Please connect your account using the Chrome Extension or Session Cookie.",
        code: "OAUTH_DISABLED_PUBLIC_INSTANCE",
      },
      { status: 400 }
    );
  }
  // Proceed with standard OAuth redirect to hh.ru/oauth/authorize...
}
```

#### 2. Expose Public Capability Flag in Settings API
In `src/app/api/settings/route.ts` (GET):

```ts
// Return whether official OAuth is available on this server
return NextResponse.json({
  ...serializedPref,
  systemCapabilities: {
    hasOfficialHhOAuth: Boolean(process.env.HH_CLIENT_ID && process.env.HH_CLIENT_SECRET),
    hasTelegramBot: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasEmailService: Boolean(process.env.SMTP_USER || process.env.EMAIL_USER),
  },
});
```

#### 3. Settings UI Graceful Degradation (`src/app/dashboard/settings/page.tsx`)
- If `systemCapabilities.hasOfficialHhOAuth === false`:
  - Automatically default the active tab in the HeadHunter Connection Card to **"Chrome Extension"** or **"Quick Cookie Connect"**.
  - Either hide the "Official OAuth" tab entirely, or display it with a badge:
    `[Self-Hosted Only] — Requires developer keys from dev.hh.ru`.
  - Provide a direct link to the Chrome extension (`/extension`) and the 1-click console bookmarklet script.
- If `systemCapabilities.hasOfficialHhOAuth === true`:
  - Show the "Official OAuth" button alongside the extension/cookie options.

#### 4. Unified Dual-Mode Client in `src/lib/hhPrivateClient.ts`
Implement the clean branching designed in issue 2.16:
- Check token shape (`oauth:` prefix or standalone Bearer string vs cookie string containing `;` / `hhtoken=`).
- If OAuth Bearer: call `https://api.hh.ru/resumes/mine`, `https://api.hh.ru/me`, and `https://api.hh.ru/negotiations` with `Authorization: Bearer <token>`.
- If Cookie: call `https://hh.ru/applicant/...` with `getWebHeaders(cookie)` and DDoS-Guard cookies.
- Fix `formatHHCookies` so it never prepends `hhtoken=` to OAuth Bearer tokens.

---

## 10. Suggested order of work

### P0 (Critical Before Public Launch / Oct 24)
*Small changes, maximum risk reduction and correctness fixes.*

1. **1.1 Cross-Tenant Isolation**: Remove `where: { isActive: true }` fallback in `analyze/route.ts` so users cannot trigger runs on other users' profiles or spend their BYOK API tokens.
2. **1.2 Mandatory Telegram Webhook Secret**: Reject webhook requests with 503 if secret is unset; enforce constant-time check with `safeEqual`.
3. **1.4 Secrets Leakage in Browser**: Stop returning `hhToken` and raw API keys in `settings/route.ts`; use `hasHhToken` boolean and `maskProviderKeys`.
4. **1.3 BYOK Key Encryption**: Encrypt custom provider keys in `search_preferences.aiProviderOrder` with `encrypt()`; provide one-off migration script.
5. **1.11 Plaintext OTP Code Storage**: Replace plaintext OTP storage in `verificationCode.ts` with salted HMAC-SHA256 hashes.
6. **2.16 HeadHunter Auth Dual-Mode Fix**: Stop `formatHHCookies` from mangling OAuth tokens into `hhtoken=`; implement official `api.hh.ru` REST endpoints for OAuth users in `hhPrivateClient.ts`.
7. **Section 7 Testing & CI**: Remove `tests/` from `.gitignore`, commit Vitest config and test files, add `.github/workflows/ci.yml`.
8. **Section 8 Documentation Fixes**: Align README cron schedules (`collect-vacancies`, `notify-pending`, `sync-negotiations`), document required environment variables.

### P1 (Next Sprint / Core Polish)
*Performance, pipeline robustness, and user fidelity.*

9. **1.12 & 1.13 Logging & Isolation**: Redact OTP codes in production stdout logs, make SMTP configurable (Resend/SendGrid/SES), and eliminate the global `TELEGRAM_CHAT_ID` fallback in `telegram.ts`.
10. **2.17 Telegram Entity Integrity**: Truncate fields before HTML interpolation and escape salary/metadata to eliminate Telegram 400 parsing errors and ugly unformatted text retries.
11. **2.1 & 2.2 Pipeline Correctness**: Fix double-counting in progress counters, introduce `pending_ai` state with a retry cron for AI dropouts, and prevent keyword-only scores from being notified as completed analyses.
12. **2.4 & 2.5 Status Enums & Experience IDs**: Fix "applied" status string mismatch; align experience filter IDs with official HeadHunter dictionary values (`noExperience`, `between1And3`, `between3And6`, `moreThan6`).
13. **3.1 Pipeline DB Batching**: Hoist vacancy cap calculation, load existing vacancies in bulk (`findMany in`), batch status updates, and reduce per-vacancy queries from ~10 to <2.
14. **3.2 Two-Stage AI Routing**: Score vacancies with a compact JSON prompt (Stage 1, 400 tokens); generate full cover letters only on high scores or user request (Stage 2).
15. **3.4 AI Router Resilience**: Add timeouts with `AbortController`, per-provider cooldown on HTTP 429/5xx, and skip providers without credentials upfront.
16. **Section 9 HeadHunter Auth UI**: Implement `systemCapabilities.hasOfficialHhOAuth` in settings API and update settings page to gracefully adapt between Zero-Key Hosted mode and Self-Hosted BYOK mode.
17. **4.1, 4.2, 4.3 UX Enhancements**: Add filter explanation tooltips, search query visibility, and direct HH re-sync / profile reload buttons.

### P2 (Later Improvements)
*Architectural cleanup, schema migrations, and advanced features.*

18. **2.13 Schema Evolution**: Formalize Prisma enums, migrate JSON arrays to scalar arrays with `prisma migrate dev`, add `userId` to `AiUsageLog`, and separate collection progress into `CollectionRun`.
19. **3.5–3.8 Scale & Bundling**: Multi-user cron queue fan-out, direct API vacancy collection with early stop, slim vacancies list query, and modularize settings tabs.
20. **4.4–4.7 & Section 5 Features**: Keyboard shortcuts in split-view, accessibility ARIA live regions, application timeline tracking from negotiations, and intelligent keyword exclusion feedback loops.

---

*Static review verified across all core modules: `verificationCode.ts`, `telegram.ts`, `hhPrivateClient.ts`, AI router, collection pipeline, rule filters, auth, crons, and schema. Before applying each fix, cross-reference line numbers with the active working tree.*
