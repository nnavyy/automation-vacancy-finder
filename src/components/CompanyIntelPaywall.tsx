import Link from "next/link";
import { Building2, Check, LockKeyhole } from "lucide-react";

export default function CompanyIntelPaywall({ returnHref = "/dashboard" }: { returnHref?: string }): React.JSX.Element {
  return (
    <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1fr_auto]">
        <div className="space-y-5">
          <Building2 size={28} className="text-emerald-400" aria-hidden="true" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-zinc-100">Company Intel</h1>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              Research employers and find the people behind the roles you want.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            {["Company research and hiring insights", "Recruiter and decision-maker contacts", "Personalized outreach email drafts"].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 md:w-52 md:border-l md:border-zinc-800 md:pl-8">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-white">250 Stars</span>
            <span className="text-sm text-zinc-400">/ month</span>
          </div>
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <LockKeyhole size={15} aria-hidden="true" /> Paid access required
          </p>
          <a href="https://t.me/wonkiiy" className="inline-flex w-full justify-center rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">
            Contact @wonkiiy
          </a>
          <p className="text-xs leading-relaxed text-zinc-500">250 Stars/month. Payments help fund development and running costs. Contact @wonkiiy to arrange access or ask about a Telegram Wallet transfer by username. USD cost varies; activation is manual.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-950/40 px-6 py-5 sm:px-9">
        <p className="max-w-md text-sm leading-relaxed text-zinc-400">Job search, matching, cover letters, and Analytics stay free.</p>
        <Link href={returnHref} className="text-sm font-medium text-zinc-200 underline-offset-4 hover:underline">Back to free dashboard</Link>
      </div>
    </section>
  );
}
