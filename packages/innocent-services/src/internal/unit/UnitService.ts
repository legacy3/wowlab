import * as Entities from "@packages/innocent-domain/Entities";
import * as Events from "@packages/innocent-domain/Events";
import * as State from "@packages/innocent-domain/State";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as Accessors from "@/Accessors";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";

export class UnitService extends Effect.Service<UnitService>()("UnitService", {
  dependencies: [
    StateServices.StateService.Default,
    Accessors.UnitAccessor.Default,
    Scheduler.EventSchedulerService.Default,
  ],
  effect: Effect.gen(function* () {
    const state = yield* StateServices.StateService;
    const accessor = yield* Accessors.UnitAccessor;
    const scheduler = yield* Scheduler.EventSchedulerService;

    return {
      // === CRUD OPERATIONS ===

      add: (unit: Entities.Unit) =>
        state.updateState((s: State.GameState) =>
          s.setIn(["units", unit.id], unit),
        ),

      remove: (unitId: Branded.UnitID) =>
        state.updateState((s: State.GameState) =>
          s.set("units", s.units.delete(unitId)),
        ),

      update: (unit: Entities.Unit) =>
        state.updateState((s: State.GameState) =>
          s.setIn(["units", unit.id], unit),
        ),

      // === HEALTH NAMESPACE ===

      health: {
        damage: (unitId: Branded.UnitID, amount: number) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentState = yield* state.getState();
            const updatedHealth = unit.health.transform.value.decrement({
              amount,
              time: currentState.currentTime,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["units", unitId, "health"], updatedHealth),
            );
          }),

        heal: (unitId: Branded.UnitID, amount: number) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentState = yield* state.getState();
            const updatedHealth = unit.health.transform.value.increment({
              amount,
              time: currentState.currentTime,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["units", unitId, "health"], updatedHealth),
            );
          }),

        set: (unitId: Branded.UnitID, newHealth: number) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentState = yield* state.getState();
            const updatedHealth = unit.health.transform.value.set({
              time: currentState.currentTime,
              value: newHealth,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["units", unitId, "health"], updatedHealth),
            );
          }),
      },

      // === AURA NAMESPACE ===

      aura: {
        add: (unitId: Branded.UnitID, aura: Entities.Aura) =>
          Effect.gen(function* () {
            yield* state.updateState((s: State.GameState) => {
              const unit = s.units.get(unitId);
              if (!unit) {
                return s;
              }
              const updatedUnit = {
                ...unit,
                auras: {
                  ...unit.auras,
                  all: unit.auras.all.set(aura.info.id, aura),
                },
              };
              return s.setIn(["units", unitId], updatedUnit);
            });

            // Schedule aura expiry event
            const auraId = aura.info.id;

            yield* scheduler.schedule({
              execute: Effect.gen(function* () {
                const currentState = yield* state.getState();
                const unit = currentState.units.get(unitId);

                if (!unit) {
                  return; // Unit removed
                }

                const currentAura = unit.auras.all.get(auraId);
                if (!currentAura) {
                  return; // Aura already removed
                }

                // Remove expired aura
                yield* state.updateState((s: State.GameState) => {
                  const u = s.units.get(unitId);
                  if (!u) {
                    return s;
                  }

                  return s.setIn(
                    ["units", unitId, "auras", "all"],
                    u.auras.all.delete(auraId),
                  );
                });
              }),
              id: `aura_expire_${unitId}_${auraId}_${aura.expiresAt}`,
              payload: {
                aura,
                unitId,
              },
              priority: Events.EVENT_PRIORITY[Events.EventType.AURA_EXPIRE],
              time: aura.expiresAt,
              type: Events.EventType.AURA_EXPIRE,
            });
          }),

        remove: (unitId: Branded.UnitID, auraId: Branded.SpellID) =>
          state.updateState((s: State.GameState) => {
            const unit = s.units.get(unitId);
            if (!unit) {
              return s;
            }
            const updatedUnit = {
              ...unit,
              auras: {
                ...unit.auras,
                all: unit.auras.all.delete(auraId),
              },
            };
            return s.setIn(["units", unitId], updatedUnit);
          }),

        update: (unitId: Branded.UnitID, aura: Entities.Aura) =>
          state.updateState((s: State.GameState) => {
            const unit = s.units.get(unitId);
            if (!unit) {
              return s;
            }
            const updatedUnit = {
              ...unit,
              auras: {
                ...unit.auras,
                all: unit.auras.all.set(aura.info.id, aura),
              },
            };
            return s.setIn(["units", unitId], updatedUnit);
          }),
      },

      // === RESOURCE NAMESPACE ===

      resource: {
        consume: (
          unitId: Branded.UnitID,
          amount: number,
          powerKey: Entities.PowerKey = "mana",
        ) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentPower = unit.power.get(powerKey);

            if (!currentPower) {
              return;
            }

            const currentState = yield* state.getState();
            const updatedPower = currentPower.transform.value.decrement({
              amount,
              time: currentState.currentTime,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["units", unitId, "power", powerKey], updatedPower),
            );
          }).pipe(Effect.catchTag("UnitNotFound", () => Effect.void)),

        regenerate: (
          unitId: Branded.UnitID,
          amount: number,
          powerKey: Entities.PowerKey = "mana",
        ) =>
          Effect.gen(function* () {
            const unit = yield* accessor.get(unitId);
            const currentPower = unit.power.get(powerKey);

            if (!currentPower) {
              return;
            }

            const currentState = yield* state.getState();
            const updatedPower = currentPower.transform.value.increment({
              amount,
              time: currentState.currentTime,
            });

            yield* state.updateState((s: State.GameState) =>
              s.setIn(["units", unitId, "power", powerKey], updatedPower),
            );
          }).pipe(Effect.catchTag("UnitNotFound", () => Effect.void)),

        regenerateAll: () =>
          state.updateState((s: State.GameState) => {
            const regenInterval = 2000; // 2 seconds
            const durationSeconds = regenInterval / 1000;
            const regenRate = 0.05;
            let newState = s;

            s.units.forEach((unit, unitId) => {
              if (!unit.isPlayer) {
                return;
              }

              const mana = unit.power.get("mana");
              if (!mana || mana.current >= mana.max) {
                return;
              }

              const regenAmount = Math.floor(
                mana.max * regenRate * durationSeconds,
              );

              if (regenAmount > 0) {
                const newMana = mana.transform.value.increment({
                  amount: regenAmount,
                  time: s.currentTime,
                });

                newState = newState.setIn(
                  ["units", unitId, "power", "mana"],
                  newMana,
                );
              }
            });

            return newState;
          }),
      },
    };
  }),
}) {}
