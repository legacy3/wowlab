import { atomWithStorage } from "jotai/utils";

export type ResultsCardId =
  | "best-dps"
  | "baseline-dps"
  | "avg-gain"
  | "combos-analyzed"
  | "character-equipment"
  | "item-combos";

export const resultsCardOrderAtom = atomWithStorage<readonly ResultsCardId[]>(
  "results-card-order",
  [
    "best-dps",
    "baseline-dps",
    "avg-gain",
    "combos-analyzed",
    "character-equipment",
    "item-combos",
  ],
);
