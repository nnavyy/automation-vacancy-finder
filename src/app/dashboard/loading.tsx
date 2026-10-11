export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="space-y-2">
          <div className="h-7 w-48 shimmer-skeleton rounded-lg" />
          <div className="h-4 w-80 shimmer-skeleton rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 shimmer-skeleton rounded-lg" />
          <div className="h-9 w-32 shimmer-skeleton rounded-lg" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl shimmer-card space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 shimmer-skeleton rounded" />
              <div className="w-5 h-5 rounded shimmer-skeleton" />
            </div>
            <div className="h-7 w-16 shimmer-skeleton rounded-lg" />
            <div className="h-2.5 w-24 shimmer-skeleton rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-xl shimmer-card space-y-4 shadow-sm">
            <div className="h-5 w-40 shimmer-skeleton rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-1/3 shimmer-skeleton rounded" />
                    <div className="h-4 w-16 shimmer-skeleton rounded" />
                  </div>
                  <div className="h-3 w-1/2 shimmer-skeleton rounded" />
                  <div className="h-3 w-2/3 shimmer-skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl shimmer-card space-y-3 shadow-sm">
            <div className="h-4 w-32 shimmer-skeleton rounded" />
            <div className="h-20 bg-zinc-950/70 rounded-lg shimmer-skeleton" />
            <div className="h-10 shimmer-skeleton rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
