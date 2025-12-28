"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { computingOrderAtom, type ComputingCardId } from "@/atoms/computing";
import {
  CpuCoresCard,
  MemoryCard,
  WorkersCard,
  SimulationsCard,
  IterationsCard,
  StatusCard,
  JobHistoryCard,
  PerformanceChartCard,
} from "./cards";

const components: DashboardConfig<ComputingCardId> = {
  "cpu-cores": { Component: CpuCoresCard },
  memory: { Component: MemoryCard },
  workers: { Component: WorkersCard },
  simulations: { Component: SimulationsCard },
  iterations: { Component: IterationsCard },
  status: { Component: StatusCard },
  "job-history": {
    Component: JobHistoryCard,
    className: "col-span-2 sm:col-span-3 lg:col-span-6",
  },
  "performance-chart": {
    Component: PerformanceChartCard,
    className: "col-span-2 sm:col-span-3 lg:col-span-6",
  },
};

export function ComputingContent() {
  const [order, setOrder] = useAtom(computingOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
    />
  );
}

export function ComputingSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
      <Skeleton className="h-80 rounded-xl col-span-2 sm:col-span-3 lg:col-span-6" />
      <Skeleton className="h-96 rounded-xl col-span-2 sm:col-span-3 lg:col-span-6" />
    </div>
  );
}
