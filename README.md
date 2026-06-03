# Nanda AI Job Assistant: User Guide & Features

> **Note for Developers:** For local installation, tech stack details, and project structure, please see the [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md).

Welcome to the **Nanda AI Job Assistant**, your personal, semi-automated job search engine for HH.ru. This application is designed to take the tedious manual labor out of job hunting by automating vacancy scraping, evaluating them using Artificial Intelligence, and assisting with OSINT (Open-Source Intelligence) to contact hiring managers directly.

---

## Core Philosophy

The traditional job search requires you to manually browse pages of jobs, read long descriptions, guess if you match the requirements, and blindly apply through an ATS (Applicant Tracking System). 

This app flips the script:
1. **It searches for you** while you sleep.
2. **It reads and scores** every job description using AI.
3. **It alerts you** via Telegram only for the best matches.
4. **It helps you bypass ATS** by finding the emails and LinkedIn profiles of company decision-makers.

---

## Key Features

### 1. Smart Vacancy Dashboard
Instead of a messy spreadsheet, you get a clean, modern dashboard to manage your entire job pipeline.
- **Overview:** See your latest AI-scored job matches at a glance.
- **Vacancies:** Review jobs that the system collected. Read the AI's explanation of *why* you are a good fit (or why you are missing skills).
- **Saved & Applied:** Track jobs you've bookmarked and jobs you've already applied for.

### 2. AI-Powered Evaluation (Groq & Gemini)
Every vacancy pulled from HH.ru is passed through a multi-layer AI pipeline.
- **Pre-screening:** Removes spam, fake jobs, or irrelevant postings.
- **Scoring (0-100):** The AI scores the job based on your exact profile, tech stack, and experience. 
- **Red Flags:** Automatically detects toxic phrases in job descriptions (e.g., "work hard play hard", "stress tolerance").
- **Cover Letters:** Automatically generates a personalized cover letter tailored to the specific job requirements.

### 3. Company Intel (OSINT & Contact Finder)
When you apply through a standard portal, you become just another PDF. The **Company Intel** feature helps you bypass the queue.
- **Automated Contact Scraping:** Enter a company name (e.g., "Gojek" or "cian.ru"), and the app will hunt down the emails, roles, and LinkedIn profiles of their employees.
- **Multi-layered Search:** It uses a hybrid of Hunter.io, Apollo.io, and a proprietary Bing OSINT Scraper to ensure you find the right people.
- **Smart OSINT Links:** One-click buttons to instantly perform a LinkedIn Search, Google X-Ray search, or Glassdoor check for the company.

### 4. Real-time HH.ru Synchronization
- Connects securely to your private HH.ru account.
- Syncs your application history, interview invites, and negotiation statuses in real-time so your dashboard is always up to date with the platform.

### 5. Telegram Bot Integration
You don't need to stare at the web app all day. 
- The system runs in the background and sends a Telegram message directly to your phone when a **High-Score Job** (e.g., >80/100) is found.
- You can read the AI summary and click "Apply" right from your chat.

---

## How to Use the App

### Step 1: Configure Your Profile & Settings
Before the AI can find your perfect job, you must configure your skills, keywords, and link your HH.ru account token. 
Read the full step-by-step tutorial here: **[How to Setup Profile & Settings](./HOW_TO_SETTINGS_PROFILE.md)**.

### Step 2: Review Your Matches
Check your Telegram or the **Overview** page on the dashboard. Look at the AI Score and the "Pros/Cons" generated for each job.

### Step 2: Apply or Save
If you like the job, you have two choices:
1. **Apply via HH.ru:** Click the link, apply normally.
2. **The Pro Strategy (Recommended):** Use the **Company Intel** tab.

### Step 3: The Pro Strategy (Bypassing ATS)
1. Go to the **Company Intel** menu.
2. Type in the company name (e.g., "Faceit").
3. The system will find the hiring managers, HRs, or CTOs.
4. Copy their email or LinkedIn URL.
5. Send them a direct, personalized message using the AI-generated Cover Letter from the vacancy page.

### Step 4: Track Analytics
Go to the **Analytics** tab to see your conversion rates: How many jobs were collected, how many you applied to, and how many resulted in interviews. Let the AI optimize your strategy based on the data.
