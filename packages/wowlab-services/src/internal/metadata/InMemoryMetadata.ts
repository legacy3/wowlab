import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Map as ImmutableMap } from "immutable";

import { MetadataService } from "./MetadataService.js";

export interface InMemoryMetadataConfig {
  readonly items: ReadonlyArray<Schemas.Item.ItemDataFlat>;
  readonly spells: ReadonlyArray<Schemas.Spell.SpellDataFlat>;
}

export const InMemoryMetadata = (config: InMemoryMetadataConfig) => {
  const spellMap = ImmutableMap(
    config.spells.map((spell) => [spell.id, spell]),
  );
  const itemMap = ImmutableMap(config.items.map((item) => [item.id, item]));

  return Layer.succeed(
    MetadataService,
    MetadataService.of({
      loadItem: (itemId) => {
        const item = itemMap.get(itemId);
        return item
          ? Effect.succeed(item)
          : Effect.fail(
              new Errors.ItemNotFound({
                itemId,
                message: "Item not found in memory",
              }),
            );
      },
      loadSpell: (spellId) => {
        const spell = spellMap.get(spellId);
        return spell
          ? Effect.succeed(
              Entities.Spell.SpellInfo.create({ ...spell, modifiers: [] }),
            )
          : Effect.fail(
              new Errors.SpellInfoNotFound({
                spellId,
                message: "Spell not found in memory",
              }),
            );
      },
    }),
  );
};
