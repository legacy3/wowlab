/**
 * Periodic Tick Handlers
 *
 * Per docs/aura-system/06-phase4-periodic-ticks.md:
 * - tickPeriodMs snapshot lives on event payload, not entities
 * - Haste is applied at schedule-time only
 * - Check if aura exists before rescheduling (stale handling)
 */
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

/**
 * Extended periodic event type with tickPeriodMs payload
 * Per Phase 4 docs: tick period snapshot lives on the queued event payload
 */
interface PeriodicEventWithTick extends CombatLog.SpellPeriodicDamage {
  readonly tickPeriodMs?: number;
}

interface PeriodicHealEventWithTick extends CombatLog.SpellPeriodicHeal {
  readonly tickPeriodMs?: number;
}

/**
 * Handle periodic damage tick.
 * Per Phase 4 docs:
 * - Check if aura still exists (stale check)
 * - Schedule next tick using tickPeriodMs from event payload
 */
const handlePeriodicDamageTick = (
  event: PeriodicEventWithTick,
  emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();

    // Check if aura still exists (stale event handling)
    const destId = Branded.UnitID(event.destGUID);
    const unit = currentState.units.get(destId);
    if (!unit) return;

    const spellId = Branded.SpellID(event.spellId);
    const aura = unit.auras.all.get(spellId);
    if (!aura) return; // Stale tick - aura was removed

    // Get tick period from event payload
    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) return;

    // Schedule next tick
    emitter.emitAt(tickPeriodMs, {
      ...event,
      _tag: "SPELL_PERIODIC_DAMAGE",
      tickPeriodMs,
    } as any);
  });

/**
 * Handle periodic heal tick.
 * Same logic as damage tick.
 */
const handlePeriodicHealTick = (
  event: PeriodicHealEventWithTick,
  emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();

    // Check if aura still exists (stale event handling)
    const destId = Branded.UnitID(event.destGUID);
    const unit = currentState.units.get(destId);
    if (!unit) return;

    const spellId = Branded.SpellID(event.spellId);
    const aura = unit.auras.all.get(spellId);
    if (!aura) return; // Stale tick - aura was removed

    // Get tick period from event payload
    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) return;

    // Schedule next tick
    emitter.emitAt(tickPeriodMs, {
      ...event,
      _tag: "SPELL_PERIODIC_HEAL",
      tickPeriodMs,
    } as any);
  });

export const PERIODIC_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_PERIODIC_DAMAGE", handlePeriodicDamageTick],
  ["SPELL_PERIODIC_HEAL", handlePeriodicHealTick],
];
