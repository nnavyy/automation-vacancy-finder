import React from "react";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
      
      {/* Search/Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 w-full sm:w-48 rounded-xl" />
        <Skeleton className="h-12 w-full sm:w-32 rounded-xl" />
      </div>
      
      {/* Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
