// =============================================================================
// Talent Data Types
// =============================================================================

export interface NodeSelection {
  choiceIndex?: number; // For choice nodes: 0 or 1
  nodeId: number;
  ranksPurchased: number;
}

export interface RenderOptions {
  onNodeClick?: (nodeId: number, entryIndex: number) => void;
  onNodeHover?: (data: TooltipData | null) => void;
  selectedHeroId?: number | null;
  selection?: TalentSelection;
}

export interface TalentEdge {
  fromNodeId: number;
  id: number;
  toNodeId: number;
  visualStyle: number;
}

export interface TalentEntry {
  definitionId: number;
  description: string;
  iconFileName: string;
  id: number;
  name: string;
  spellId: number;
}

// =============================================================================
// Selection State
// =============================================================================

export interface TalentNode {
  entries: TalentEntry[];
  id: number;
  maxRanks: number;
  orderIndex: number;
  posX: number;
  posY: number;
  subTreeId: number;
  treeIndex: number;
  type: number; // 0 = single, 1 = tiered(?), 2 = choice
}

export interface TalentSelection {
  nodes: Map<number, NodeSelection>;
}

// =============================================================================
// Hover/Tooltip
// =============================================================================

export interface TalentSubTree {
  description: string;
  iconFileName: string;
  id: number;
  name: string;
}

// =============================================================================
// Renderer Options
// =============================================================================

export interface TalentTreeData {
  edges: TalentEdge[];
  nodes: TalentNode[];
  subTrees: TalentSubTree[];
}

export interface TooltipData {
  entryIndex: number;
  node: TalentNode;
  screenX: number;
  screenY: number;
}
