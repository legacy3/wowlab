import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const applyHealing = (
  event: CombatLog.HealEvent,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const newCurrent = Math.min(
        unit.health.current + event.amount,
        unit.health.max,
      );
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
  });

export const HEAL_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_HEAL", applyHealing],
  ["SPELL_PERIODIC_HEAL", applyHealing],
];
