"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SidebarNav from "./SidebarNav";
import { BrandLogo } from "@/components/BrandLogo";
import { BRAND_NAME } from "@/lib/brand";

export default function MobileSidebarWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar: translucent so content scrolls underneath */}
      <div className="glass-chrome md:hidden flex items-center justify-between bg-zinc-950/70 backdrop-blur-xl border-b border-white/[0.06] px-4 h-14 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={24} className="shrink-0" />
          <span className="text-sm font-medium tracking-tight text-zinc-100">{BRAND_NAME}</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar menu" : "Open sidebar menu"}
          className="p-2 -mr-2 text-zinc-400 hover:text-zinc-100 active:scale-95 transition-all"
        >
          {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Scrim */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar container: slides in and out along the same edge */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-[#0b0b0d] border-r border-white/[0.06] flex flex-col shrink-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarNav onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
