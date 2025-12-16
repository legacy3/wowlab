import { createPersistedOrderAtom } from "../utils";

export type LandingCardId =
  | "recent"
  | "quick-sim"
  | "simulate"
  | "optimize"
  | "rankings"
  | "rotations"
  | "editor"
  | "lab";

export const landingOrderAtom = createPersistedOrderAtom<LandingCardId>(
  "landing-order-v5",
  [
    "recent",
    "quick-sim",
    "simulate",
    "optimize",
    "rankings",
    "rotations",
    "editor",
    "lab",
  ],
);
