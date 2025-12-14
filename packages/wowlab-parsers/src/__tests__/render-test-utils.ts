import { visitSpellDescription } from "../internal/spell-description";
import type { SpellDescriptionNode } from "../internal/spell-description";

// Exported defaults so tests can reference the mock substitution values.
export const DEFAULT_RENDER_MOCKS = {
  effectValue: 1,
  spellLevelSeconds: 15,
  playerValue: 100,
  enchantValue: 0,
  miscValue: 0,
  crossRefValue: 1,
};

export function renderDescriptionWithMocks(
  _id: number,
  raw: string,
): { text: string; errors: readonly unknown[]; lexErrors: readonly unknown[] } {
  const parsed = visitSpellDescription(raw);
  const text = renderNodes(parsed.ast.nodes);

  return { text, errors: parsed.errors, lexErrors: parsed.lexErrors };
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
        case "text":
          return node.value;

        case "effectVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.effectValue);

        case "spellLevelVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.spellLevelSeconds);

        case "playerVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.playerValue);

        case "enchantVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.enchantValue);
        case "miscVariable":
          return setNumber(DEFAULT_RENDER_MOCKS.miscValue);

        case "crossSpellReference":
          return setNumber(DEFAULT_RENDER_MOCKS.crossRefValue);

        case "pluralization": {
          const word = lastNumber === 1 ? node.singular : node.plural;

          return node.capitalized
            ? word.replace(/^./, (c) => c.toUpperCase())
            : word;
        }
        case "gender":
          return node.male;

        case "atVariable":
          return `<@${node.varType}${node.spellId ?? ""}>`;

        case "customVariable":
          return `<${node.varName}>`;

        case "colorCode":
          return "";

        default:
          return "";
      }
    })
    .join("");
}
