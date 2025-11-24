import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as Cast from "./cast/index.js";
import * as Cooldown from "./cooldown/index.js";
import * as Damage from "./damage/index.js";
import { EventHandlerRegistry } from "./registry/EventHandlerRegistry.js";

const registerAllHandlers = Effect.gen(function* () {
  const registry = yield* EventHandlerRegistry;

  registry.registerMany(Events.EventType.SPELL_CAST_COMPLETE, [
    {
      callback: Cast.clearCastState,
      name: "clearCastState",
      phase: Events.HandlerPhase.CLEANUP,
      phasePriority: -10,
    },
    {
      callback: Cast.executeOnCast,
      name: "executeOnCast",
      phase: Events.HandlerPhase.SECONDARY,
    },
  ]);

  registry.register(Events.EventType.SPELL_CHARGE_READY, {
    callback: Cooldown.incrementCharge,
    name: "incrementCharge",
    phase: Events.HandlerPhase.CORE,
  });

  registry.register(Events.EventType.SPELL_COOLDOWN_READY, {
    callback: Cooldown.cooldownReady,
    name: "cooldownReady",
    phase: Events.HandlerPhase.CORE,
  });

  registry.register(Events.EventType.PROJECTILE_IMPACT, {
    callback: Damage.applyDamage,
    name: "applyDamage",
    phase: Events.HandlerPhase.CORE,
    phasePriority: -5,
  });

  yield* Effect.log("Event handlers registered");
});

export const EventHandlerBootstrapLayer: Layer.Layer<
  never,
  never,
  EventHandlerRegistry
> = Layer.effectDiscard(registerAllHandlers);
