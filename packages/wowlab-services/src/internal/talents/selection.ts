import type { Talent } from "@wowlab/core/Schemas";

import { collectTalentPrerequisiteIds } from "./graph.js";

export interface TalentPointLimits {
  class: number;
  hero: number;
  spec: number;
}

export interface TalentPointsSpent {
  class: number;
  hero: number;
  spec: number;
}

export interface TalentSelection {
  choiceIndex?: number;
  nodeId?: number;
  ranksPurchased?: number;
  selected?: boolean;
}

export type TreeType = "class" | "spec" | "hero";

/**
 * Calculate points spent per tree type from current selections.
 * Each rank purchased counts as 1 point.
 */
export function calculatePointsSpent(
  nodes: readonly Talent.TalentNode[],
  selections: Map<number, TalentSelection>,
): TalentPointsSpent {
  const spent: TalentPointsSpent = { class: 0, hero: 0, spec: 0 };

  for (const node of nodes) {
    const selection = selections.get(node.id);
    if (!selection?.selected) {
      continue;
    }

    const ranks = selection.ranksPurchased ?? 1;
    addToSpent(spent, node.treeIndex ?? 2, ranks);
  }

  return spent;
}

/**
 * Calculate points that would be spent by selecting a node including all unselected prerequisites.
 * Returns points per tree type.
 */
export function calculateSelectionCost(
  nodeId: number,
  nodeById: Map<number, Talent.TalentNode>,
  selections: Map<number, TalentSelection>,
  parentsByNodeId: Map<number, Set<number>>,
): TalentPointsSpent {
  const cost: TalentPointsSpent = { class: 0, hero: 0, spec: 0 };

  // Get all prerequisites including the node itself
  const required = collectTalentPrerequisiteIds(nodeId, parentsByNodeId);

  for (const requiredId of required) {
    if (selections.has(requiredId)) {
      continue;
    }

    const node = nodeById.get(requiredId);
    if (!node) {
      continue;
    }

    addToSpent(cost, node.treeIndex ?? 2, 1);
  }

  return cost;
}

export function getTalentPointLimits(tree: {
  pointLimits?: TalentPointLimits;
}): TalentPointLimits {
  return tree.pointLimits ?? { class: 0, hero: 0, spec: 0 };
}

/**
 * Check if selecting a node (or adding ranks) would exceed point limits.
 * Returns the tree type that would be exceeded, or null if within limits.
 */
export function wouldExceedPointLimit(
  node: Talent.TalentNode,
  ranksToAdd: number,
  currentSpent: TalentPointsSpent,
  limits: TalentPointLimits,
): TreeType | null {
  const type = getTreeType(node.treeIndex ?? 2);

  if (currentSpent[type] + ranksToAdd > limits[type]) {
    return type;
  }

  return null;
}

/**
 * Check if selecting a node (including prerequisites) would exceed point limits.
 * Returns the tree type that would be exceeded, or null if within limits.
 */
export function wouldExceedPointLimitWithPrereqs(
  nodeId: number,
  nodeById: Map<number, Talent.TalentNode>,
  selections: Map<number, TalentSelection>,
  parentsByNodeId: Map<number, Set<number>>,
  currentSpent: TalentPointsSpent,
  limits: TalentPointLimits,
): TreeType | null {
  const cost = calculateSelectionCost(
    nodeId,
    nodeById,
    selections,
    parentsByNodeId,
  );

  const types: TreeType[] = ["class", "spec", "hero"];

  for (const type of types) {
    if (currentSpent[type] + cost[type] > limits[type]) {
      return type;
    }
  }

  return null;
}

function addToSpent(
  spent: TalentPointsSpent,
  treeIndex: number,
  amount: number,
): void {
  const type = getTreeType(treeIndex);

  spent[type] += amount;
}

function getTreeType(treeIndex: number): TreeType {
  if (treeIndex === 1) {
    return "class";
  }

  if (treeIndex === 3) {
    return "hero";
  }

  return "spec";
}
