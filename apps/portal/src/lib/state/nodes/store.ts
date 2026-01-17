"use client";

import { create } from "zustand";

interface NodesSelectionStore {
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
}

export const useNodesSelection = create<NodesSelectionStore>()((set, get) => ({
  clearSelection: () => set({ selectedIds: new Set() }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  selectedIds: new Set(),

  toggleSelected: (id) => {
    const selected = new Set(get().selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedIds: selected });
  },
}));

// Helper to convert Set to Array for components
export function useNodesSelectionArray() {
  const { selectedIds, ...rest } = useNodesSelection();
  return {
    selectedIds: Array.from(selectedIds),
    selectedIdsSet: selectedIds,
    ...rest,
  };
}
