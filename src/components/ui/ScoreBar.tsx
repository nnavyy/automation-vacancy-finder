// ============================================================
// Score progress bar with color coding
// ============================================================

interface ScoreBarProps {
  score: number;
  size?: "sm" | "md";
}

function getBarColor(score: number): string {
  if (score >= 75) return "bg-green-400";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

function getTextColor(score: number): string {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default function ScoreBar({ score, size = "md" }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const barH    = size === "sm" ? "h-1.5" : "h-2.5";
  const textSz  = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-gray-800 rounded-full ${barH} overflow-hidden`}>
        <div
          className={`${barH} rounded-full ${getBarColor(score)} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`${textSz} font-semibold ${getTextColor(score)} tabular-nums min-w-[3rem] text-right`}
      >
        {score}/100
      </span>
    </div>
  );
}
