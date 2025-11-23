import * as Entities from "@wowlab/core/Entities";
import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";

import { PeriodicTriggerService } from "../periodic/PeriodicTriggerService.js";
import { RotationRefService } from "../rotation/RotationRefService.js";
import { EventSchedulerService } from "../scheduler/EventSchedulerService.js";
import { StateService } from "../state/StateService.js";
import { UnitService } from "../unit/UnitService.js";

export class SimulationService extends Effect.Service<SimulationService>()(
  "SimulationService",
  {
    dependencies: [
      EventSchedulerService.Default,
      UnitService.Default,
      StateService.Default,
      RotationRefService.Default,
      PeriodicTriggerService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateService;
      const scheduler = yield* EventSchedulerService;
      const rotationRef = yield* RotationRefService;
      const periodic = yield* PeriodicTriggerService;
      const snapshotPubSub =
        yield* PubSub.unbounded<Entities.GameState.GameState>();
      const eventsProcessedRef = yield* Ref.make(0);

      return {
        events: scheduler.events,

        run: (
          rotation: Effect.Effect<void, unknown, unknown>,
          maxDuration: number,
        ) =>
          Effect.gen(function* () {
            const startState = yield* state.getState();

            // Publish initial state
            yield* PubSub.publish(snapshotPubSub, startState);

            // Set rotation in ref so CastQueue can access it
            yield* rotationRef.set(rotation as Effect.Effect<void, unknown>);

            // Clear any existing events and schedule initial APL evaluation
            yield* scheduler.clear();
            yield* scheduler.schedule({
              execute: rotation as Effect.Effect<void, unknown>,
              id: "initial_apl",
              payload: {},
              priority: Events.EVENT_PRIORITY[Events.EventType.APL_EVALUATE],
              time: 0,
              type: Events.EventType.APL_EVALUATE,
            });

            // Start periodic triggers (resource regen, auto shot, etc.)
            yield* periodic.startPeriodic(maxDuration);

            // Event-driven loop: process events until queue is empty or maxDuration exceeded
            let iterationCount = 0;
            const maxIterations = 100000; // Safety limit to prevent infinite loops

            while (iterationCount < maxIterations) {
              const nextEvent = yield* scheduler.peek();

              // Stop if no more events or event exceeds max duration
              if (!nextEvent || nextEvent.time > maxDuration) {
                break;
              }

              // Dequeue next event
              yield* scheduler.dequeue();

              // Advance currentTime to event time
              const currentState = yield* state.getState();
              if (nextEvent.time > currentState.currentTime) {
                yield* state.updateState((s) =>
                  s
                    .set("currentTime", nextEvent.time)
                    .set("iterationCount", iterationCount + 1),
                );
              }

              // Execute the event and catch interruptions (from successful casts) and treat as success
              yield* nextEvent.execute.pipe(
                Effect.catchAllCause((cause) => {
                  if (cause._tag === "Interrupt") {
                    return Effect.void;
                  }

                  return Effect.failCause(cause);
                }),
              );

              // Increment events processed
              yield* Ref.update(eventsProcessedRef, (n) => n + 1);

              // Publish snapshot if state changed
              const newState = yield* state.getState();
              if (!currentState.equals(newState)) {
                yield* PubSub.publish(snapshotPubSub, newState);
              }

              iterationCount++;
            }

            // Warn if hit iteration limit
            if (iterationCount >= maxIterations) {
              console.warn(
                `Simulation hit max iteration limit (${maxIterations}). Possible infinite event loop.`,
              );
            }

            // Publish final state
            const finalState = yield* state.getState();
            yield* PubSub.publish(snapshotPubSub, finalState);

            const eventsProcessed = yield* Ref.get(eventsProcessedRef);

            return {
              eventsProcessed,
              finalTime: finalState.currentTime,
            };
          }),

        snapshots: snapshotPubSub,
      };
    }),
  },
) {}
