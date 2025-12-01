import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type DataType = "spell" | "item";

export type HistoryEntry = {
  id: number;
  type: DataType;
  timestamp: number;
};

export type DataInspectorCardId =
  | "controls"
  | "history"
  | "transformed"
  | "raw";

const DEFAULT_ORDER: DataInspectorCardId[] = [
  "controls",
  "history",
  "transformed",
  "raw",
];

export const dataInspectorOrderAtom = atomWithStorage<DataInspectorCardId[]>(
  "data-inspector-order",
  DEFAULT_ORDER,
);

export const queryHistoryAtom = atom<HistoryEntry[]>([]);

export const queryIdAtom = atom(133);
export const queryTypeAtom = atom<DataType>("spell");

// Result state atoms
export const queryLoadingAtom = atom(false);
export const queryErrorAtom = atom<string | null>(null);
export const rawDataAtom = atom<Record<string, unknown> | null>(null);
export const transformedDataAtom = atom<unknown | null>(null);
