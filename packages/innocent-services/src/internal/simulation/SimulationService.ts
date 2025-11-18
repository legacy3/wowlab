import * as Events from "@packages/innocent-domain/Events";
import * as State from "@packages/innocent-domain/State";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as PubSub from "effect/PubSub";

import * as Periodic from "@/Periodic";
import * as Rotation from "@/Rotation";
import * as Scheduler from "@/Scheduler";
import * as StateServices from "@/State";
import * as Unit from "@/Unit";

export class SimulationService extends Effect.Service<SimulationService>()(
  "SimulationService",
  {
    dependencies: [
      StateServices.StateService.Default,
      Unit.UnitService.Default,
      Scheduler.EventSchedulerService.Default,
      Rotation.RotationRefService.Default,
      Periodic.PeriodicTriggerService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateServices.StateService;
      const _units = yield* Unit.UnitService;
      const scheduler = yield* Scheduler.EventSchedulerService;
      const rotationRef = yield* Rotation.RotationRefService;
      const periodic = yield* Periodic.PeriodicTriggerService;
      const snapshotPubSub = yield* PubSub.unbounded<State.GameState>();

      return {
        events: scheduler.events,

        run: <E, R>(rotation: Effect.Effect<void, E, R>, maxDuration: number) =>
          Effect.gen(function* () {
            const startState = yield* state.getState();

            // Publish initial state
            yield* PubSub.publish(snapshotPubSub, startState);

            // Set rotation in fiber-local storage so CastQueue can access it
            yield* rotationRef.set(rotation);

            // Clear any existing events and schedule initial APL evaluation
            yield* scheduler.clear();
            yield* scheduler.schedule({
              execute: rotation,
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

            while (
              (yield* scheduler.hasEvents()) &&
              iterationCount < maxIterations
            ) {
              // Dequeue next event
              const eventOpt = yield* scheduler.dequeue();
              if (Option.isNone(eventOpt)) {
                break;
              }

              const event = eventOpt.value;

              // Stop if event exceeds max duration
              if (event.time > maxDuration) {
                break;
              }

              // Advance currentTime to event time
              const currentState = yield* state.getState();
              if (event.time > currentState.currentTime) {
                yield* state.updateState((s) =>
                  s
                    .set("currentTime", event.time)
                    .set("iterationCount", iterationCount + 1),
                );
              }

              // Execute the event and catch interruptions (from successful casts) and treat as success
              yield* event.execute.pipe(
                Effect.catchAllCause((cause) => {
                  if (cause._tag === "Interrupt") {
                    return Effect.void;
                  }

                  return Effect.failCause(cause);
                }),
              );

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
          }),
        snapshots: snapshotPubSub,
      };
    }),
  },
) {}
