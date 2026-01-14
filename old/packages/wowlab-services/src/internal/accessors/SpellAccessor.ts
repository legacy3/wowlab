import * as Errors from "@wowlab/core/Errors";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";

export class SpellAccessor extends Effect.Service<SpellAccessor>()(
  "SpellAccessor",
  {
    effect: Effect.gen(function* () {
      const state = yield* StateService;

      return {
        get: (unitId: Schemas.Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const gameState = yield* state.getState();
            const unit = gameState.units.get(unitId);

            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }

            const spell = unit.spells.all.get(
              spellId as Schemas.Branded.SpellID,
            );

            if (!spell) {
              return yield* Effect.fail(
                new Errors.SpellNotFound({ spellId, unitId }),
              );
            }

            // Recompute spell with current time to ensure isReady is fresh
            const recomputedSpell = spell.with({}, gameState.currentTime);

            return Effect.succeed(recomputedSpell);
          }).pipe(Effect.flatten),
      };
    }),
  },
) {}
