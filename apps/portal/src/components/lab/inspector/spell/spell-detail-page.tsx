"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SpellProvider, MOCK_SPELL_AIMED_SHOT } from "./spell-context";
import { SpellDetailContent } from "./spell-detail-content";

interface SpellDetailPageProps {
  spellId: string;
}

export function SpellDetailPage({ spellId }: SpellDetailPageProps) {
  // In a real implementation, we would fetch data based on spellId
  // For now, we use mock data
  const spell = MOCK_SPELL_AIMED_SHOT;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lab/inspector/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inspector
          </Link>
        </Button>
      </div>

      {/* Dashboard Content */}
      <SpellProvider spell={spell}>
        <SpellDetailContent />
      </SpellProvider>
    </div>
  );
}

export function SpellDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Navigation Skeleton */}
      <Skeleton className="h-9 w-40" />

      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 md:col-span-2" />
        <Skeleton className="h-32 md:col-span-2" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
