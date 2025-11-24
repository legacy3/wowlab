import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";

import { SpellLifecycleService } from "../../lifecycle/SpellLifecycleService.js";
import { UnitService } from "../../unit/UnitService.js";

/**
 * Applies damage and triggers onDamage lifecycle modifiers.
 * @priority 40 (core game logic)
 */
export const handler: Events.ExecutionCallback<Events.EventType.PROJECTILE_IMPACT> =
  Effect.fn("callbacks.applyDamage")((ctx) =>
    Effect.gen(function* () {
      const unitService = yield* UnitService;
      const lifecycle = yield* SpellLifecycleService;

      yield* unitService.health.damage(ctx.targetUnitId, ctx.damage);
      yield* lifecycle.executeOnDamage(ctx.spell, ctx.damage, ctx.casterUnitId);
    }),
  );
