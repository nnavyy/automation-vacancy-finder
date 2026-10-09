# Product Requirements Document (PRD) — HH Job Copilot Optimization

## Overview
This document tracks task progression for the Ralph Loop autonomous runner and Antigravity development workflow.

---

## Active Milestone: Pipeline Performance & Concurrency Optimization

- [ ] **Task 1: Benchmark and Audit Sequential Loops in `collectionPipeline.ts`**
  - Locate all sequential `for`-loop network operations (`fetchVacancyJsonLd`, `analyzeVacancy`).
  - Target file: `src/lib/collectionPipeline.ts`.
  - Acceptance Criteria: Baseline execution time measured; candidate concurrency bottlenecks mapped out.

- [ ] **Task 2: Implement Bounded Concurrency Pool for Vacancy Processing**
  - Replace naive sequential loop with bounded concurrency (e.g. 5 concurrent requests) using `p-limit`.
  - Enforce `ponytail` minimal diff and avoid redundant dependency bloat.
  - Acceptance Criteria: 40 vacancies processed in <45s instead of ~160s without HTTP 429 rate limit errors.

- [ ] **Task 3: Optimize Multi-Tier AI Provider Routing for Bulk Scoring**
  - Ensure bulk screening defaults to ultra-fast models (Groq / Gemini Flash) for rapid match scoring.
  - Retain high-reasoning models (Claude Sonnet / GPT-4o) exclusively for customized cover letters and recruiter dossiers.
  - Acceptance Criteria: Scoring latency reduced by 70% while maintaining 100% schema accuracy.

- [ ] **Task 4: Run Verification Suite**
  - Execute automated tests and typechecks (`npm test`, `npm run lint`).
  - Follow `pstack` verification-first guidelines: confirm zero regressions before marking complete.

---

## Completed Tasks Log
*(Completed items will be logged here with verification results)*
