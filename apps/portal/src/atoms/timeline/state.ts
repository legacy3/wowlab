"use client";

import { atomWithStorage } from "jotai/utils";

export type TimelineCardId =
  | "event-timeline"
  | "total-events"
  | "cast-time"
  | "cooldown-usage"
  | "visualization";

const DEFAULT_TIMELINE_CARD_ORDER: TimelineCardId[] = [
  "event-timeline",
  "total-events",
  "cast-time",
  "cooldown-usage",
  "visualization",
];

export const timelineCardOrderAtom = atomWithStorage<TimelineCardId[]>(
  "timeline-card-order",
  [...DEFAULT_TIMELINE_CARD_ORDER],
);
