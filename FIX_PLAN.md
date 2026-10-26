# Post-Review Fix Plan

Scope: issues found when re-reviewing the repo after the P0/P1 refactor (see `IMPROVEMENT_SUGGESTIONS.md`).
Baseline before this plan: `tsc --noEmit` exit 0, Vitest 14 files / 73 tests green.

Format per item: **Problem** (file, what happens), **Why it matters**, **Fix**, **Verify**.
Priority: **P0** = fix before the Oct 24-26 launch, **P1** = same sprint, **P2** = polish.

Skills applied: `pstack` (verify with evidence after every phase), `alibaba-open-code-review` (tenant isolation, injection),
`pipeline-concurrency-optimizer` (retry sweep, bounded work), `slop-monster` (letter prompt), `ponytail` (no new columns or
dependencies where a constant works), `non-redundant-ui-ux` (single source of truth for counters).

---

## Summary

| # | Pri | Issue | Origin |
|---|-----|-------|--------|
| F1 | P0 | `regenerate-letter` and Telegram "Regenerate" return an empty letter or raw JSON | Regression from my Stage 1/2 split |
| F2 | P0 | `regenerate-letter` falls back to **another user's** profile and BYOK keys | Pre-existing, same class as 1.1 |
| F3 | P0 | `block-company` writes into **another user's** `excludeKeywords` | Pre-existing, same class as 1.1 |
| F4 | P0 | `vercel.json` sub-daily crons are rejected on the Hobby plan | My P0.8 change |
| F5 | P0 | `pending_ai` is written but never retried, so those vacancies are never notified | My Phase 2 change |
| F6 | P1 | Dashboard counters ignore `pending_ai` | My Phase 2 change |
| F7 | P1 | `autoCoverLetterMinScore` is read but no such field exists | My Phase 2 change |
| F8 | P1 | Stage 2 letter prompt has no vacancy description, so letters are generic | My Phase 2 change |
| F9 | P1 | Telegram message has no hard 4096-char guarantee | My Phase 1 change |
| F10 | P1 | Webhook replies interpolate vacancy title and letter without HTML escaping | Pre-existing |
| F11 | P2 | Self-Hosted card has hard-coded English strings | My Phase 3 change |
| F12 | P1 | No tests for Stage 2, `pending_ai`, retry sweep, or hard cap | Gap |

---

## F1 [P0] Letter regeneration is broken by the Stage 1 prompt change

**Problem.** `buildAnalysisPrompt` no longer asks the model for `cover_letter` (Stage 1 is scoring only). Two callers still
rely on it:
- `src/app/api/vacancies/[id]/regenerate-letter/route.ts` L93-132 appends "update the cover_letter field" to the Stage 1 prompt, then reads
  `fullAnalysis.cover_letter`, which is now `""`.
- `src/app/api/telegram/webhook/route.ts` `handleEdit` L214-261 does the same, and on parse failure falls back to
  `aiResult.content.trim()`, which would post raw JSON to the user's chat.

**Why it matters.** The dashboard "Regenerate" button and the Telegram "Regenerate" button both silently produce a blank
or garbage letter. This is user-visible and I introduced it.

**Fix.**
1. Extend `generateCoverLetter(vacancy, analysis, pref, options?)` with `options.instruction` (sanitized with
   `sanitizeUntrustedPromptText`) and `options.maxTokens`.
2. `regenerate-letter` calls `generateCoverLetter` with the stored analysis (`matchReasons`, `bestLanguage`) and the
   user's instruction, then updates only `coverLetter` on the existing `VacancyAnalysis`.
3. If no analysis exists yet, return `409` with "Analyze this vacancy first" (the old code created a full analysis from
   the regenerate call; that is no longer possible with a letter-only prompt).
4. `handleEdit` calls `generateCoverLetter`, escapes the result with `escapeHtml` before sending.
5. Remove the raw-JSON fallback.

**Verify.** Unit test: mocked `callAI` returns plain letter text, `generateCoverLetter` returns it trimmed with fences
stripped; with an instruction, the prompt contains the sanitized instruction. Route-level behavior covered by F2 test.

---

## F2 [P0] `regenerate-letter` cross-user profile fallback

**Problem.** Same route, L81-85:
```ts
const pref = await prisma.searchPreference.findFirst({ where: { userId: user.id, isActive: true } })
  || await prisma.searchPreference.findFirst({ where: { isActive: true } });   // any user
```

**Why it matters.** A user with no active profile generates letters from another user's resume and spends that user's
BYOK key. Identical to issue 1.1, which I fixed in `analyze/route.ts` but missed here.

**Fix.** Drop the fallback; return `400 { error: "No active search profile..." }`.

**Verify.** Grep confirms zero remaining `where: { isActive: true }` without `userId` in user-facing routes (the cron
route is intentionally global). Add to the final grep check.

---

## F3 [P0] `block-company` modifies another user's profile

**Problem.** `src/app/api/vacancies/[id]/block-company/route.ts` L33-37 has the same unscoped fallback, then **updates**
that profile's `excludeKeywords`.

**Why it matters.** A user without an active profile can add arbitrary strings to a stranger's exclude list, silently
hiding that stranger's vacancies. This is a cross-tenant write, worse than a read leak.

**Fix.** Remove the fallback. If the user has no active profile, skip the exclude update, still mark the vacancy
ignored (it is owned by the caller via `getOwnedVacancy`), and return `success` with `excluded: false`.

**Verify.** Grep check from F2.

---

## F4 [P0] Cron schedules incompatible with Hobby plan

**Problem.** `vercel.json` has `notify-pending` at `0 */2 * * *` and `sync-negotiations` at `0 */4 * * *`. Your commit
`a649178` ("keep vercel cron at daily for hobby tier compatibility") shows you are on Hobby, where only once-per-day
expressions are accepted. Deploy fails on invalid cron.

**Fix.** Make all three daily and staggered:
- `collect-vacancies` `0 0 * * *` (unchanged)
- `notify-pending` `0 6 * * *`
- `sync-negotiations` `0 12 * * *`

For higher frequency without upgrading, call the same endpoints from n8n or a GitHub Actions schedule with the
`Authorization: Bearer $CRON_SECRET` header (routes are already secret-protected). Add a note to the README.

**Verify.** JSON parses; every expression has day-of-month/hour fields fixed (no `*/N` in the hour field).

---

## F5 [P0] `pending_ai` rows are never retried

**Problem.** `analyzeVacancy` returns `aiStatus: "pending_ai"` on provider failure, and the pipeline defers the
Telegram alert. Nothing later re-runs AI for those rows, and `notify-pending` only handles rows already analyzed.

**Why it matters.** Any vacancy that meets a provider timeout is never notified. That is worse than the previous
behavior (a rule-only alert).

**Fix.** New `src/lib/pendingAiRetry.ts`:
- `retryPendingAnalyses({ userId, pref, deadline, limit = 5 })` selects vacancies with status `analyzed`, `analysis.aiStatus
  in ("pending_ai","pending_limit")`, owned by `userId`, created within the last 3 days, newest first.
- Re-runs `analyzeVacancy` per row and persists via an upsert. If it succeeds, `aiStatus` becomes `completed` and the
  row is picked up by the normal notify query in the same cron run.
- If the row is older than 3 days, set `aiStatus: "rule_based_only"` (terminal). This bounds retries without a new
  attempts column (`ponytail`).
- Respects the cron deadline and the `limit`, so one slow provider cannot starve the run.
- `notify-pending/route.ts` calls it per user before querying notifiable rows, using the full preference record via
  `toSearchPrefData`.

**Verify.** Unit test with mocked prisma and `analyzeVacancy`: success path persists `completed`; failure path leaves
`pending_ai`; stale rows flip to `rule_based_only`; `limit` and `deadline` are honored.

---

## F6 [P1] Counters ignore `pending_ai`

**Problem.** `dashboard/page.tsx` L66, `api/dashboard/collect-status/route.ts` L43 and `services/vacancyService.ts` L149 only
count `pending_limit`. `vacancies/[id]/page.tsx` L134 colors only `pending_limit`.

**Fix.** Use `aiStatus: { in: ["pending_limit","pending_ai"] }` and the equivalent filter; add `pending_ai` to the badge
variant mapping (yellow).

**Verify.** `tsc` clean; grep shows no bare `"pending_limit"` equality left in counters.

---

## F7 [P1] Dead `autoCoverLetterMinScore` setting

**Problem.** `analyzeVacancy` reads `pref.autoCoverLetterMinScore`, which is not in `prisma/schema.prisma`, not in
`SearchPreferenceData`, and not in settings.

**Fix (ponytail).** Our agreed design was a fixed 75 threshold plus on-demand. Replace the dead read with an exported
constant `AUTO_COVER_LETTER_MIN_SCORE = 75`. No migration. If per-profile control is wanted later, add the column then.

**Verify.** Test: score 74 gets no auto letter, score 75 does.

---

## F8 [P1] Stage 2 prompt lacks vacancy content

**Problem.** `generateCoverLetter` only sends title, company and up to 3 match reasons. The letter cannot reference real
requirements.

**Fix.** Add the vacancy description (first 1500 chars) inside the same
`<untrusted_external_content ... inert_data>` wrapper and `PROMPT_INJECTION_DEFENSE_DIRECTIVE` used by Stage 1, run
through `sanitizeUntrustedPromptText`. Keep the anti-cliche rules.

**Verify.** Test asserts the prompt contains the defense directive and the sanitized description, and that an injected
`</untrusted_external_content>` in the description does not appear verbatim.

---

## F9 [P1] Telegram hard length cap

**Problem.** After pre-truncation the message is usually short, but HTML escaping can expand characters (`&` becomes
`&amp;`), and there is no final guarantee under 4096.

**Fix.** Build the message from ordered blocks. While `length > 4000`, drop optional blocks in this order: cover preview,
language line, missing requirements. Header, score and red flags always stay. Never slice mid-entity.

**Verify.** Test with maximum-length fields full of `&` stays under 4096 and still contains no unclosed tags.

---

## F10 [P1] Unescaped HTML in webhook replies

**Problem.** `handleSkip`, `handleSave`, `handleEdit` interpolate `v.title`, `v.company` and the letter into
`parse_mode: HTML` messages. A title containing `<` triggers Telegram "can't parse entities" and the reply is lost.

**Fix.** Wrap interpolations with `escapeHtml` (already exported from `telegram.ts`).

**Verify.** `tsc` clean; manual unit check through the exported helper test.

---

## F11 [P2] Hard-coded English in the Self-Hosted card

**Problem.** "Self-Hosted", "Zero-Key Mode" and the three setup steps are English-only while the surrounding card is
bilingual.

**Fix.** Use the page's existing `language === "ru"` ternary pattern for these strings.

---

## F12 [P1] Test coverage

New tests:
- `tests/lib/aiAnalyzerTwoStage.test.ts`: `callAI` mocked. Covers Stage 1 success with score below and at the threshold,
  Stage 2 failure falling back to the rule-based letter, provider failure returning `pending_ai`, parse failure
  returning `pending_ai`, `generateCoverLetter` fence stripping and instruction handling, injection wrapper.
- `tests/lib/pendingAiRetry.test.ts`: prisma and `analyzeVacancy` mocked.
- `tests/lib/telegram.test.ts`: add the hard cap case.

---

## Execution order and gates

1. **Phase A (P0 safety):** F2, F3, F4, then F1 (shared helper), F5.
   Gate: `tsc --noEmit` and `vitest run` green.
2. **Phase B (P1):** F6, F7, F8, F9, F10, F12.
   Gate: same.
3. **Phase C (P2):** F11, final grep audit, update this file with results.
   Gate: same, plus grep for unscoped `isActive: true` queries.

## Out of scope (flagged, not changed)

- Committed screenshots, `scripts/capture-*.ts`, `public/downloads/`: repo-hygiene decision is yours. I did not find
  secrets in `scripts/` with a regex scan, but I did not inspect the PNGs. Check them for tokens or emails.
- Per-profile cover-letter threshold column (see F7).
- Moving crons to n8n or GitHub Actions (documented, not wired).

## Results

All planned improvements and fixes (F1 through F12) have been implemented and verified under `pstack` standards:

- **Type Check:** `node ./node_modules/typescript/bin/tsc --noEmit` passed with exit code 0 (zero errors).
- **Test Suite:** `node ./node_modules/vitest/vitest.mjs run` executed successfully:
  - **16 test files passed** (16 of 16)
  - **89 tests passed** (89 of 89, up from baseline 73 tests)
  - Coverage includes two-stage LLM routing, auto-threshold gating, injection neutralizing, Telegram 4000/4096 hard-limit formatting, tenant-isolated fallback, and pending AI retry sweeps.
- **Tenant Isolation Audit:** Verified with full `grep_search`. Zero unscoped `where: { isActive: true }` queries exist in user-facing routes. Cross-profile fallbacks removed from `regenerate-letter` and `block-company`.
- **Single Source of Truth:** `generateCoverLetter` is the dedicated single function for cover letter drafting. Counters in dashboard, API, and services consistently track both `pending_ai` and `pending_limit`.
- **Deployment Compatibility:** Vercel Hobby daily cron schedule documented in `vercel.json` and `README.md` with clear instructions for external runners (n8n, GitHub Actions). Optional environment variables documented.
