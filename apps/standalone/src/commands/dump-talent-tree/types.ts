export interface TalentEdge {
  fromNodeId: number;
  id: number;
  toNodeId: number;
  visualStyle: number;
}

export interface TalentNode {
  entries: TalentNodeEntry[];
  id: number;
  maxRanks: number;
  orderIndex: number;
  posX: number;
  posY: number;
  subTreeId: number;
  type: number;
}

export interface TalentNodeEntry {
  definitionId: number;
  description: string;
  iconFileName: string;
  id: number;
  name: string;
  spellId: number;
}

export interface TalentSubTree {
  description: string;
  iconFileName: string;
  id: number;
  name: string;
}

export interface TalentTree {
  className: string;
  edges: TalentEdge[];
  nodes: TalentNode[];
  specId: number;
  specName: string;
  subTrees: TalentSubTree[];
  treeId: number;
}
