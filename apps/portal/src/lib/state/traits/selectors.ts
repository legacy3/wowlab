"use client";

import { useCallback, useMemo } from "react";

import {
  buildEdgeMaps,
  type EdgeState,
  getEdgeState,
  getNodeState,
  type NodeSelection,
  type NodeState,
  type PointLimits,
  type TraitNode,
} from "@/lib/trait";

import { useTraitStore } from "./store";

export function useEdgeState(fromNodeId: number, toNodeId: number): EdgeState {
  const selection = useTraitStore((state) => state.selection);

  return useMemo(
    () => getEdgeState(fromNodeId, toNodeId, selection),
    [selection, fromNodeId, toNodeId],
  );
}

export function useHistoryState(): { canRedo: boolean; canUndo: boolean } {
  const historyIndex = useTraitStore((state) => state.historyIndex);
  const historyLength = useTraitStore((state) => state.history.length);

  return useMemo(
    () => ({
      canRedo: historyIndex < historyLength - 1,
      canUndo: historyIndex > 0,
    }),
    [historyIndex, historyLength],
  );
}

export function useNodeActions(nodeId: number) {
  const purchaseNode = useTraitStore((state) => state.purchaseNode);
  const refundNode = useTraitStore((state) => state.refundNode);

  const purchase = useCallback(
    (entryIndex?: number) => purchaseNode(nodeId, entryIndex),
    [purchaseNode, nodeId],
  );

  const refund = useCallback(() => refundNode(nodeId), [refundNode, nodeId]);

  return { purchase, refund };
}

export function useNodeSelection(nodeId: number): NodeSelection | undefined {
  return useTraitStore((state) => state.selection.nodes.get(nodeId));
}

export function useNodeState(nodeId: number): NodeState {
  const treeData = useTraitStore((state) => state.treeData);
  const selection = useTraitStore((state) => state.selection);

  return useMemo(() => {
    const node = treeData.nodes.find((n) => n.id === nodeId);
    if (!node) {
      return "locked";
    }

    const { incoming } = buildEdgeMaps(treeData.edges);
    return getNodeState(node, selection, incoming);
  }, [treeData, selection, nodeId]);
}

export function usePointCounts(): {
  classPoints: number;
  classPointsLimit: number;
  heroPoints: number;
  heroPointsLimit: number;
  specPoints: number;
  specPointsLimit: number;
} {
  const classPointsSpent = useTraitStore((state) => state.classPointsSpent);
  const specPointsSpent = useTraitStore((state) => state.specPointsSpent);
  const heroPointsSpent = useTraitStore((state) => state.heroPointsSpent);
  const pointLimits = useTraitStore((state) => state.treeData.pointLimits);

  return useMemo(
    () => ({
      classPoints: classPointsSpent,
      classPointsLimit: pointLimits.class,
      heroPoints: heroPointsSpent,
      heroPointsLimit: pointLimits.hero,
      specPoints: specPointsSpent,
      specPointsLimit: pointLimits.spec,
    }),
    [classPointsSpent, specPointsSpent, heroPointsSpent, pointLimits],
  );
}

export function usePointLimits(): PointLimits {
  return useTraitStore((state) => state.treeData.pointLimits);
}

export function useTreeInfo(): { className: string; specName: string } {
  const className = useTraitStore((state) => state.treeData.className);
  const specName = useTraitStore((state) => state.treeData.specName);

  return useMemo(() => ({ className, specName }), [className, specName]);
}

export function useVisibleNodes(): TraitNode[] {
  return useTraitStore((state) => state.treeData.nodes);
}
