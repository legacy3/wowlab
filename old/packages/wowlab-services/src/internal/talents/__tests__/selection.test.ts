import { describe, expect, it } from "vitest";
import {
  calculatePointsSpent,
  wouldExceedPointLimit,
  wouldExceedPointLimitWithPrereqs,
} from "../selection";

describe("calculatePointsSpent", () => {
  it("sums points by tree type", () => {
    const nodes = [
      { id: 1, treeIndex: 1, maxRanks: 1 },
      { id: 2, treeIndex: 2, maxRanks: 2 },
      { id: 3, treeIndex: 3, maxRanks: 1 },
    ] as any;
    const selections = new Map([
      [1, { selected: true, ranksPurchased: 1 }],
      [2, { selected: true, ranksPurchased: 2 }],
      [3, { selected: true, ranksPurchased: 1 }],
    ]);

    const spent = calculatePointsSpent(nodes, selections);
    expect(spent).toEqual({ class: 1, spec: 2, hero: 1 });
  });

  it("ignores unselected nodes", () => {
    const nodes = [{ id: 1, treeIndex: 1, maxRanks: 1 }] as any;
    const selections = new Map([[1, { selected: false, ranksPurchased: 0 }]]);

    const spent = calculatePointsSpent(nodes, selections);
    expect(spent).toEqual({ class: 0, spec: 0, hero: 0 });
  });
});

describe("wouldExceedPointLimit", () => {
  const limits = { class: 31, spec: 30, hero: 10 };

  it("returns null when within limits", () => {
    const node = { treeIndex: 1 } as any;
    const spent = { class: 30, spec: 0, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe(null);
  });

  it("returns tree type when limit exceeded", () => {
    const node = { treeIndex: 1 } as any;
    const spent = { class: 31, spec: 0, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("class");
  });

  it("checks correct tree type for spec nodes", () => {
    const node = { treeIndex: 2 } as any;
    const spent = { class: 0, spec: 30, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("spec");
  });

  it("checks correct tree type for hero nodes", () => {
    const node = { treeIndex: 3 } as any;
    const spent = { class: 0, spec: 0, hero: 10 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("hero");
  });
});

describe("wouldExceedPointLimitWithPrereqs", () => {
  it("includes prerequisite costs in limit check", () => {
    const nodeById = new Map([
      [101, { id: 101, treeIndex: 2 }],
      [102, { id: 102, treeIndex: 2 }],
      [103, { id: 103, treeIndex: 2 }],
    ]);
    const parents = new Map([[103, new Set([101, 102])]]);
    const selections = new Map();
    const spent = { class: 0, spec: 28, hero: 0 };
    const limits = { class: 31, spec: 30, hero: 10 };

    expect(
      wouldExceedPointLimitWithPrereqs(
        103,
        nodeById,
        selections,
        parents,
        spent,
        limits,
      ),
    ).toBe("spec");
  });
});
