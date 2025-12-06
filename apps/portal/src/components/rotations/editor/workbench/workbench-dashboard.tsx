"use client";

import { useAtom } from "jotai";

import {
  workbenchCardOrderAtom,
  type WorkbenchCardId,
} from "@/atoms/workbench";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  WorkbenchConfigurationCard,
  WorkbenchQuickActionsCard,
  WorkbenchRecentExperimentsCard,
  WorkbenchVariablesCard,
} from "./cards";

const components: DashboardConfig<WorkbenchCardId> = {
  configuration: {
    Component: WorkbenchConfigurationCard,
    className: "md:col-span-2",
  },
  "quick-actions": {
    Component: WorkbenchQuickActionsCard,
  },
  "recent-experiments": {
    Component: WorkbenchRecentExperimentsCard,
  },
  variables: {
    Component: WorkbenchVariablesCard,
  },
};

export function WorkbenchDashboard() {
  const [order, setOrder] = useAtom(workbenchCardOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
    />
  );
}
