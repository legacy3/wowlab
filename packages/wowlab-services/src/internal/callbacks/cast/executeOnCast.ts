import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

import { SpellLifecycleService } from "../../lifecycle/SpellLifecycleService.js";

/**
 * Executes onCast lifecycle modifiers when a spell completes.
 * @priority 50 (runs after state cleanup)
 */
export const handler: Events.ExecutionCallback<Events.EventType.SPELL_CAST_COMPLETE> =
  Effect.fn("callbacks.executeOnCast")((ctx) =>
    Effect.gen(function* () {
      const lifecycle = yield* SpellLifecycleService;
      yield* lifecycle.executeOnCast(ctx.spell, ctx.casterId);
    }),
  );
