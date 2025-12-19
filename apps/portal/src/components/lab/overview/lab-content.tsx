"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { labOrderAtom, type LabCardId } from "@/atoms/lab";
import {
  DataInspectorCard,
  SpecCoverageCard,
  TableCoverageCard,
} from "./cards";

const components: DashboardConfig<LabCardId> = {
  "data-inspector": { Component: DataInspectorCard },
  "spec-coverage": { Component: SpecCoverageCard },
  "table-coverage": { Component: TableCoverageCard },
};

export function LabContent() {
  const [order, setOrder] = useAtom(labOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
      gridClassName="grid gap-4 sm:grid-cols-2"
    />
  );
}
