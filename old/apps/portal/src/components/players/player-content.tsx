"use client";

import { capitalCase } from "change-case";

import { Skeleton } from "@/components/ui/skeleton";

interface PlayerContentProps {
  region: string;
  realm: string;
  name: string;
}

export function PlayerContent({ region, realm, name }: PlayerContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Here will be the profile of player <strong>{capitalCase(name)}</strong>{" "}
        on <strong>{capitalCase(realm)}</strong> (
        <strong>{region.toUpperCase()}</strong>).
      </p>
    </div>
  );
}

export function PlayerSkeleton() {
  return <Skeleton className="h-64 w-full rounded-xl" />;
}
