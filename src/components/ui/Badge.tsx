// ============================================================
// Reusable colored pill badge
// ============================================================

interface BadgeProps {
  label: string;
  variant: "green" | "yellow" | "red" | "blue" | "gray";
}

const VARIANT_STYLES: Record<BadgeProps["variant"], string> = {
  green:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
  yellow: "bg-amber-500/10   text-amber-400   border border-amber-500/25",
  red:    "bg-rose-500/10    text-rose-400    border border-rose-500/25",
  blue:   "bg-sky-500/10     text-sky-400     border border-sky-500/25",
  gray:   "bg-zinc-800       text-zinc-400    border border-zinc-700/80",
};

export default function Badge({ label, variant }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${VARIANT_STYLES[variant]}`}
    >
      {label}
    </span>
  );
}
