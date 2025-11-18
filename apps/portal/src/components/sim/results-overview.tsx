"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { resultsCardOrderAtom, type ResultsCardId } from "@/atoms/sim";
import {
  BestDpsCard,
  BaselineDpsCard,
  AvgGainCard,
  CombosAnalyzedCard,
  CharacterEquipmentCard,
  ItemCombosCard,
} from "./cards";

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
  const [order, setOrder] = useAtom(resultsCardOrderAtom);

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
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-32" />
          </CardHeader>
        </Card>
      ))}

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <Skeleton className="h-16 w-full" />
        </CardHeader>
        <Skeleton className="h-96 w-full" />
      </Card>

      <Card className="sm:col-span-2 lg:col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <div className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
