import * as Entities from "@wowlab/core/Entities";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";

import { StateService } from "../state/StateService.js";
import { UnitAccessor } from "../accessors/UnitAccessor.js";

export class UnitService extends Effect.Service<UnitService>()("UnitService", {
  dependencies: [UnitAccessor.Default],
  effect: Effect.gen(function* () {
    const state = yield* StateService;
    const accessor = yield* UnitAccessor;

    return {
      add: (unit: Entities.Unit.Unit) =>
        state.updateState((s) => s.setIn(["units", unit.id], unit)),

      remove: (unitId: Schemas.Branded.UnitID) =>
        state.updateState((s) => s.set("units", s.units.delete(unitId))),

      update: (unit: Entities.Unit.Unit) =>
        state.updateState((s) => s.setIn(["units", unit.id], unit)),

      // Health operations
      health: {
        damage: (unitId: Schemas.Branded.UnitID, amount: number) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentState = yield* state.getState;
            const updatedHealth = unit.health.set(
              "current",
              Math.max(0, unit.health.current - amount),
            );

            yield* state.updateState((s) =>
              s.setIn(["units", unitId, "health"], updatedHealth),
            );
          }),
      },
    };
  }),
}) {}
