# Phase 7 — Core Tests

## Goal
Lock down the rules to stop regressions.

## Test Location
- `packages/wowlab-parsers/src/__tests__/talents.test.ts`
- `packages/wowlab-services/src/internal/talents/__tests__/`

---

## Parsers Tests (`wowlab-parsers`)

### Encoding/Decoding Roundtrip
```ts
describe("talent loadout encoding", () => {
  it("roundtrips empty loadout", () => {
    const input = { version: 1, specId: 62, treeHash: new Uint8Array(16), nodes: [] };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));
    expect(decoded.specId).toBe(62);
    expect(decoded.nodes).toHaveLength(0);
  });

  it("roundtrips loadout with selected nodes", () => {
    const input = {
      version: 1,
      specId: 263,
      treeHash: new Uint8Array(16),
      nodes: [
        { selected: true, purchased: true, ranksPurchased: 1 },
        { selected: false },
        { selected: true, purchased: true, partiallyRanked: true, ranksPurchased: 2 },
      ],
    };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));
    expect(decoded.nodes[0].selected).toBe(true);
    expect(decoded.nodes[1].selected).toBe(false);
    expect(decoded.nodes[2].ranksPurchased).toBe(2);
  });

  it("roundtrips choice nodes", () => {
    const input = {
      version: 1,
      specId: 102,
      treeHash: new Uint8Array(16),
      nodes: [{ selected: true, purchased: true, choiceNode: true, choiceIndex: 1 }],
    };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));
    expect(decoded.nodes[0].choiceNode).toBe(true);
    expect(decoded.nodes[0].choiceIndex).toBe(1);
  });

  it("handles invalid characters gracefully", () => {
    const result = Effect.runSync(Effect.either(decodeTalentLoadout("invalid!@#$")));
    expect(result._tag).toBe("Left");
  });
});
```

### Selection Encoding
```ts
describe("encodeSelectionsToLoadoutString", () => {
  it("encodes selections matching allNodeIds order", () => {
    // Test that selections are encoded in tree.allNodeIds order, not arbitrary order
  });

  it("handles gaps in selections (unselected nodes)", () => {
    // Test that nodes without selections encode as { selected: false }
  });

  it("sets partiallyRanked when ranks < maxRanks", () => {
    // Test partial rank detection
  });
});
```

---

## Services Tests (`wowlab-services`)

### Graph Tests (`graph.test.ts`)
```ts
describe("buildTalentEdgeIndex", () => {
  it("builds parent/child relationships from edges", () => {
    const edges = [
      { id: 1, fromNodeId: 100, toNodeId: 101 },
      { id: 2, fromNodeId: 100, toNodeId: 102 },
      { id: 3, fromNodeId: 101, toNodeId: 103 },
    ];
    const index = buildTalentEdgeIndex(edges);

    expect(index.childrenByNodeId.get(100)).toEqual(new Set([101, 102]));
    expect(index.parentsByNodeId.get(103)).toEqual(new Set([101]));
    expect(index.edgeIdByPair.get("100-101")).toBe(1);
  });

  it("builds neighbor map (bidirectional)", () => {
    const edges = [{ id: 1, fromNodeId: 100, toNodeId: 101 }];
    const index = buildTalentEdgeIndex(edges);

    expect(index.neighborsByNodeId.get(100)).toContain(101);
    expect(index.neighborsByNodeId.get(101)).toContain(100);
  });
});

describe("collectTalentPrerequisiteIds", () => {
  it("returns transitive prerequisites", () => {
    // A -> B -> C -> D
    const parents = new Map([
      [101, new Set([100])],
      [102, new Set([101])],
      [103, new Set([102])],
    ]);

    const prereqs = collectTalentPrerequisiteIds(103, parents);
    expect(prereqs).toEqual(new Set([100, 101, 102, 103])); // includes self
  });

  it("handles diamond dependencies", () => {
    //     A
    //    / \
    //   B   C
    //    \ /
    //     D
    const parents = new Map([
      [101, new Set([100])],  // B <- A
      [102, new Set([100])],  // C <- A
      [103, new Set([101, 102])],  // D <- B, C
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
```

### Selection Tests (`selection.test.ts`)
```ts
describe("calculatePointsSpent", () => {
  it("sums points by tree type", () => {
    const nodes = [
      { id: 1, treeIndex: 1, maxRanks: 1 },  // class
      { id: 2, treeIndex: 2, maxRanks: 2 },  // spec
      { id: 3, treeIndex: 3, maxRanks: 1 },  // hero
    ];
    const selections = new Map([
      [1, { selected: true, ranksPurchased: 1 }],
      [2, { selected: true, ranksPurchased: 2 }],
      [3, { selected: true, ranksPurchased: 1 }],
    ]);

    const spent = calculatePointsSpent(nodes, selections);
    expect(spent).toEqual({ class: 1, spec: 2, hero: 1 });
  });

  it("ignores unselected nodes", () => {
    const nodes = [{ id: 1, treeIndex: 1, maxRanks: 1 }];
    const selections = new Map([[1, { selected: false, ranksPurchased: 0 }]]);

    const spent = calculatePointsSpent(nodes, selections);
    expect(spent).toEqual({ class: 0, spec: 0, hero: 0 });
  });
});

describe("wouldExceedPointLimit", () => {
  const limits = { class: 31, spec: 30, hero: 10 };

  it("returns null when within limits", () => {
    const node = { treeIndex: 1 };
    const spent = { class: 30, spec: 0, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe(null);
  });

  it("returns tree type when limit exceeded", () => {
    const node = { treeIndex: 1 };
    const spent = { class: 31, spec: 0, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("class");
  });

  it("checks correct tree type for spec nodes", () => {
    const node = { treeIndex: 2 };
    const spent = { class: 0, spec: 30, hero: 0 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("spec");
  });

  it("checks correct tree type for hero nodes", () => {
    const node = { treeIndex: 3 };
    const spent = { class: 0, spec: 0, hero: 10 };
    expect(wouldExceedPointLimit(node, 1, spent, limits)).toBe("hero");
  });
});

describe("wouldExceedPointLimitWithPrereqs", () => {
  it("includes prerequisite costs in limit check", () => {
    // Node 103 requires 101, 102 (both unselected)
    // Each costs 1 point, so selecting 103 costs 3 total
    const nodeById = new Map([
      [101, { id: 101, treeIndex: 2 }],
      [102, { id: 102, treeIndex: 2 }],
      [103, { id: 103, treeIndex: 2 }],
    ]);
    const parents = new Map([
      [103, new Set([101, 102])],
    ]);
    const selections = new Map(); // nothing selected
    const spent = { class: 0, spec: 28, hero: 0 };
    const limits = { class: 31, spec: 30, hero: 10 };

    // 28 + 3 = 31 > 30, should exceed
    expect(
      wouldExceedPointLimitWithPrereqs(103, nodeById, selections, parents, spent, limits)
    ).toBe("spec");
  });
});
```

### Visibility Tests (`graph.test.ts`)
```ts
describe("computeVisibleNodes", () => {
  it("includes all nodes with subTreeId 0", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 0 },
      { id: 3, subTreeId: 1 },  // hero node
    ];
    const edges = [];

    const visible = computeVisibleNodes(nodes, edges);
    expect(visible.map(n => n.id)).toContain(1);
    expect(visible.map(n => n.id)).toContain(2);
  });
});

describe("filterByHeroTree", () => {
  it("returns only main nodes when selectedHeroId is null", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 1 },
      { id: 3, subTreeId: 2 },
    ];

    const filtered = filterByHeroTree(nodes, null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });

  it("includes hero nodes matching selectedHeroId", () => {
    const nodes = [
      { id: 1, subTreeId: 0 },
      { id: 2, subTreeId: 1 },
      { id: 3, subTreeId: 2 },
    ];

    const filtered = filterByHeroTree(nodes, 1);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(n => n.id)).toContain(1);
    expect(filtered.map(n => n.id)).toContain(2);
  });
});
```

### Layout Tests (`view-model.test.ts`)
```ts
describe("buildTalentViewModel layout", () => {
  it("returns default scale for empty nodes", () => {
    const tree = { nodes: [], edges: [], allNodeIds: [] };
    const viewModel = buildTalentViewModel(tree as TalentTree, new Map(), {
      width: 500,
      height: 600,
    });

    expect(viewModel.layout.scale).toBeGreaterThan(0);
  });

  it("scales to fit within bounds", () => {
    const tree = {
      nodes: [
        { id: 1, posX: 0, posY: 0, subTreeId: 0, type: 0, maxRanks: 1, entries: [] },
        { id: 2, posX: 1000, posY: 2000, subTreeId: 0, type: 0, maxRanks: 1, entries: [] },
      ],
      edges: [],
      allNodeIds: [1, 2],
    };
    const viewModel = buildTalentViewModel(tree as TalentTree, new Map(), {
      width: 500,
      height: 600,
    });

    const [n1, n2] = viewModel.nodes;
    expect(n1.x).toBeGreaterThanOrEqual(0);
    expect(n2.x).toBeLessThanOrEqual(500);
    expect(n1.y).toBeGreaterThanOrEqual(0);
    expect(n2.y).toBeLessThanOrEqual(600);
  });
});
```

---

## Exit Criteria
- [ ] All test files created and passing
- [ ] Roundtrip encoding tests cover: empty, single node, multi-rank, choice nodes
- [ ] Prerequisite traversal tests cover: linear chain, diamond, root node
- [ ] Point limit tests cover: within limit, at limit, over limit, per-tree-type
- [ ] Visibility tests cover: main nodes, hero filtering
- [ ] Layout tests cover: empty, single node, bounds checking (via `buildTalentViewModel`)
- [ ] CI runs tests on every PR
