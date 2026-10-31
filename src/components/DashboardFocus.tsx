"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Search, SlidersHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Destination = "vacancies" | "saved" | "settings";
interface DashboardFocusProps {
  total: number;
  saved: number;
  language?: "en" | "ru";
  onNavigate?: (destination: Destination) => void;
}

export default function DashboardFocus({ total, saved, language = "en", onNavigate }: DashboardFocusProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const isRu = language === "ru";
  const destination: Destination = total === 0 ? "settings" : "vacancies";
  const action = total === 0 ? (isRu ? "Настроить профиль" : "Set up your profile") : (isRu ? "Посмотреть вакансии" : "Review your matches");
  const actionClass = "inline-flex items-center gap-2 rounded-lg bg-emerald-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-200 transition-colors";
  return (
    <motion.section initial={reducedMotion ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="grid overflow-hidden rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-300/[0.07] via-[#111717] to-[#101214] lg:grid-cols-[1.5fr_1fr]">
      <div className="p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2 text-sm text-emerald-300"><Search size={17} />{isRu ? "Ваш следующий шаг" : "Your next step"}</div>
        <h2 className="text-2xl font-medium tracking-tight text-zinc-100">{total === 0 ? (isRu ? "Начните с того, что важно вам." : "Start with what matters to you.") : (isRu ? "Найдите вакансию, достойную отклика." : "Find the role worth applying for.")}</h2>
        <p className="mb-6 mt-3 max-w-lg text-sm leading-6 text-zinc-400">{total === 0 ? (isRu ? "Укажите навыки, роли и зарплату, затем запустите поиск." : "Add your skills, target roles, and salary preferences, then run your first search.") : (isRu ? "Просмотрите совпадения, сохраните интересные роли и подготовьте сопроводительное письмо." : "Review the match, save your favorites, and draft a cover letter when you find a good fit.")}</p>
        {onNavigate ? <button type="button" className={actionClass} onClick={() => onNavigate(destination)}>{action}<ArrowUpRight size={16} /></button> : <Link href={`/dashboard/${destination}`} className={actionClass}>{action}<ArrowUpRight size={16} /></Link>}
      </div>
      <div className="flex flex-col justify-center gap-5 border-t border-white/[0.08] bg-black/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-4"><Bookmark size={21} className="text-sky-300" /><div><p className="text-sm font-medium text-zinc-200">{saved} {isRu ? "сохранено" : "in your shortlist"}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{isRu ? "Вернитесь к ним, когда будете готовы." : "Pick up where you left off."}</p></div></div>
        {onNavigate ? <button type="button" onClick={() => onNavigate("saved")} className="text-left text-xs text-sky-200 hover:underline">{isRu ? "Открыть сохранённые →" : "Open saved roles →"}</button> : <Link href="/dashboard/saved" className="text-xs text-sky-200 hover:underline">{isRu ? "Открыть сохранённые →" : "Open saved roles →"}</Link>}
        <div className="flex gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-400"><SlidersHorizontal size={17} className="mt-0.5 shrink-0" />{isRu ? "Поиск, сопроводительные письма и аналитика бесплатны." : "Search, cover letters, and Analytics are included for free."}</div>
      </div>
    </motion.section>
  );
}
