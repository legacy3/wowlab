"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TalentCalculatorSkeleton() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
      <Skeleton className="h-[700px] w-full" />
    </div>
  );
}
