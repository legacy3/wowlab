import type {
  EdgeState,
  NodeSelection,
  NodeState,
  SelectionState,
  TraitNode,
} from "@/lib/trait";

export interface GridLayout {
  gridHeight: number;
  gridWidth: number;
  numCols: number;
  numRows: number;
  offsetX: number;
  offsetY: number;
  xToCol: Map<number, number>;
  yToRow: Map<number, number>;
}

export interface NodeRenderContext {
  images: Map<string, HTMLImageElement>;
  isHero: boolean;
  node: TraitNode;
  onHover?: (data: TooltipData | null) => void;
  onPurchase?: (nodeId: number, entryIndex?: number) => void;
  onRefund?: (nodeId: number) => void;
  selection: NodeSelection | undefined;
  state: NodeState;
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface RenderOptions {
  getEdgeState: (fromNodeId: number, toNodeId: number) => EdgeState;
  getNodeSelection: (nodeId: number) => NodeSelection | undefined;
  getNodeState: (nodeId: number) => NodeState;
  onNodeHover?: (data: TooltipData | null) => void;
  onNodePurchase?: (nodeId: number, entryIndex?: number) => void;
  onNodeRefund?: (nodeId: number) => void;
  selection: SelectionState;
}

export interface TooltipData {
  entryIndex: number;
  node: TraitNode;
  ranksPurchased: number;
  screenX: number;
  screenY: number;
}
