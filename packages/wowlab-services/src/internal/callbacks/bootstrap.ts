import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as Cast from "./cast/index.js";
import * as Cooldown from "./cooldown/index.js";
import * as Damage from "./damage/index.js";
import {
  defineHandler,
  EventHandlerRegistry,
} from "./registry/EventHandlerRegistry.js";

/**
 * Bootstrap layer that registers all event handlers.
 * Run this at application startup to configure the event system.
 *
 * Priority guide:
 * - 0-20: Critical pre-processing (state cleanup, validation)
 * - 20-50: Core game logic (damage, healing, resource changes)
 * - 50-100: Secondary effects (procs, triggers, modifiers)
 * - 100+: Post-processing (logging, metrics, cleanup)
 */
const registerAllHandlers = Effect.gen(function* () {
  const registry = yield* EventHandlerRegistry;

  // SPELL_CAST_COMPLETE handlers
  registry.register(
    Events.EventType.SPELL_CAST_COMPLETE,
    "clearCastState",
    Cast.clearCastState,
    10, // Early: cleanup before other handlers
  );

  registry.register(
    Events.EventType.SPELL_CAST_COMPLETE,
    "executeOnCast",
    Cast.executeOnCast,
    50, // Mid: trigger spell modifiers
  );

  // SPELL_COOLDOWN_READY handlers
  registry.register(
    Events.EventType.SPELL_COOLDOWN_READY,
    "cooldownReady",
    Cooldown.cooldownReady,
    50, // Mid: update spell state
  );

  // SPELL_CHARGE_READY handlers
  registry.register(
    Events.EventType.SPELL_CHARGE_READY,
    "incrementCharge",
    Cooldown.incrementCharge,
    50, // Mid: update spell charges
  );

  // PROJECTILE_IMPACT handlers
  registry.register(
    Events.EventType.PROJECTILE_IMPACT,
    "applyDamage",
    Damage.applyDamage,
    40, // Core game logic: damage + onDamage modifiers
  );

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
