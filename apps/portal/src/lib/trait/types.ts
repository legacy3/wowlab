export type {
  PointLimits,
  TraitEdge,
  TraitNode,
  TraitNodeEntry,
  TraitSelection,
  TraitSubTree,
  TraitTreeFlat,
  TraitTreeWithSelections,
} from "wowlab-parsers";

// Node types: 0 = single, 1 = tiered, 2 = choice
export type TraitNodeType = 0 | 1 | 2;

export const TraitNodeTypeLabel: Record<TraitNodeType, string> = {
  0: "single",
  1: "tiered",
  2: "choice",
};

export type EdgeState = "locked" | "unlocked" | "active";

export interface NodeSelection {
  choiceIndex?: number;
  nodeId: number;
  ranksPurchased: number;
}

export type NodeState = "locked" | "unlocked" | "active" | "maxed";

export interface SelectionState {
  nodes: Map<number, NodeSelection>;
}

export function isChoiceNode(node: {
  type: number;
  entries: unknown[];
}): boolean {
  return node.type === 2 && node.entries.length > 1;
}

export function isTieredNode(node: {
  type: number;
  maxRanks: number;
}): boolean {
  return node.type === 1 || node.maxRanks > 1;
}

export function isTraitNodeType(value: unknown): value is TraitNodeType {
  return value === 0 || value === 1 || value === 2;
}
