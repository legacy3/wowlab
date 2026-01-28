/* eslint-disable */

export { extractSpecId } from "./extract-spec-id";

export { buildEdgeMaps } from "./graph";

export { TraitTransformError, transformSpecTraits } from "./transform";

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
export { isChoiceNode, isTraitNodeType } from "./types";

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
