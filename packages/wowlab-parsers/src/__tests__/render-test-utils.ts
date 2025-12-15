import type { SpellDescriptionNode } from "../internal/spell-description";

import { visitSpellDescription } from "../internal/spell-description";

// Exported defaults so tests can reference the mock substitution values.
export const DEFAULT_RENDER_MOCKS = {
  crossRefValue: 1,
  effectValue: 1,
  enchantValue: 0,
  miscValue: 0,
  playerValue: 100,
  spellLevelSeconds: 15,
};

export function renderDescriptionWithMocks(
  _id: number,
  raw: string,
): { text: string; errors: readonly unknown[]; lexErrors: readonly unknown[] } {
  const parsed = visitSpellDescription(raw);
  const text = renderNodes(parsed.ast.nodes);

  return { errors: parsed.errors, lexErrors: parsed.lexErrors, text };
}

function renderNodes(nodes: ReadonlyArray<SpellDescriptionNode>): string {
  let lastNumber: number | null = null;

  const setNumber = (value: number) => {
    lastNumber = value;
    return String(value);
  };

  return nodes
    .map((node) => {
      switch (node.type) {
        case "atVariable":
          return `<@${node.varType}${node.spellId ?? ""}>`;

        case "colorCode":
          return "";

        case "crossSpellReference":
          return setNumber(DEFAULT_RENDER_MOCKS.crossRefValue);

        case "customVariable":
          return `<${node.varName}>`;

        case "effectVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.effectValue);
        case "enchantVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.enchantValue);

        case "gender":
          return node.male;

        case "miscVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.miscValue);
        case "playerVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.playerValue);

        case "pluralization": {
          const word = lastNumber === 1 ? node.singular : node.plural;

          return node.capitalized
            ? word.replace(/^./, (c) => c.toUpperCase())
            : word;
        }

        case "spellLevelVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.spellLevelSeconds);

        case "text":
          return node.value;

        default:
          return "";
      }
    })
    .join("");
}
