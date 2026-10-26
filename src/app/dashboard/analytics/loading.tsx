export default function AnalyticsLoading() {
  return (
    <div className="max-w-6xl space-y-7 pb-12 animate-in fade-in duration-200">
      {/* ── Top Header Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 shimmer-skeleton rounded-lg" />
          <div className="h-4 w-96 max-w-full shimmer-skeleton rounded-md" />
        </div>
        {/* Time range pill buttons */}
        <div className="h-9 w-48 shimmer-skeleton rounded-xl" />
      </div>

      {/* ── Top Metric Cards Row (4 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="shimmer-card rounded-2xl p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 shimmer-skeleton rounded" />
              <div className="w-5 h-5 shimmer-skeleton rounded-lg" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="h-8 w-20 shimmer-skeleton rounded-lg" />
              <div className="h-4 w-12 shimmer-skeleton rounded" />
            </div>
            <div className="h-3 w-32 shimmer-skeleton rounded" />
          </div>
        ))}
      </div>

      {/* ── Middle Row: Pipeline Funnel Skeleton ── */}
      <div className="shimmer-card rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-44 shimmer-skeleton rounded-md" />
            <div className="h-3 w-72 shimmer-skeleton rounded" />
          </div>
          <div className="h-4 w-24 shimmer-skeleton rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((stage) => (
            <div
              key={stage}
              className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 shimmer-skeleton rounded" />
                <div className="h-3 w-10 shimmer-skeleton rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-7 w-16 shimmer-skeleton rounded-lg" />
                <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full w-2/3 shimmer-skeleton rounded-full" />
                </div>
              </div>
              <div className="h-3 w-36 shimmer-skeleton rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Row: Score Distribution & Skill Gaps Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 shimmer-card rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="h-4 w-44 shimmer-skeleton rounded" />
            <div className="h-3 w-20 shimmer-skeleton rounded" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-28 shimmer-skeleton rounded" />
                  <div className="h-3 w-12 shimmer-skeleton rounded" />
                </div>
                <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                  <div className="h-full w-1/2 shimmer-skeleton rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 shimmer-card rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="h-4 w-40 shimmer-skeleton rounded" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((gap) => (
              <div
                key={gap}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between"
              >
                <div className="h-4 w-28 shimmer-skeleton rounded" />
                <div className="h-4 w-16 shimmer-skeleton rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
