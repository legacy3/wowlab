import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type DataType = "spell" | "item";

export type HistoryEntry = {
  id: number;
  type: DataType;
  timestamp: number;
};

export type DataInspectorCardId = "controls" | "history" | "transformed";

const DEFAULT_ORDER: DataInspectorCardId[] = [
  "controls",
  "history",
  "transformed",
];

export const dataInspectorOrderAtom = atomWithStorage<DataInspectorCardId[]>(
  "data-inspector-order-v2",
  DEFAULT_ORDER,
);

export const queryHistoryAtom = atom<HistoryEntry[]>([]);

export const queryIdAtom = atom(133);
export const queryTypeAtom = atom<DataType>("spell");

// Result state atoms
export const queryLoadingAtom = atom(false);
export const queryErrorAtom = atom<string | null>(null);
export const transformedDataAtom = atom<unknown | null>(null);
