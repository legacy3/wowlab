import { createPersistedOrderAtom } from "./utils";

export type SpecCoverageCardId = "overview" | "matrix";

export const specCoverageOrderAtom =
  createPersistedOrderAtom<SpecCoverageCardId>("spec-coverage-order-v4", [
    "overview",
    "matrix",
  ]);
