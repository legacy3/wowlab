"use client";

import { useAtom } from "jotai";

import { topGearCardOrderAtom, type TopGearCardId } from "@/atoms/top-gear";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  TopGearCurrentGearCard,
  TopGearOptimizationStatusCard,
  TopGearUpgradePathCard,
} from "./cards";
import { OptimizeIntroTour } from "@/components/tours";

const components: DashboardConfig<TopGearCardId> = {
  "current-gear": {
    Component: TopGearCurrentGearCard,
  },
  "optimization-status": {
    Component: TopGearOptimizationStatusCard,
  },
  "upgrade-path": {
    Component: TopGearUpgradePathCard,
    className: "md:col-span-2",
  },
};

export function TopGearDashboard() {
  const [order, setOrder] = useAtom(topGearCardOrderAtom);

  return (
    <>
      <DraggableDashboard
        items={order}
        onReorder={setOrder}
        components={components}
        gridClassName="grid gap-4 md:auto-rows-min md:grid-cols-2"
      />
      <OptimizeIntroTour show />
    </>
  );
}
