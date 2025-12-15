import { useMemo } from "react";
import type { Talent } from "@wowlab/core/Schemas";
import type {
  TalentTreeLayout,
  TalentNodePosition,
  TalentEdgePosition,
} from "@/components/talents/types";
import { PADDING } from "@/components/talents/constants";

interface UseTalentLayoutParams {
  nodes: readonly Talent.TalentNode[];
  edges: readonly Talent.TalentEdge[];
  selections?: Map<number, Talent.DecodedTalentSelection>;
  width: number;
  height: number;
}

export function useTalentLayout({
  nodes,
  edges,
  selections,
  width,
  height,
}: UseTalentLayoutParams): TalentTreeLayout {
  return useMemo(() => {
    if (nodes.length === 0) {
      return { nodes: [], edges: [] };
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

    const availableWidth = width - PADDING * 2;
    const availableHeight = height - PADDING * 2;
    const scaleX = availableWidth / rangeX;
    const scaleY = availableHeight / rangeY;
    const scale = Math.min(scaleX, scaleY);

    const offsetX =
      PADDING + (availableWidth - rangeX * scale) / 2 - minX * scale;
    const offsetY =
      PADDING + (availableHeight - rangeY * scale) / 2 - minY * scale;

    const nodePositions: TalentNodePosition[] = nodes.map((node) => ({
      id: node.id,
      x: node.posX * scale + offsetX,
      y: node.posY * scale + offsetY,
      node,
      selection: selections?.get(node.id),
      isHero: node.subTreeId > 0,
    }));

    const visibleIds = new Set(nodes.map((n) => n.id));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edgePositions: TalentEdgePosition[] = [];
    for (const edge of edges) {
      if (!visibleIds.has(edge.fromNodeId) || !visibleIds.has(edge.toNodeId)) {
        continue;
      }

      const fromNode = nodeMap.get(edge.fromNodeId);
      const toNode = nodeMap.get(edge.toNodeId);

      if (!fromNode || !toNode) {
        continue;
      }

      edgePositions.push({
        id: edge.id,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        fromX: fromNode.posX * scale + offsetX,
        fromY: fromNode.posY * scale + offsetY,
        toX: toNode.posX * scale + offsetX,
        toY: toNode.posY * scale + offsetY,
        fromSelected: selections?.get(edge.fromNodeId)?.selected ?? false,
        toSelected: selections?.get(edge.toNodeId)?.selected ?? false,
      });
    }

    return { nodes: nodePositions, edges: edgePositions };
  }, [nodes, edges, selections, width, height]);
}
