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
  settingsCardOrderAtom,
  type SettingsCardId,
} from "@/atoms/user/settings-ui";
import { ProfileSettingsCard, SimulationSettingsCard } from "./cards";

const components: DashboardConfig<SettingsCardId> = {
  "profile-settings": {
    Component: ProfileSettingsCard,
    className: "md:col-span-2",
  },
  "simulation-settings": {
    Component: SimulationSettingsCard,
    className: "md:col-span-2",
  },
};

export function SettingsOverview() {
  return (
    <Suspense fallback={<SettingsOverviewSkeleton />}>
      <SettingsOverviewInner />
    </Suspense>
  );
}

function SettingsOverviewInner() {
  const [order, setOrder] = useAtom(settingsCardOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-6 md:grid-cols-2"
    />
  );
}

export function SettingsOverviewSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-2 flex-1" />
              <Skeleton className="h-5 w-14" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
