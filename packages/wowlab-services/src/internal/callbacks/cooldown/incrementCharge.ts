import { Entities, Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

import { StateService } from "../../state/StateService.js";

/**
 * Increments spell charge when charge cooldown completes.
 * @priority 50
 */
export const handler: Events.ExecutionCallback<Events.EventType.SPELL_CHARGE_READY> =
  Effect.fn("callbacks.incrementCharge")((ctx) =>
    Effect.gen(function* () {
      const state = yield* StateService;

      yield* state.updateState((s) => {
        const unit = s.units.get(ctx.casterId);
        if (!unit) return s;

        const currentSpell = unit.spells.all.get(ctx.spell.info.id);
        if (!currentSpell) return s;

        const withCharge = currentSpell.transform.charges.increment({
          amount: 1,
          time: s.currentTime,
        });

        const readySpell = withCharge.transform.cooldown.set({
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
