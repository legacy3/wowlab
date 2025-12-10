"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  specCoverageOrderAtom,
  type SpecCoverageCardId,
} from "@/atoms/spec-coverage";
import { OverviewCard, MatrixCard } from "./cards";

const components: DashboardConfig<SpecCoverageCardId> = {
  overview: { Component: OverviewCard },
  matrix: { Component: MatrixCard },
};

export function SpecCoverageContent() {
  const [order, setOrder] = useAtom(specCoverageOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4"
    />
  );
}
