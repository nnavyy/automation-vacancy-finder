"use client";

// ============================================================
// Nanda AI Job Assistant — Internationalization (i18n) Engine
// Target Market: CIS Region & Global (HeadHunter Ecosystem)
// Supported Languages: English (Default), Russian (ru / CIS)
// Strict rule: Zero emojis in translation strings
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export type Language = "en" | "ru";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English (Default)" },
  { code: "ru", label: "Russian", nativeName: "Русский (CIS)" },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.overview": "Overview",
    "nav.vacancies": "Vacancies",
    "nav.saved": "Saved",
    "nav.applied": "Applied",
    "nav.companyIntel": "Company Intel",
    "nav.analytics": "Analytics",
    "nav.settings": "Settings",

    // Common Actions
    "action.save": "Save",
    "action.saving": "Saving...",
    "action.saved": "Saved",
    "action.cancel": "Cancel",
    "action.delete": "Delete",
    "action.edit": "Edit",
    "action.search": "Search",
    "action.filter": "Filter",
    "action.copy": "Copy",
    "action.copied": "Copied",
    "action.connect": "Connect Account",
    "action.connecting": "Connecting...",
    "action.validating": "Validating...",
    "action.refresh": "Refresh",

    // Language Section
    "lang.title": "Interface Language & Localization",
    "lang.subtitle": "Choose your preferred language for the assistant dashboard. Tailored for CIS & Global job markets.",
    "lang.select": "Select Language",
    "lang.en": "English (Default)",
    "lang.ru": "Русский (Russian / CIS)",

    // HH Sync Section
    "hh.sectionTitle": "HH.ru Account & Session Sync",
    "hh.active": "HeadHunter Session: Active & Connected",
    "hh.disconnected": "HeadHunter Session: Disconnected / Expired",
    "hh.ttl": "TTL: ~30 days",
    "hh.checkSession": "Check Session",
    "hh.modeConsole": "Console F12 (Cloud)",
    "hh.modeOAuth": "Official OAuth",
    "hh.modeLocal": "Localhost Browser",
    "hh.consoleSteps": "Steps: 1. Open hh.ru -> 2. F12 Console/Network -> 3. Copy Token/Cookie -> 4. Paste Token",
    "hh.consoleInstructions": "1. In F12 DevTools on hh.ru, go to Application > Cookies > https://hh.ru (or Network tab > Request Headers > Cookie).\n2. Copy the hhtoken value or the full cookie string (hhtoken, _xsrf, hhuid), paste below, and click Connect.",
    "hh.consoleNote": "Note: hh.ru protects hhtoken with HttpOnly flag, which prevents document.cookie in Console. Extracting from Application tab, Network tab, or the 1-Click Sync Chrome Extension captures all session cookies.",
    "hh.cloudCompatible": "100% Cloud Compatible",
    "hh.copyScript": "Copy F12 Script",
    "hh.tokenPlaceholder": "Paste HeadHunter token here (Ctrl + V)...",
    "hh.oauthTitle": "Official HeadHunter OAuth 2.0",
    "hh.oauthDesc": "Authorize directly via official HeadHunter servers. Works on mobile, desktop, and cloud.",
    "hh.oauthBtn": "Official Login (OAuth)",
    "hh.localBadge": "Self-Hosted Only (Localhost / Docker)",
    "hh.localDesc": "Launches local Chrome browser for direct login. Requires physical desktop display (self-hosted only, unavailable on cloud Vercel).",
    "hh.localSteps": "1. Chrome Popup -> 2. Login SMS/Pass -> 3. Auto Link",
    "hh.localBtn": "Launch Local Browser",
    "hh.localWaiting": "Waiting for Login...",
    "hh.connectedResume": "Connected to Resume:",
    "hh.noResume": "No resume chosen",
    "hh.autoBump": "Auto-bump every 4 hours",

    // Metrics
    "metrics.totalApplies": "TOTAL AUTO-APPLIES",
    "metrics.capturedExpiry": "CAPTURED EXPIRY",
    "metrics.keepalive": "KEEPALIVE INTERVAL",

    // Settings General
    "settings.profileTitle": "Candidate Target & Role Profile",
    "settings.profileDesc": "Define target job titles and skills for automated vacancy matching.",
    "settings.searchCriteria": "Search & Matching Criteria",
    "settings.aiStrategy": "AI Provider Strategy & Cover Letter",
    "settings.autoSave": "Auto-Saved",

    // Analytics Dashboard
    "analytics.title": "Analytics & Pipeline Intelligence",
    "analytics.subtitle": "Algorithmic performance across {total} tracked vacancies from HeadHunter. Insights derived from autonomous skill indexing, match vector calculations, and recruiter response tracking.",
    "analytics.range30d": "Last 30 Days",
    "analytics.range14d": "Last 14 Days",
    "analytics.rangeAll": "All Time",
    "analytics.totalVacancies": "Total Vacancies",
    "analytics.active": "Active",
    "analytics.past14d": "Past 14 days telemetry",
    "analytics.past30d": "Past 30 days telemetry",
    "analytics.entirePortfolio": "Entire portfolio crawl",
    "analytics.aiEvaluated": "AI Evaluated",
    "analytics.pendingQueue": "pending in background queue",
    "analytics.dispatchedApps": "Dispatched Apps",
    "analytics.dispatchedRate": "rate",
    "analytics.dispatchedDesc": "Submitted via HH & manual direct",
    "analytics.qualifiedFit": "Qualified Fit Rate",
    "analytics.qualifiedDesc": "Vacancies graded APPLY or MAYBE",
    "analytics.funnelTitle": "Pipeline Conversion Funnel",
    "analytics.funnelYield": "end-to-end yield",
    "analytics.funnelDesc": "Stage-by-stage progression from raw HeadHunter crawler ingestion to recruiter dialogues.",
    "analytics.stage1Title": "1. Sourced Pool",
    "analytics.stage1Desc": "Raw positions tracked",
    "analytics.stage2Title": "2. AI Filtered",
    "analytics.stage2Desc": "Scored against user profile",
    "analytics.stage3Title": "3. Applications",
    "analytics.stage3Desc": "Transmitted to employer",
    "analytics.stage4Title": "4. Recruiter Response",
    "analytics.stage4Desc": "Invitations & interviews",
    "analytics.distTitle": "Compatibility Score Distribution",
    "analytics.distDesc": "Distribution across evaluated vacancies (Mean: {avg} / 100)",
    "analytics.totalEvaluated": "total evaluated",
    "analytics.highSynergy": "High Synergy (≥ 75%)",
    "analytics.moderateMatch": "Moderate Match (50% - 74%)",
    "analytics.borderline": "Borderline (25% - 49%)",
    "analytics.incompatible": "Incompatible / Skip (< 25%)",
    "analytics.immediateApply": "Immediate Apply",
    "analytics.tailorResume": "Tailor Resume",
    "analytics.autoCulled": "Auto-Culled",
    "analytics.skillGapsTitle": "Highest Frequency Skill Gaps",
    "analytics.skillGapsDesc": "Missing capabilities causing score penalties across active vacancies",
    "analytics.noGaps": "No recurring skill gaps detected in evaluated positions.",
    "analytics.foundInPositions": "Found in {count} positions",
    "analytics.fitImpact": "fit impact",
    "analytics.recommendation": "Algorithmic Recommendation: Incorporating Next.js 14 and Docker patterns into your active resume text will directly elevate estimated match confidence across 60%+ of open positions.",

    // Dashboard Overview
    "overview.title": "Overview",
    "overview.subtitle": "Autonomous job search and pipeline intelligence at a glance",
    "overview.runCollection": "Run Collection",
    "overview.totalVacancies": "Total Vacancies",
    "overview.parsedFromHh": "Parsed from HeadHunter",
    "overview.applied": "Applied",
    "overview.responses": "responses",
    "overview.conversionRate": "Conversion rate",
    "overview.skipped": "Skipped",
    "overview.autoCulled": "auto-culled",
    "overview.lowMatch": "Low match threshold",
    "overview.saved": "Saved",
    "overview.staged": "staged",
    "overview.actionableQueue": "Actionable manual queue",
    "overview.aiPending": "AI Pending",
    "overview.inQueue": "in queue",
    "overview.backgroundActive": "Background queue active",
    "overview.avgScore": "Average Match Score",
    "overview.basedOnAnalyzed": "Based on {count} analyzed vacancies",
    "overview.high": "HIGH (>75%)",
    "overview.maybe": "MAYBE (50-74%)",
    "overview.low": "LOW (<50%)",
    "overview.hunterEngine": "Hunter Engine",
    "overview.sessionStatus": "HH.ru Session Status",
    "overview.validActive": "Valid Active",
    "overview.sessionDisconnected": "Disconnected",
    "overview.cadence": "Autonomous Cadence",
    "overview.lastSynced": "LAST SYNCED",
    "overview.nextSyncIn": "NEXT SYNC IN",
    "overview.trackedQueries": "TRACKED QUERIES",
    "overview.configureQueries": "Configure Queries",
    "overview.inspectMatrix": "Inspect Matrix",
    "overview.aiSuggestion": "AI Optimization Suggestion",
    "overview.aiSuggestionText": "Aligning your required skills and search keywords in Settings with recent vacancy patterns increases match calibration score across automated screening pipelines.",
    "overview.topMatches": "Top Matches & Opportunities",
    "overview.topMatchesDesc": "Highest scoring vacancies with instant HR contact discovery",
    "overview.viewAll": "View all {count} vacancies",
    "overview.findHr": "Find HR",
    "overview.applyViaHh": "Apply via HH",
    "overview.inspectSplit": "Inspect in Split View",
    "overview.highSynergy": "HIGH SYNERGY",
    "overview.aiReasoning": "AI Reasoning",

    // Vacancies Split View
    "vacancies.title": "Vacancies",
    "vacancies.subtitle": "AI-evaluated job opportunities synchronized from HeadHunter matching your target profile",
    "vacancies.searchPlaceholder": "Filter positions, skills, or companies (e.g. Next.js, Novakid)...",
    "vacancies.filteredOf": "{shown} of {total} vacancies",
    "vacancies.tabAll": "All Active",
    "vacancies.tabHigh": "High Match",
    "vacancies.tabMaybe": "Maybe",
    "vacancies.tabAnalyzed": "Analyzed",
    "vacancies.tabApplied": "Applied",
    "vacancies.tabSaved": "Saved",
    "vacancies.tabSkip": "Hidden / Skipped",
    "vacancies.noMatch": "No vacancies match filter",
    "vacancies.noMatchDesc": "Try adjusting search query or tab filter above.",
    "vacancies.generatePitch": "Generate AI Pitch",
    "vacancies.applyHh": "Apply via HH.ru",
    "vacancies.findRecruiter": "Find Recruiter",
    "vacancies.tabDeepMatch": "AI Deep Match Analysis",
    "vacancies.tabDescription": "Full Job Description",
    "vacancies.tabPitch": "Outreach & Pitch",
    "vacancies.skillMatrixTitle": "SKILL MATRIX VERIFICATION",
    "vacancies.verifiedMatch": "Verified Match (Target Profile)",
    "vacancies.gapsTitle": "Gaps & Deviations (To Address)",
    "vacancies.noGaps": "No major gaps identified",
    "vacancies.reAnalyze": "Re-analyze",
    "vacancies.hhSource": "HH.ru Source",
    "vacancies.hhPost": "HH.ru Post",
    "vacancies.inspecting": "INSPECTING",
    "vacancies.salaryNotSpecified": "Salary not specified",

    // Recruiter Dossier Modal
    "dossier.hiringAuthority": "Hiring Authority",
    "dossier.synergyMatch": "High Synergy Profile Match",
    "dossier.synergyDesc": "Direct alignment with candidate tech stack, architectural background, and target role.",
    "dossier.optimalRecruiter": "Optimal Recruiter",
    "dossier.directAuthority": "Direct Hiring Authority",
    "dossier.verifiedChannels": "VERIFIED OUTREACH CHANNELS",
    "dossier.corporateEmail": "Corporate Email",
    "dossier.telegramDirect": "Telegram Direct",
    "dossier.linkedinProfile": "LinkedIn Profile",
    "dossier.corporatePhone": "Corporate Line / WhatsApp",
    "dossier.notPublic": "Not publicly listed",
    "dossier.techFootprint": "TECHNICAL FOOTPRINT & RESPONSE WINDOW",
    "dossier.activeWindow": "Active window 10:00 - 18:00 MSK",
    "dossier.pipelineHistory": "OUTREACH PIPELINE HISTORY",
    "dossier.hhAutoIndex": "HeadHunter Auto-Index",
    "dossier.indexedFrom": "Indexed from HeadHunter vacancy",
    "dossier.copyDossier": "Copy Full Dossier",
    "dossier.generatePitch": "Generate AI Pitch",

    // Company Intel
    "intel.title": "Company Intel & Recruiter Directory",
    "intel.osintBadge": "AUTOMATED OSINT",
    "intel.subtitle": "Discover verified hiring managers, tech leads, and HR contacts for target vacancies. Generate personalized, high-converting cold pitches via AI engine.",
    "intel.activeCrawler": "Active Multi-Engine Crawler",
    "intel.trackedCompanies": "Tracked Companies",
    "intel.entities": "entities",
    "intel.addedRecent": "+4 added from recent crawl",
    "intel.decisionMakers": "Decision Makers",
    "intel.identified": "identified",
    "intel.directVerifiedChannels": "direct verified channels",
    "intel.outreachPitches": "Outreach Pitches",
    "intel.delivered": "delivered",
    "intel.replyRate": "38.8% positive reply rate",
    "intel.avgResponse": "Avg Response Time",
    "intel.days": "days",
    "intel.fasterHh": "4.2x faster than HH standard",
    "intel.searchPlaceholder": "Target company name or domain (e.g. Novakid Inc, Grab, cian.ru)...",
    "intel.rolePlaceholder": "Target role (e.g. Head of Frontend)",
    "intel.deepCrawl": "Deep Crawl",
    "intel.crawling": "Crawling...",
    "intel.presets": "OSINT Presets:",
    "intel.presetLinkedin": "LinkedIn Decision Makers",
    "intel.presetGoogle": "Google X-Ray Recruiter",
    "intel.presetGlassdoor": "Glassdoor Sentiment",
    "intel.website": "Website",
    "intel.careers": "Careers Portal",
    "intel.linkedin": "LinkedIn",
    "intel.techFootprint": "Engineering Tech Stack Footprint",
    "intel.hiringDynamics": "Hiring Dynamics & Insights",
    "intel.hiringDesc": "Values asynchronous autonomy. English & Russian bilingual team setup. Engineering interview cadence: 1 screening + 1 deep technical architecture session.",
    "intel.stackAlignment": "Stack Alignment",
    "intel.fitsCandidate": "Fits Candidate Target",
    "intel.recentAnalyses": "Recent Company Analyses",
    "intel.saved": "saved",
    "intel.decisionContacts": "decision contacts",
    "intel.decisionMakersTitle": "Identified Decision Makers",
    "intel.filterAll": "All",
    "intel.filterTech": "Tech Leads",
    "intel.filterHr": "HR & Talent",
    "intel.synergyScore": "Synergy Score",
    "intel.linkedinProfile": "LinkedIn Profile",
    "intel.inspectDossier": "Inspect Dossier",
    "intel.synthesizePitch": "Synthesize Pitch:",
    "intel.pitchTelegram": "Telegram DM (RU)",
    "intel.pitchEmail": "Cold Email (EN)",
    "intel.pitchLinkedin": "LinkedIn Note",
    "intel.crawledSources": "Crawled Search Results & Web Sources",
  },
  ru: {
    // Nav
    "nav.overview": "Обзор",
    "nav.vacancies": "Вакансии",
    "nav.saved": "Сохраненные",
    "nav.applied": "Отклики",
    "nav.companyIntel": "Анализ компаний",
    "nav.analytics": "Аналитика",
    "nav.settings": "Настройки",

    // Common Actions
    "action.save": "Сохранить",
    "action.saving": "Сохранение...",
    "action.saved": "Сохранено",
    "action.cancel": "Отмена",
    "action.delete": "Удалить",
    "action.edit": "Изменить",
    "action.search": "Поиск",
    "action.filter": "Фильтр",
    "action.copy": "Копировать",
    "action.copied": "Скопировано",
    "action.connect": "Подключить аккаунт",
    "action.connecting": "Подключение...",
    "action.validating": "Проверка...",
    "action.refresh": "Обновить",

    // Language Section
    "lang.title": "Язык интерфейса и локализация",
    "lang.subtitle": "Выберите предпочитаемый язык интерфейса. Оптимизировано для рынков СНГ (HeadHunter) и Global.",
    "lang.select": "Выбор языка",
    "lang.en": "English (По умолчанию)",
    "lang.ru": "Русский (СНГ / HeadHunter)",

    // HH Sync Section
    "hh.sectionTitle": "Синхронизация сессии HH.ru",
    "hh.active": "Сессия HeadHunter: Активна и подключена",
    "hh.disconnected": "Сессия HeadHunter: Отключена / Истекла",
    "hh.ttl": "Срок: ~30 дней",
    "hh.checkSession": "Проверить сессию",
    "hh.modeConsole": "Консоль F12 (Cloud)",
    "hh.modeOAuth": "Официальный OAuth",
    "hh.modeLocal": "Локальный браузер",
    "hh.consoleSteps": "Шаги: 1. Откройте hh.ru -> 2. F12 -> 3. Скопируйте токен/Cookie -> 4. Вставьте токен",
    "hh.consoleInstructions": "1. В окне F12 (DevTools) на hh.ru перейдите в Application > Cookies > https://hh.ru (или вкладка Network > Request Headers > Cookie).\n2. Скопируйте значение hhtoken или полную строку Cookie (hhtoken, _xsrf, hhuid), вставьте ниже и нажмите Подключить.",
    "hh.consoleNote": "Примечание: hh.ru защищает hhtoken флагом HttpOnly, блокируя document.cookie в консоли. Получение через Application, Network или Chrome-расширение 1-Click Sync считывает все сессионные cookies.",
    "hh.cloudCompatible": "100% поддержка облака",
    "hh.copyScript": "Скопировать скрипт F12",
    "hh.tokenPlaceholder": "Вставьте токен HeadHunter сюда (Ctrl + V)...",
    "hh.oauthTitle": "Официальный HeadHunter OAuth 2.0",
    "hh.oauthDesc": "Прямая авторизация через серверы HeadHunter. Работает на смартфонах, ПК и в облаке.",
    "hh.oauthBtn": "Официальный вход (OAuth)",
    "hh.localBadge": "Только Self-Hosted (Localhost / Docker)",
    "hh.localDesc": "Запускает локальный браузер Chrome для прямого входа. Требуется рабочий стол (не работает на Vercel).",
    "hh.localSteps": "1. Окно Chrome -> 2. Вход по SMS/паролю -> 3. Авто-привязка",
    "hh.localBtn": "Запустить локальный браузер",
    "hh.localWaiting": "Ожидание входа...",
    "hh.connectedResume": "Подключенное резюме:",
    "hh.noResume": "Резюме не выбрано",
    "hh.autoBump": "Авто-поднятие каждые 4 часа",

    // Metrics
    "metrics.totalApplies": "ВСЕГО ОТКЛИКОВ",
    "metrics.capturedExpiry": "СРОК СЕССИИ",
    "metrics.keepalive": "ИНТЕРВАЛ KEEPALIVE",

    // Settings General
    "settings.profileTitle": "Целевые роли и профиль соискателя",
    "settings.profileDesc": "Настройте ключевые должности и навыки для подбора вакансий.",
    "settings.searchCriteria": "Критерии поиска и фильтрации",
    "settings.aiStrategy": "Стратегия ИИ и сопроводительные письма",
    "settings.autoSave": "Авто-сохранено",

    // Analytics Dashboard
    "analytics.title": "Аналитика и воронка откликов",
    "analytics.subtitle": "Алгоритмическая эффективность по {total} вакансиям с HeadHunter. Аналитика на основе индексации навыков, сопоставления векторов и ответов рекрутеров.",
    "analytics.range30d": "За 30 дней",
    "analytics.range14d": "За 14 дней",
    "analytics.rangeAll": "За всё время",
    "analytics.totalVacancies": "Всего вакансий",
    "analytics.active": "Активно",
    "analytics.past14d": "Данные за последние 14 дней",
    "analytics.past30d": "Данные за последние 30 дней",
    "analytics.entirePortfolio": "Все найденные вакансии",
    "analytics.aiEvaluated": "Оценено ИИ",
    "analytics.pendingQueue": "в очереди на анализ",
    "analytics.dispatchedApps": "Отправлено откликов",
    "analytics.dispatchedRate": "конверсия",
    "analytics.dispatchedDesc": "Через HH и прямые контакты",
    "analytics.qualifiedFit": "Подходящие вакансии",
    "analytics.qualifiedDesc": "Вакансии со статусом APPLY или MAYBE",
    "analytics.funnelTitle": "Воронка конверсии вакансий",
    "analytics.funnelYield": "общая конверсия",
    "analytics.funnelDesc": "Поэтапное движение: от сбора вакансий с HeadHunter до диалога с рекрутерами.",
    "analytics.stage1Title": "1. Сбор вакансий",
    "analytics.stage1Desc": "Всего найдено вакансий",
    "analytics.stage2Title": "2. Фильтрация ИИ",
    "analytics.stage2Desc": "Сопоставлено с профилем",
    "analytics.stage3Title": "3. Отклики",
    "analytics.stage3Desc": "Отправлено работодателю",
    "analytics.stage4Title": "4. Ответы рекрутеров",
    "analytics.stage4Desc": "Приглашения и интервью",
    "analytics.distTitle": "Распределение оценки совместимости",
    "analytics.distDesc": "Распределение по проверенным вакансиям (Среднее: {avg} / 100)",
    "analytics.totalEvaluated": "всего оценено",
    "analytics.highSynergy": "Высокая совместимость (≥ 75%)",
    "analytics.moderateMatch": "Умеренная совместимость (50% - 74%)",
    "analytics.borderline": "Пограничная (25% - 49%)",
    "analytics.incompatible": "Не подходит / Пропуск (< 25%)",
    "analytics.immediateApply": "Быстрый отклик",
    "analytics.tailorResume": "Адаптировать резюме",
    "analytics.autoCulled": "Отсеяно",
    "analytics.skillGapsTitle": "Часто недостающие навыки",
    "analytics.skillGapsDesc": "Навыки, снижающие балл совместимости по активным вакансиям",
    "analytics.noGaps": "В оцененных вакансиях не обнаружено повторяющихся пробелов в навыках.",
    "analytics.foundInPositions": "Встречается в {count} вакансиях",
    "analytics.fitImpact": "влияние на балл",
    "analytics.recommendation": "Алгоритмическая рекомендация: добавление Next.js и Docker в текст резюме повысит расчетную совместимость более чем на 60% открытых позиций.",

    // Dashboard Overview
    "overview.title": "Обзор",
    "overview.subtitle": "Автономный поиск работы и статус воронки откликов",
    "overview.runCollection": "Запустить сбор",
    "overview.totalVacancies": "Всего вакансий",
    "overview.parsedFromHh": "Собрано с HeadHunter",
    "overview.applied": "Отклики",
    "overview.responses": "откликов",
    "overview.conversionRate": "Конверсия",
    "overview.skipped": "Пропущено",
    "overview.autoCulled": "отсеяно",
    "overview.lowMatch": "Ниже порога соответствия",
    "overview.saved": "Сохранено",
    "overview.staged": "в закладках",
    "overview.actionableQueue": "Очередь ручной обработки",
    "overview.aiPending": "Ожидает ИИ",
    "overview.inQueue": "в очереди",
    "overview.backgroundActive": "Фоновый анализ активен",
    "overview.avgScore": "Средний балл соответствия",
    "overview.basedOnAnalyzed": "На основе {count} оцененных вакансий",
    "overview.high": "ВЫСОКИЙ (>75%)",
    "overview.maybe": "ВОЗМОЖНО (50-74%)",
    "overview.low": "НИЗКИЙ (<50%)",
    "overview.hunterEngine": "Движок сбора",
    "overview.sessionStatus": "Статус сессии HH.ru",
    "overview.validActive": "Активна",
    "overview.sessionDisconnected": "Отключена",
    "overview.cadence": "Автономное расписание",
    "overview.lastSynced": "ПОСЛЕДНИЙ СБОР",
    "overview.nextSyncIn": "СЛЕДУЮЩИЙ СБОР",
    "overview.trackedQueries": "ОТСЛЕЖИВАЕМЫЕ ЗАПРОСЫ",
    "overview.configureQueries": "Настроить запросы",
    "overview.inspectMatrix": "Матрица соответствия",
    "overview.aiSuggestion": "Рекомендация ИИ по оптимизации",
    "overview.aiSuggestionText": "Синхронизация ваших ключевых навыков в Настройках с актуальными требованиями рынка повышает расчетную совместимость в автоматических фильтрах.",
    "overview.topMatches": "Лучшие совпадения и вакансии",
    "overview.topMatchesDesc": "Вакансии с наивысшим баллом и поиском прямых контактов HR",
    "overview.viewAll": "Смотреть все {count} вакансий",
    "overview.findHr": "Найти HR",
    "overview.applyViaHh": "Откликнуться на HH",
    "overview.inspectSplit": "Открыть в сплит-режиме",
    "overview.highSynergy": "ВЫСОКАЯ СОВМЕСТИМОСТЬ",
    "overview.aiReasoning": "Вердикт ИИ",

    // Vacancies Split View
    "vacancies.title": "Вакансии",
    "vacancies.subtitle": "Оцененные ИИ вакансии, синхронизированные с HeadHunter под ваш целевой профиль",
    "vacancies.searchPlaceholder": "Поиск по должности, навыкам или компании (напр. Next.js, Ozon)...",
    "vacancies.filteredOf": "{shown} из {total} вакансий",
    "vacancies.tabAll": "Все активные",
    "vacancies.tabHigh": "Высокий балл",
    "vacancies.tabMaybe": "Возможно",
    "vacancies.tabAnalyzed": "Оцененные",
    "vacancies.tabApplied": "Отклики",
    "vacancies.tabSaved": "Сохраненные",
    "vacancies.tabSkip": "Скрытые / Пропущенные",
    "vacancies.noMatch": "Нет вакансий, соответствующих фильтру",
    "vacancies.noMatchDesc": "Попробуйте изменить поисковый запрос или выбрать другую вкладку.",
    "vacancies.generatePitch": "Сгенерировать AI-питч",
    "vacancies.applyHh": "Откликнуться на HH.ru",
    "vacancies.findRecruiter": "Найти рекрутера",
    "vacancies.tabDeepMatch": "Глубокий анализ ИИ",
    "vacancies.tabDescription": "Полное описание вакансии",
    "vacancies.tabPitch": "Письмо нанимателю",
    "vacancies.skillMatrixTitle": "ПРОВЕРКА МАТРИЦЫ НАВЫКОВ",
    "vacancies.verifiedMatch": "Подтвержденное соответствие",
    "vacancies.gapsTitle": "Недостающие навыки и отклонения",
    "vacancies.noGaps": "Критичных пробелов не обнаружено",
    "vacancies.reAnalyze": "Пересчитать",
    "vacancies.hhSource": "Источник HH.ru",
    "vacancies.hhPost": "Вакансия на HH.ru",
    "vacancies.inspecting": "ПРОСМОТР",
    "vacancies.salaryNotSpecified": "Зарплата не указана",

    // Recruiter Dossier Modal
    "dossier.hiringAuthority": "Лицо, принимающее решения",
    "dossier.synergyMatch": "Высокая синергия с профилем",
    "dossier.synergyDesc": "Прямое соответствие стеку кандидата, архитектурному опыту и целевой роли.",
    "dossier.optimalRecruiter": "Оптимальный контакт",
    "dossier.directAuthority": "Прямой наниматель",
    "dossier.verifiedChannels": "ПРОВЕРЕННЫЕ КАНАЛЫ СВЯЗИ",
    "dossier.corporateEmail": "Корпоративная почта",
    "dossier.telegramDirect": "Telegram напрямую",
    "dossier.linkedinProfile": "Профиль LinkedIn",
    "dossier.corporatePhone": "Телефон / WhatsApp",
    "dossier.notPublic": "Не указан публично",
    "dossier.techFootprint": "ТЕХНИЧЕСКИЙ ПРОФИЛЬ И ВРЕМЯ ОТВЕТА",
    "dossier.activeWindow": "Рабочие часы 10:00 - 18:00 МСК",
    "dossier.pipelineHistory": "ИСТОРИЯ ВЗАИМОДЕЙСТВИЯ",
    "dossier.hhAutoIndex": "Индексация HeadHunter",
    "dossier.indexedFrom": "Индексировано по вакансии HeadHunter",
    "dossier.copyDossier": "Копировать досье",
    "dossier.generatePitch": "Сгенерировать AI-питч",

    // Company Intel
    "intel.title": "Анализ компаний и база рекрутеров",
    "intel.osintBadge": "АВТОНОМНЫЙ OSINT",
    "intel.subtitle": "Поиск прямых контактов нанимающих менеджеров, тимлидов и HR-специалистов. Генерация персонализированных сопроводительных питчей через AI.",
    "intel.activeCrawler": "Активный мультимодельный краулер",
    "intel.trackedCompanies": "Компании в базе",
    "intel.entities": "компаний",
    "intel.addedRecent": "+4 добавлено в недавнем сборе",
    "intel.decisionMakers": "Лица, принимающие решения",
    "intel.identified": "найдено",
    "intel.directVerifiedChannels": "прямых каналов связи",
    "intel.outreachPitches": "Подготовлено питчей",
    "intel.delivered": "отправлено",
    "intel.replyRate": "38.8% конверсия в ответ",
    "intel.avgResponse": "Среднее время ответа",
    "intel.days": "дня",
    "intel.fasterHh": "В 4.2 раза быстрее обычного отклика",
    "intel.searchPlaceholder": "Название компании или домен (напр. Novakid Inc, Авито, cian.ru)...",
    "intel.rolePlaceholder": "Целевая роль (напр. Тимлид фронтенда)",
    "intel.deepCrawl": "Глубокий поиск",
    "intel.crawling": "Сбор данных...",
    "intel.presets": "Пресеты OSINT:",
    "intel.presetLinkedin": "LinkedIn руководители",
    "intel.presetGoogle": "Google X-Ray поиск HR",
    "intel.presetGlassdoor": "Отзывы на Glassdoor",
    "intel.website": "Веб-сайт",
    "intel.careers": "Карьерный портал",
    "intel.linkedin": "LinkedIn",
    "intel.techFootprint": "Технический стек компании",
    "intel.hiringDynamics": "Особенности найма и процессы",
    "intel.hiringDesc": "Ценится автономность и асинхронный формат. Двуязычная команда (RU / EN). Процесс найма: HR-скрининг + 1 архитектурная техническая секция.",
    "intel.stackAlignment": "Совпадение по стеку",
    "intel.fitsCandidate": "Подходит под профиль соискателя",
    "intel.recentAnalyses": "История анализа компаний",
    "intel.saved": "сохранено",
    "intel.decisionContacts": "контактов",
    "intel.decisionMakersTitle": "Найденные контакты нанимателей",
    "intel.filterAll": "Все",
    "intel.filterTech": "Тимлиды и техлиды",
    "intel.filterHr": "HR и рекрутеры",
    "intel.synergyScore": "Балл совместимости",
    "intel.linkedinProfile": "Профиль LinkedIn",
    "intel.inspectDossier": "Открыть досье",
    "intel.synthesizePitch": "Сгенерировать питч:",
    "intel.pitchTelegram": "Telegram сообщение",
    "intel.pitchEmail": "Email питч",
    "intel.pitchLinkedin": "LinkedIn InMail",
    "intel.crawledSources": "Результаты поиска и веб-источники",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  languages: SUPPORTED_LANGUAGES,
});

const STORAGE_KEY = "app_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // English is the default language
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === "en" || saved === "ru")) {
        setLanguageState(saved);
      }
    } catch {
      // ignore localStorage errors in private browsing
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const activeDict = TRANSLATIONS[language] || TRANSLATIONS.en;
      if (activeDict[key]) return activeDict[key];
      if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
      return fallback !== undefined ? fallback : key;
    };
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language: mounted ? language : "en",
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
