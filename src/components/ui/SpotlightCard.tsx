"use client";

// Card with a cursor-following radial highlight, in the style of Dub's feature tiles.
// Tracking is written straight to CSS variables so it never triggers a React render.

import { useRef } from "react";
import { clsx } from "clsx";

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export default function SpotlightCard({ children, className, active = false }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      data-active={active}
      className={clsx("spotlight-card rounded-2xl", className)}
    >
      {children}
    </div>
  );
}

