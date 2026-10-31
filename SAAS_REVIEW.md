# SaaS review — 31 October 2026

Product boundary: Company Intel is priced at $3 per month. Analytics, job search, matching, and cover letters remain free.

## Scope

Reviewed application authentication, API ownership boundaries, settings and profile persistence, AI routing, Company Intel, collection and retry flows, vacancy handling, Telegram integration, public assets, landing copy, build configuration, and tests. Used targeted searches and reads of relevant source files. Did not inspect generated build caches, dependency trees, editor folders, low-code drafts, large graph exports, or the contents of source archives and personal profile exports. This is a focused code review, not a guarantee that every possible defect has been discovered.

## Changes

- Removed the customer AI provider/model/key panel, provider imports/exports and save payloads, and the customer connection-test endpoint. AI routing now uses server environment variables only and ignores legacy customer credentials/endpoints.
- Added paid Company Intel checks to the dashboard layout and list/search/outreach APIs. Free accounts can still delete their own existing records. Analytics has no paid-access guard.
- Added bounded AI requests with cancellation and response validation. Internal model reasoning is never used as a final answer. Provider error bodies are not logged.
- Made Telegram webhook authentication fail closed when either the server secret or request header is missing. Shared webhook configuration requires the operator's bearer secret and uses the configured application URL.
- Replaced new 24-bit Telegram account-link tokens with 192-bit tokens. Existing tokens are not rotated automatically; users can regenerate them in Settings.
- Changed HH OAuth from a predictable user ID state to random, browser-bound state, with an HttpOnly cookie and a configured callback origin.
- Made OTP consumption conditional and atomic, preventing concurrent reuse and respecting the attempt/expiry limit at the write.
- Validated settings and profile actions before database writes. Unknown or unowned requested profile IDs no longer silently update the active profile. Profile rename responses expose only metadata.
- Prevented registration from changing an existing account's profile before OTP verification. New account, profile, and Telegram-link creation use one nested database write.
- Removed persistent browser caches of settings and credentials. Failed settings loads cannot autosave defaults over stored preferences. Imported HH tokens are removed from the visible URL immediately.
- Added public-page fetching that validates literal addresses and DNS results, pins the checked address when connecting, revalidates redirects, limits response size, and times out requests. Used it for portfolio and Company Intel website crawling. Careers links require a web protocol and exact/subdomain ATS hostname matches.
- Added a conditional database claim for collection runs so simultaneous starts cannot both acquire the same profile. Final cleanup cannot release a newer run's lock.
- Company Intel refresh rejects missing/unowned records and replaces contacts in one atomic nested update, preserving the prior contacts if the write fails.
- Removed the publicly served source ZIP and personal profile export. Preserved both files locally under ignored `private-assets/`. Retired the source-download API and changed active landing calls to action to signup.
- Retired the unused server-browser login API so customers cannot open browsers on the operator host; the local CLI scripts remain available. This also removes its broad filesystem trace from the hosted bundle.
- Vacancy reanalysis preserves application/tracking statuses and does not notify pending AI fallbacks. Temporary HH errors (403/429/5xx) no longer cause jobs to be treated as closed. Invalid pagination returns a client error.
- Restored production build type checking, narrowed standalone TypeScript input to relevant code, and removed an incompatible React test plugin in favor of the existing JSX transform.

## Deployment configuration

Set `APP_BASE_URL` to the canonical HTTPS origin, along with `AUTH_SECRET`, `ENCRYPTION_KEY`, database URLs, SMTP settings, configured server AI credentials/models, and Telegram settings as applicable. Do not publish `.env`.

`COMPANY_INTEL_USER_IDS` is a comma-separated list of trusted internal User IDs granted access by the operator. It defaults to no paid access. This is a manual grant mechanism, not subscription billing. No checkout, charge, webhook-based payment verification, renewal, cancellation, or automatic expiry has been implemented. A future billing integration must grant and revoke access from verified server-side subscription state.

Register the Telegram webhook using an authenticated operator request with `Authorization: Bearer <CRON_SECRET>` to `/api/telegram/setup-webhook` after configuring `TELEGRAM_WEBHOOK_SECRET`. Ordinary signed-in accounts cannot perform this operation. No Telegram messages or external configuration changes were made during the review.

The initial review did not perform a production database migration or deployment. Legacy customer AI configurations remain stored but are ignored by execution and omitted from settings responses.

## Remaining launch work

- Integrate payment processing and durable subscription entitlements before accepting payment; choose pricing and access expiry behavior.
- Replace the old self-hosting terms and privacy pages before public SaaS launch. They currently make statements such as no operator access/no telemetry that do not describe the hosted implementation, which includes Vercel Analytics. Legacy documentation and duplicate exports have been removed from current Git tracking; the public demo now represents the free plan. Older published screenshots still need a product-content pass.
- Replace in-memory request limits and idempotency state with shared durable storage before scaling across server instances. Current limits are per process.
- Profile switching/deletion and bootstrap do not yet have a database-enforced single-active-profile constraint under concurrent requests. Password changes/resets also do not yet revoke already-issued JWT sessions.
- Exercise signup/SMTP delivery, HH OAuth and application submission, real AI provider responses, Telegram registration/delivery, and Company Intel enrichment in an isolated staging environment. Tests use mocks; they do not prove those external services are currently configured or available.
- Publicly deployed old archives/profile exports may remain in old deployments or caches until those are retired. Local source changes cannot remove already-published copies.

## Verification

- Baseline: 89 tests passed. New regressions were run and observed failing before the corresponding fixes.
- Final `npm test` after pricing/free-preview changes: **27 test files, 149 tests passed**.
- `npx tsc --noEmit --incremental false`: **passed**. The final production build also ran its TypeScript check successfully.
- `npm run lint -- --format json --output-file scratch/saas-lint.json`: **0 errors**, 176 warnings remain (mostly legacy `any`, unused imports, and raw image elements). The review did not turn into a broad style refactor.
- `npm run build`: **passed**, including Prisma generation and all 55 static pages. The broad filesystem-tracing warning disappeared after retiring server browser login. An existing informational edge/static-generation warning remains.
- `git diff --check`: **passed**.
- Production-server HTTP smoke checks passed: landing returns 200 with signup and no source-download link; retired download API returns 410; former public ZIP/profile URLs return 404; unauthenticated Company Intel API returns 401 and dashboard redirects to login (307).
- Confirmed the source ZIP and personal profile export no longer exist under `public/`; both original files are preserved in ignored `private-assets/`.
- No package was added. No live external messages, applications, payment operations, migrations, or deployments were performed.

## Publishing preparation

The public demo and real free-account paywall share the $3/month Company Intel screen. No payment processing has been added. Development uses webpack to avoid an observed Windows Turbopack junction/cache error. Legacy plans, n8n workflows, capture scripts, and duplicate screenshot exports are untracked but preserved locally; `.vercelignore` also excludes them and private assets from direct uploads. The user explicitly requested that the existing repository become public with its history retained.
