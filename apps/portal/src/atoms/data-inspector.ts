import type { Aura, Item, Spell } from "@wowlab/core/Schemas";
import { atom } from "jotai";

import { createPersistedOrderAtom } from "./utils";

export type DataType = "spell" | "item" | "aura";

export type HistoryEntry = {
  id: number;
  type: DataType;
  timestamp: number;
};

export type TransformedData =
  | Spell.SpellDataFlat
  | Item.ItemDataFlat
  | Aura.AuraDataFlat;

export type DataInspectorCardId = "controls" | "history" | "transformed";

export const dataInspectorOrderAtom =
  createPersistedOrderAtom<DataInspectorCardId>("data-inspector-order-v2", [
    "controls",
    "history",
    "transformed",
  ]);

export const queryHistoryAtom = atom<HistoryEntry[]>([]);

export const queryIdAtom = atom(133);
export const queryTypeAtom = atom<DataType>("spell");

// Result state atoms
export const queryLoadingAtom = atom(false);
export const queryErrorAtom = atom<string | null>(null);
export const transformedDataAtom = atom<TransformedData | null>(null);
