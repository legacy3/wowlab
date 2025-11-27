import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Context from "@wowlab/rotation/Context";
import * as Effect from "effect/Effect";

export interface RotationDefinition {
  name: string;
  run: (
    playerId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, Errors.RotationError, Context.RotationContext>;
  setupPlayer: (
    id: Schemas.Branded.UnitID,
    spells: Schemas.Spell.SpellDataFlat[],
  ) => Entities.Unit.Unit;
  spellIds: number[];
}
