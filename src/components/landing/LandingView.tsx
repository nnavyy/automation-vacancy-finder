"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Bookmark, Building2, Check, ChevronRight, FileText, Menu, Search, Send, X } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import ProductExperience, { LANDING_ROLES } from "./ProductExperience";
import "./fieldwork.css";

interface LandingViewProps {
  userEmail?: string | null;
  activity?: ReactNode;
}

export default function LandingView({ userEmail, activity }: LandingViewProps) {
  return (
    <LanguageProvider>
      <LandingContent userEmail={userEmail} activity={activity} />
    </LanguageProvider>
  );
}

function LandingContent({ userEmail, activity }: LandingViewProps) {
  const { language, setLanguage } = useLanguage();
  const ru = language === "ru";
  const copy = (r: string, e: string) => ru ? r : e;
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const role = LANDING_ROLES[selected];
  const alert = LANDING_ROLES[0];
  const navigation = [
    ["#preview", copy("Обзор продукта", "Product tour")],
    ["#how-it-works", copy("Как это работает", "How it works")],
    ["#pricing", copy("Тарифы", "Pricing")],
    ["#faq", copy("Вопросы", "FAQ")],
  ];
  const accountHref = userEmail ? "/dashboard" : "/login";
  const accountLabel = userEmail ? copy("Кабинет", "Dashboard") : copy("Войти", "Sign in");
  const startHref = userEmail ? "/dashboard" : "/register";
  const startLabel = userEmail ? accountLabel : copy("Начать бесплатно", "Start free");
  const steps = [
    { icon: FileText, title: copy("Расскажите о своём опыте", "Tell us about your experience"), description: copy("Добавьте резюме, навыки и желаемые роли. Укажите зарплату, город и формат работы.", "Add your resume, skills and target roles. Choose a salary range, location and workplace preference.") },
    { icon: Search, title: copy("Разберитесь в совпадениях", "Understand each match"), description: copy("Запустите поиск по HeadHunter. Сравните требования с профилем, сильные стороны и вопросы, которые стоит уточнить.", "Search HeadHunter. Compare the requirements with your profile, see where you fit and what to clarify.") },
    { icon: Bookmark, title: copy("Подготовьте отклик", "Prepare your application"), description: copy("Сохраните роль, подготовьте черновик письма и откликнитесь на HeadHunter. История и аналитика сохранят контекст.", "Save a role, draft a cover letter and apply on HeadHunter. History and Analytics keep the context together.") },
  ];
  const features = [
    { icon: Send, title: copy("Вакансии в Telegram", "Matches in Telegram"), description: copy("Подключите Telegram в настройках и получайте уведомления о подходящих ролях.", "Connect Telegram in Settings to get alerts when promising roles appear.") },
    { icon: BarChart3, title: copy("Прогресс поиска", "Search progress"), description: copy("Следите за сохранёнными ролями, откликами и распределением оценок в бесплатной аналитике.", "Track saved roles, applications and match scores in free Analytics.") },
    { icon: Building2, title: "Company Intel", description: copy("Изучайте карьерные страницы и публичные контакты по найму. Проверяйте источники перед отправкой.", "Research career pages and public hiring contacts. Review the sources before reaching out.") },
  ];
  const plans = [
    { title: copy("Бесплатно", "Free"), price: "$0", items: [copy("Поиск и оценка вакансий", "Job search and match explanations"), copy("Сохранённые вакансии и письма", "Saved roles and cover letters"), copy("Аналитика и история откликов", "Analytics and application tracking"), copy("Уведомления в Telegram", "Telegram vacancy alerts")], href: startHref, label: userEmail ? accountLabel : copy("Создать аккаунт", "Create free account") },
    { title: "Company Intel", price: "250 Stars", items: [copy("Всё из бесплатного тарифа", "Everything in Free"), copy("Исследование компаний и источники", "Company research and sources"), copy("Публичные контакты по найму", "Public hiring contacts"), copy("Черновики сообщений работодателям", "Outreach drafts")], href: "https://t.me/wonkiiy", label: copy("Оформить доступ в Telegram", "Arrange access on Telegram") },
  ];
  const questions = [
    [copy("Для кого этот сервис?", "Who is this for?"), copy("Для соискателей, которые ищут работу на HeadHunter, прежде всего в России и странах СНГ. Интерфейс доступен на русском и английском. Вакансии зависят от выбранных регионов и работодателей.", "For people searching on HeadHunter, primarily in Russia and the CIS. The interface is available in Russian and English. Available roles depend on your regions and employers.")],
    [copy("Вы откликаетесь вместо меня?", "Do you apply on my behalf?"), copy("Вы просматриваете вакансию и управляете откликом. Сервис помогает с поиском, оценкой и черновиками. Проверяйте содержание перед отправкой.", "You review the role and control the application. The service helps with search, assessment and drafts. Review the content before sending.")],
    [copy("Что означает оценка совпадения?", "What does a match score mean?"), copy("Это подсказка для сравнения вашего профиля с требованиями вакансии. Она может ошибаться и не гарантирует приглашение.", "It helps compare your profile with job requirements. It can be wrong and cannot guarantee an interview.")],
    [copy("Нужны ли API-ключи и установка?", "Do I need API keys or an installation?"), copy("Вы работаете в браузере. В профиле нужны только сведения для поиска работы.", "Use the app in your browser. Your profile contains your job-search preferences.")],
    [copy("Можно попробовать без регистрации?", "Can I try it without registering?"), copy("Да. Откройте интерактивный пример или полное демо. Они используют вымышленные данные.", "Yes. Open the interactive preview or the full demo. Both use sample data.")],
  ];

  return (
    <div className="field-landing">
      <a href="#content" className="field-skip">{copy("К содержанию", "Skip to content")}</a>
      <header className="field-header" onKeyDown={(event) => {
        if (event.key === "Escape" && menu) {
          setMenu(false);
          menuToggle.current?.focus();
        }
      }}>
        <div className="field-wrap field-header-row">
          <Link prefetch={false} href="/" className="field-brand"><BrandLogo size={34} />{BRAND_NAME}</Link>
          <nav aria-label={copy("Основная навигация", "Main navigation")} className="field-desktop-nav">
            {navigation.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="field-header-actions">
            <div className="field-language">
              <button type="button" aria-label="Русский" aria-pressed={ru} onClick={() => setLanguage("ru")}>RU</button>
              <button type="button" aria-label="English" aria-pressed={!ru} onClick={() => setLanguage("en")}>EN</button>
            </div>
            <Link prefetch={false} href={accountHref} className="field-header-signin">{accountLabel}<ArrowUpRight size={15} /></Link>
            <button ref={menuToggle} type="button" aria-label={menu ? copy("Закрыть меню", "Close navigation") : copy("Открыть меню", "Open navigation")} aria-expanded={menu} aria-controls={menu ? "field-mobile-navigation" : undefined} onClick={() => setMenu(!menu)} className="field-mobile-toggle">
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menu && <nav id="field-mobile-navigation" aria-label={copy("Мобильное меню", "Mobile navigation")} className="field-mobile-nav">
          {navigation.map(([href, label]) => <a key={href} href={href} onClick={() => setMenu(false)}>{label}<ArrowDown size={14} /></a>)}
          <Link prefetch={false} href={accountHref}>{accountLabel}<ArrowUpRight size={15} /></Link>
        </nav>}
      </header>

      <main id="content" tabIndex={-1}>
        <section className="field-hero field-wrap" aria-labelledby="landing-title">
          <div className="field-hero-copy">
            <h1 id="landing-title">{copy("Меньше поиска.", "Less searching.")} <em>{copy("Ближе к вашей работе.", "Closer to your next role.")}</em></h1>
            <p>{copy("Подбирайте вакансии HeadHunter под свой опыт, сравнивайте условия и решайте, куда откликнуться.", "Find HeadHunter roles that fit your experience, compare the details and decide where to apply.")}</p>
            <div className="field-actions">
              <Link prefetch={false} href={startHref} className="field-button">{startLabel}<ArrowUpRight size={18} /></Link>
              <Link prefetch={false} href="/demo" className="field-button field-button-quiet">{copy("Открыть демо", "Explore demo")}<ArrowRight size={18} /></Link>
            </div>
          </div>
          <section id="preview" className="field-hero-product" aria-label={copy("Обзор продукта", "Product tour")}>
            <ProductExperience ru={ru} opener={opener} onOpen={() => dialog.current?.showModal()} />
          </section>
        </section>

        <section id="how-it-works" className="field-section field-wrap" aria-labelledby="workflow-title">
          <div className="field-section-heading"><h2 id="workflow-title">{copy("Как устроен ваш поиск", "How your search comes together")}</h2></div>
          <div className="field-steps">
            {steps.map(({ icon: Icon, title, description }) => <article key={title}>
              <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3><p>{description}</p>
            </article>)}
          </div>
        </section>

        <section className="field-feature-section" aria-labelledby="field-features-title">
          <div className="field-wrap field-feature-grid">
            <div className="field-alert-visual">
              <figure className="field-alert-window">
                <figcaption className="field-alert-channel"><Send size={18} aria-hidden="true" /><strong>Telegram</strong><span>{copy("Пример уведомления", "Example notification")}</span></figcaption>
                <div className="field-alert-message">
                  <p>{copy("Найдена подходящая вакансия", "A match from your search")}</p>
                  <strong>{alert.title}</strong>
                  <p>{alert.company} · {copy("Удалённо", "Remote")}</p>
                  <div className="field-alert-details"><span>{alert.salary}</span><strong>{alert.score}% {copy("совпадение", "match")}</strong></div>
                </div>
              </figure>
            </div>
            <div className="field-feature-content">
              <h2 id="field-features-title">{copy("Держите поиск под рукой.", "Keep your search close.")}</h2>
              {features.map(({ icon: Icon, title, description }) => <article key={title}>
                <Icon size={21} strokeWidth={1.5} aria-hidden="true" /><div><h3>{title}</h3><p>{description}</p></div>
              </article>)}
            </div>
          </div>
        </section>

        {activity}

        <section id="pricing" aria-labelledby="pricing-title" className="field-section field-wrap field-pricing">
          <div className="field-section-heading"><h2 id="pricing-title">{copy("Начните бесплатно. Узнайте больше, когда нужно.", "Start free. Go deeper when you need to.")}</h2></div>
          <div className="field-plan-grid">
            {plans.map(({ title, price, items, href, label }, index) => <article key={title} className={index ? "field-plan-highlight" : undefined}>
              <h3>{title}</h3>
              <p className="field-price">{price}<span>{copy("/ месяц", "/ month")}</span></p>
              <ul>{items.map((text) => <li key={text}><Check size={16} aria-hidden="true" />{text}</li>)}</ul>
              <Link prefetch={false} href={href} className={index ? "field-button" : "field-button field-button-quiet"}>{label}<ArrowUpRight size={17} /></Link>
              {index === 1 && <p className="field-plan-note">{copy("Напишите @wonkiiy для оформления или уточнения перевода через Telegram Wallet. Доступ активируется вручную. Стоимость Stars в долларах может отличаться.", "Contact @wonkiiy for access or a Telegram Wallet transfer. Access is activated manually. The USD cost of Stars varies.")}</p>}
            </article>)}
          </div>
        </section>

        <section id="faq" className="field-section field-wrap field-faq" aria-labelledby="faq-title">
          <div className="field-section-heading"><h2 id="faq-title">{copy("Перед первым поиском", "Before your first search")}</h2></div>
          <div>{questions.map(([question, answer]) => <details key={question}>
            <summary>{question}<ChevronRight size={18} aria-hidden="true" /></summary><p>{answer}</p>
          </details>)}</div>
        </section>
      </main>

      <footer className="field-footer">
        <div className="field-wrap field-footer-row">
          <div><Link prefetch={false} href="/" className="field-brand"><BrandLogo size={30} />{BRAND_NAME}</Link><p>© {new Date().getFullYear()} {BRAND_NAME}</p></div>
          <nav aria-label={copy("Помощь и информация", "Help and information")}>
            <Link prefetch={false} href="/guide">{copy("Как пользоваться", "User guide")}</Link><Link prefetch={false} href="/about">{copy("О проекте", "About")}</Link>
            <Link prefetch={false} href="/compare">{copy("Сравнение", "Compare")}</Link>
            <Link prefetch={false} href="/blog">{copy("Блог", "Blog")}</Link>
            <Link prefetch={false} href="/architecture">{copy("Архитектура", "Architecture")}</Link>
            <a href="https://t.me/wonkiiy">{copy("Поддержка", "Support")}</a><Link prefetch={false} href="/legal/privacy">{copy("Конфиденциальность", "Privacy")}</Link>
            <Link prefetch={false} href="/legal/terms">{copy("Условия использования", "Terms")}</Link>
          </nav>
          <Link prefetch={false} href={startHref} className="field-button field-button-quiet">{startLabel}<ArrowUpRight size={16} /></Link>
        </div>
      </footer>

      <dialog ref={dialog} onClose={() => opener.current?.focus()} aria-labelledby="field-preview-dialog-title" className="field-preview-dialog">
        <div className="field-dialog-header">
          <div><h2 id="field-preview-dialog-title">{copy("Попробуйте свой следующий шаг", "Try your next step")}</h2><p>{copy("Пример данных · Ничего не отправляется", "Sample data · Nothing is sent")}</p></div>
          <button type="button" onClick={() => { dialog.current?.close(); opener.current?.focus(); }} aria-label={copy("Закрыть просмотр", "Close preview")}><X size={22} /></button>
        </div>
        <div className="field-dialog-grid">
          <div className="field-dialog-roles">
            {LANDING_ROLES.map((item, index) => <button type="button" key={item.title} aria-pressed={selected === index} onClick={() => { setSelected(index); setSaved(false); }}>
              <span>{item.title}<small>{item.company} · {copy("Удалённо", "Remote")}</small></span><strong>{item.score}%</strong>
            </button>)}
          </div>
          <div className="field-dialog-detail"><h3>{role.title}</h3><p>{copy("Ваш опыт совпадает с основным стеком. Уточните уровень ответственности и процесс найма перед откликом.", "Your experience matches the core stack. Clarify responsibilities and the hiring process before applying.")}</p>
            <button type="button" onClick={() => setSaved(!saved)} aria-pressed={saved} className="field-button"><Bookmark size={17} fill={saved ? "currentColor" : "none"} />{saved ? copy("Сохранено в примере", "Saved in preview") : copy("Сохранить вакансию", "Save role")}</button>
            <Link prefetch={false} href="/demo" className="field-text-link">{copy("Открыть полное демо", "Open full demo")}<ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </dialog>
    </div>
  );
}
