"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PlayersContent() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Here will be an overview of all players.
      </p>
    </div>
  );
}

export function PlayersSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}
