"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";

import { BRAND_NAME } from "@/lib/brand";

export default function MobileSidebarWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100">{BRAND_NAME}</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close sidebar menu" : "Open sidebar menu"}
          className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col shrink-0 z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Pass close handler so nav links close sidebar on mobile tap */}
        <SidebarNav onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
}
