import { atom } from "jotai";

import { createPersistedOrderAtom } from "./utils";
import type {
  SpecCoverageData,
  SpecCoverageProgress,
} from "@/lib/spec-coverage";

export type SpecCoverageCardId = "overview" | "matrix";

export const specCoverageOrderAtom =
  createPersistedOrderAtom<SpecCoverageCardId>("spec-coverage-order-v4", [
    "overview",
    "matrix",
  ]);

export const specCoverageDataAtom = atom<SpecCoverageData | null>(null);
export const specCoverageLoadingAtom = atom(false);
export const specCoverageErrorAtom = atom<string | null>(null);
export const specCoverageProgressAtom = atom<SpecCoverageProgress | null>(null);
