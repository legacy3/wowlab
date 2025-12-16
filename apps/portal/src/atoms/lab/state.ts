import { createPersistedOrderAtom } from "../utils";

export type LabCardId =
  | "data-inspector"
  | "spec-coverage"
  | "talent-calculator";

export const labOrderAtom = createPersistedOrderAtom<LabCardId>(
  "lab-order-v2",
  ["data-inspector", "spec-coverage", "talent-calculator"],
);
