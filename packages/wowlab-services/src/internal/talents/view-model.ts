import type { Talent } from "@wowlab/core/Schemas";

import {
  computeVisibleNodes,
  deriveSelectedHeroId,
  filterByHeroTree,
} from "./graph.js";
import {
  calculatePointsSpent,
  getTalentPointLimits,
  type TalentPointLimits,
  type TalentPointsSpent,
  type TalentSelection,
} from "./selection.js";

export interface BuildTalentViewModelOptions {
  height: number;
  padding?: number;
  selectedHeroId?: number | null;
  width: number;
}

export interface TalentEdgePosition {
  fromNodeId: number;
  fromSelected: boolean;
  fromX: number;
  fromY: number;
  id: number;
  toNodeId: number;
  toSelected: boolean;
  toX: number;
  toY: number;
}

export interface TalentNodeData {
  entries: Array<{
    id: number;
    name: string;
    description: string;
    iconFileName: string;
    spellId: number;
  }>;
  id: number;
  maxRanks: number;
  orderIndex: number;
  subTreeId: number;
  type: number;
}

export interface TalentNodePosition {
  id: number;
  isHero: boolean;
  node: TalentNodeData;
  selection?: TalentSelection;
  x: number;
  y: number;
}

export interface TalentViewModel {
  availableHeroTrees: Array<{ id: number; name: string; iconFileName: string }>;
  edges: TalentEdgePosition[];
  layout: {
    scale: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };
  nodes: TalentNodePosition[];
  pointLimits: TalentPointLimits;
  pointsSpent: TalentPointsSpent;
  selectedHeroId: number | null;
}

const computeLayout = (
  nodes: readonly Talent.TalentNode[],
  width: number,
  height: number,
  padding: number,
) => {
  if (nodes.length === 0) {
    return { offsetX: 0, offsetY: 0, scale: 0.05 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.posX < minX) {
      minX = node.posX;
    }

    if (node.posX > maxX) {
      maxX = node.posX;
    }

    if (node.posY < minY) {
      minY = node.posY;
    }
    
    if (node.posY > maxY) {
      maxY = node.posY;
    }
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const availableWidth = Math.max(1, width - padding * 2);
  const availableHeight = Math.max(1, height - padding * 2);
  const scaleX = availableWidth / rangeX;
  const scaleY = availableHeight / rangeY;
  const scale = Math.min(scaleX, scaleY);

  const offsetX =
    padding + (availableWidth - rangeX * scale) / 2 - minX * scale;
  const offsetY =
    padding + (availableHeight - rangeY * scale) / 2 - minY * scale;

  return { offsetX, offsetY, scale };
};

export function buildTalentViewModel(
  tree: Talent.TalentTree,
  selections: Map<number, TalentSelection>,
  options: BuildTalentViewModelOptions,
): TalentViewModel {
  const visibleNodes = computeVisibleNodes(tree.nodes, tree.edges);
  const resolvedHeroId =
    options.selectedHeroId === undefined
      ? deriveSelectedHeroId(tree.subTrees, visibleNodes, selections)
      : options.selectedHeroId;
  const displayNodes = filterByHeroTree(visibleNodes, resolvedHeroId);
  const displayNodeIds = new Set(displayNodes.map((node) => node.id));
  const padding = options.padding ?? 20;

  const layout = computeLayout(
    displayNodes,
    options.width,
    options.height,
    padding,
  );
  const displayNodeById = new Map(displayNodes.map((node) => [node.id, node]));

  const nodes = displayNodes.map((node) => ({
    id: node.id,
    isHero: node.subTreeId > 0,
    node: {
      entries: node.entries.map((entry) => ({
        description: entry.description,
        iconFileName: entry.iconFileName,
        id: entry.id,
        name: entry.name,
        spellId: entry.spellId,
      })),
      id: node.id,
      maxRanks: node.maxRanks,
      orderIndex: node.orderIndex,
      subTreeId: node.subTreeId,
      type: node.type,
    },
    selection: selections.get(node.id),
    x: node.posX * layout.scale + layout.offsetX,
    y: node.posY * layout.scale + layout.offsetY,
  }));

  const edges: TalentEdgePosition[] = [];
  for (const edge of tree.edges) {
    if (
      !displayNodeIds.has(edge.fromNodeId) ||
      !displayNodeIds.has(edge.toNodeId)
    ) {
      continue;
    }

    const fromNode = displayNodeById.get(edge.fromNodeId);
    const toNode = displayNodeById.get(edge.toNodeId);
    if (!fromNode || !toNode) {
      continue;
    }

    edges.push({
      fromNodeId: edge.fromNodeId,
      fromSelected: selections.get(edge.fromNodeId)?.selected ?? false,
      fromX: fromNode.posX * layout.scale + layout.offsetX,
      fromY: fromNode.posY * layout.scale + layout.offsetY,
      id: edge.id,
      toNodeId: edge.toNodeId,
      toSelected: selections.get(edge.toNodeId)?.selected ?? false,
      toX: toNode.posX * layout.scale + layout.offsetX,
      toY: toNode.posY * layout.scale + layout.offsetY,
    });
  }

  return {
    availableHeroTrees: tree.subTrees.map((st) => ({
      iconFileName: st.iconFileName,
      id: st.id,
      name: st.name,
    })),
    edges,
    layout: {
      height: options.height,
      offsetX: layout.offsetX,
      offsetY: layout.offsetY,
      scale: layout.scale,
      width: options.width,
    },
    nodes,
    pointLimits: getTalentPointLimits(tree),
    pointsSpent: calculatePointsSpent(visibleNodes, selections),
    selectedHeroId: resolvedHeroId,
  };
}
