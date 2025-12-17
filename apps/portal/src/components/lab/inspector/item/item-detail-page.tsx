"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ItemProvider, MOCK_ITEM_CLOTH_VEST } from "./item-context";
import { ItemDetailContent } from "./item-detail-content";

interface ItemDetailPageProps {
  itemId: string;
}

export function ItemDetailPage({ itemId }: ItemDetailPageProps) {
  // In a real implementation, we would fetch data based on itemId
  // For now, we use mock data
  const item = MOCK_ITEM_CLOTH_VEST;

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
      <ItemProvider item={item}>
        <ItemDetailContent />
      </ItemProvider>
    </div>
  );
}

export function ItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back Navigation Skeleton */}
      <Skeleton className="h-9 w-40" />

      {/* Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* header */}
        <Skeleton className="h-32 md:col-span-2" />
        {/* classification / stat-breakdown */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* bonus-ids / upgrade-path */}
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64 md:col-span-2" />
        {/* sockets / set-bonuses */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* item-effects */}
        <Skeleton className="h-64 md:col-span-2" />
        {/* armor-calculation / spec-usability */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* drop-sources */}
        <Skeleton className="h-64 md:col-span-2" />
        {/* item-flags / crafting */}
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        {/* raw-data / simulation */}
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
