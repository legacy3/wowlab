"use client";

import { Suspense, lazy } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const VisTimelineRenderer = lazy(() =>
  import("./renderers/vis-timeline").then((m) => ({
    default: m.VisTimelineRenderer,
  })),
);

const D3TimelineRenderer = lazy(() =>
  import("./renderers/d3-timeline").then((m) => ({
    default: m.D3TimelineRenderer,
  })),
);

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <Skeleton className="h-[500px] w-full rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function TimelineContent() {
  return (
    <Tabs defaultValue="vis" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="vis">vis-timeline</TabsTrigger>
        <TabsTrigger value="d3">D3.js</TabsTrigger>
      </TabsList>

      <TabsContent value="vis">
        <Suspense fallback={<TimelineSkeleton />}>
          <VisTimelineRenderer />
        </Suspense>
      </TabsContent>

      <TabsContent value="d3">
        <Suspense fallback={<TimelineSkeleton />}>
          <D3TimelineRenderer />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
