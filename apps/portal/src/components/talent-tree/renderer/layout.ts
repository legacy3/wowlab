import { env } from "@/lib/env";

import type { TalentNode } from "../types";

import { CELL_SIZE } from "../constants";

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

export interface Position {
  x: number;
  y: number;
}

/**
 * Build a lookup of edges by source node ID.
 */
export function buildEdgeLookup(
  edges: Array<{ fromNodeId: number; toNodeId: number }>,
  visibleNodeIds: Set<number>,
): Map<number, number[]> {
  const edgesByNode = new Map<number, number[]>();

  for (const edge of edges) {
    if (
      !visibleNodeIds.has(edge.fromNodeId) ||
      !visibleNodeIds.has(edge.toNodeId)
    ) {
      continue;
    }

    const list = edgesByNode.get(edge.fromNodeId) ?? [];
    list.push(edge.toNodeId);
    edgesByNode.set(edge.fromNodeId, list);
  }

  return edgesByNode;
}

/**
 * Build a map of node IDs to their pixel positions.
 */
export function buildPositionMap(
  nodes: TalentNode[],
  grid: GridLayout,
): Map<number, Position> {
  const positions = new Map<number, Position>();

  for (const node of nodes) {
    const col = grid.xToCol.get(node.posX) ?? 0;
    const row = grid.yToRow.get(node.posY) ?? 0;

    positions.set(node.id, {
      x: grid.offsetX + col * CELL_SIZE,
      y: grid.offsetY + row * CELL_SIZE,
    });
  }

  return positions;
}

/**
 * Calculate the grid layout from visible nodes.
 * Maps logical positions to pixel coordinates.
 */
export function calculateGrid(
  nodes: TalentNode[],
  canvasWidth: number,
  canvasHeight: number,
): GridLayout {
  const uniqueX = [...new Set(nodes.map((n) => n.posX))].sort((a, b) => a - b);
  const uniqueY = [...new Set(nodes.map((n) => n.posY))].sort((a, b) => a - b);

  const xToCol = new Map(uniqueX.map((x, i) => [x, i]));
  const yToRow = new Map(uniqueY.map((y, i) => [y, i]));

  const numCols = uniqueX.length;
  const numRows = uniqueY.length;
  const gridWidth = numCols * CELL_SIZE;
  const gridHeight = numRows * CELL_SIZE;

  const offsetX = (canvasWidth - gridWidth) / 2 + CELL_SIZE / 2;
  const offsetY = (canvasHeight - gridHeight) / 2 + CELL_SIZE / 2;

  return {
    gridHeight,
    gridWidth,
    numCols,
    numRows,
    offsetX,
    offsetY,
    xToCol,
    yToRow,
  };
}

/**
 * Collect all icon URLs from visible nodes.
 */
export function collectIconUrls(nodes: TalentNode[]): string[] {
  const urls: string[] = [];

  for (const node of nodes) {
    for (const entry of node.entries) {
      if (entry.iconFileName) {
        urls.push(getIconUrl(entry.iconFileName));
      }
    }
  }

  return urls;
}

/**
 * Get the full URL for a talent icon.
 */
export function getIconUrl(iconName: string): string {
  return `${env.SUPABASE_URL}/functions/v1/icons/medium/${iconName}.jpg`;
}
