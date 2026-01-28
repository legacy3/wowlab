"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import {
  buildEdgeMaps,
  canPurchaseNode,
  canRefundNode,
  cloneSelection,
  countClassPoints,
  countHeroPoints,
  createEmptySelection,
  type TraitTreeFlat,
} from "@/lib/trait";

import type { TraitStore } from "./types";

const MAX_HISTORY = 50;

function pushHistory(state: TraitStore): void {
  if (state.historyIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.historyIndex + 1);
  }

  state.history.push(cloneSelection(state.selection));
  state.historyIndex = state.history.length - 1;

  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(-MAX_HISTORY);
    state.historyIndex = state.history.length - 1;
  }
}

function updatePointCounts(state: TraitStore): void {
  state.classPointsSpent = countClassPoints(
    state.treeData.nodes,
    state.selection,
  );
  state.specPointsSpent = state.classPointsSpent;
  state.heroPointsSpent = countHeroPoints(
    state.treeData.nodes,
    state.selection,
  );
}

const EMPTY_TREE: TraitTreeFlat = {
  allNodeIds: [],
  className: "",
  edges: [],
  nodes: [],
  pointLimits: { class: 31, hero: 10, spec: 30 },
  specId: 0,
  specName: "",
  subTrees: [],
  treeId: 0,
};

export const useTraitStore = create<TraitStore>()(
  immer((set, get) => ({
    canRedo: () => get().historyIndex < get().history.length - 1,
    canUndo: () => get().historyIndex > 0,
    classPointsSpent: 0,
    exportLoadout: () => {
      const state = get();
      const selections = Array.from(state.selection.nodes.values());
      return btoa(
        JSON.stringify({
          nodes: selections,
          specId: state.treeData.specId,
        }),
      );
    },
    getNodes: () => get().treeData.nodes,
    getNodeSelection: (nodeId: number) => get().selection.nodes.get(nodeId),
    getPointLimits: () => get().treeData.pointLimits,

    heroPointsSpent: 0,

    history: [],

    historyIndex: -1,

    importLoadout: (loadout: string) => {
      try {
        const data = JSON.parse(atob(loadout)) as {
          nodes?: Array<{
            choiceIndex?: number;
            nodeId: number;
            ranksPurchased: number;
          }>;
          specId?: number;
        };

        set((state) => {
          if (data.specId && data.specId !== state.treeData.specId) {
            return;
          }

          state.selection = createEmptySelection();

          if (data.nodes) {
            for (const node of data.nodes) {
              state.selection.nodes.set(node.nodeId, node);
            }
          }

          updatePointCounts(state);
          pushHistory(state);
        });

        return true;
      } catch {
        return false;
      }
    },

    loadTree: (data: TraitTreeFlat) => {
      set((state) => {
        state.treeData = data;
        state.selection = createEmptySelection();
        state.classPointsSpent = 0;
        state.specPointsSpent = 0;
        state.heroPointsSpent = 0;
        state.history = [cloneSelection(state.selection)];
        state.historyIndex = 0;
      });
    },

    purchaseNode: (nodeId: number, entryIndex?: number) => {
      const state = get();
      const node = state.treeData.nodes.find((n) => n.id === nodeId);
      if (!node) {
        return false;
      }

      const { incoming } = buildEdgeMaps(state.treeData.edges);

      const result = canPurchaseNode(
        node,
        state.selection,
        state.treeData.nodes,
        incoming,
        state.treeData.pointLimits,
      );

      if (!result.allowed) {
        return false;
      }

      set((state) => {
        const existing = state.selection.nodes.get(nodeId);
        const currentRank = existing?.ranksPurchased ?? 0;

        state.selection.nodes.set(nodeId, {
          choiceIndex: entryIndex ?? existing?.choiceIndex,
          nodeId,
          ranksPurchased: currentRank + 1,
        });

        updatePointCounts(state);
        pushHistory(state);
      });

      return true;
    },

    redo: () => {
      set((state) => {
        if (state.historyIndex >= state.history.length - 1) {
          return;
        }

        state.historyIndex++;
        state.selection = cloneSelection(state.history[state.historyIndex]);
        updatePointCounts(state);
      });
    },

    refundNode: (nodeId: number) => {
      const state = get();
      const node = state.treeData.nodes.find((n) => n.id === nodeId);
      if (!node) {
        return false;
      }

      const { outgoing } = buildEdgeMaps(state.treeData.edges);

      const result = canRefundNode(node, state.selection, outgoing);
      if (!result.allowed) {
        return false;
      }

      set((state) => {
        const existing = state.selection.nodes.get(nodeId);
        if (!existing) {
          return;
        }

        if (existing.ranksPurchased <= 1) {
          state.selection.nodes.delete(nodeId);
        } else {
          state.selection.nodes.set(nodeId, {
            ...existing,
            ranksPurchased: existing.ranksPurchased - 1,
          });
        }

        updatePointCounts(state);
        pushHistory(state);
      });

      return true;
    },

    selection: { nodes: new Map() },

    specPointsSpent: 0,

    treeData: EMPTY_TREE,

    undo: () => {
      set((state) => {
        if (state.historyIndex <= 0) {
          return;
        }

        state.historyIndex--;
        state.selection = cloneSelection(state.history[state.historyIndex]);
        updatePointCounts(state);
      });
    },
  })),
);
