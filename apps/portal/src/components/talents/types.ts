import type { Talent } from "@wowlab/core/Schemas";

export interface TalentNodePosition {
  id: number;
  x: number;
  y: number;
  node: Talent.TalentNode;
  selection?: Talent.DecodedTalentSelection;
  isHero: boolean;
}

export interface TalentEdgePosition {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromSelected: boolean;
  toSelected: boolean;
}

export interface TalentTreeLayout {
  nodes: TalentNodePosition[];
  edges: TalentEdgePosition[];
}

export interface TooltipState {
  x: number;
  y: number;
  node: Talent.TalentNode;
  selection?: Talent.DecodedTalentSelection;
}
