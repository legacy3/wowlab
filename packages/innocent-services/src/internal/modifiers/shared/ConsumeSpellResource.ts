import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Log from "@/Log";
import * as Unit from "@/Unit";

export const ConsumeSpellResource: Entities.SpellModifier = {
  name: "consume-spell-resource",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        const logService = yield* Log.LogService;

        if (spell.info.manaCost === 0) {
          yield* logService.debug(
            "ConsumeSpellResource",
            "No resource cost, skipping consumption",
            {
              spellId: spell.info.id,
              spellName: spell.info.name,
            },
          );
          return;
        }

        const units = yield* Unit.UnitService;
        yield* units.resource.consume(
          Branded.UnitID("player"),
          spell.info.manaCost,
        );

        yield* logService.debug("ConsumeSpellResource", "Consumed mana", {
          manaCost: spell.info.manaCost,
          spellId: spell.info.id,
          spellName: spell.info.name,
        });
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "consume-spell-resource",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "consume-spell-resource"),
    ),
};
