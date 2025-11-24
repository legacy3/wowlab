import { Entities, Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

import { StateService } from "../../state/StateService.js";

/**
 * Marks a spell cooldown as ready.
 * @priority 50
 */
export const handler: Events.ExecutionCallback<Events.EventType.SPELL_COOLDOWN_READY> =
  Effect.fn("callbacks.cooldownReady")((ctx) =>
    Effect.gen(function* () {
      const state = yield* StateService;

      yield* state.updateState((s) => {
        const unit = s.units.get(ctx.casterId);
        if (!unit) return s;

        const currentSpell = unit.spells.all.get(ctx.spell.info.id);
        if (!currentSpell) return s;

        const readySpell = currentSpell.transform.cooldown.set({
          time: s.currentTime,
          value: s.currentTime,
        });

        const updatedUnit = Entities.Unit.Unit.create({
          ...unit.toObject(),
          spells: {
            all: unit.spells.all.set(readySpell.info.id, readySpell),
            meta: unit.spells.meta,
          },
        });

        return s.set("units", s.units.set(ctx.casterId, updatedUnit));
      });
    }),
  );
