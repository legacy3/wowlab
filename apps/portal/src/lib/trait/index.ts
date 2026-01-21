/* eslint-disable */

// Utilities

export { extractSpecId } from "./extract-spec-id";

// Graph

export {
  buildEdgeMaps,
  buildIncomingEdgeMap,
  buildNodeMap,
  buildOutgoingEdgeMap,
  findPathToNode,
  findReachableNodes,
  getActiveDependents,
  getRootNodes,
  hasAllDependencies,
  hasDependents,
} from "./graph";

// Transform

export {
  TraitTransformError,
  transformSpecTraits,
  tryTransformSpecTraits,
} from "./transform";

// Types

export type {
  EdgeState,
  NodeSelection,
  NodeState,
  PointLimits,
  SelectionState,
  TraitEdge,
  TraitNode,
  TraitNodeEntry,
  TraitNodeType,
  TraitSelection,
  TraitSubTree,
  TraitTreeFlat,
  TraitTreeWithSelections,
} from "./types";
export {
  isChoiceNode,
  isTieredNode,
  isTraitNodeType,
  TraitNodeTypeLabel,
} from "./types";

// Validation

export {
  canPurchaseNode,
  canRefundNode,
  canSelectChoice,
  cloneSelection,
  countClassPoints,
  countHeroPoints,
  countPointsSpent,
  countSpecPoints,
  createEmptySelection,
  deserializeSelection,
  getEdgeState,
  getNodeState,
  serializeSelection,
  type PurchaseResult,
  type RefundResult,
} from "./validation";
