"use client";

import { createPersistedOrderAtom } from "../utils";

export type LandingCardId =
  | "recent"
  | "quick-sim"
  | "talents"
  | "optimize"
  | "rankings"
  | "rotations"
  | "lab";

export const landingOrderAtom = createPersistedOrderAtom<LandingCardId>(
  "landing-order-v6",
  [
    "recent",
    "quick-sim",
    "talents",
    "optimize",
    "rankings",
    "rotations",
    "lab",
  ],
);
