import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface MetadataService {
  readonly loadItem: (
    id: number,
  ) => Effect.Effect<unknown, Errors.ItemNotFound>; // TODO: Define Item entity
  readonly loadSpell: (
    id: Schemas.Branded.SpellID,
  ) => Effect.Effect<Entities.Spell.SpellInfo, Errors.SpellInfoNotFound>;
}

export const MetadataService = Context.GenericTag<MetadataService>(
  "@wowlab/services/MetadataService",
);
