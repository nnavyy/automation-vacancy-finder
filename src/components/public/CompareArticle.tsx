"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { type Language, useLanguage } from "@/lib/i18n";

const PRODUCTS = [
  {
    id: "copilot",
    name: BRAND_NAME,
    sources: [{ href: "/guide", en: "Setup guide", ru: "Руководство" }],
  },
  {
    id: "hh",
    name: "HeadHunter (hh.ru)",
    sources: [{ href: "https://feedback.hh.ru/knowledge-base/article/00226", en: "HeadHunter applicant guide", ru: "Справка hh.ru для соискателей" }],
  },
  {
    id: "teal",
    name: "Teal",
    sources: [{ href: "https://help.tealhq.com/en/articles/14435727-how-to-track-your-job-applications", en: "Teal Job Tracker guide", ru: "Справка Teal Job Tracker" }],
  },
  {
    id: "huntr",
    name: "Huntr",
    sources: [{ href: "https://help.huntr.co/en/articles/9859408-the-huntr-chrome-extension", en: "Huntr extension guide", ru: "Справка о расширении Huntr" }],
  },
] as const;

type Product = typeof PRODUCTS[number];

interface CompareCopy {
  guide: string;
  current: string;
  title: string;
  intro: string;
  scope: string;
  reviewed: string;
  date: string;
  tableTitle: string;
  toolColumn: string;
  startingColumn: string;
  workflowColumn: string;
  products: Record<Product["id"], { starting: string; workflow: string }>;
  setupTitle: string;
  setupIntro: string;
  setupSteps: readonly string[];
  cost: string;
  guideCta: string;
  demoCta: string;
}

const COPY = {
  en: {
    guide: "User guide",
    current: "Compare",
    title: "Compare job-search tools",
    intro: "Start with the part of your search that needs help. These tools cover different steps, from discovering openings to organizing applications you already plan to send.",
    scope: "This comparison covers individual job seekers and draws on each product’s documentation.",
    reviewed: "Reviewed",
    date: "26 November 2026",
    tableTitle: "Where each tool fits",
    toolColumn: "Tool",
    startingColumn: "Useful when you want to",
    workflowColumn: "What the workflow looks like",
    products: {
      copilot: {
        starting: "Build a shortlist from HeadHunter around your own search profile.",
        workflow: "Set target roles and filters, run a search, and review why a vacancy matches. Save promising roles and review a cover-letter draft before deciding whether to apply on HeadHunter.",
      },
      hh: {
        starting: "Search and apply directly on HeadHunter.",
        workflow: "Browse with search and filters, review job recommendations, and use your HeadHunter resume to apply. Follow responses and invitations in your applicant account.",
      },
      teal: {
        starting: "Organize roles you find across job sites and track the resume version used for each one.",
        workflow: "Save postings manually or through the Chrome extension, track stages and follow-ups, and compare a resume with a saved job description.",
      },
      huntr: {
        starting: "Manage applications on a board and use autofill on supported forms.",
        workflow: "Clip postings from supported sites into the tracker, move jobs between stages, and use the browser extension to fill visible application forms where the site supports it.",
      },
    },
    setupTitle: "Start a search in HH Job Copilot",
    setupIntro: "Try one target role and a location or remote preference. The vacancies you see depend on your filters and the available HeadHunter listings. Use each match explanation to guide your review.",
    setupSteps: ["Save a search profile in Settings.", "Run a search from the dashboard.", "Review the vacancy before deciding whether to apply on HeadHunter."],
    cost: "The core job-search workflow is free. Optional paid Company Intel helps research publicly available company and recruiter information.",
    guideCta: "Read the setup guide",
    demoCta: "Explore the demo",
  },
  ru: {
    guide: "Руководство",
    current: "Сравнение",
    title: "Сравнение инструментов для поиска работы",
    intro: "Начните с той задачи, которую хотите упростить. Эти сервисы помогают на разных этапах — от поиска вакансий до ведения списка откликов.",
    scope: "Сравнение описывает возможности для соискателей по документации каждого сервиса.",
    reviewed: "Проверено",
    date: "26 ноября 2026 г.",
    tableTitle: "Для каких задач подходит каждый сервис",
    toolColumn: "Инструмент",
    startingColumn: "Что вы хотите сделать",
    workflowColumn: "Как устроен процесс",
    products: {
      copilot: {
        starting: "Собрать подборку вакансий HeadHunter по своему профилю поиска.",
        workflow: "Укажите должности и фильтры, запустите поиск и посмотрите, почему подходит вакансия. Сохраните интересные позиции и проверьте черновик письма, прежде чем решить, отправлять ли отклик на HeadHunter.",
      },
      hh: {
        starting: "Искать вакансии и откликаться прямо на HeadHunter.",
        workflow: "Используйте поиск и фильтры, просматривайте рекомендации и откликайтесь с резюме на HeadHunter. Следите за откликами и приглашениями в кабинете соискателя.",
      },
      teal: {
        starting: "Собрать вакансии с разных сайтов и помнить, какую версию резюме использовали для каждой из них.",
        workflow: "Сохраняйте вакансии вручную или через расширение Chrome, отмечайте этапы и даты для напоминаний, сравнивайте резюме с сохранённым описанием вакансии.",
      },
      huntr: {
        starting: "Вести отклики на доске и заполнять поддерживаемые формы автоматически.",
        workflow: "Сохраняйте вакансии с поддерживаемых сайтов, перемещайте их между этапами и заполняйте открытые формы отклика через расширение браузера, где это поддерживается.",
      },
    },
    setupTitle: "Как начать поиск в HH Job Copilot",
    setupIntro: "Начните с одной должности и укажите регион или удалённый формат. Список зависит от фильтров и доступных вакансий HeadHunter. Объяснение оценки поможет разобраться, что стоит проверить в каждой вакансии.",
    setupSteps: ["Сохраните профиль поиска в настройках.", "Запустите поиск из личного кабинета.", "Изучите вакансию, прежде чем решить, откликаться ли на HeadHunter."],
    cost: "Основные функции поиска бесплатны. Дополнительный платный раздел Company Intel помогает изучать общедоступную информацию о компаниях и рекрутерах.",
    guideCta: "Открыть руководство по настройке",
    demoCta: "Посмотреть демо",
  },
} satisfies Record<Language, CompareCopy>;

function SourceLinks({ product, language }: { product: Product; language: Language }): React.JSX.Element {
  return (
    <ul className="mt-3 space-y-1.5 text-sm font-medium text-field-accent">
      {product.sources.map((source) => (
        <li key={source.href}>
          <a href={source.href} className="rounded-sm underline underline-offset-4 hover:text-field-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-field-accent">
            {source[language]}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function CompareArticle(): React.JSX.Element {
  const { language } = useLanguage();
  const copy = COPY[language];

  return (
    <main lang={language} className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
      <article aria-labelledby="compare-title">
        <header className="grid gap-6 border-b border-field-line pb-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end lg:gap-12">
          <div>
            <p className="mb-5 flex flex-wrap items-center gap-2 text-sm font-medium text-field-muted">
              <Link href="/guide" className="rounded-sm text-field-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-field-accent">{copy.guide}</Link>
              <ChevronRight size={15} aria-hidden="true" />
              <span>{copy.current}</span>
            </p>
            <h1 id="compare-title" className="max-w-3xl text-balance font-display text-[clamp(2.35rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-.045em]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-2xl leading-relaxed text-field-muted sm:text-lg">{copy.intro}</p>
          </div>
          <div className="space-y-3 border-l border-field-line pl-4 text-sm leading-6 text-field-muted">
            <p>{copy.scope}</p>
            <p>{copy.reviewed} <time dateTime="2026-11-26">{copy.date}</time></p>
          </div>
        </header>

        <section aria-labelledby="comparison-heading" className="mt-9 sm:mt-12">
          <h2 id="comparison-heading" className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.tableTitle}</h2>
          <div className="hidden overflow-hidden rounded-2xl border border-field-line bg-field-panel md:block">
            <table aria-labelledby="comparison-heading" className="w-full table-fixed border-collapse text-left text-sm leading-relaxed">
              <thead className="bg-field-raised font-semibold">
                <tr>
                  <th scope="col" className="w-[23%] px-5 py-4">{copy.toolColumn}</th>
                  <th scope="col" className="w-[30%] px-5 py-4">{copy.startingColumn}</th>
                  <th scope="col" className="px-5 py-4">{copy.workflowColumn}</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((product) => (
                  <tr key={product.id} className="border-t border-field-line align-top">
                    <th scope="row" className="px-5 py-5 text-base font-semibold">{product.name}</th>
                    <td className="px-5 py-5 font-medium">{copy.products[product.id].starting}</td>
                    <td className="px-5 py-5 text-field-muted">
                      <p>{copy.products[product.id].workflow}</p>
                      <SourceLinks product={product} language={language} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-field-line overflow-hidden rounded-2xl border border-field-line bg-field-panel md:hidden">
            {PRODUCTS.map((product) => (
              <li key={product.id} className="p-4 sm:p-5">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed">{copy.products[product.id].starting}</p>
                <p className="mt-2 text-sm leading-relaxed text-field-muted">{copy.products[product.id].workflow}</p>
                <SourceLinks product={product} language={language} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="compare-setup-heading" className="mt-12 grid gap-6 rounded-2xl border border-field-line bg-field-panel p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)] lg:gap-10">
          <div>
            <h2 id="compare-setup-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.setupTitle}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-field-muted">{copy.setupIntro}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-field-muted">{copy.cost}</p>
          </div>
          <div>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed marker:font-semibold marker:text-field-accent">
              {copy.setupSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link href="/guide" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-field-accent px-4 py-2 text-sm font-semibold leading-tight text-white transition-colors hover:bg-[#2c3bb7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-field-accent">
                {copy.guideCta}<ArrowRight size={16} aria-hidden="true" className="shrink-0" />
              </Link>
              <Link href="/demo" className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-field-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-field-accent">{copy.demoCta}</Link>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}
