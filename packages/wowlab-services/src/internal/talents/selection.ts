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
    const treeIndex = node.treeIndex ?? 2;

    if (treeIndex === 1) {
      spent.class += ranks;
    } else if (treeIndex === 2) {
      spent.spec += ranks;
    } else if (treeIndex === 3) {
      spent.hero += ranks;
    }
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
    // Skip if already selected
    if (selections.has(requiredId)) {
      continue;
    }

    const node = nodeById.get(requiredId);
    if (!node) {
      continue;
    }

    // Each unselected node costs 1 point (minimum rank)
    const treeIndex = node.treeIndex ?? 2;
    if (treeIndex === 1) {
      cost.class += 1;
    } else if (treeIndex === 2) {
      cost.spec += 1;
    } else if (treeIndex === 3) {
      cost.hero += 1;
    }
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
): "class" | "spec" | "hero" | null {
  const treeIndex = node.treeIndex ?? 2;

  if (treeIndex === 1) {
    if (currentSpent.class + ranksToAdd > limits.class) {
      return "class";
    }
  } else if (treeIndex === 2) {
    if (currentSpent.spec + ranksToAdd > limits.spec) {
      return "spec";
    }
  } else if (treeIndex === 3) {
    if (currentSpent.hero + ranksToAdd > limits.hero) {
      return "hero";
    }
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
): "class" | "spec" | "hero" | null {
  const cost = calculateSelectionCost(
    nodeId,
    nodeById,
    selections,
    parentsByNodeId,
  );

  if (currentSpent.class + cost.class > limits.class) {
    return "class";
  }
  if (currentSpent.spec + cost.spec > limits.spec) {
    return "spec";
  }
  if (currentSpent.hero + cost.hero > limits.hero) {
    return "hero";
  }

  return null;
}
