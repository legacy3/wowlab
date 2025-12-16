import { createPersistedOrderAtom } from "../utils";

export type LabCardId = "data-inspector" | "spec-coverage";

export const labOrderAtom = createPersistedOrderAtom<LabCardId>(
  "lab-order-v3",
  ["data-inspector", "spec-coverage"],
);
