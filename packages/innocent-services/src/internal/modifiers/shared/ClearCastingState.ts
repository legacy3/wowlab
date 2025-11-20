import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";

import * as Accessors from "@/Accessors";
import * as Log from "@/Log";
import * as Unit from "@/Unit";

export const ClearCastingState: Entities.Types.SpellModifier = {
  name: "clear-casting-state",

  onCast: (spell) =>
    pipe(
      Effect.gen(function* () {
        if (spell.info.castTime === 0) {
          return; // Instant spells don't set isCasting
        }

        const unitAccessor = yield* Accessors.UnitAccessor;
        const unitService = yield* Unit.UnitService;
        const logService = yield* Log.LogService;

        const player = yield* unitAccessor.player();
        const updatedPlayer = { ...player, isCasting: false };
        yield* unitService.update(updatedPlayer);

        yield* logService.debug("ClearCastingState", "Cleared isCasting flag", {
          spellId: spell.info.id,
          spellName: spell.info.name,
        });
      }),
      Effect.mapError(
        (error) =>
          new Errors.Modifier({
            modifierName: "clear-casting-state",
            phase: "onCast",
            reason: String(error),
            spell,
          }),
      ),
      Effect.annotateLogs("modifier", "clear-casting-state"),
    ),
};
