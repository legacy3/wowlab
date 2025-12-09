import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

interface PeriodicEventWithTick extends CombatLog.SpellPeriodicDamage {
  readonly tickPeriodMs?: number;
}

interface PeriodicHealEventWithTick extends CombatLog.SpellPeriodicHeal {
  readonly tickPeriodMs?: number;
}

const handlePeriodicDamageTick = (
  event: PeriodicEventWithTick,
  emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();

    const destId = Branded.UnitID(event.destGUID);
    const unit = currentState.units.get(destId);
    if (!unit) {
      return;
    }

    const spellId = Branded.SpellID(event.spellId);
    const aura = unit.auras.all.get(spellId);
    if (!aura) {
      return;
    }

    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) {
      return;
    }

    emitter.emitAt(tickPeriodMs, {
      ...event,
      _tag: "SPELL_PERIODIC_DAMAGE",
      tickPeriodMs,
    } as any);
  });

const handlePeriodicHealTick = (
  event: PeriodicHealEventWithTick,
  emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;
    const currentState = yield* state.getState();

    const destId = Branded.UnitID(event.destGUID);
    const unit = currentState.units.get(destId);
    if (!unit) {
      return;
    }

    const spellId = Branded.SpellID(event.spellId);
    const aura = unit.auras.all.get(spellId);
    if (!aura) {
      return;
    }

    const tickPeriodMs = event.tickPeriodMs ?? 0;
    if (tickPeriodMs <= 0) {
      return;
    }

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
