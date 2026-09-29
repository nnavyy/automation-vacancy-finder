# HeadHunter Developer Registration Guide (dev.hh.ru)

This guide provides step-by-step instructions for registering a developer application on the official HeadHunter developer portal (`dev.hh.ru`), general API technical standards, and ready-to-use Russian form templates tailored to pass manual review by the HeadHunter moderation team.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [General HH.ru API Specifications](#2-general-hhru-api-specifications)
3. [Application Registration Steps (dev.hh.ru/admin)](#3-application-registration-steps-devhhrxadmin)
4. [Registration Form Templates (Russian Language)](#4-registration-form-templates-russian-language)
5. [Notes for International / Foreign Developers](#5-notes-for-international--foreign-developers)
6. [Mandatory Header Rules and Rate Limits](#6-mandatory-header-rules-and-rate-limits)
7. [Post-Approval Integration Steps](#7-post-approval-integration-steps)

---

## 1. Prerequisites

Before registering an application:
1. An active account on [hh.ru](https://hh.ru) (a job seeker account / *соискатель* is recommended).
2. A verified email address associated with your account.
3. Prepared OAuth2 Redirect URIs:
   - Local development: `http://localhost:3000/api/auth/callback/hh`
   - Production domain: `https://your-domain.com/api/auth/callback/hh`

---

## 2. General HH.ru API Specifications

All requests to the official HeadHunter API must adhere to the following standards:

- **Base URL**: `https://api.hh.ru/`
- **Protocol**: HTTPS is strictly required for all requests.
- **Data Exchange Format**: JSON (`Content-Type: application/json; charset=UTF-8`).
- **Authorization Protocol**: OAuth 2.0 (Authorization Code Grant).
- **Date/Time Standard**: ISO 8601 (`YYYY-MM-DDThh:mm:ss±hhmm`).
- **OpenAPI Reference**: [https://api.hh.ru/openapi/redoc](https://api.hh.ru/openapi/redoc)
- **Official Documentation Repository**: [https://github.com/hhru/api](https://github.com/hhru/api)

---

## 3. Application Registration Steps (dev.hh.ru/admin)

1. Open your browser and navigate to the developer administration console: [https://dev.hh.ru/admin](https://dev.hh.ru/admin).
2. Log in using your existing `hh.ru` account credentials.
3. Click the **«Создать приложение»** (Create Application) or **«Добавить приложение»** button.
4. Fill in the required fields using the Russian templates provided in Section 4 below.
5. Click **«Отправить заявку»** (Submit Application).

> **IMPORTANT**: Every new application request is manually reviewed by a human moderator at HeadHunter. Review cycles typically take between 3 and 15 business days. Applications mentioning "automated bots", "scraping", or "mass auto-apply" will be rejected immediately. Always use the structured career analytics template below.

---

## 4. Registration Form Templates (Russian Language)

Copy and paste the following Russian text into the corresponding fields on the registration form:

### Field 1: Название приложения (Application Name)
Select one of the following formal titles:

**Option A (Career Analytics Focus - Recommended):**
```text
Карьерный Ассистент и Аналитика Вакансий
```
*(Meaning: Career Assistant and Vacancy Analytics)*

**Option B (Skill Matching Focus):**
```text
Умный Поиск и Оценка Соответствия Вакансий
```
*(Meaning: Smart Search and Vacancy Match Evaluation)*

---

### Field 2: Описание приложения (Application Description)
*This field is reviewed directly by human curators. Use the following formal Russian text:*

```text
Приложение представляет собой персональный инструмент соискателя для умного поиска и аналитики вакансий на платформе hh.ru.

Основные цели использования API:
1. Поиск открытых вакансий по ключевым профессиональным навыкам и параметрам соискателя (метод GET /vacancies).
2. Получение подробной информации о требованиях работодателей для проведения сравнительного анализа соответствия резюме (метод GET /vacancies/{vacancy_id}).
3. Управление откликами и отслеживание статуса рассмотрения кандидатуры через официальный протокол OAuth 2.0 авторизации соискателя.

Приложение не осуществляет массовых автоматических рассылок спама, строго соблюдает правила платформы, ограничения по частоте запросов (rate limits) и передает корректный заголовок User-Agent. Сервис разработан для повышения эффективности персонального трудоустройства.
```

*(English Translation: The application is a personal job seeker tool for smart search and vacancy analytics on the hh.ru platform. Primary API objectives: 1. Search open vacancies by skills and parameters. 2. Fetch detailed vacancy criteria for resume fit analysis. 3. Manage applications and track submission status via official OAuth 2.0. The application does not send mass spam, strictly complies with platform rules and rate limits, and transmits a valid User-Agent. Developed solely to increase individual employment efficiency.)*

---

### Field 3: Сайт приложения (Application Website / URL)
Provide a link to your public GitHub repository or landing page:
```text
https://github.com/username/automation-vacancy-finder
```

---

### Field 4: Redirect URI (Redirect Callback URL)
Enter the OAuth2 callback handler URL:
```text
http://localhost:3000/api/auth/callback/hh
```
*(If you also have a live production domain, add it on a separate line: `https://your-domain.com/api/auth/callback/hh`)*

---

### Field 5: Для кого предназначено приложение (Intended Audience)
Select:
```text
Для соискателей
```
*(For job seekers / personal applicant use)*

---

### Field 6: Контактные данные (Developer Contacts)
- **Имя / Контактное лицо (Contact Name)**: Your full name.
- **Email**: Active email address matching your `hh.ru` account.
- **Телефон (Phone)**: Your international mobile phone number (e.g., `+62812...`). Note: moderators communicate via email, not international voice calls.

---

## 5. Notes for International / Foreign Developers

If you are registering from outside the Russian Federation:

1. **Email / Social Login**:
   - You do not need a Russian phone number to access `dev.hh.ru/admin`.
   - Register and authenticate on `hh.ru` using your email address or Google account. Verification codes (OTP) will be delivered directly to your email inbox.
2. **International Phone Numbers**:
   - In the developer contact form (`dev.hh.ru/admin`), the phone field is a standard informational text input. You can enter your international number (`+62...`) directly; the form submission does not trigger an interactive SMS verification challenge.
3. **If SMS Verification Is Triggered on Account Setup**:
   - If international SMS delivery to your carrier experiences delays, wait 60 seconds and select the voice verification option (*«Позвонить»* / Flash Call), or use a temporary virtual activation service (e.g., SMS-Activate or 5sim) for initial account verification.

---

## 6. Mandatory Header Rules and Rate Limits

Once approved, all API client calls must comply with the following technical rules:

### A. Mandatory User-Agent Header
HH.ru returns `403 Forbidden` if the `User-Agent` header is absent, generic (e.g., default `curl` or `python-requests`), or non-compliant.

**Required Format:**
```http
User-Agent: ApplicationName/Version (developer_email@example.com)
HH-User-Agent: ApplicationName/Version (developer_email@example.com)
```

**Example:**
```http
User-Agent: CareerAssistant/1.0.0 (dev@myproject.com)
HH-User-Agent: CareerAssistant/1.0.0 (dev@myproject.com)
```

### B. Rate Limiting and Backoff
- Do not make concurrent burst requests.
- Maintain a minimum delay of `150ms - 300ms` between sequential `GET` requests.
- When receiving an HTTP `429 Too Many Requests` status, read the `Retry-After` header and execute exponential backoff.

### C. Error and Captcha Handling
If the API returns a `captcha_required` error:
- Do not retry with automated brute-force requests.
- Provide the verification URL to the user so they can complete the challenge in their browser.

---

## 7. Post-Approval Integration Steps

Once approved by the HeadHunter API team:
1. Log in to [dev.hh.ru/admin](https://dev.hh.ru/admin).
2. Click your application card.
3. Copy your credentials:
   - **Client ID**: Public identifier.
   - **Client Secret**: Private secret key (never commit this to version control).
4. Update your local `.env` configuration:
   ```env
   HH_CLIENT_ID=your_client_id_here
   HH_CLIENT_SECRET=your_client_secret_here
   HH_REDIRECT_URI=http://localhost:3000/api/auth/callback/hh
   HH_USER_AGENT=CareerAssistant/1.0.0 (your-email@example.com)
   ```
5. Authorize users via OAuth 2.0:
   - **Authorization URL**:
     ```text
     https://hh.ru/oauth/authorize?response_type=code&client_id={HH_CLIENT_ID}&redirect_uri={HH_REDIRECT_URI}
     ```
   - **Token Exchange Endpoint**:
     ```http
     POST https://hh.ru/oauth/token
     Content-Type: application/x-www-form-urlencoded

     grant_type=authorization_code&client_id={HH_CLIENT_ID}&client_secret={HH_CLIENT_SECRET}&redirect_uri={HH_REDIRECT_URI}&code={AUTHORIZATION_CODE}
     ```
