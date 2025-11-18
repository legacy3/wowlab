import * as Entities from "@packages/innocent-domain/Entities";
import * as Errors from "@packages/innocent-domain/Errors";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as State from "@/State";

export class UnitAccessor extends Effect.Service<UnitAccessor>()(
  "UnitAccessor",
  {
    dependencies: [State.StateService.Default],
    effect: Effect.gen(function* () {
      const stateService = yield* State.StateService;

      return {
        all: () =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            return state.units.toArray().map(([_, unit]) => unit);
          }),

        get: (id: Branded.UnitID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(id);
            if (!unit) {
              return yield* Effect.fail(
                new Errors.UnitNotFound({ unitId: id }),
              );
            }
            return unit;
          }),

        getAura: (unitId: Branded.UnitID, auraId: Branded.SpellID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }
            return unit.auras.all.get(auraId);
          }),

        getAuras: (unitId: Branded.UnitID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(unitId);
            if (!unit) {
              return yield* Effect.fail(new Errors.UnitNotFound({ unitId }));
            }
            return unit.auras.all;
          }),

        getOrNull: (id: Branded.UnitID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const unit = state.units.get(id);
            return unit ?? Entities.createNotFoundUnit(id);
          }),

        has: (id: Branded.UnitID) =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            return state.units.has(id);
          }),

        player: () =>
          Effect.gen(function* () {
            const state = yield* stateService.getState();
            const playerUnit = state.units
              .toArray()
              .map(([_, unit]) => unit)
              .find((unit) => unit.isPlayer);

            if (!playerUnit) {
              return yield* Effect.fail(
                new Errors.UnitNotFound({
                  unitId: Branded.UnitID("player"),
                }),
              );
            }
            return playerUnit;
          }),
      };
    }),
  },
) {}
