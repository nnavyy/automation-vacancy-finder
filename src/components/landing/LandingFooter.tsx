"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n";

export default function LandingFooter({ localized = false }: { localized?: boolean }): React.JSX.Element {
  const { language } = useLanguage();
  const ru = localized && language === "ru";
  const copy = (en: string, russian: string) => ru ? russian : en;

  return (
    <footer className="border-t border-field-line px-5 py-10 text-sm text-public-500 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
        <div><Link href="/" className="flex items-center gap-3 font-medium text-public-200"><span aria-hidden="true"><BrandLogo size={25} /></span>{BRAND_NAME}</Link></div>
        <nav aria-label={copy("Footer navigation", "Дополнительная навигация")} className="flex flex-wrap gap-x-7 gap-y-4">
          <Link href="/#pricing" className="hover:text-public-100">{copy("Pricing", "Тарифы")}</Link>
          <Link href="/guide" className="hover:text-public-100">{copy("User guide", "Руководство")}</Link>
          <Link href="/compare" className="hover:text-public-100">{copy("Compare", "Сравнение")}</Link>
          <Link href="/about" className="hover:text-public-100">{copy("About", "О проекте")}</Link>
          <a href="https://t.me/wonkiiy" className="hover:text-public-100">{copy("Contact", "Поддержка")}</a>
          <Link href="/legal/privacy" className="hover:text-public-100">{copy("Privacy", "Конфиденциальность")}</Link>
          <Link href="/legal/terms" className="hover:text-public-100">{copy("Terms", "Условия")}</Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl border-t border-field-line pt-6 text-xs">© {new Date().getFullYear()} {BRAND_NAME}. {copy("Independent of HeadHunter and Telegram.", "Проект не связан с HeadHunter или Telegram.")}</p>
    </footer>
  );
}
