"use client";

import { useAtom } from "jotai";

import {
  DpsChart,
  ResourceChart,
  AbilityChart,
  CooldownChart,
  DetailedChart,
} from "@/components/charts";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { chartsOrderAtom, type ChartId } from "@/atoms/charts";

const components: DashboardConfig<ChartId> = {
  dps: {
    Component: DpsChart,
  },
  resource: {
    Component: ResourceChart,
  },
  ability: {
    Component: AbilityChart,
  },
  cooldown: {
    Component: CooldownChart,
  },
  detailed: {
    Component: DetailedChart,
    className: "md:col-span-2",
  },
};

export function ChartsContent() {
  const [order, setOrder] = useAtom(chartsOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 md:grid-cols-2 md:auto-rows-min"
    />
  );
}
