import type { Talent } from "@wowlab/core/Schemas";

/**
 * Computes visible nodes using BFS traversal.
 * Includes nodes with orderIndex >= 0, hero nodes, and their connected descendants.
 */
export function computeVisibleNodes(
  nodes: readonly Talent.TalentNode[],
  edges: readonly Talent.TalentEdge[],
): Talent.TalentNode[] {
  const allNodeMap = new Map(nodes.map((n) => [n.id, n]));

  const edgesFrom = new Map<number, number[]>();
  for (const edge of edges) {
    const existing = edgesFrom.get(edge.fromNodeId);
    if (existing) {
      existing.push(edge.toNodeId);
    } else {
      edgesFrom.set(edge.fromNodeId, [edge.toNodeId]);
    }
  }

  const includedIds = new Set<number>();
  const queue: number[] = [];

  for (const n of nodes) {
    if (n.orderIndex >= 0 || n.subTreeId > 0) {
      includedIds.add(n.id);
      queue.push(n.id);
    }
  }

  // BFS with O(1) dequeue using index pointer
  let head = 0;
  while (head < queue.length) {
    const nodeId = queue[head++];
    const targets = edgesFrom.get(nodeId);

    if (targets) {
      for (const targetId of targets) {
        if (!includedIds.has(targetId)) {
          const targetNode = allNodeMap.get(targetId);
          if (targetNode && targetNode.subTreeId === 0) {
            includedIds.add(targetId);
            queue.push(targetId);
          }
        }
      }
    }
  }

  return nodes.filter((n) => includedIds.has(n.id));
}

/**
 * Filters visible nodes by hero tree selection.
 */
export function filterByHeroTree(
  nodes: readonly Talent.TalentNode[],
  selectedHeroId: number | null,
): Talent.TalentNode[] {
  return nodes.filter((n) => {
    if (n.subTreeId === 0) return true;
    return selectedHeroId !== null && n.subTreeId === selectedHeroId;
  });
}

export interface TalentLayout {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const NODE_OFFSET = 20;

/**
 * Computes scale and offset for positioning talent nodes.
 * Uses single-pass bounds calculation.
 */
export function computeTalentLayout(
  nodes: readonly Talent.TalentNode[],
  width: number,
  height: number,
): TalentLayout {
  if (nodes.length === 0) {
    return { scale: 0.05, offsetX: 0, offsetY: 0 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    if (node.posX < minX) minX = node.posX;
    if (node.posX > maxX) maxX = node.posX;
    if (node.posY < minY) minY = node.posY;
    if (node.posY > maxY) maxY = node.posY;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const scaleX = (width - NODE_OFFSET * 2) / rangeX;
  const scaleY = (height - NODE_OFFSET * 2) / rangeY;
  const scale = Math.min(scaleX, scaleY);

  return {
    scale,
    offsetX: NODE_OFFSET - minX * scale,
    offsetY: NODE_OFFSET - minY * scale,
  };
}

/**
 * Finds nodes matching a search query.
 */
export function searchTalentNodes(
  nodes: readonly Talent.TalentNode[],
  query: string,
): Set<number> {
  const trimmed = query.trim();
  if (!trimmed) {
    return new Set<number>();
  }

  const lowerQuery = trimmed.toLowerCase();
  const matches = new Set<number>();

  for (const node of nodes) {
    for (const entry of node.entries) {
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        matches.add(node.id);
        break;
      }
    }
  }

  return matches;
}

/**
 * Derives the selected hero tree from selections data.
 * Returns the subTreeId that has any selected nodes, or first available.
 */
export function deriveSelectedHeroId(
  subTrees: readonly Talent.TalentSubTree[],
  nodes: readonly Talent.TalentNode[],
  selections?: Map<number, Talent.DecodedTalentSelection>,
): number | null {
  if (subTrees.length === 0) return null;

  // If we have selections, find which hero tree has selected nodes
  if (selections) {
    for (const node of nodes) {
      if (node.subTreeId > 0) {
        const selection = selections.get(node.id);
        if (selection?.selected) {
          return node.subTreeId;
        }
      }
    }
  }

  // Default to first hero tree
  return subTrees[0]?.id ?? null;
}
