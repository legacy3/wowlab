import * as Events from "@packages/innocent-domain/Events";
import * as Branded from "@packages/innocent-schemas/Branded";
import * as Effect from "effect/Effect";

import * as Accessors from "@/Accessors";
import * as CastQueue from "@/CastQueue";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";
import * as Unit from "@/Unit";

// TODO Remove this
const AUTO_SHOT_SPELL_ID = Branded.SpellID(75); // https://www.wowhead.com/spell=75/auto-shot

export class PeriodicTriggerService extends Effect.Service<PeriodicTriggerService>()(
  "PeriodicTriggerService",
  {
    dependencies: [
      StateServices.StateService.Default,
      Unit.UnitService.Default,
      Accessors.UnitAccessor.Default,
      Scheduler.EventSchedulerService.Default,
      Accessors.SpellAccessor.Default,
      CastQueue.CastQueueService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateServices.StateService;
      const units = yield* Unit.UnitService;
      const unitAccessor = yield* Accessors.UnitAccessor;
      const scheduler = yield* Scheduler.EventSchedulerService;
      const spellAccessor = yield* Accessors.SpellAccessor;
      const castQueue = yield* CastQueue.CastQueueService;

      const RESOURCE_REGEN_INTERVAL = 2000;
      const AUTO_SHOT_INTERVAL = 2500;

      return {
        startPeriodic: (maxDuration: number) =>
          Effect.gen(function* () {
            // Schedule resource regeneration
            const scheduleResourceRegen = (
              time: number,
            ): Effect.Effect<void, never, typeof scheduler | typeof units> =>
              Effect.gen(function* () {
                if (time > maxDuration) {
                  return;
                }

                yield* scheduler.schedule({
                  execute: Effect.gen(function* () {
                    yield* units.resource.regenerateAll();

                    const currentState = yield* state.getState();
                    const nextRegenTime =
                      currentState.currentTime + RESOURCE_REGEN_INTERVAL;

                    yield* scheduleResourceRegen(nextRegenTime);
                  }),
                  id: `periodic_power_${time}`,
                  payload: {},
                  priority:
                    Events.EVENT_PRIORITY[Events.EventType.PERIODIC_POWER],
                  time,
                  type: Events.EventType.PERIODIC_POWER,
                });
              });

            // Schedule auto shot - just cast the auto shot spell!
            const scheduleAutoShot = (
              time: number,
            ): Effect.Effect<void, never, unknown> =>
              Effect.gen(function* () {
                if (time > maxDuration) {
                  return;
                }

                yield* scheduler.schedule({
                  execute: Effect.gen(function* () {
                    const player = yield* unitAccessor.player();
                    const autoShotSpell = yield* spellAccessor.get(
                      player.id,
                      AUTO_SHOT_SPELL_ID,
                    );

                    // Just cast it like any other spell!
                    yield* castQueue.enqueue(autoShotSpell);

                    // Schedule next auto shot
                    const currentState = yield* state.getState();
                    const nextAutoShotTime =
                      currentState.currentTime + AUTO_SHOT_INTERVAL;

                    yield* scheduleAutoShot(nextAutoShotTime);
                  }),
                  id: `periodic_spell_${time}`,
                  payload: {},
                  priority:
                    Events.EVENT_PRIORITY[Events.EventType.PERIODIC_SPELL],
                  time,
                  type: Events.EventType.PERIODIC_SPELL,
                });
              });

            // Start all periodic triggers
            yield* scheduleResourceRegen(RESOURCE_REGEN_INTERVAL);
            yield* scheduleAutoShot(AUTO_SHOT_INTERVAL);
          }),
      };
    }),
  },
) {}
