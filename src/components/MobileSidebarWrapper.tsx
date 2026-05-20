"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function MobileSidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 border-b border-gray-800 p-4 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <span className="text-sm font-semibold text-white">wingkiiy Job AI</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* On mobile, we might want to close the sidebar when a link is clicked, but the children is a server component here. We can just rely on the user clicking outside or we can pass down a close function if we make SidebarNav accept it. For now, the user can tap the overlay to close. */}
        {children}
      </aside>
    </>
  );
}
