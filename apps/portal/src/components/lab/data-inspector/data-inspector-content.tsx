"use client";

import { useAtom } from "jotai";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  dataInspectorOrderAtom,
  type DataInspectorCardId,
} from "@/atoms/data-inspector";
import { ControlsCard, HistoryCard, TransformedCard } from "./cards";
import { QueryProvider } from "./query-context";

const components: DashboardConfig<DataInspectorCardId> = {
  controls: { Component: ControlsCard },
  history: { Component: HistoryCard },
  transformed: { Component: TransformedCard, className: "md:col-span-2" },
};

export function DataInspectorContent() {
  const [order, setOrder] = useAtom(dataInspectorOrderAtom);

  return (
    <QueryProvider>
      <DraggableDashboard
        items={order}
        onReorder={setOrder}
        components={components}
        gridClassName="grid gap-4 md:grid-cols-2"
      />
    </QueryProvider>
  );
}
