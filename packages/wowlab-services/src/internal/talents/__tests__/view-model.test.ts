import { describe, expect, it } from "vitest";
import { buildTalentViewModel } from "../view-model";

describe("buildTalentViewModel layout", () => {
  it("returns default scale for empty nodes", () => {
    const tree = {
      nodes: [],
      edges: [],
      allNodeIds: [],
      pointLimits: { class: 0, spec: 0, hero: 0 },
      subTrees: [],
    } as any;

    const viewModel = buildTalentViewModel(tree, new Map(), {
      width: 500,
      height: 600,
    });

    expect(viewModel.layout.scale).toBeGreaterThan(0);
  });

  it("scales to fit within bounds", () => {
    const tree = {
      nodes: [
        {
          id: 1,
          posX: 0,
          posY: 0,
          subTreeId: 0,
          type: 0,
          maxRanks: 1,
          orderIndex: 0,
          entries: [],
        },
        {
          id: 2,
          posX: 1000,
          posY: 2000,
          subTreeId: 0,
          type: 0,
          maxRanks: 1,
          orderIndex: 1,
          entries: [],
        },
      ],
      edges: [],
      allNodeIds: [1, 2],
      pointLimits: { class: 0, spec: 0, hero: 0 },
      subTrees: [],
    } as any;

    const viewModel = buildTalentViewModel(tree, new Map(), {
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
