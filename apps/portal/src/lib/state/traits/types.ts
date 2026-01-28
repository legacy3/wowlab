import type {
  NodeSelection,
  PointLimits,
  SelectionState,
  TraitNode,
  TraitTreeFlat,
} from "@/lib/trait";

export interface TraitActions {
  canRedo: () => boolean;
  canUndo: () => boolean;
  exportLoadout: () => string;
  getNodes: () => TraitNode[];
  getNodeSelection: (nodeId: number) => NodeSelection | undefined;
  getPointLimits: () => PointLimits;
  importLoadout: (loadout: string) => boolean;
  loadTree: (data: TraitTreeFlat) => void;
  purchaseNode: (nodeId: number, entryIndex?: number) => boolean;
  redo: () => void;
  refundNode: (nodeId: number) => boolean;
  undo: () => void;
}

export interface TraitState {
  classPointsSpent: number;
  heroPointsSpent: number;
  history: SelectionState[];
  historyIndex: number;
  selection: SelectionState;
  specPointsSpent: number;
  treeData: TraitTreeFlat;
}

export type TraitStore = TraitActions & TraitState;
