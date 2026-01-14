"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import { labOrderAtom, type LabCardId } from "@/atoms/lab";
import {
  DataInspectorCard,
  PresetCharactersCard,
  SpecCoverageCard,
  TableCoverageCard,
} from "./cards";
import { LabOverviewTour } from "@/components/tours";

const components: DashboardConfig<LabCardId> = {
  "data-inspector": { Component: DataInspectorCard },
  "preset-characters": { Component: PresetCharactersCard },
  "spec-coverage": { Component: SpecCoverageCard },
  "table-coverage": { Component: TableCoverageCard },
};

export function LabContent() {
  const [order, setOrder] = useAtom(labOrderAtom);

  return (
    <>
      <DraggableDashboard
        items={order}
        onReorder={setOrder}
        components={components}
        gridClassName="grid gap-4 sm:grid-cols-2"
      />
      <LabOverviewTour show />
    </>
  );
}
