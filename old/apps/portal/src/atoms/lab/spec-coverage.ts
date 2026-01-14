import { atom } from "jotai";

import { createPersistedOrderAtom } from "../utils";
import type {
  SpecCoverageData,
  SpecCoverageProgress,
  UntrackedSpell,
} from "@/lib/spec-coverage";

export type SpecCoverageCardId = "overview" | "matrix" | "untracked";

export const specCoverageOrderAtom =
  createPersistedOrderAtom<SpecCoverageCardId>("spec-coverage-order-v6", [
    "overview",
    "matrix",
    "untracked",
  ]);

export const specCoverageDataAtom = atom<SpecCoverageData | null>(null);
export const specCoverageLoadingAtom = atom(false);
export const specCoverageErrorAtom = atom<string | null>(null);
export const specCoverageProgressAtom = atom<SpecCoverageProgress | null>(null);
export const untrackedSpellsAtom = atom<UntrackedSpell[]>([]);
