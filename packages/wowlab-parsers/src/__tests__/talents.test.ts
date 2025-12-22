import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import {
  decodeTalentLoadout,
  encodeSelectionsToLoadoutString,
  encodeTalentLoadout,
} from "../internal/simc/talents";

describe("talent loadout encoding", () => {
  it("roundtrips empty loadout", () => {
    const input = {
      nodes: [],
      specId: 62,
      treeHash: new Uint8Array(16),
      version: 1,
    };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    expect(decoded.specId).toBe(62);
    // Note: Padding bits in the base64 encoding get interpreted as unselected nodes.
    // In practice, applyDecodedTalents uses the tree structure to limit node count.
    // We verify the header roundtrips correctly; padding nodes are all unselected.
    expect(decoded.nodes.every((n) => !n.selected)).toBe(true);
  });

  it("roundtrips loadout with selected nodes", () => {
    const input = {
      nodes: [
        { purchased: true, ranksPurchased: 1, selected: true },
        { selected: false },
        {
          partiallyRanked: true,
          purchased: true,
          ranksPurchased: 2,
          selected: true,
        },
      ],
      specId: 263,
      treeHash: new Uint8Array(16),
      version: 1,
    };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    expect(decoded.nodes[0]?.selected).toBe(true);
    expect(decoded.nodes[1]?.selected).toBe(false);
    expect(decoded.nodes[2]?.ranksPurchased).toBe(2);
  });

  it("roundtrips choice nodes", () => {
    const input = {
      nodes: [
        { choiceIndex: 1, choiceNode: true, purchased: true, selected: true },
      ],
      specId: 102,
      treeHash: new Uint8Array(16),
      version: 1,
    };
    const encoded = encodeTalentLoadout(input);
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    expect(decoded.nodes[0]?.choiceNode).toBe(true);
    expect(decoded.nodes[0]?.choiceIndex).toBe(1);
  });

  it("handles invalid characters gracefully", () => {
    const result = Effect.runSync(
      Effect.either(decodeTalentLoadout("invalid!@#$")),
    );

    expect(result._tag).toBe("Left");
  });
});

describe("encodeSelectionsToLoadoutString", () => {
  it("encodes selections matching allNodeIds order", () => {
    const tree = {
      allNodeIds: [100, 200, 300],
      nodes: [
        { entries: [{ id: 1 }], id: 100, maxRanks: 1, type: 1 },
        { entries: [{ id: 2 }], id: 200, maxRanks: 1, type: 1 },
        { entries: [{ id: 3 }], id: 300, maxRanks: 1, type: 1 },
      ],
    };

    const selections = new Map<
      number,
      { selected?: boolean; ranksPurchased?: number }
    >([[300, { ranksPurchased: 1, selected: true }]]);

    const encoded = encodeSelectionsToLoadoutString({
      decoded: {
        nodes: [],
        specId: 70,
        treeHash: new Uint8Array(16),
        version: 1,
      },
      selections,
      tree,
    });

    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    // Padding bits create extra unselected nodes; check first 3 match expected pattern
    expect(decoded.nodes.length).toBeGreaterThanOrEqual(3);
    expect(decoded.nodes[0]?.selected).toBe(false);
    expect(decoded.nodes[1]?.selected).toBe(false);
    expect(decoded.nodes[2]?.selected).toBe(true);
  });

  it("handles gaps in selections (unselected nodes)", () => {
    const tree = {
      allNodeIds: [10, 20],
      nodes: [
        { entries: [{ id: 1 }], id: 10, maxRanks: 1, type: 1 },
        { entries: [{ id: 2 }], id: 20, maxRanks: 1, type: 1 },
      ],
    };
    const selections = new Map<
      number,
      { selected?: boolean; ranksPurchased?: number }
    >([[20, { ranksPurchased: 1, selected: true }]]);

    const encoded = encodeSelectionsToLoadoutString({
      decoded: {
        nodes: [],
        specId: 70,
        treeHash: new Uint8Array(16),
        version: 1,
      },
      selections,
      tree,
    });
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    // Padding bits create extra unselected nodes; check first 2 match expected pattern
    expect(decoded.nodes.length).toBeGreaterThanOrEqual(2);
    expect(decoded.nodes[0]?.selected).toBe(false);
    expect(decoded.nodes[1]?.selected).toBe(true);
  });

  it("sets partiallyRanked when ranks < maxRanks", () => {
    const tree = {
      allNodeIds: [5],
      nodes: [{ entries: [{ id: 1 }], id: 5, maxRanks: 3, type: 1 }],
    };
    const selections = new Map<
      number,
      { selected?: boolean; ranksPurchased?: number }
    >([[5, { ranksPurchased: 1, selected: true }]]);

    const encoded = encodeSelectionsToLoadoutString({
      decoded: {
        nodes: [],
        specId: 70,
        treeHash: new Uint8Array(16),
        version: 1,
      },
      selections,
      tree,
    });
    const decoded = Effect.runSync(decodeTalentLoadout(encoded));

    expect(decoded.nodes[0]?.partiallyRanked).toBe(true);
    expect(decoded.nodes[0]?.ranksPurchased).toBe(1);
  });
});
