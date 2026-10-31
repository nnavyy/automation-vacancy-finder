"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function LandingHeader({ userEmail }: { userEmail?: string | null }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const links = [{ href: "/#how-it-works", label: "How it works" }, { href: "/#pricing", label: "Pricing" }, { href: "/demo", label: "Explore demo" }];
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl" onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-tight"><BrandLogo size={30} /><span>HH Job Copilot</span></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">{links.map((link) => <Link key={link.href} href={link.href} className="transition-colors hover:text-white">{link.label}</Link>)}</nav>
        <div className="flex items-center gap-5">
          {!userEmail && <Link href="/login" className="hidden text-sm text-zinc-300 hover:text-white sm:block">Sign in</Link>}
          <Link href={userEmail ? "/dashboard" : "/register"} className="hidden items-center gap-2 rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-200 sm:flex">{userEmail ? "Dashboard" : "Start free"}<ArrowUpRight size={16} /></Link>
          <button ref={toggle} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} className="p-2 text-zinc-200 md:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </div>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid gap-1 border-t border-white/10 px-5 py-4 md:hidden">
        {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-zinc-300 hover:bg-white/5">{link.label}</Link>)}
        <Link href={userEmail ? "/dashboard" : "/register"} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-emerald-300">{userEmail ? "Dashboard" : "Create free account"}</Link>
        {!userEmail && <Link href="/login" className="px-3 py-3 text-sm text-zinc-300">Sign in</Link>}
      </nav>}
    </header>
  );
}
