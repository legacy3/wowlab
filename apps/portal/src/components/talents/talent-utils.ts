import Fuse from "fuse.js";
import type { TalentNodePosition } from "@wowlab/services/Talents";

type FlattenedEntry = {
  nodeId: number;
  name: string;
};

export function searchTalentNodes(
  nodes: readonly TalentNodePosition[],
  query: string,
): Set<number> {
  const trimmed = query.trim();
  if (!trimmed) {
    return new Set<number>();
  }

  const flatEntries: FlattenedEntry[] = [];
  for (const node of nodes) {
    for (const entry of node.node.entries) {
      flatEntries.push({ nodeId: node.id, name: entry.name });
    }
  }

  const fuse = new Fuse(flatEntries, {
    keys: ["name"],
    threshold: 0.3,
    ignoreLocation: true,
  });

  const results = fuse.search(trimmed);
  return new Set(results.map((result) => result.item.nodeId));
}
