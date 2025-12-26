"use client";

import { capitalCase } from "change-case";

import { Skeleton } from "@/components/ui/skeleton";

interface RealmContentProps {
  region: string;
  realm: string;
}

export function RealmContent({ region, realm }: RealmContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Here will be an overview of realm <strong>{capitalCase(realm)}</strong>{" "}
        in <strong>{region.toUpperCase()}</strong>.
      </p>
    </div>
  );
}

export function RealmSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}
