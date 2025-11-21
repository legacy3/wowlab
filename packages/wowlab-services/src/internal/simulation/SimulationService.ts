import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";

import { EventSchedulerService } from "../scheduler/EventSchedulerService.js";
import { StateService } from "../state/StateService.js";
import { UnitService } from "../unit/UnitService.js";

export class SimulationService extends Effect.Service<SimulationService>()(
  "SimulationService",
  {
    dependencies: [EventSchedulerService.Default, UnitService.Default],
    effect: Effect.gen(function* () {
      const state = yield* StateService;
      const scheduler = yield* EventSchedulerService;

      const snapshotStreamRef = yield* Ref.make<
        Array<(snapshot: unknown) => void>
      >([]);

      return {
        run: (durationMs: number) =>
          Effect.gen(function* () {
            const startTime = yield* state.getState.pipe(
              Effect.map((s) => s.currentTime),
            );
            const endTime = startTime + durationMs;

            // Main simulation loop
            while (true) {
              const nextEvent = yield* scheduler.peek();

              if (!nextEvent || nextEvent.time > endTime) {
                // No more events or past end time
                yield* state.updateState((s) => s.set("currentTime", endTime));
                break;
              }

              // Dequeue and process event
              yield* scheduler.dequeue();
              yield* state.updateState((s) =>
                s.set("currentTime", nextEvent.time),
              );

              // Process event based on type
              // TODO: Dispatch to appropriate handlers
              if (nextEvent.execute) {
                yield* nextEvent.execute;
              }
            }

            const finalState = yield* state.getState;
            return {
              eventsProcessed: 0, // TODO: track
              finalTime: finalState.currentTime,
            };
          }),

        subscribeSnapshots: (callback: (snapshot: unknown) => void) =>
          Ref.update(snapshotStreamRef, (subs) => [...subs, callback]),
      };
    }),
  },
) {}
