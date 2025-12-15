/**
 * Talent Tree Output Types
 *
 * These are the processed types used for HTML rendering.
 */

import type {
  TraitEdgeType,
  TraitEdgeVisualStyle,
  TraitNodeEntryType,
  TraitNodeType,
} from "./wow-api.js";

// Re-export enums for convenience
export {
  TraitEdgeType,
  TraitEdgeVisualStyle,
  TraitNodeEntryType,
  TraitNodeType,
};

/**
 * Edge connecting two nodes.
 */
export interface TalentEdge {
  sourceNodeId: number;
  targetNodeId: number;
  type: TraitEdgeType;
  visualStyle: TraitEdgeVisualStyle;
}

/**
 * A single entry within a talent node.
 */
export interface TalentEntry {
  definitionId: number | null;
  description: string | null;
  iconFileName: string | null;
  id: number;
  maxRanks: number;
  name: string | null;
  spellId: number | null;
  subTreeId: number | null;
  type: TraitNodeEntryType;
}

/**
 * A talent node in the tree.
 */
export interface TalentNode {
  entries: TalentEntry[];
  flags: number;
  id: number;
  pixelX: number;
  pixelY: number;
  subTreeId: number | null;
  type: TraitNodeType;
}

/**
 * A gate that blocks access to nodes.
 */
export interface TalentGate {
  conditionId: number;
  spentAmountRequired: number;
  topLeftNodeId: number;
}

/**
 * A hero talent sub-tree.
 */
export interface TalentSubTree {
  description: string | null;
  iconFileName: string | null;
  id: number;
  name: string | null;
  nodeIds: number[];
}

/**
 * Complete talent tree for a specialization.
 */
export interface TalentTree {
  bounds: {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  };
  classId: number;
  className: string;
  edges: TalentEdge[];
  gates: TalentGate[];
  nodes: TalentNode[];
  specId: number;
  specName: string;
  subTrees: TalentSubTree[];
  treeId: number;
}
