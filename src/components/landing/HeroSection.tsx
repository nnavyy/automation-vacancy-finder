"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bookmark, Check, MapPin, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const examples = [
  { title: "Senior Frontend Engineer", company: "Example cloud company", salary: "250,000 – 350,000 ₽", score: 94, stack: "React · TypeScript · Next.js", reason: "Your React experience and salary preference align with this role." },
  { title: "Full Stack Developer", company: "Example product studio", salary: "200,000 – 280,000 ₽", score: 89, stack: "Node.js · React · PostgreSQL", reason: "A strong stack match with the remote flexibility you are looking for." },
];
export default function HeroSection(): React.JSX.Element {
  const [selected, setSelected] = useState(0);
  const [saved, setSaved] = useState(false);
  const reduceMotion = useReducedMotion();
  const job = examples[selected];
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-10 h-[600px] w-[700px] rounded-full bg-emerald-400/[0.04] blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-28">
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.5 }}>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.07] tracking-[-0.055em] sm:text-6xl xl:text-7xl">Less searching.<br /><span className="text-emerald-300">More right-fit<br className="hidden xl:block" /> opportunities.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">Bring your skills. We&apos;ll help you sort through HeadHunter roles, understand your matches, and keep your next move in view.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-3 rounded-lg bg-emerald-300 px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-200">Find my next role <ArrowUpRight size={18} /></Link>
            <Link href="/demo" className="inline-flex items-center gap-3 rounded-lg border border-white/15 px-5 py-3.5 text-sm font-medium text-zinc-200 hover:bg-white/5">Explore the dashboard <ArrowRight size={16} /></Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-zinc-500"><Check size={14} className="text-emerald-400" /> Free job search, cover letters, and Analytics.</p>
          <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-sm text-zinc-400">
            <span className="flex items-center gap-2"><img src="/assets/hh-logo.png" width="24" height="24" alt="" /> HeadHunter vacancies</span>
            <span className="flex items-center gap-2"><img src="/assets/telegram.svg" width="21" height="21" alt="" /> Telegram alerts</span>
          </div>
        </motion.div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", bounce: 0, duration: 0.6, delay: 0.1 }} className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111416] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5"><span className="text-sm font-medium">Your shortlist</span><span className="text-xs text-zinc-500">Interactive sample</span></div>
            <div className="grid grid-cols-2 border-b border-white/10">
              {examples.map((example, index) => <button key={example.title} type="button" aria-pressed={selected === index} onClick={() => { setSelected(index); setSaved(false); }} className={`border-b-2 px-4 py-4 text-left text-xs transition-colors ${selected === index ? "border-emerald-300 bg-emerald-300/5 text-emerald-200" : "border-transparent text-zinc-500 hover:text-zinc-200"}`}>{example.title}</button>)}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={selected} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs text-zinc-500">{job.company}</p><h2 className="mt-2 text-2xl font-medium tracking-tight">{job.title}</h2><p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400"><MapPin size={13} /> Remote · Full time</p></div>
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90" aria-hidden="true"><circle cx="40" cy="40" r="34" fill="none" stroke="#27312e" strokeWidth="4" /><motion.circle cx="40" cy="40" r="34" fill="none" stroke="#6ee7b7" strokeWidth="4" strokeLinecap="round" strokeDasharray="214" initial={false} animate={{ strokeDashoffset: 214 * (1 - job.score / 100) }} /></svg>
                    <span className="text-xl font-semibold text-emerald-200">{job.score}<span className="text-xs">%</span></span>
                  </div>
                </div>
                <p className="mt-6 text-lg font-medium text-zinc-100">{job.salary}<span className="ml-2 text-xs font-normal text-zinc-500">/ month</span></p><p className="mt-2 text-xs text-zinc-500">{job.stack}</p>
                <div className="mt-6 border-l-2 border-emerald-300/60 bg-emerald-300/[0.04] p-4"><p className="text-xs font-medium text-emerald-200">Why it fits</p><p className="mt-2 text-sm leading-6 text-zinc-400">{job.reason}</p></div>
                <button type="button" aria-pressed={saved} onClick={() => setSaved(!saved)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-3 text-sm text-zinc-200 hover:bg-white/5">{saved ? <Check size={16} /> : <Bookmark size={16} />}{saved ? "Saved to sample shortlist" : "Save this sample role"}</button>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="relative ml-6 mt-4 flex items-start gap-3 rounded-xl border border-sky-300/15 bg-[#101b22] p-4 sm:ml-12"><Send size={18} className="mt-1 shrink-0 text-sky-300" /><div><p className="text-xs font-medium text-sky-100">A good match, right in Telegram</p><p className="mt-1 text-xs leading-5 text-zinc-400">Connect your account to receive new role alerts. Review and apply when you&apos;re ready.</p></div></div>
        </motion.div>
      </div>
    </section>
  );
}
