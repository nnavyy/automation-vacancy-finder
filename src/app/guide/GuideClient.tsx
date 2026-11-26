"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import "@/components/public/public.css";

const steps = [
  {
    id: "create-account",
    href: "/register",
    en: {
      title: "Create your account",
      description: "Start with the registration questions about your search. Then add your email and password and enter the code sent to your inbox. If you already have an account, sign in.",
      action: "Register",
    },
    ru: {
      title: "Создайте аккаунт",
      description: "Сначала ответьте на вопросы о поиске работы. Затем укажите почту и пароль и введите код из письма. Если у вас уже есть аккаунт, войдите в него.",
      action: "Зарегистрироваться",
    },
  },
  {
    id: "set-up-profile",
    href: "/dashboard/settings",
    en: {
      title: "Set up your search profile",
      description: "Open Settings → Profile. Check your target roles and key skills, then use Search filters and Search rules to refine locations, work format, salary, and keywords. If you have multiple profiles, select the one you want in the sidebar. Wait for the auto-save confirmation before leaving Settings.",
      example: "Try Frontend Developer, React and TypeScript, with remote work selected.",
      action: "Open profile settings",
    },
    ru: {
      title: "Настройте профиль поиска",
      description: "Откройте Настройки → Профиль. Проверьте целевые должности и основные навыки. В разделах «Фильтры поиска» и «Правила поиска» уточните регион, формат работы, зарплату и ключевые слова. Если профилей несколько, выберите нужный в боковом меню. Дождитесь подтверждения автосохранения.",
      example: "Например, Frontend-разработчик, React и TypeScript, удалённая работа.",
      action: "Открыть настройки профиля",
    },
  },
  {
    id: "first-run",
    href: "/dashboard",
    en: {
      title: "Run your first search",
      description: "Open Overview and choose Run Collection. The app searches HeadHunter using your active profile and shows the run status on the same screen. Wait for the run to finish, then open Vacancies.",
      action: "Open overview",
    },
    ru: {
      title: "Запустите первый поиск",
      description: "Откройте «Обзор» и нажмите «Запустить сбор» (Run Collection). Приложение ищет вакансии на HeadHunter по активному профилю. Статус поиска отображается на том же экране. Дождитесь завершения и откройте «Вакансии».",
      action: "Открыть обзор",
    },
  },
  {
    id: "review-vacancies",
    href: "/dashboard/vacancies",
    en: {
      title: "Review, save, and track roles",
      description: "In Vacancies, choose a role and compare the description, compensation when listed, and match analysis when available. Save roles to revisit in Saved. Review the cover-letter draft before applying. If you applied on HeadHunter, use Mark Applied to keep track in Applied. Analytics reflects the activity recorded in your workspace.",
      action: "Open vacancies",
    },
    ru: {
      title: "Изучите вакансии и отслеживайте отклики",
      description: "В разделе «Вакансии» выберите объявление и проверьте описание, зарплату и оценку соответствия, если они доступны. Интересные позиции добавьте в «Сохранённые». Проверьте черновик письма перед откликом. Если вы откликнулись на HeadHunter, отметьте это в приложении, и вакансия появится в «Откликах». В «Аналитике» отображаются данные вашего кабинета.",
      action: "Открыть вакансии",
    },
  },
  {
    id: "telegram",
    href: "/dashboard/settings#section-telegram",
    en: {
      title: "Connect Telegram for alerts",
      description: "This step is optional. In Settings → Telegram, use the bot link and follow the linking instructions. After the connection is confirmed, the app can send eligible vacancy alerts to Telegram when the bot is configured.",
      action: "Open Telegram settings",
    },
    ru: {
      title: "Подключите уведомления в Telegram",
      description: "Этот шаг необязателен. В разделе Настройки → Telegram откройте ссылку на бота и следуйте инструкции по привязке. После подтверждения подключения настроенный бот сможет присылать уведомления о подходящих вакансиях.",
      action: "Открыть настройки Telegram",
    },
  },
];

const guideCopy = {
  en: {
    title: "Set up your first search",
    intro: "Build your search profile, collect vacancies from HeadHunter, and track the roles you want to pursue.",
    create: "Create an account",
    settings: "Open settings",
    demo: "Explore the demo",
    onThisPage: "On this page",
    troubleshooting: "Troubleshooting",
    issues: [
      { title: "The email code hasn’t arrived", detail: "Check the email address and spam folder. Request a new code when the resend option becomes available." },
      { title: "A collection is already running", detail: "Check the status in Overview and wait for the current run to finish before starting another." },
      { title: "There are no matching vacancies", detail: "Try a broader role title, fewer required keywords, or a wider location. Save the changes and run the collection again." },
    ],
    support: "Contact support",
  },
  ru: {
    title: "Настройте первый поиск",
    intro: "Заполните профиль, соберите вакансии с HeadHunter и отслеживайте интересные позиции и отклики.",
    create: "Создать аккаунт",
    settings: "Открыть настройки",
    demo: "Посмотреть демо",
    onThisPage: "На этой странице",
    troubleshooting: "Решение проблем",
    issues: [
      { title: "Код не пришёл на почту", detail: "Проверьте адрес и папку «Спам». Когда кнопка повторной отправки станет доступна, запросите новый код." },
      { title: "Сбор уже идёт", detail: "Проверьте статус в «Обзоре» и дождитесь завершения текущего сбора, прежде чем запустить новый." },
      { title: "Подходящих вакансий нет", detail: "Попробуйте более общее название должности, сократите список обязательных слов или расширьте регион. Дождитесь сохранения и запустите сбор снова." },
    ],
    support: "Связаться с поддержкой",
  },
};

export default function GuideClient({ signedIn }: { signedIn: boolean }) {
  const { language } = useLanguage();
  const labels = guideCopy[language];

  return (
    <main lang={language} className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="max-w-3xl pb-9 sm:pb-12">
        <h1 className="fw-public-title">{labels.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--fw-muted)]">{labels.intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={signedIn ? "/dashboard/settings" : "/register"} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-field-accent px-4 text-sm font-semibold text-white hover:bg-[var(--fw-accent-hover)]">
            {signedIn ? labels.settings : labels.create}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link href="/demo" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-field-line bg-field-panel px-4 text-sm font-semibold hover:text-field-accent">
            {labels.demo}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="grid items-start gap-6 border-t border-field-line pt-8 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
        <nav aria-label={labels.onThisPage} className="rounded-xl border border-field-line bg-field-panel p-4 md:sticky md:top-28">
          <p className="mb-2 text-sm font-semibold">{labels.onThisPage}</p>
          <ul className="space-y-1 text-sm text-[var(--fw-muted)]">
            {steps.map((step) => (
              <li key={step.id}><a className="block rounded-md px-2 py-1.5 hover:bg-field-raised hover:text-field-accent" href={`#${step.id}`}>{step[language].title}</a></li>
            ))}
            <li><a className="block rounded-md px-2 py-1.5 hover:bg-field-raised hover:text-field-accent" href="#troubleshooting">{labels.troubleshooting}</a></li>
          </ul>
        </nav>

        <div>
          <ol className="overflow-hidden rounded-xl border border-field-line bg-field-panel">
            {steps.map(({ id, href, ...locales }, index) => {
              const step = locales[language];
              const showAction = signedIn ? id !== "create-account" : id === "create-account";
              return (
                <li id={id} key={id} className="grid scroll-mt-24 grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 border-b border-field-line p-4 last:border-0 sm:scroll-mt-28 sm:gap-4 sm:p-6">
                  <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-[var(--fw-accent-soft)] text-sm font-semibold text-field-accent">{index + 1}</span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">{step.title}</h2>
                    <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--fw-muted)]">{step.description}</p>
                    {step.example && <p className="mt-3 max-w-[68ch] rounded-lg bg-field-raised px-3 py-2 text-sm leading-6">{step.example}</p>}
                    {showAction && <Link href={href} className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-field-accent hover:underline">
                      {step.action}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>}
                  </div>
                </li>
              );
            })}
          </ol>

          <section id="troubleshooting" className="mt-10 scroll-mt-24 sm:scroll-mt-28">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{labels.troubleshooting}</h2>
            <div className="overflow-hidden rounded-xl border border-field-line bg-field-panel">
              {labels.issues.map(({ title, detail }) => (
                <details key={title} className="border-b border-field-line px-4 py-3 last:border-0 sm:px-5">
                  <summary className="cursor-pointer py-1 text-sm font-semibold hover:text-field-accent">{title}</summary>
                  <p className="pb-2 pt-2 text-sm leading-6 text-[var(--fw-muted)]">{detail}</p>
                </details>
              ))}
            </div>
            <a href="https://t.me/wonkiiy" className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-field-accent hover:underline">
              {labels.support}
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
