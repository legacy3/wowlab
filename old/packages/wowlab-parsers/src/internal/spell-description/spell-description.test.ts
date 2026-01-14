import { describe, expect, it } from "vitest";

import type {
  CrossSpellReferenceNode,
  EffectVariableNode,
  ParsedSpellDescription,
  PlayerVariableNode,
  PluralizationNode,
  TextNode,
} from "./types";

import { visitSpellDescription } from "./visitor";

describe("spell description parsing (chevrotain + typed vars)", () => {
  it("maps effect variables to typed nodes", () => {
    const { ast } = visitSpellDescription("Deals $s1 damage.");
    const { nodes } = ast;
    const varNode = nodes.find((n) => n.type === "effectVariable");

    expect(varNode).toMatchObject({ effectIndex: 1, varType: "s" });
  });

  it("maps spell-level duration variables", () => {
    const { ast } = visitSpellDescription("Lasts $d.");
    const { nodes } = ast;
    const node = nodes.find((n) => n.type === "spellLevelVariable");

    expect(node).toMatchObject({ index: undefined, varType: "d" });
  });

  it("maps player stat variables", () => {
    const { ast } = visitSpellDescription("Scaling with $SP.");
    const { nodes } = ast;
    const node = nodes.find((n) => n.type === "playerVariable");

    expect(node).toMatchObject({ varName: "SP" });
  });

  it("maps cross-spell references", () => {
    const { ast } = visitSpellDescription("See $12345s2 for details.");
    const { nodes } = ast;
    const node = nodes.find((n) => n.type === "crossSpellReference");

    expect(node).toMatchObject({
      effectIndex: 2,
      spellId: 12345,
      varType: "s",
    });
  });

  it("parses pluralization hints", () => {
    const { ast } = visitSpellDescription("$s1 $lstack:stacks;");
    const { nodes } = ast;
    const node = nodes.find((n) => n.type === "pluralization");

    expect(node).toMatchObject({
      capitalized: false,
      plural: "stacks",
      singular: "stack",
    });
  });

  it("accepts conditionals syntactically even if unhandled downstream", () => {
    expect(() => visitSpellDescription("$?a123[text][else]")).not.toThrow();
  });
});

describe("parseDescription end-to-end", () => {
  const expectParsed = (input: string) => {
    const parsed = visitSpellDescription(input);

    expect(parsed.lexErrors).toHaveLength(0);
    expect(parsed.errors).toHaveLength(0);

    return parsed.ast.nodes;
  };

  it("returns typed nodes and preserves order", () => {
    const nodes = expectParsed("Deals $s1 damage over $d.");

    expect(nodes.map((n) => n.type)).toEqual([
      "text",
      "effectVariable",
      "text",
      "spellLevelVariable",
      "text",
    ]);
  });

  it("handles @ variables, pluralization, and gender together", () => {
    const nodes = expectParsed("$@spelldesc123 $lstack:stacks; $ghis:her;");

    expect(nodes.find((n) => n.type === "atVariable")).toMatchObject({
      spellId: 123,
      varType: "spelldesc",
    });
    expect(nodes.find((n) => n.type === "pluralization")).toMatchObject({
      plural: "stacks",
      singular: "stack",
    });
    expect(nodes.find((n) => n.type === "gender")).toMatchObject({
      female: "her",
      male: "his",
    });
  });

  it("parses misc/enchant vars and color codes", () => {
    const nodes = expectParsed("|cFFFFFFFF$maxcast $ec1|r");

    expect(nodes.find((n) => n.type === "colorCode")).toBeDefined();
    expect(nodes.find((n) => n.type === "miscVariable")).toMatchObject({
      varName: "maxcast",
    });
    expect(nodes.find((n) => n.type === "enchantVariable")).toMatchObject({
      varType: "ec1",
    });
  });

  it("parses expression-mode variables as typed nodes", () => {
    const nodes = expectParsed("${$s1 + $SP}");

    expect(
      nodes.filter((n) => n.type === "effectVariable").length,
    ).toBeGreaterThan(0);
    expect(
      nodes.filter((n) => n.type === "playerVariable").length,
    ).toBeGreaterThan(0);
  });
});

// --- End-to-end text rendering (mocked resolver) ----------------------------

type MockSpell = {
  id: number;
  effects: number[]; // index 1-based in input, but stored 0-based
  durationSec: number;
};

const currentSpell: MockSpell = {
  durationSec: 12,
  effects: [500, 0, 0, 0, 0, 0, 0, 0, 0],
  id: 1000,
};
const otherSpell: MockSpell = { durationSec: 8, effects: [42], id: 2000 };

const playerStats = { SP: 1200 };

function render(ast: ParsedSpellDescription): string {
  let lastNumber: number | undefined;

  const renderNode = (
    node: ParsedSpellDescription["nodes"][number],
  ): string => {
    switch (node.type) {
      case "crossSpellReference": {
        const n = node as CrossSpellReferenceNode;
        const spell = n.spellId === otherSpell.id ? otherSpell : undefined;

        if (!spell) {
          return "$" + n.spellId.toString();
        }

        if (n.varType === "d") {
          lastNumber = spell.durationSec;
          return `${spell.durationSec}s`;
        }
        if (n.varType === "s") {
          const value = spell.effects[(n.effectIndex ?? 1) - 1] ?? 0;
          lastNumber = value;

          return value.toString();
        }

        return `$${n.spellId}${n.varType}${n.effectIndex ?? ""}`;
      }

      case "effectVariable": {
        const n = node as EffectVariableNode;
        const value = currentSpell.effects[n.effectIndex - 1] ?? 0;
        lastNumber = value;

        return value.toString();
      }

      case "playerVariable": {
        const n = node as PlayerVariableNode;
        const value = playerStats[n.varName as "SP"] ?? 0;

        lastNumber = value;

        return value.toString();
      }

      case "pluralization": {
        const n = node as PluralizationNode;
        const word = lastNumber === 1 ? n.singular : n.plural;

        return n.capitalized ? word[0]?.toUpperCase() + word.slice(1) : word;
      }

      case "spellLevelVariable": {
        const value = currentSpell.durationSec;

        lastNumber = value;

        return `${value}s`;
      }
      case "text":
        return (node as TextNode).value;

      default:
        return "";
    }
  };

  return ast.nodes.map(renderNode).join("");
}

describe("rendering text end-to-end", () => {
  it("replaces current spell variables and duration", () => {
    const res = visitSpellDescription("Deals $s1 damage over $d.");
    expect(render(res.ast)).toBe("Deals 500 damage over 12s.");
  });

  it("resolves cross-spell references", () => {
    const res = visitSpellDescription("Also improves $2000s1 for $2000d.");
    expect(render(res.ast)).toBe("Also improves 42 for 8s.");
  });

  it("applies pluralization based on last number", () => {
    const res = visitSpellDescription("$s1 $lstack:stacks;");
    expect(render(res.ast)).toBe("500 stacks");
  });

  it("substitutes player stats in expressions (flat render)", () => {
    const res = visitSpellDescription("Scaling with $SP power.");
    expect(render(res.ast)).toBe("Scaling with 1200 power.");
  });
});
