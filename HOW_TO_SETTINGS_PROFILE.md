# Configuration Guide — Settings and Profile Setup

This guide explains how to configure Nanda AI Job Assistant for your first use. All settings are managed from the dashboard at `/dashboard/settings`.

---

## Table of Contents

- [Connecting Your HH.ru Account](#1-connecting-your-hhru-account)
- [Profile and Target Roles](#2-profile-and-target-roles)
- [Skills Configuration](#3-skills-configuration)
- [Search Keywords](#4-search-keywords)
- [Scoring Thresholds](#5-scoring-thresholds)
- [Exclusion and Red Flag Filters](#6-exclusion-and-red-flag-filters)
- [Cover Letter and Resume Context](#7-cover-letter-and-resume-context)
- [Importing a JSON Profile](#8-importing-a-json-profile)
- [Connecting Telegram Notifications](#9-connecting-telegram-notifications)
- [Saving Settings](#10-saving-settings)

---

## 1. Connecting Your HH.ru Account

The HH.ru integration uses your browser session cookie to authenticate API requests on your behalf. This allows the system to sync your negotiation history (interview invitations, rejections, views) without requiring your username or password.

**Steps to obtain your session cookie:**

1. Open [hh.ru](https://hh.ru) in a desktop browser and sign in to your account.
2. Press `F12` to open Developer Tools. In Firefox, use `Ctrl+Shift+I`.
3. Go to the **Network** tab.
4. Reload the page (`F5`).
5. Click on any request to `hh.ru` in the request list.
6. Open the **Headers** section of that request and locate the `Cookie` header under **Request Headers**.
7. Copy the entire cookie string (it will look like `hhtoken=...; hhuid=...; _xsrf=...`).
8. Paste this string into the **Full Cookie String** field in Settings.
9. Click **Load Resumes** to validate the cookie and select which resume to use for auto-apply.

**Notes:**

- Session cookies typically expire after several weeks. If vacancy synchronization stops, refresh the cookie by repeating the steps above.
- The cookie is stored in your own database and is never transmitted to any server other than HH.ru.

---

## 2. Profile and Target Roles

**Profile Name**

A label for this configuration, useful if you maintain multiple profiles for different job types.

Example: `Backend Lead`, `Frontend (React)`, `Fullstack Remote`

**Target Roles (comma-separated)**

The exact job titles you are searching for. The AI uses this list to evaluate whether a vacancy's title and responsibilities align with your career goals.

Example: `Frontend Developer, React Developer, Fullstack Engineer, UI Engineer`

---

## 3. Skills Configuration

**Required Skills (comma-separated)**

Technologies or competencies that are non-negotiable for you. If a vacancy's requirements conflict with your required skills (for example, it requires Angular when you only do React), the AI will penalize the score accordingly.

Example: `JavaScript, TypeScript, React, Git, REST API`

**Nice-to-Have Skills (comma-separated)**

Technologies you know and appreciate, but would not reject a job for not using. Matching these increases the AI score.

Example: `Docker, GraphQL, Next.js, Figma, AWS`

---

## 4. Search Keywords

These keywords are passed directly to the HH.ru public search API to pull an initial set of vacancies before AI analysis begins.

**English Keywords**

Used for searching vacancies posted in English or for international companies.

Example: `React, Frontend Developer, Next.js, TypeScript`

**Russian Keywords**

Used for searching Russian-language vacancies. Enter terms in Cyrillic.

Example: `Фронтенд разработчик, React, Веб-разработчик`

Providing both sets maximizes coverage across the HH.ru catalog.

---

## 5. Scoring Thresholds

**Minimum Score to Notify**

Vacancies that score at or above this threshold will trigger a Telegram notification. Set this high (e.g., 75) to reduce noise, or lower (e.g., 50) to see more matches.

Range: 0–100. Default: 70.

**Maximum Notifications per Day**

Limits the number of Telegram messages sent in a 24-hour period to avoid notification fatigue.

Default: 20.

---

## 6. Exclusion and Red Flag Filters

**Exclude Keywords (comma-separated)**

Vacancies containing any of these words in their title or description are skipped immediately before AI analysis. Use this to block technologies you cannot work with or industries you want to avoid.

Example: `PHP, Angular, Vue, 1C, Bitrix, WordPress, SAP`

**Red Flag Keywords (comma-separated)**

These words do not disqualify a vacancy outright, but they trigger a warning label in the analysis and reduce the AI score. Use this for phrases associated with poor company culture.

Example: `stress tolerance, work hard play hard, overtime is expected, self-motivated, passport copy`

---

## 7. Cover Letter and Resume Context

**Resume / Background Text**

Paste the text of your resume or a brief professional summary. The AI uses this when generating personalized pitches and evaluating fit. It does not need to be formatted — plain text is sufficient.

The more specific and detailed this text is, the more accurate the AI-generated pitches will be.

**Cover Letter Language**

Select the language the AI should use when generating cover letters:

| Option | Behavior |
|---|---|
| English | Always generates in English |
| Russian | Always generates in Russian |
| Auto (Match Vacancy) | Detects the vacancy language and matches it |

**Portfolio / Website URL**

Provide a link to your personal site, GitHub profile, or portfolio. The AI can crawl this URL (using the Test Crawl button) to extract project evidence that gets referenced in cover letters.

---

## 8. Importing a JSON Profile

You can pre-fill all settings fields by uploading a structured JSON file. This is useful if you maintain your job search preferences as a document or want to migrate between environments.

**Supported fields:**

| JSON Key | Maps To |
|---|---|
| `profileName` or `name` | Profile Name |
| `resumeText` or `bio` | Resume Text |
| `portfolioUrl` | Portfolio URL |
| `targetRoles` | Target Roles |
| `searchKeywordsEn` | English Keywords |
| `searchKeywordsRu` | Russian Keywords |
| `requiredSkills` | Required Skills |
| `niceToHaveSkills` | Nice-to-Have Skills |
| `excludeKeywords` | Exclude Keywords |
| `redFlagKeywords` | Red Flag Keywords |

Fields not present in the JSON file are left unchanged.

**Optional: Translate Russian to English**

Enable the "Translate Russian to English" toggle before uploading if your JSON contains Russian-language values that you want converted automatically.

---

## 9. Connecting Telegram Notifications

1. Open a chat with your Telegram bot.
2. Scroll to the **Telegram Bot** section in Settings.
3. Click **Generate Telegram Token**. A one-time token will appear.
4. Send the command `/link <token>` to your bot.
5. The status indicator will change from "Not linked" to "Linked."

If your account becomes unlinked, click **Regenerate Token** and repeat the linking step.

---

## 10. Saving Settings

Click **Save Settings** at the top or bottom of the Settings page. A confirmation message will confirm the save was successful.

Settings take effect immediately. The next collection cycle (triggered by n8n or manually) will use the updated keywords, thresholds, and skill lists.

---

> For technical setup, environment variables, and deployment instructions, see [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md).
