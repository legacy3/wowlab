import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as Cast from "./cast/index.js";
import * as Cooldown from "./cooldown/index.js";
import * as Damage from "./damage/index.js";
import { EventHandlerRegistry } from "./registry/EventHandlerRegistry.js";

/**
 * Bootstrap layer that registers all event handlers.
 * Run this at application startup to configure the event system.
 *
 * Phase execution order: CLEANUP → CORE → SECONDARY → POST
 */
const registerAllHandlers = Effect.gen(function* () {
  const registry = yield* EventHandlerRegistry;

  // SPELL_CAST_COMPLETE handlers
  registry.register({
    callback: Cast.clearCastState,
    eventType: Events.EventType.SPELL_CAST_COMPLETE,
    name: "clearCastState",
    phase: Events.HandlerPhase.CLEANUP,
    phasePriority: -10,
  });

  registry.register({
    callback: Cast.executeOnCast,
    eventType: Events.EventType.SPELL_CAST_COMPLETE,
    name: "executeOnCast",
    phase: Events.HandlerPhase.SECONDARY,
  });

  // SPELL_COOLDOWN_READY handlers
  registry.register({
    callback: Cooldown.cooldownReady,
    eventType: Events.EventType.SPELL_COOLDOWN_READY,
    name: "cooldownReady",
    phase: Events.HandlerPhase.CORE,
  });

  // SPELL_CHARGE_READY handlers
  registry.register({
    callback: Cooldown.incrementCharge,
    eventType: Events.EventType.SPELL_CHARGE_READY,
    name: "incrementCharge",
    phase: Events.HandlerPhase.CORE,
  });

  // PROJECTILE_IMPACT handlers
  registry.register({
    callback: Damage.applyDamage,
    eventType: Events.EventType.PROJECTILE_IMPACT,
    name: "applyDamage",
    phase: Events.HandlerPhase.CORE,
    phasePriority: -5,
  });

  yield* Effect.log("Event handlers registered successfully");
});

/**
 * Layer that provides event handler registration.
 * Add this to your application's main layer.
 *
 * Requirements: EventHandlerRegistry
 * Provides: Nothing (side-effect only)
 */
export const EventHandlerBootstrapLayer: Layer.Layer<
  never,
  never,
  EventHandlerRegistry
> = Layer.effectDiscard(registerAllHandlers);
