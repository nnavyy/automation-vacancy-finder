"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight, ChevronLeft, ChevronRight, Cpu, Database, Github, Globe, Instagram, Mail, ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BRAND_NAME } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n";
import "@/components/public/public.css";

const GALLERY_ITEMS = [
  {
    id: "dashboard",
    file: "01_dashboard_overview",
    en: { title: "Workspace overview", description: "The dashboard shows collection activity, new vacancies, and results from past searches." },
    ru: { title: "Обзор кабинета", description: "На панели видны история сборов, новые вакансии и результаты прошлых поисков." },
  },
  {
    id: "split-view",
    file: "02_vacancies_split_view",
    en: { title: "Vacancy review", description: "Select a vacancy to read the listing, compare its requirements with your skills, and save it for later." },
    ru: { title: "Просмотр вакансии", description: "Выберите вакансию, чтобы прочитать объявление, сверить требования со своими навыками и сохранить её." },
  },
  {
    id: "recruiter",
    file: "06_find_recruiter_dossier",
    en: { title: "Recruiter research", description: "Review company details and public contact information when it is available." },
    ru: { title: "Поиск рекрутера", description: "Изучите сведения о компании и общедоступные контакты, если они найдены." },
  },
  {
    id: "analytics",
    file: "05_analytics_funnel",
    en: { title: "Search analytics", description: "Review vacancy and application activity recorded in the workspace." },
    ru: { title: "Аналитика поиска", description: "Просмотрите данные о вакансиях и откликах, которые были записаны в кабинете." },
  },
];

const ENGINEERING = [
  {
    icon: ShieldCheck,
    en: { title: "Credential storage", description: "The app uses AES-256-GCM to encrypt supported stored integration credentials." },
    ru: { title: "Хранение учётных данных", description: "Для шифрования поддерживаемых учётных данных интеграций используется AES-256-GCM." },
  },
  {
    icon: Database,
    en: { title: "Collection controls", description: "The collector checks for duplicates and limits concurrent requests while processing listings." },
    ru: { title: "Управление сбором", description: "При обработке вакансий сборщик проверяет дубликаты и ограничивает число одновременных запросов." },
  },
  {
    icon: Cpu,
    en: { title: "Task-specific AI", description: "Vacancy scoring and cover-letter drafting can use separate model tiers when an AI provider is available." },
    ru: { title: "Модели для разных задач", description: "При доступном ИИ-провайдере оценка вакансий и подготовка писем могут использовать модели разных уровней." },
  },
];

const TECH_STACK = [
  { name: "Next.js 16", src: "/assets/nextjs.svg" },
  { name: "React 19", src: "/assets/react.svg" },
  { name: "TypeScript", src: "/assets/typescript.svg" },
  { name: "PostgreSQL", src: "/assets/postgresql.svg" },
  { name: "Tailwind CSS", src: "/assets/tailwind.svg" },
  { name: "Docker", src: "/assets/docker.svg" },
];

const aboutCopy = {
  en: {
    title: `About ${BRAND_NAME}`,
    intro: "I built this workspace to make it easier to find suitable roles on HeadHunter and keep track of the applications I send.",
    role: "Full-stack engineer and automation specialist",
    bio: "I build web applications, data collection tools, and developer automation with TypeScript and PostgreSQL.",
    portfolio: "Portfolio",
    email: "Email",
    stack: "Technology",
    purpose: "Built around a HeadHunter search",
    mission: "The app pulls vacancies from HeadHunter. It uses your profile to evaluate matches, keeps a shortlist of roles you save, and prepares cover-letter drafts for your review. You can connect Telegram for vacancy alerts.",
    compare: "Compare job search tools",
    engineering: "How the app works",
    privacy: "Read the privacy notice",
    archive: "Product archive",
    archiveDescription: "Screenshots from earlier versions.",
    previous: "Previous screenshot",
    next: "Next screenshot",
  },
  ru: {
    title: `О проекте ${BRAND_NAME}`,
    intro: "Я создал этот сервис, чтобы проще находить подходящие вакансии на HeadHunter и отслеживать отправленные отклики.",
    role: "Фулстек-разработчик и специалист по автоматизации",
    bio: "Я разрабатываю веб-приложения, инструменты сбора данных и автоматизации на TypeScript и PostgreSQL.",
    portfolio: "Портфолио",
    email: "Почта",
    stack: "Технологии",
    purpose: "Поиск работы на HeadHunter",
    mission: "Приложение собирает вакансии с HeadHunter, оценивает их по вашему профилю, сохраняет интересные позиции и готовит черновики сопроводительных писем для проверки. Для уведомлений о вакансиях можно подключить Telegram.",
    compare: "Сравнить сервисы поиска работы",
    engineering: "Как работает приложение",
    privacy: "Читать политику конфиденциальности",
    archive: "Архив интерфейсов",
    archiveDescription: "Скриншоты предыдущих версий.",
    previous: "Предыдущий скриншот",
    next: "Следующий скриншот",
  },
};

const linkClass = "inline-flex min-h-10 items-center gap-2 rounded-lg border border-field-line bg-field-panel px-3 text-sm font-medium hover:text-field-accent";
const arrowClass = "grid size-11 shrink-0 place-items-center rounded-lg border border-field-line bg-field-panel text-field-muted hover:border-field-accent hover:text-field-accent";

export default function AboutClient(): React.JSX.Element {
  const { language } = useLanguage();
  const labels = aboutCopy[language];
  const [index, setIndex] = useState(0);
  const slide = GALLERY_ITEMS[index];
  const slideCopy = slide[language];
  const screenshot = `/screenshots/${slide.file}${language === "ru" ? "_ru" : ""}.png`;
  const reduceMotion = useReducedMotion();

  const changeSlide = (offset: number) => {
    setIndex((current) => (current + offset + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
  };

  return (
    <main lang={language} className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl border-b border-field-line pb-9 sm:pb-12">
        <h1 className="fw-public-title">{labels.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-field-muted">{labels.intro}</p>
      </header>

      <div className="mt-8 grid items-start gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-field-line bg-field-panel p-5 sm:p-6">
          <h2 className="text-xl font-semibold tracking-tight">Nanda (Zhafran)</h2>
          <p className="mt-1 text-sm font-medium">{labels.role}</p>
          <p className="mt-3 max-w-lg text-sm leading-6 text-field-muted">{labels.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="https://nandaz-portofolio.vercel.app" target="_blank" rel="noreferrer" className={linkClass}>
              <Globe size={15} aria-hidden="true" />{labels.portfolio}
            </a>
            <a href="https://github.com/nnavyy" target="_blank" rel="noreferrer" className={linkClass}>
              <Github size={15} aria-hidden="true" />GitHub @nnavyy
            </a>
            <a href="mailto:nandazhafran@gmail.com" className={linkClass}>
              <Mail size={15} aria-hidden="true" />{labels.email}
            </a>
            <a href="https://www.instagram.com/rrqac_zsyons/" target="_blank" rel="noreferrer" className={linkClass}>
              <Instagram size={15} aria-hidden="true" />@rrqac_zsyons
            </a>
          </div>
        </section>

        <section className="rounded-xl border border-field-line bg-field-panel p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">{labels.stack}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 text-sm text-field-muted">
            {TECH_STACK.map(({ name, src }) => (
              <li key={name} className="flex min-w-0 items-center gap-2">
                <Image src={src} alt="" width={18} height={18} className="shrink-0 object-contain" />{name}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="my-10 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight">{labels.purpose}</h2>
        <p className="mt-3 max-w-[68ch] text-sm leading-6 text-field-muted">{labels.mission}</p>
        <Link href="/compare" className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-field-accent hover:underline">
          {labels.compare}<ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className="border-t border-field-line pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">{labels.engineering}</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {ENGINEERING.map(({ icon: Icon, ...locales }) => (
            <li key={locales.en.title} className="rounded-xl border border-field-line bg-field-panel p-4 sm:p-5">
              <Icon size={19} className="mb-3 text-field-accent" aria-hidden="true" />
              <h3 className="text-sm font-semibold">{locales[language].title}</h3>
              <p className="mt-2 text-sm leading-6 text-field-muted">{locales[language].description}</p>
            </li>
          ))}
        </ul>
        <Link href="/legal/privacy" className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-field-accent hover:underline">
          {labels.privacy}<ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className="mt-10 overflow-hidden rounded-xl border border-field-line bg-field-panel" aria-labelledby="archive-title">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <h2 id="archive-title" className="text-2xl font-semibold tracking-tight">{labels.archive}</h2>
            <p className="mt-1 text-sm text-field-muted">{labels.archiveDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeSlide(-1)} aria-label={labels.previous} className={arrowClass}><ChevronLeft size={18} aria-hidden="true" /></button>
            <span className="px-2 text-xs tabular-nums text-field-muted">{index + 1} / {GALLERY_ITEMS.length}</span>
            <button type="button" onClick={() => changeSlide(1)} aria-label={labels.next} className={arrowClass}><ChevronRight size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <figure className="min-w-0">
          <div className="overflow-hidden border-y border-field-line bg-field-raised">
            <AnimatePresence initial={false} mode="wait">
              <motion.div key={slide.id} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduceMotion ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.17 }} className="relative aspect-video">
                <Image src={screenshot} alt={slideCopy.title} fill sizes="(max-width: 1152px) 100vw, 1086px" className="object-contain" />
              </motion.div>
            </AnimatePresence>
          </div>
          <figcaption className="px-4 py-5 sm:px-6" aria-live="polite">
            <h3 className="text-sm font-semibold">{slideCopy.title}</h3>
            <p className="mt-1 text-sm leading-6 text-field-muted">{slideCopy.description}</p>
          </figcaption>
        </figure>
      </section>
    </main>
  );
}
