"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TalentCalculatorSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="flex items-center gap-2 w-full">
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-md">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-44 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        <div className="flex items-center justify-center min-h-[200px]">
          <div className="rounded-lg border bg-card p-4 w-[420px]">
            <div className="grid grid-cols-5 gap-2 min-h-[140px] place-items-center">
              {Array.from({ length: 13 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-1.5">
                  <Skeleton className="w-10 h-10 rounded-md" />
                  <Skeleton className="w-12 h-3 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
