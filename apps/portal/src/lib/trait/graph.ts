import type { SelectionState, TraitEdge, TraitNode } from "./types";

export function buildEdgeMaps(edges: TraitEdge[]): {
  incoming: Map<number, number[]>;
  outgoing: Map<number, number[]>;
} {
  const incoming = new Map<number, number[]>();
  const outgoing = new Map<number, number[]>();

  for (const edge of edges) {
    const outList = outgoing.get(edge.fromNodeId) ?? [];
    outList.push(edge.toNodeId);
    outgoing.set(edge.fromNodeId, outList);

    const inList = incoming.get(edge.toNodeId) ?? [];
    inList.push(edge.fromNodeId);
    incoming.set(edge.toNodeId, inList);
  }

  return { incoming, outgoing };
}

export function buildIncomingEdgeMap(
  edges: TraitEdge[],
): Map<number, number[]> {
  const map = new Map<number, number[]>();

  for (const edge of edges) {
    const list = map.get(edge.toNodeId) ?? [];
    list.push(edge.fromNodeId);
    map.set(edge.toNodeId, list);
  }

  return map;
}

export function buildNodeMap(nodes: TraitNode[]): Map<number, TraitNode> {
  const map = new Map<number, TraitNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
}

export function buildOutgoingEdgeMap(
  edges: TraitEdge[],
): Map<number, number[]> {
  const map = new Map<number, number[]>();

  for (const edge of edges) {
    const list = map.get(edge.fromNodeId) ?? [];
    list.push(edge.toNodeId);
    map.set(edge.fromNodeId, list);
  }

  return map;
}

export function findPathToNode(
  targetNodeId: number,
  selection: SelectionState,
  incoming: Map<number, number[]>,
): number[] {
  const path: number[] = [];
  const visited = new Set<number>();
  const stack = [targetNodeId];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const nodeSelection = selection.nodes.get(nodeId);
    if (!nodeSelection || nodeSelection.ranksPurchased === 0) {
      path.push(nodeId);
    }

    const deps = incoming.get(nodeId);
    if (deps) {
      stack.push(...deps);
    }
  }

  return path.reverse();
}

export function findReachableNodes(
  startNodeId: number,
  outgoing: Map<number, number[]>,
): Set<number> {
  const reachable = new Set<number>();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (reachable.has(nodeId)) {
      continue;
    }

    reachable.add(nodeId);

    const children = outgoing.get(nodeId);
    if (children) {
      stack.push(...children);
    }
  }

  return reachable;
}

export function getActiveDependents(
  nodeId: number,
  selection: SelectionState,
  outgoing: Map<number, number[]>,
): number[] {
  const dependents = outgoing.get(nodeId);

  if (!dependents || dependents.length === 0) {
    return [];
  }

  return dependents.filter((depId) => {
    const depSelection = selection.nodes.get(depId);
    return depSelection !== undefined && depSelection.ranksPurchased > 0;
  });
}

export function getRootNodes(
  nodes: TraitNode[],
  incoming: Map<number, number[]>,
): TraitNode[] {
  return nodes.filter((node) => {
    const deps = incoming.get(node.id);
    return !deps || deps.length === 0;
  });
}

export function hasAllDependencies(
  nodeId: number,
  selection: SelectionState,
  incoming: Map<number, number[]>,
): boolean {
  const dependencies = incoming.get(nodeId);

  if (!dependencies || dependencies.length === 0) {
    return true;
  }

  return dependencies.every((depId) => {
    const depSelection = selection.nodes.get(depId);
    return depSelection !== undefined && depSelection.ranksPurchased > 0;
  });
}

export function hasDependents(
  nodeId: number,
  selection: SelectionState,
  outgoing: Map<number, number[]>,
): boolean {
  const dependents = outgoing.get(nodeId);

  if (!dependents || dependents.length === 0) {
    return false;
  }

  return dependents.some((depId) => {
    const depSelection = selection.nodes.get(depId);
    return depSelection !== undefined && depSelection.ranksPurchased > 0;
  });
}
