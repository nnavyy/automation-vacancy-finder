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
    "hh.disconnected": "HeadHunter Session: Disconnected / Expired (403)",
    "hh.ttl": "TTL: ~30 days",
    "hh.checkSession": "Check Session",
    "hh.modeConsole": "Console F12 (Cloud)",
    "hh.modeOAuth": "Official OAuth",
    "hh.modeLocal": "Localhost Browser",
    "hh.consoleSteps": "Steps: 1. Open hh.ru -> 2. F12 Console -> 3. Run Script -> 4. Paste Token",
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
    "hh.disconnected": "Сессия HeadHunter: Отключена / Истекла (403)",
    "hh.ttl": "Срок: ~30 дней",
    "hh.checkSession": "Проверить сессию",
    "hh.modeConsole": "Консоль F12 (Cloud)",
    "hh.modeOAuth": "Официальный OAuth",
    "hh.modeLocal": "Локальный браузер",
    "hh.consoleSteps": "Шаги: 1. Откройте hh.ru -> 2. F12 Консоль -> 3. Запустите скрипт -> 4. Вставьте токен",
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
