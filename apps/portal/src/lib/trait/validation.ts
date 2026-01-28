import type {
  EdgeState,
  NodeState,
  PointLimits,
  SelectionState,
  TraitNode,
} from "./types";

import { isChoiceNode } from "./types";

export interface PurchaseResult {
  allowed: boolean;
  reason?: string;
}

export interface RefundResult {
  allowed: boolean;
  reason?: string;
}

export function canPurchaseNode(
  node: TraitNode,
  selection: SelectionState,
  nodes: TraitNode[],
  incoming: Map<number, number[]>,
  pointLimits: PointLimits,
): PurchaseResult {
  const nodeSelection = selection.nodes.get(node.id);
  const currentRank = nodeSelection?.ranksPurchased ?? 0;

  if (currentRank >= node.maxRanks) {
    return { allowed: false, reason: "Already at max rank" };
  }

  const dependencies = incoming.get(node.id);
  if (dependencies && dependencies.length > 0) {
    const hasAllDeps = dependencies.every((depId) => {
      const depSelection = selection.nodes.get(depId);
      return depSelection !== undefined && depSelection.ranksPurchased > 0;
    });

    if (!hasAllDeps) {
      return { allowed: false, reason: "Missing required prerequisites" };
    }
  }

  if (node.subTreeId === 0) {
    const currentPoints = countClassPoints(nodes, selection);
    if (currentPoints >= pointLimits.class) {
      return { allowed: false, reason: "Class point limit reached" };
    }
  } else {
    const currentPoints = countHeroPoints(nodes, selection);
    if (currentPoints >= pointLimits.hero) {
      return { allowed: false, reason: "Hero point limit reached" };
    }
  }

  return { allowed: true };
}

export function canRefundNode(
  node: TraitNode,
  selection: SelectionState,
  outgoing: Map<number, number[]>,
): RefundResult {
  const nodeSelection = selection.nodes.get(node.id);
  if (!nodeSelection || nodeSelection.ranksPurchased <= 0) {
    return { allowed: false, reason: "No ranks to refund" };
  }

  const dependents = outgoing.get(node.id);
  if (dependents && dependents.length > 0) {
    const hasActiveDependents = dependents.some((depId) => {
      const depSelection = selection.nodes.get(depId);
      return depSelection !== undefined && depSelection.ranksPurchased > 0;
    });

    if (hasActiveDependents) {
      return {
        allowed: false,
        reason: "Cannot refund: other traits depend on this",
      };
    }
  }

  return { allowed: true };
}

export function canSelectChoice(
  node: TraitNode,
  entryIndex: number,
  selection: SelectionState,
  nodes: TraitNode[],
  incoming: Map<number, number[]>,
  pointLimits: PointLimits,
): PurchaseResult {
  if (!isChoiceNode(node)) {
    return { allowed: false, reason: "Not a choice node" };
  }

  if (entryIndex < 0 || entryIndex >= node.entries.length) {
    return { allowed: false, reason: "Invalid entry index" };
  }

  const nodeSelection = selection.nodes.get(node.id);

  if (nodeSelection && nodeSelection.choiceIndex !== undefined) {
    if (
      nodeSelection.choiceIndex !== entryIndex &&
      nodeSelection.ranksPurchased > 0
    ) {
      return { allowed: false, reason: "Already selected different choice" };
    }
  }

  return canPurchaseNode(node, selection, nodes, incoming, pointLimits);
}

export function cloneSelection(selection: SelectionState): SelectionState {
  return { nodes: new Map(selection.nodes) };
}

export function countClassPoints(
  nodes: TraitNode[],
  selection: SelectionState,
): number {
  return countPointsSpent(nodes, selection, (id) => id === 0);
}

export function countHeroPoints(
  nodes: TraitNode[],
  selection: SelectionState,
): number {
  return countPointsSpent(nodes, selection, (id) => id > 0);
}

export function countPointsSpent(
  nodes: TraitNode[],
  selection: SelectionState,
  subTreeFilter: (subTreeId: number) => boolean,
): number {
  let total = 0;

  for (const node of nodes) {
    if (!subTreeFilter(node.subTreeId)) {
      continue;
    }

    const nodeSelection = selection.nodes.get(node.id);
    if (nodeSelection) {
      total += nodeSelection.ranksPurchased;
    }
  }

  return total;
}

export function countSpecPoints(
  nodes: TraitNode[],
  selection: SelectionState,
): number {
  return countPointsSpent(nodes, selection, (id) => id === 0);
}

export function createEmptySelection(): SelectionState {
  return { nodes: new Map() };
}

export function deserializeSelection(
  data: Array<{ choiceIndex?: number; nodeId: number; ranksPurchased: number }>,
): SelectionState {
  const nodes = new Map<
    number,
    { choiceIndex?: number; nodeId: number; ranksPurchased: number }
  >();

  for (const item of data) {
    nodes.set(item.nodeId, item);
  }

  return { nodes };
}

export function getEdgeState(
  fromNodeId: number,
  toNodeId: number,
  selection: SelectionState,
): EdgeState {
  const fromSelection = selection.nodes.get(fromNodeId);
  const toSelection = selection.nodes.get(toNodeId);

  const fromActive =
    fromSelection !== undefined && fromSelection.ranksPurchased > 0;
  const toActive = toSelection !== undefined && toSelection.ranksPurchased > 0;

  if (fromActive && toActive) {
    return "active";
  }
  if (fromActive) {
    return "unlocked";
  }

  return "locked";
}

export function getNodeState(
  node: TraitNode,
  selection: SelectionState,
  incoming: Map<number, number[]>,
): NodeState {
  const nodeSelection = selection.nodes.get(node.id);
  const currentRank = nodeSelection?.ranksPurchased ?? 0;

  if (currentRank >= node.maxRanks) {
    return "maxed";
  }
  if (currentRank > 0) {
    return "active";
  }

  const dependencies = incoming.get(node.id);
  if (!dependencies || dependencies.length === 0) {
    return "unlocked";
  }

  const hasAllDeps = dependencies.every((depId) => {
    const depSelection = selection.nodes.get(depId);
    return depSelection !== undefined && depSelection.ranksPurchased > 0;
  });

  return hasAllDeps ? "unlocked" : "locked";
}

export function serializeSelection(
  selection: SelectionState,
): Array<{ choiceIndex?: number; nodeId: number; ranksPurchased: number }> {
  return Array.from(selection.nodes.values());
}
