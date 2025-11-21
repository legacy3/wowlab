import * as Errors from "@wowlab/core/Errors";
import { Branded } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import * as Accessors from "@wowlab/services/Accessors";
import * as Unit from "@wowlab/services/Unit";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [Unit.UnitService.Default, Accessors.UnitAccessor.Default],
    effect: Effect.gen(function* () {
      const unitAccessor = yield* Accessors.UnitAccessor;

      return {
        cast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            // Get unit
            const unit = yield* unitAccessor.get(unitId);

            // Get spell from unit
            const spell = unit.spells.all.get(Branded.SpellID(spellId));
            if (!spell) {
              return yield* Effect.fail(
                new Errors.SpellNotFound({ unitId, spellId }),
              );
            }

            // TODO: Start cast via CastQueueService or similar mechanism
            // For now, we just log it as per the plan
            yield* Effect.log(`Casting ${spell.info.name}`);
          }),

        canCast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));

            // Check cooldown, resource, etc.
            // For now, just check existence
            return spell !== undefined;
          }),
      };
    }),
  },
) {}
