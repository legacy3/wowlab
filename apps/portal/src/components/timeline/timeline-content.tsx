"use client";

import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const D3Timeline = lazy(() =>
  import("./d3-timeline").then((m) => ({ default: m.D3Timeline })),
);

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Main timeline skeleton */}
      <div className="relative rounded-lg border bg-card overflow-hidden">
        <div className="flex">
          {/* Track labels */}
          <div className="w-20 border-r bg-muted/20 p-2 space-y-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Timeline area */}
          <div className="flex-1 p-4 space-y-4">
            {/* Time axis */}
            <div className="flex gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-8" />
              ))}
            </div>

            {/* Tracks */}
            <div className="space-y-3">
              {/* Phase track */}
              <div className="flex gap-2">
                <Skeleton className="h-5 flex-1 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 flex-1 rounded" />
              </div>

              {/* Cast track */}
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 20 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-6 rounded" />
                ))}
              </div>

              {/* Buff track */}
              <div className="flex gap-2">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-5 w-28 rounded" />
              </div>

              {/* Debuff track */}
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>

              {/* Damage track */}
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-1 rounded-sm"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>

              {/* Resource track */}
              <Skeleton className="h-10 w-full rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Minimap skeleton */}
      <Skeleton className="h-10 w-full rounded" />

      {/* Track toggles skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineContent() {
  return (
    <Suspense fallback={<TimelineSkeleton />}>
      <D3Timeline />
    </Suspense>
  );
}
