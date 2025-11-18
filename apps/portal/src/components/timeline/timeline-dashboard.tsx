"use client";

import { useAtom } from "jotai";

import { timelineCardOrderAtom, type TimelineCardId } from "@/atoms/timeline";
import {
  DraggableDashboard,
  type DashboardConfig,
} from "@/components/ui/draggable-dashboard";
import {
  TimelineEventTimelineCard,
  TimelineTotalEventsCard,
  TimelineCastTimeCard,
  TimelineCooldownUsageCard,
  TimelineVisualizationCard,
} from "./cards";

const components: DashboardConfig<TimelineCardId> = {
  "event-timeline": {
    Component: TimelineEventTimelineCard,
    className: "md:col-span-3",
  },
  "total-events": {
    Component: TimelineTotalEventsCard,
  },
  "cast-time": {
    Component: TimelineCastTimeCard,
  },
  "cooldown-usage": {
    Component: TimelineCooldownUsageCard,
  },
  visualization: {
    Component: TimelineVisualizationCard,
    className: "md:col-span-3",
  },
};

export function TimelineDashboard() {
  const [order, setOrder] = useAtom(timelineCardOrderAtom);

  return (
    <DraggableDashboard
      items={order}
      onReorder={setOrder}
      components={components}
    />
  );
}
