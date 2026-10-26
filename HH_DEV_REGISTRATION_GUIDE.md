# HeadHunter Developer Registration Guide (dev.hh.ru)

This guide provides step-by-step instructions for registering an API client on the official HeadHunter developer console (`dev.hh.ru/admin`), updated for the latest API policies (post-December 15, 2025), with ready-to-use Russian submission templates and English translations.

---

## Table of Contents

1. [Important Policy Notice (Post-2025)](#1-important-policy-notice-post-2025)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step Registration (dev.hh.ru/admin)](#3-step-by-step-registration-devhhrxadmin)
4. [Ready-to-Use Form Templates (Russian & English)](#4-ready-to-use-form-templates-russian--english)
5. [Technical Guidelines & User-Agent Standards](#5-technical-guidelines--user-agent-standards)
6. [Post-Approval Integration](#6-post-approval-integration)

---

## 1. Important Policy Notice (Post-2025)

> **CRITICAL HEADHUNTER POLICY UPDATE:**
> HeadHunter officially discontinued public API support for personal job seekers (*соискатели*) on December 15, 2025.
> Applications describing "personal job applicant bots", "mass auto-apply", or "scraping tools" are rejected immediately by automated filters and human moderators.
>
> To obtain API approval, your application must be positioned as an **HR Analytics & Labor Market Intelligence Tool** (*HR-аналитика и мониторинг рынка труда*) used by hiring specialists.

---

## 2. Prerequisites

1. An active account on [hh.ru](https://hh.ru).
2. A verified email address matching your `hh.ru` login.
3. OAuth2 Callback Redirect URIs:
   - Development: `http://localhost:3000/api/auth/hh/callback`
   - Production: `https://your-domain.com/api/auth/hh/callback`

---

## 3. Step-by-Step Registration (dev.hh.ru/admin)

1. Open your browser and navigate to [https://dev.hh.ru/admin](https://dev.hh.ru/admin).
2. Log in with your `hh.ru` credentials.
3. Click **«Добавить приложение»** (Add Application) or **«Создать приложение»** (Create Application).
4. Fill in the fields using the templates provided below.
5. Click **«Отправить заявку»** (Submit Application).

---

## 4. Ready-to-Use Form Templates (Russian & English)

### Field 1: The application will be used by (Кем будет использоваться)
Select:
```text
Employees of several employers (Сотрудники нескольких работодателей)
```

---

### Field 2: Application Name (Название приложения)

**Russian (Copy to form):**
```text
IT Vacancy Analytics & Market Monitor
```
*(Alternatif Rusia: `Аналитика IT-Вакансий и Стек Монитор`)*

**English Meaning:**
IT Vacancy Analytics & Tech Stack Labor Market Monitor.

---

### Field 3: Information about the creator of the application (Информация о создателе приложения)

**Russian (Copy to form):**
```text
Независимый инженер-разработчик в сфере HR-Tech и автоматизации анализа данных рынка труда. Специализируюсь на создании аналитических инструментов и внутренних интеграционных решений для IT-рекрутеров и специалистов по подбору персонала.
```

**English Meaning:**
Independent software engineer in HR-Tech and labor market data automation. I specialize in building analytical tools and internal integration solutions for IT recruiters and talent acquisition specialists.

---

### Field 4: Who will use it (Кто будет использовать)

**Russian (Copy to form):**
```text
Внутренние рекрутеры, специалисты по подбору IT-персонала и HR-аналитики для исследования рынка труда, мониторинга открытых позиций по ключевым IT-направлениям и оценки рыночных зарплатных вилок.
```

**English Meaning:**
Internal recruiters, IT talent acquisition specialists, and HR analysts for labor market research, monitoring open positions across core IT sectors, and assessing market salary benchmarks.

---

### Field 5: Description of the application (Описание приложения)

**Russian (Copy to form):**
```text
Аналитическая платформа для агрегации и исследования требований к вакансиям в сфере информационных технологий.

Основные сценарии использования API:
1. Получение открытой информации по вакансиям (метод GET /vacancies) для анализа актуальных стеков технологий (Frontend, Backend, Mobile, DevOps) и динамики рынка труда.
2. Анализ детальных требований работодателей (метод GET /vacancies/{vacancy_id}) для составления зарплатных бенчмарков и оценки востребованности навыков.
3. Помощь кадровым специалистам в подготовке конкурентоспособных описаний вакансий на основе сопоставления с рыночными данными.

Приложение строго соблюдает регламент HeadHunter, не выполняет агрессивных запросов, выдерживает ограничения частоты (rate limits), передает уникальный заголовок User-Agent и не содержит функционала автоматической рассылки спама или несанкционированного сбора персональных данных.
```

**English Meaning:**
An analytical platform for aggregating and researching vacancy requirements in the information technology sector.

Primary API use cases:
1. Fetching public vacancy information (GET /vacancies) to analyze current technology stacks (Frontend, Backend, Mobile, DevOps) and labor market dynamics.
2. Analyzing detailed vacancy requirements (GET /vacancies/{vacancy_id}) to compile salary benchmarks and evaluate skill demand.
3. Assisting HR professionals in drafting competitive vacancy postings based on comparative market data.

The application strictly complies with HeadHunter policies, avoids burst requests, respects rate limits, transmits a unique User-Agent header, and contains no automated spam or unauthorized scraping of candidate personal data.

---

### Field 6: Application Website (Сайт приложения)

```text
https://github.com/nnavyy/automation-vacancy-finder
```

---

### Field 7: Redirect URI (Адрес перенаправления)

```text
http://localhost:3000/api/auth/hh/callback
```
*(If you also deploy online, add on a new line: `https://your-domain.com/api/auth/hh/callback`)*

---

### Field 8: Developer Contact Details (Контактные данные)

- **Name / Contact Person:** Your full legal name.
- **Email:** The email address verified on your `hh.ru` account.
- **Phone:** Your international mobile number (e.g. `+62812...`). Moderators send decisions and feedback via email.

---

## 5. Technical Guidelines & User-Agent Standards

Once approved, all requests must transmit a descriptive `User-Agent`:

```http
User-Agent: ITMarketMonitor/1.0 (contact@yourdomain.com)
HH-User-Agent: ITMarketMonitor/1.0 (contact@yourdomain.com)
```

- Maintain a delay of 200–300ms between sequential requests.
- Handle HTTP 429 using exponential backoff based on the `Retry-After` response header.

---

## 6. Post-Approval Integration

When approved:
1. Navigate to [dev.hh.ru/admin](https://dev.hh.ru/admin) and select your application.
2. Copy your **Client ID** and **Client Secret**.
3. Add them to your `.env` file:
   ```ini
   HH_CLIENT_ID="your_client_id_here"
   HH_CLIENT_SECRET="your_client_secret_here"
   ```
4. Restart your application. In the dashboard at `/dashboard/settings`, select **Official OAuth** and click **Connect via Official OAuth**.
