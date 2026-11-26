"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Bookmark, Check, ChevronRight, FileText, Pause, Play, Search, SlidersHorizontal } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { useLandingMotion } from "./useLandingMotion";
import "./product-tour.css";

export const LANDING_ROLES = [
  { title: "Frontend Developer", company: "Pixel Studio", score: 94, stack: "React · TypeScript", salary: "180 000–240 000 ₽" },
  { title: "Full Stack Engineer", company: "Northstar Labs", score: 90, stack: "Node.js · React", salary: "200 000–260 000 ₽" },
  { title: "Product Engineer", company: "Signal Works", score: 86, stack: "TypeScript · PostgreSQL", salary: "185 000–230 000 ₽" },
];

const ACTIVITY = {
  week: { saved: 8, applied: 3, bars: [2, 3, 4, 2, 5, 3, 5] },
  month: { saved: 19, applied: 11, bars: [4, 7, 10, 5, 8, 13, 9, 12, 10, 8] },
};

function TourActivity({ ru }: { ru: boolean }) {
  const copy = (r: string, e: string) => ru ? r : e;
  const [period, setPeriod] = useState<keyof typeof ACTIVITY>("week");
  const data = ACTIVITY[period];
  const matches = data.bars.reduce((sum, value) => sum + value, 0);
  const motionAllowed = useLandingMotion();

  return <div className="tour-activity">
    <div className="tour-activity-header">
      <h3>{copy("Активность поиска", "Search activity")}</h3>
      <div className="tour-period" aria-label={copy("Период", "Time range")}>
        <button type="button" aria-pressed={period === "week"} onClick={() => setPeriod("week")}>{copy("7 дней", "7 days")}</button>
        <button type="button" aria-pressed={period === "month"} onClick={() => setPeriod("month")}>{copy("30 дней", "30 days")}</button>
      </div>
    </div>
    <dl className="tour-chart-totals" aria-live="polite">
      {[[copy("Совпадения", "Matches"), matches], [copy("Сохранено", "Saved"), data.saved], [copy("Отклики", "Applications"), data.applied]].map(([label, amount]) => (
        <div key={label}><dt>{label}</dt><dd><motion.span key={amount} initial={motionAllowed ? { y: 7, opacity: .4 } : false} animate={{ y: 0, opacity: 1 }}>{amount}</motion.span></dd></div>
      ))}
    </dl>
    <div key={period} className="tour-chart" role="img" aria-label={copy(`Совпадения по периодам: ${data.bars.join(", ")}`, `Matches by interval: ${data.bars.join(", ")}`)}>
      {data.bars.map((value, index) => <motion.span key={index} aria-hidden="true" initial={motionAllowed ? { scaleY: .18 } : false} animate={{ scaleY: 1 }} transition={{ type: "spring", stiffness: 125, damping: 18, delay: index * .025 }} style={{ height: `${value / Math.max(...data.bars) * 100}%` }} />)}
    </div>
    <div className="tour-chart-axis" aria-hidden="true">
      <span>{period === "week" ? copy("7 дней назад", "7 days ago") : copy("30 дней назад", "30 days ago")}</span>
      <span>{copy("Сегодня", "Today")}</span>
    </div>
  </div>;
}

export default function ProductExperience({ ru, onOpen, opener }: { ru: boolean; onOpen: () => void; opener: RefObject<HTMLButtonElement | null> }) {
  const copy = (r: string, e: string) => ru ? r : e;
  const motionAllowed = useLandingMotion();
  const frame = useRef<HTMLDivElement>(null);
  const inView = useInView(frame, { amount: .3 });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [role, setRole] = useState(0);
  const [savedRoles, setSavedRoles] = useState<number[]>([]);
  const selected = LANDING_ROLES[role];
  const saved = savedRoles.includes(role);
  const steps = [
    { label: copy("Вакансии", "Matches"), icon: Search, description: copy("Сравните подходящие роли и причины совпадения.", "Compare promising roles and see why each one fits.") },
    { label: copy("Профиль", "Profile"), icon: SlidersHorizontal, description: copy("Задайте условия поиска и навыки, которые хотите использовать.", "Set your preferences and the skills you want to use.") },
    { label: copy("Письмо", "Cover letter"), icon: FileText, description: copy("Подготовьте черновик письма под выбранную вакансию.", "Prepare a cover-letter draft for the role you select.") },
    { label: copy("Аналитика", "Analytics"), icon: BarChart3, description: copy("Посмотрите, как меняется поиск за 7 или 30 дней.", "Compare search activity across 7 and 30 days.") },
  ];
  const active = steps[step];
  const autoplay = playing && motionAllowed && inView;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % 4), 6500);
    return () => window.clearInterval(timer);
  }, [autoplay]);

  function selectStep(index: number) {
    setStep(index);
    setPlaying(false);
  }

  return (
    <div ref={frame} className="field-tour">
      <div className="tour-rail">
        <div className="tour-shoulder" aria-hidden="true"><svg viewBox="0 0 108 64" preserveAspectRatio="none"><path d="M0 0H15C50 0 44 64 108 64H0Z" /></svg></div>
        <div className="tour-picker" role="group" aria-label={copy("Функции в демо", "Demo features")}>
          {steps.map(({ label, icon: Icon }, index) => <button type="button" key={label} aria-pressed={step === index} onClick={() => selectStep(index)}><Icon size={17} aria-hidden="true" />{label}</button>)}
          <button type="button" className="tour-play" disabled={!motionAllowed} aria-label={playing && motionAllowed ? copy("Приостановить обзор", "Pause walkthrough") : copy("Продолжить обзор", "Play walkthrough")} onClick={() => setPlaying(!playing)}>{playing && motionAllowed ? <Pause size={16} /> : <Play size={16} />}</button>
        </div>
        <div className="tour-shoulder tour-shoulder-end" aria-hidden="true"><svg viewBox="0 0 108 64" preserveAspectRatio="none"><path d="M0 0H15C50 0 44 64 108 64H0Z" /></svg></div>
      </div>

      <div className="tour-stage" onFocus={() => setPlaying(false)}>
        <div className="tour-window">
          <div className="tour-window-header"><span>{BRAND_NAME}</span><span>{copy("Демонстрационные данные", "Sample data")}</span></div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} className="tour-panel" initial={motionAllowed ? { x: 12, opacity: .55 } : false} animate={{ x: 0, opacity: 1 }} exit={motionAllowed ? { x: -8, opacity: .55 } : undefined} transition={{ duration: .25 }}>
              {step === 0 && <div className="tour-matches">
                <div className="tour-roles">
                  {LANDING_ROLES.map((item, index) => <button key={item.title} type="button" onClick={() => setRole(index)} aria-pressed={role === index}>
                    <span><strong>{item.title}</strong><small>{item.company} · {copy("Удалённо", "Remote")}</small></span><ChevronRight size={16} aria-hidden="true" />
                  </button>)}
                </div>
                <div className="tour-match-glance">
                  <h3>{selected.title}</h3>
                  <div className="tour-score" aria-hidden="true"><small>{copy("Совпадение", "Match score")}</small><strong>{selected.score}%</strong></div>
                  <progress className="tour-match-meter" value={selected.score} max={100} aria-label={copy("Совпадение", "Match score")} />
                  <div className="tour-match-details"><span>{selected.stack}</span><span>{selected.salary}</span></div>
                  <button type="button" aria-pressed={saved} onClick={() => setSavedRoles(saved ? savedRoles.filter((index) => index !== role) : [...savedRoles, role])} className="tour-save"><Bookmark size={16} fill={saved ? "currentColor" : "none"} />{saved ? copy("Сохранено", "Saved") : copy("Сохранить", "Save role")}</button>
                </div>
              </div>}

              {step === 1 && <div className="tour-profile">
                <h3>{copy("Что вы ищете?", "What are you looking for?")}</h3>
                <p className="tour-sample-copy">{copy("Frontend-разработчик. React и TypeScript. Удалённая работа, от 180 000 ₽.", "Frontend developer. React and TypeScript. Remote, from 180,000 ₽.")}</p>
                <ul>{["React / TypeScript", copy("От 180 000 ₽", "From 180,000 ₽"), copy("Удалённая работа", "Remote work")].map((item) => <li key={item}><Check size={16} aria-hidden="true" />{item}</li>)}</ul>
                <button type="button" className="tour-inline" onClick={() => selectStep(0)}>{copy("Показать совпадения", "Show matches")}<ArrowRight size={16} /></button>
              </div>}

              {step === 2 && <div className="tour-profile">
                <h3>{copy("Черновик для отклика", "Application draft")}</h3>
                <p className="tour-sample-copy">{copy(`Здравствуйте! Меня заинтересовала ваша вакансия ${selected.title}. Мой опыт включает ${selected.stack}. Буду рад обсудить задачи команды.`, `Hello! I’m interested in the ${selected.title} role. My experience includes ${selected.stack}. I’d welcome a conversation about your team’s work.`)}</p>
                <p className="tour-draft-note"><ArrowDownRight size={17} />{copy("Проверьте факты и добавьте свой голос перед отправкой.", "Check the facts and make the draft your own before sending.")}</p>
              </div>}

              {step === 3 && <TourActivity ru={ru} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="tour-caption">
          <p>{active.description}</p>
          <button type="button" ref={opener} onClick={() => { setPlaying(false); onOpen(); }} aria-label={copy("Открыть интерактивный просмотр", "Open interactive preview")}>{copy("Попробовать", "Try it")}<ArrowUpRight size={17} /></button>
        </div>
      </div>
    </div>
  );
}
