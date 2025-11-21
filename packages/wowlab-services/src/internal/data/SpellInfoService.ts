import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

export interface SpellInfoService {
  readonly getSpellInfo: (
    id: Schemas.Branded.SpellID,
  ) => Effect.Effect<Entities.Spell.SpellInfo, Errors.SpellInfoNotFound>;
}

export const SpellInfoService = Context.GenericTag<SpellInfoService>(
  "@wowlab/services/SpellInfoService",
);
