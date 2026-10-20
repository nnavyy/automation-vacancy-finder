import React from "react";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-emerald-400 animate-spin" />
    </div>
  );
}
