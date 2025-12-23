import type { Talent } from "@wowlab/core/Schemas";

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

  return { childrenByNodeId, edgeIdByPair, neighborsByNodeId, parentsByNodeId };
}

export function collectTalentDependentIds(
  nodeId: number,
  childrenByNodeId: Map<number, Set<number>>,
): Set<number> {
  return collectTransitiveIds(nodeId, childrenByNodeId);
}

export function collectTalentPrerequisiteIds(
  nodeId: number,
  parentsByNodeId: Map<number, Set<number>>,
): Set<number> {
  return collectTransitiveIds(nodeId, parentsByNodeId);
}

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
  for (const node of nodes) {
    includedIds.add(node.id);
    queue.push(node.id);
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

export function deriveSelectedHeroId(
  subTrees: readonly Talent.TalentSubTree[],
  nodes: readonly Talent.TalentNode[],
  selections?: Map<number, { selected?: boolean }>,
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

export function filterByHeroTree(
  nodes: readonly Talent.TalentNode[],
  selectedHeroId: number | null,
): Talent.TalentNode[] {
  return nodes.filter((node) => {
    if (node.subTreeId === 0) {
      return true;
    }
    return selectedHeroId !== null && node.subTreeId === selectedHeroId;
  });
}

function collectTransitiveIds(
  nodeId: number,
  adjacencyMap: Map<number, Set<number>>,
): Set<number> {
  const visited = new Set<number>();
  const queue: number[] = [nodeId];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!;
    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const neighbors = adjacencyMap.get(current);
    if (neighbors) {
      for (const neighborId of neighbors) {
        queue.push(neighborId);
      }
    }
  }

  return visited;
}
