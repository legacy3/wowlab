import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog, Enums } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const energize = (
  event: CombatLog.EnergizeEvent,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const powerType = event.powerType as Enums.PowerType;
      const currentPower = unit.power.get(powerType);

      if (!currentPower) {
        const newPower = Entities.Power.Power.create({
          current: event.amount,
          max: 100, // TODO This isn't a given
        });

        const updatedUnit = Entities.Unit.Unit.create({
          ...unit.toObject(),
          power: unit.power.set(powerType, newPower),
        });

        return s.set("units", s.units.set(destId, updatedUnit));
      }

      const newCurrent = Math.min(
        currentPower.current + event.amount,
        currentPower.max,
      );
      const updatedPower = Entities.Power.Power.create({
        current: newCurrent,
        max: currentPower.max,
      });

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        power: unit.power.set(powerType, updatedPower),
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });

    yield* Effect.logDebug(
      `Energize: ${event.destName} +${event.amount} power (type ${event.powerType})`,
    );
  });

const drain = (
  event: CombatLog.DrainEvent,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const powerType = event.powerType as Enums.PowerType;
      const currentPower = unit.power.get(powerType);
      if (!currentPower) {
        return s;
      }

      const newCurrent = Math.max(0, currentPower.current - event.amount);
      const updatedPower = Entities.Power.Power.create({
        current: newCurrent,
        max: currentPower.max,
      });

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        power: unit.power.set(powerType, updatedPower),
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });

    yield* Effect.logDebug(
      `Drain: ${event.destName} -${event.amount} power (type ${event.powerType})`,
    );
  });

export const POWER_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_ENERGIZE", energize],
  ["SPELL_PERIODIC_ENERGIZE", energize],
  ["SPELL_DRAIN", drain],
  ["SPELL_PERIODIC_DRAIN", drain],
];
