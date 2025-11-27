import * as Errors from "@wowlab/core/Errors";
import { Branded } from "@wowlab/core/Schemas";
import * as Accessors from "@wowlab/services/Accessors";
import * as Log from "@wowlab/services/Log";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [Unit.UnitService.Default, Accessors.UnitAccessor.Default],
    effect: Effect.gen(function* () {
      const unitAccessor = yield* Accessors.UnitAccessor;
      const stateService = yield* State.StateService;
      const logService = yield* Log.LogService;

      const logger = yield* logService.withName("SpellActions");

      return {
        canCast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));
            return spell !== undefined;
          }),

        cast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));
            if (!spell) {
              return yield* Effect.fail(
                new Errors.SpellNotFound({ spellId, unitId }),
              );
            }

            const state = yield* stateService.getState();
            const timestamp = state.currentTime;

            // logger.info( TODO Fix info logger not showing in @apps/standalone
            yield* Effect.logInfo(
              `[${timestamp.toFixed(3)}s] SPELL_CAST_SUCCESS: ${unit.name} casts ${spell.info.name} (${spellId})`,
            );
          }),
      };
    }),
  },
) { }
