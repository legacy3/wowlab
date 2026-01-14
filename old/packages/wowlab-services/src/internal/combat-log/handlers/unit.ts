import * as Entities from "@wowlab/core/Entities";
import { Branded, CombatLog } from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import type { Emitter } from "../Emitter.js";
import type { StateMutation } from "./types.js";

import { StateService } from "../../state/StateService.js";

const summonUnit = (
  event: CombatLog.SpellSummon,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      if (s.units.has(destId)) {
        return s;
      }

      const newUnit = Entities.Unit.Unit.create({
        health: Entities.Power.Power.create({ current: 100, max: 100 }), // TODO actual defaults
        id: destId,
        isPlayer: false,
        name: event.destName,
      });

      return s.set("units", s.units.set(destId, newUnit));
    });
  });

const unitDied = (
  event: CombatLog.UnitDied,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      const unit = s.units.get(destId);
      if (!unit) {
        return s;
      }

      const updatedHealth = Entities.Power.Power.create({
        current: 0,
        max: unit.health.max,
      });

      const updatedUnit = Entities.Unit.Unit.create({
        ...unit.toObject(),
        health: updatedHealth,
      });

      return s.set("units", s.units.set(destId, updatedUnit));
    });
  });

const destroyUnit = (
  event: CombatLog.UnitDestroyed,
  _emitter: Emitter,
): Effect.Effect<void, never, StateService> =>
  Effect.gen(function* () {
    const state = yield* StateService;

    yield* state.updateState((s) => {
      const destId = Branded.UnitID(event.destGUID);
      return s.set("units", s.units.delete(destId));
    });
  });

export const UNIT_MUTATIONS: readonly StateMutation[] = [
  ["SPELL_SUMMON", summonUnit],
  ["UNIT_DIED", unitDied],
  ["UNIT_DESTROYED", destroyUnit],
];
