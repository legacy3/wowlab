import { describe, expect, it } from "vitest";
import {
  buildTalentEdgeIndex,
  collectTalentDependentIds,
  collectTalentPrerequisiteIds,
  computeVisibleNodes,
  filterByHeroTree,
} from "../graph";

describe("buildTalentEdgeIndex", () => {
  it("builds parent/child relationships from edges", () => {
    const edges = [
      { id: 1, fromNodeId: 100, toNodeId: 101 },
      { id: 2, fromNodeId: 100, toNodeId: 102 },
      { id: 3, fromNodeId: 101, toNodeId: 103 },
    ] as any;
    const index = buildTalentEdgeIndex(edges);

    expect(index.childrenByNodeId.get(100)).toEqual(new Set([101, 102]));
    expect(index.parentsByNodeId.get(103)).toEqual(new Set([101]));
    expect(index.edgeIdByPair.get("100-101")).toBe(1);
  });

  it("builds neighbor map (bidirectional)", () => {
    const edges = [{ id: 1, fromNodeId: 100, toNodeId: 101 }] as any;
    const index = buildTalentEdgeIndex(edges);

    expect(index.neighborsByNodeId.get(100)).toContain(101);
    expect(index.neighborsByNodeId.get(101)).toContain(100);
  });
});

describe("collectTalentPrerequisiteIds", () => {
  it("returns transitive prerequisites", () => {
    const parents = new Map([
      [101, new Set([100])],
      [102, new Set([101])],
      [103, new Set([102])],
    ]);

    const prereqs = collectTalentPrerequisiteIds(103, parents);
    expect(prereqs).toEqual(new Set([100, 101, 102, 103]));
  });

  it("handles diamond dependencies", () => {
    const parents = new Map([
      [101, new Set([100])],
      [102, new Set([100])],
      [103, new Set([101, 102])],
    ]);

    const prereqs = collectTalentPrerequisiteIds(103, parents);
    expect(prereqs).toEqual(new Set([100, 101, 102, 103]));
  });

  it("returns just self for root nodes", () => {
    const parents = new Map<number, Set<number>>();
    const prereqs = collectTalentPrerequisiteIds(100, parents);
    expect(prereqs).toEqual(new Set([100]));
  });
});

describe("collectTalentDependentIds", () => {
  it("returns transitive dependents", () => {
    const children = new Map([
      [100, new Set([101, 102])],
      [101, new Set([103])],
    ]);

    const deps = collectTalentDependentIds(100, children);
    expect(deps).toEqual(new Set([100, 101, 102, 103]));
  });
});

describe("computeVisibleNodes", () => {
  it("includes all nodes with subTreeId 0", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 0 },
      { id: 3, subTreeId: 1 },
    ] as any;
    const edges = [] as any;

    const visible = computeVisibleNodes(nodes, edges);
    expect(visible.map((n) => n.id)).toContain(1);
    expect(visible.map((n) => n.id)).toContain(2);
  });
});

describe("filterByHeroTree", () => {
  it("returns only main nodes when selectedHeroId is null", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 1 },
      { id: 3, subTreeId: 2 },
    ] as any;

    const filtered = filterByHeroTree(nodes, null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe(1);
  });

  it("includes hero nodes matching selectedHeroId", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 1 },
      { id: 3, subTreeId: 2 },
    ] as any;

    const filtered = filterByHeroTree(nodes, 1);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((n) => n.id)).toContain(1);
    expect(filtered.map((n) => n.id)).toContain(2);
  });
});
