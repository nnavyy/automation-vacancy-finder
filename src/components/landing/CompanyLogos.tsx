import React from "react";

interface CompanyLogoProps {
  name: "yandex" | "sber" | "tinkoff" | "vk" | "avito" | "ozon" | "hh";
  className?: string;
  size?: number;
}

export function CompanyBubbleLogo({ name, className = "", size = 28 }: CompanyLogoProps) {
  switch (name) {
    case "yandex":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-[#fc3f1d] text-white font-bold text-xs select-none shadow-sm ${className}`}
          title="Yandex"
        >
          <span className="font-sans leading-none">Я</span>
        </div>
      );
    case "sber":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#21a038] to-[#137a24] text-white font-bold text-xs select-none shadow-sm ${className}`}
          title="Sber"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
          </svg>
        </div>
      );
    case "tinkoff":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-[#ffdd2d] text-black font-extrabold text-xs select-none shadow-sm ${className}`}
          title="T-Bank (Tinkoff)"
        >
          <span className="font-sans leading-none text-black">T</span>
        </div>
      );
    case "vk":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-[#0077ff] text-white font-bold text-xs select-none shadow-sm ${className}`}
          title="VK"
        >
          <span className="font-sans leading-none tracking-tighter">VK</span>
        </div>
      );
    case "avito":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-black text-white font-bold text-xs select-none shadow-sm ${className}`}
          title="Avito"
        >
          <div className="flex gap-0.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#96dc14]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#00aaff]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5252]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
          </div>
        </div>
      );
    case "ozon":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-[#005bff] text-white font-bold text-xs select-none shadow-sm ${className}`}
          title="Ozon"
        >
          <span className="font-sans text-[10px] leading-none tracking-tight">ozon</span>
        </div>
      );
    case "hh":
      return (
        <div
          style={{ width: size, height: size }}
          className={`flex items-center justify-center rounded-full bg-[#d6001c] text-white font-black text-xs select-none shadow-sm ${className}`}
          title="HeadHunter (hh.ru)"
        >
          <span className="font-sans leading-none text-[11px]">hh</span>
        </div>
      );
    default:
      return null;
  }
}
