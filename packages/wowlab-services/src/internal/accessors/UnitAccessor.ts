import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class UnitAccessor extends Effect.Service<UnitAccessor>()(
  "UnitAccessor",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        get: (unitId: Schemas.Branded.UnitID) =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            const unit = gameState.units.get(unitId);

            return unit
              ? Effect.succeed(unit)
              : Effect.fail(new Errors.UnitNotFound({ unitId }));
          }).pipe(Effect.flatten),

        getAll: () =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            return Array.from(gameState.units.values());
          }),

        updateSpell: (
          unitId: Schemas.Branded.UnitID,
          spellId: Schemas.Branded.SpellID,
          updatedSpell: Entities.Spell.Spell,
        ) =>
          state.updateState((s) =>
            s.setIn(["units", unitId, "spells", "all", spellId], updatedSpell),
          ),
      };
    }),
  },
) {}
