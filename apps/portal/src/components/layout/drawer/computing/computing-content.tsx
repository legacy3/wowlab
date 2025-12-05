"use client";

import { Suspense } from "react";
import { useAtom } from "jotai";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  computingCardOrderAtom,
  type ComputingCardId,
} from "@/atoms/computing";
import {
  ActiveJobsCard,
  QueuedJobsCard,
  CompletedJobsCard,
  QueueCard,
  ResourcesCard,
} from "./cards";

const components: DashboardConfig<ComputingCardId> = {
  "active-jobs": {
    Component: ActiveJobsCard,
  },
  "queued-jobs": {
    Component: QueuedJobsCard,
  },
  "completed-jobs": {
    Component: CompletedJobsCard,
  },
  queue: {
    Component: QueueCard,
  },
  resources: {
    Component: ResourcesCard,
  },
};

export function ComputingContent() {
  return (
    <Suspense fallback={<ComputingContentSkeleton />}>
      <ComputingContentInner />
    </Suspense>
  );
}

function ComputingContentInner() {
  const [order, setOrder] = useAtom(computingCardOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:auto-rows-min"
    />
  );
}

function ComputingContentSkeleton() {
  return (
    <div className="grid gap-4 md:auto-rows-min">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <div className="px-6 pb-6">
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <div className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <div className="space-y-4 p-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    </div>
  );
}
