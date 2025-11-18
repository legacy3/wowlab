"use client";

import { atomWithStorage } from "jotai/utils";

export type TopGearCardId =
  | "current-gear"
  | "optimization-status"
  | "upgrade-path";

const DEFAULT_TOP_GEAR_CARD_ORDER: TopGearCardId[] = [
  "current-gear",
  "optimization-status",
  "upgrade-path",
];

export const topGearCardOrderAtom = atomWithStorage<TopGearCardId[]>(
  "top-gear-card-order",
  [...DEFAULT_TOP_GEAR_CARD_ORDER],
);
