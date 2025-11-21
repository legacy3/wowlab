import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

export interface RotationDefinition {
  name: string;
  run: (
    playerId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, any, Context.RotationContext>;
  setupPlayer: (id: Schemas.Branded.UnitID) => Entities.Unit.Unit;
  spells: Schemas.Spell.SpellDataFlat[];
}
