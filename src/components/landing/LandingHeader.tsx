"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import PublicLanguageToggle from "@/components/public/PublicLanguageToggle";
import { BRAND_NAME } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n";

export default function LandingHeader({ userEmail, localized = false }: { userEmail?: string | null; localized?: boolean }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const { language } = useLanguage();
  const ru = localized && language === "ru";
  const copy = (en: string, russian: string) => ru ? russian : en;
  const accountHref = userEmail ? "/dashboard" : "/register";
  const accountLabel = userEmail ? copy("Dashboard", "Кабинет") : copy("Start free", "Начать бесплатно");
  const links = [
    { href: "/#how-it-works", label: copy("How it works", "Как это работает") },
    { href: "/guide", label: copy("Guide", "Руководство") },
    { href: "/compare", label: copy("Compare", "Сравнение") },
    { href: "/#pricing", label: copy("Pricing", "Тарифы") },
    { href: "/demo", label: copy("Explore demo", "Демо") },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-field-line bg-white/95 backdrop-blur-xl" onKeyDown={(event) => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } }}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:h-20 sm:gap-4 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight sm:gap-3"><span aria-hidden="true" className="shrink-0"><BrandLogo size={30} /></span><span>{BRAND_NAME}</span></Link>
        <nav aria-label={copy("Main navigation", "Основная навигация")} className="hidden items-center gap-5 text-sm text-public-400 xl:flex">{links.map((link) => <Link key={link.href} href={link.href} className="whitespace-nowrap transition-colors hover:text-public-100">{link.label}</Link>)}</nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          {localized && <PublicLanguageToggle />}
          {!userEmail && <Link href="/login" className="hidden whitespace-nowrap text-sm text-public-300 hover:text-public-100 md:block">{copy("Sign in", "Войти")}</Link>}
          <Link href={accountHref} className="hidden items-center gap-2 whitespace-nowrap rounded-lg bg-field-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2c3bb7] sm:flex">{accountLabel}<ArrowUpRight size={16} aria-hidden="true" /></Link>
          <button ref={toggle} type="button" aria-label={open ? copy("Close navigation", "Закрыть меню") : copy("Open navigation", "Открыть меню")} aria-expanded={open} aria-controls={open ? "mobile-navigation" : undefined} onClick={() => setOpen(!open)} className="grid size-11 shrink-0 place-items-center text-public-200 xl:hidden">{open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" aria-label={copy("Mobile navigation", "Мобильная навигация")} className="grid gap-1 border-t border-field-line px-5 py-4 xl:hidden">
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-public-300 hover:bg-field-raised">{link.label}</Link>)}
        <Link href={accountHref} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-field-accent">{accountLabel}</Link>
        {!userEmail && <Link href="/login" onClick={() => setOpen(false)} className="px-3 py-3 text-sm text-public-300">{copy("Sign in", "Войти")}</Link>}
      </nav>}
    </header>
  );
}
