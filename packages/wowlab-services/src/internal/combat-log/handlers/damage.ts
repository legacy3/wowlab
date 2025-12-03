import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const applyDamage = (
  event: CombatLog.DamageEvent,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const newCurrent = Math.max(0, unit.health.current - event.amount);
      const updatedHealth = Entities.Power.Power.create({
        current: newCurrent,
        max: unit.health.max,
      });

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        health: updatedHealth,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });

    const spellInfo =
      "spellName" in event ? ` (${event.spellName})` : " (melee)";

    yield* Effect.logDebug(
      `Damage: ${event.destName} -${event.amount} HP${spellInfo}`,
    );
  });

export const DAMAGE_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_DAMAGE", applyDamage],
  ["SPELL_PERIODIC_DAMAGE", applyDamage],
  ["SWING_DAMAGE", applyDamage],
  ["RANGE_DAMAGE", applyDamage],
  ["ENVIRONMENTAL_DAMAGE", applyDamage],
];
