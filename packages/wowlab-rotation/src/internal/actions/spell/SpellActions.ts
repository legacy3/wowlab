import * as Errors from "@wowlab/core/Errors";
import { Branded } from "@wowlab/core/Schemas";
import * as Accessors from "@wowlab/services/Accessors";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [Unit.UnitService.Default, Accessors.UnitAccessor.Default],
    effect: Effect.gen(function* () {
      const unitAccessor = yield* Accessors.UnitAccessor;

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
            // TODO: Implement with new combat log architecture
            yield* Effect.void;
          }),
      };
    }),
  },
) {}
