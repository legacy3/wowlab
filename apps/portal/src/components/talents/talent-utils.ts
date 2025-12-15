import type { Talent } from "@wowlab/core/Schemas";

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

  // Include ALL nodes - don't filter by orderIndex
  // SimC iterates all nodes, baseline nodes have orderIndex = -1 but must still be included
  for (const n of nodes) {
    includedIds.add(n.id);
    queue.push(n.id);
  }

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

export function filterByHeroTree(
  nodes: readonly Talent.TalentNode[],
  selectedHeroId: number | null,
): Talent.TalentNode[] {
  return nodes.filter((n) => {
    if (n.subTreeId === 0) {
      return true;
    }
    return selectedHeroId !== null && n.subTreeId === selectedHeroId;
  });
}

export interface TalentLayout {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const NODE_OFFSET = 20;

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

export function deriveSelectedHeroId(
  subTrees: readonly Talent.TalentSubTree[],
  nodes: readonly Talent.TalentNode[],
  selections?: Map<number, Talent.DecodedTalentSelection>,
): number | null {
  if (subTrees.length === 0) {
    return null;
  }

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

  return subTrees[0]?.id ?? null;
}

export type TalentEdgeIndex = {
  parentsByNodeId: Map<number, Set<number>>;
  childrenByNodeId: Map<number, Set<number>>;
  neighborsByNodeId: Map<number, Set<number>>;
  edgeIdByPair: Map<string, number>;
};

export function buildTalentEdgeIndex(
  edges: readonly Talent.TalentEdge[],
): TalentEdgeIndex {
  const parentsByNodeId = new Map<number, Set<number>>();
  const childrenByNodeId = new Map<number, Set<number>>();
  const neighborsByNodeId = new Map<number, Set<number>>();
  const edgeIdByPair = new Map<string, number>();

  const add = (map: Map<number, Set<number>>, key: number, val: number) => {
    const existing = map.get(key);
    if (existing) {
      existing.add(val);
    } else {
      map.set(key, new Set([val]));
    }
  };

  for (const edge of edges) {
    add(childrenByNodeId, edge.fromNodeId, edge.toNodeId);
    add(parentsByNodeId, edge.toNodeId, edge.fromNodeId);
    add(neighborsByNodeId, edge.fromNodeId, edge.toNodeId);
    add(neighborsByNodeId, edge.toNodeId, edge.fromNodeId);
    edgeIdByPair.set(`${edge.fromNodeId}-${edge.toNodeId}`, edge.id);
  }

  return { parentsByNodeId, childrenByNodeId, neighborsByNodeId, edgeIdByPair };
}

export function collectTalentPrerequisiteIds(
  nodeId: number,
  parentsByNodeId: Map<number, Set<number>>,
): Set<number> {
  const visited = new Set<number>();
  const queue: number[] = [nodeId];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const parents = parentsByNodeId.get(current);
    if (!parents) {
      continue;
    }
    for (const parentId of parents) {
      queue.push(parentId);
    }
  }

  return visited;
}

export function collectTalentDependentIds(
  nodeId: number,
  childrenByNodeId: Map<number, Set<number>>,
): Set<number> {
  const visited = new Set<number>();
  const queue: number[] = [nodeId];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const children = childrenByNodeId.get(current);
    if (!children) {
      continue;
    }
    for (const childId of children) {
      queue.push(childId);
    }
  }

  return visited;
}
