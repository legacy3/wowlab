"use client";

import { Suspense, useState } from "react";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useAtom } from "jotai";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
// TODO(refine-migration): resultsCardOrderAtom deleted - implement with Refine/localStorage
// import { resultsCardOrderAtom, type ResultsCardId } from "@/atoms/sim";
import {
  BestDpsCard,
  BaselineDpsCard,
  AvgGainCard,
  CombosAnalyzedCard,
  CharacterEquipmentCard,
  ItemCombosCard,
} from "./cards";

// Temporary type definition until Refine migration
type ResultsCardId =
  | "best-dps"
  | "baseline-dps"
  | "avg-gain"
  | "combos-analyzed"
  | "character-equipment"
  | "item-combos";

const components: DashboardConfig<ResultsCardId> = {
  "best-dps": {
    Component: BestDpsCard,
  },
  "baseline-dps": {
    Component: BaselineDpsCard,
  },
  "avg-gain": {
    Component: AvgGainCard,
  },
  "combos-analyzed": {
    Component: CombosAnalyzedCard,
  },
  "character-equipment": {
    Component: CharacterEquipmentCard,
    className: "sm:col-span-2 lg:col-span-4",
  },
  "item-combos": {
    Component: ItemCombosCard,
    className: "sm:col-span-2 lg:col-span-4",
  },
};

export function ResultsOverview() {
  return (
    <Suspense fallback={<ResultsOverviewSkeleton />}>
      <ResultsOverviewInner />
    </Suspense>
  );
}

function ResultsOverviewInner() {
  // TODO(refine-migration): Replace with Refine/localStorage for persistence
  // const [order, setOrder] = useAtom(resultsCardOrderAtom);
  const [order, setOrder] = useState<ResultsCardId[]>([
    "best-dps",
    "baseline-dps",
    "avg-gain",
    "combos-analyzed",
    "character-equipment",
    "item-combos",
  ]);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:auto-rows-min"
    />
  );
}

function ResultsOverviewSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:auto-rows-min">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-2 pb-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-28" />
          </CardHeader>
        </Card>
      ))}

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 mt-1" />
        </CardHeader>
        <div className="p-6 pt-4 space-y-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-56 mt-1" />
        </CardHeader>
        <div className="p-6 pt-4 space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
