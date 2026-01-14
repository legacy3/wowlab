"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface RegionContentProps {
  region: string;
}

export function RegionContent({ region }: RegionContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Here will be an overview of region{" "}
        <strong>{region.toUpperCase()}</strong>.
      </p>
    </div>
  );
}

export function RegionSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}
