export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-800/80 rounded-lg animate-pulse" />
          <div className="h-4 w-80 bg-zinc-850 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-zinc-800/80 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-emerald-500/20 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
              <div className="w-5 h-5 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-7 w-16 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-2.5 w-24 bg-zinc-850 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
            <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-850 space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-1/3 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-1/2 bg-zinc-850 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-zinc-850 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
            <div className="h-20 bg-zinc-950/60 rounded-lg animate-pulse" />
            <div className="h-10 bg-zinc-850 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
