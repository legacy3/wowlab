import { Entities, Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

import { StateService } from "../../state/StateService.js";

/**
 * Clears casting state when a spell cast completes.
 * @priority 10 (runs early, before other handlers need clean state)
 */
export const handler: Events.ExecutionCallback<Events.EventType.SPELL_CAST_COMPLETE> =
  Effect.fn("callbacks.clearCastState")((ctx) =>
    Effect.gen(function* () {
      const state = yield* StateService;
      const gameState = yield* state.getState();

      const caster = gameState.units.get(ctx.casterId);
      if (!caster) {
        return;
      }

      const clearedCaster = Entities.Unit.Unit.create({
        ...caster.toObject(),
        castingSpellId: null,
        castRemaining: 0,
        castTarget: null,
        isCasting: false,
      });

      yield* state.updateState((s) =>
        s.set("units", s.units.set(ctx.casterId, clearedCaster)),
      );
    }),
  );
