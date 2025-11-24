import * as Schemas from "@wowlab/core/Schemas";
import { kebabCase, pascalCase } from "change-case";
import * as Schema from "effect/Schema";

import type { RaidbotsTalentsSchema } from "./types";
import type { SpecSpellMap, SpellEntry } from "./types";

export const extractSpellEntriesBySpec = (
  talents: Schema.Schema.Type<typeof RaidbotsTalentsSchema>,
): ReadonlyArray<SpecSpellMap> => {
  return talents.map((spec) => {
    const spellMap = new Map<Schemas.Branded.SpellID, SpellEntry>();
    const allNodes = [...spec.classNodes, ...spec.specNodes, ...spec.heroNodes];

    for (const node of allNodes) {
      for (const entry of node.entries) {
        if ("spellId" in entry && entry.spellId) {
          const spellId = Schemas.Branded.SpellID(entry.spellId);
          if (!spellMap.has(spellId)) {
            spellMap.set(spellId, {
              name: entry.name,
              normalizedName: pascalCase(entry.name),
              spellId,
            });
          }
        }
      }
    }

    const classSlug = kebabCase(spec.className);
    const specSlug = kebabCase(spec.specName);
    return {
      classId: `class-${classSlug}`,
      className: spec.className,
      classSlug,
      specId: `spec-${classSlug}-${specSlug}`,
      specName: spec.specName,
      specSlug,
      spells: Array.from(spellMap.values()).sort(
        (a, b) => a.spellId - b.spellId,
      ),
    };
  });
};
