"use client";

import { createPersistedOrderAtom } from "../utils";

export type TopGearCardId =
  | "current-gear"
  | "optimization-status"
  | "upgrade-path";

export const topGearCardOrderAtom = createPersistedOrderAtom<TopGearCardId>(
  "top-gear-card-order",
  ["current-gear", "optimization-status", "upgrade-path"],
);
