import * as Errors from "@wowlab/core/Errors";
import { Branded } from "@wowlab/core/Schemas";
import * as Accessors from "@wowlab/services/Accessors";
import * as CastQueue from "@wowlab/services/CastQueue";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

export class SpellActions extends Effect.Service<SpellActions>()(
  "SpellActions",
  {
    dependencies: [
      Unit.UnitService.Default,
      Accessors.UnitAccessor.Default,
      CastQueue.CastQueueService.Default,
    ],
    effect: Effect.gen(function* () {
      const unitAccessor = yield* Accessors.UnitAccessor;
      const castQueue = yield* CastQueue.CastQueueService;

      return {
        canCast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            const unit = yield* unitAccessor.get(unitId);
            const spell = unit.spells.all.get(Branded.SpellID(spellId));

            // Check cooldown, resource, etc.
            // For now, just check existence
            return spell !== undefined;
          }),

        cast: (unitId: Branded.UnitID, spellId: number) =>
          Effect.gen(function* () {
            // Get unit
            const unit = yield* unitAccessor.get(unitId);

            // Get spell from unit
            const spell = unit.spells.all.get(Branded.SpellID(spellId));
            if (!spell) {
              return yield* Effect.fail(
                new Errors.SpellNotFound({ spellId, unitId }),
              );
            }

            // Enqueue cast - this will interrupt the fiber if successful
            // TODO This compiles
            yield* Effect.log(`Casting ${spell.info.name}`);

            // This doesnt?
            // yield* castQueue.enqueue(spell).pipe(Effect.orDie);
          }),
      };
    }),
  },
) {}
