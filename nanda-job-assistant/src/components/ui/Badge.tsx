// ============================================================
// Reusable colored pill badge
// ============================================================

interface BadgeProps {
  label: string;
  variant: "green" | "yellow" | "red" | "blue" | "gray";
}

const VARIANT_STYLES: Record<BadgeProps["variant"], string> = {
  green:  "bg-green-400/10  text-green-400  border border-green-400/30",
  yellow: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30",
  red:    "bg-red-400/10    text-red-400    border border-red-400/30",
  blue:   "bg-blue-400/10   text-blue-400   border border-blue-400/30",
  gray:   "bg-gray-800      text-gray-400   border border-gray-700",
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
