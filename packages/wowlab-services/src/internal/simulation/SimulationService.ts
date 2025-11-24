import * as Entities from "@wowlab/core/Entities";
import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";

import { LogService } from "../log/LogService.js";
import { PeriodicTriggerService } from "../periodic/PeriodicTriggerService.js";
import { RotationProviderService } from "../rotation/RotationProviderService.js";
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
      RotationProviderService.Default,
      PeriodicTriggerService.Default,
      LogService.Default,
    ],
    effect: Effect.gen(function* () {
      const state = yield* StateService;
      const scheduler = yield* EventSchedulerService;
      const rotationProvider = yield* RotationProviderService;
      const periodic = yield* PeriodicTriggerService;
      const logService = yield* LogService;
      const logger = yield* logService.withName("SimulationService");
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

            // Set rotation for APL scheduling
            yield* rotationProvider.set(rotation as Effect.Effect<void>);

            // Clear any existing events and schedule initial APL at t=0
            yield* scheduler.clear();
            yield* scheduler.scheduleAPL(0);

            // Start periodic triggers (resource regen, auto shot, etc.)
            yield* periodic.startPeriodic(maxDuration);

            // Event-driven loop: process events until queue is empty or maxDuration exceeded
            let iterationCount = 0;
            const maxIterations = 100000; // Safety limit to prevent infinite loops

            while (iterationCount < maxIterations) {
              const nextEvent = yield* scheduler.peek();

              // Stop if no more events or event exceeds max duration
              if (!nextEvent || nextEvent.at > maxDuration) {
                break;
              }

              // Dequeue next event
              yield* scheduler.dequeue();

              // Advance currentTime to event time
              const currentState = yield* state.getState();
              if (nextEvent.at > currentState.currentTime) {
                yield* state.updateState((s) =>
                  s
                    .set("currentTime", nextEvent.at)
                    .set("iterationCount", iterationCount + 1),
                );
              }

              // Execute the event and catch interruptions (from successful casts) and treat as success
              yield* Effect.forEach(
                nextEvent.callbacks,
                (callback) => callback(nextEvent.payload),
                { discard: true },
              ).pipe(
                Effect.catchAllCause((cause) => {
                  if (cause._tag === "Interrupt") {
                    return Effect.void;
                  }

                  return Effect.failCause(cause);
                }),
              );

              // TODO Not sure about this
              // Schedule APL if a resource became available or projectile impacted
              if (
                nextEvent.type === Events.EventType.SPELL_COOLDOWN_READY ||
                nextEvent.type === Events.EventType.SPELL_CHARGE_READY ||
                nextEvent.type === Events.EventType.PROJECTILE_IMPACT
              ) {
                yield* scheduler.scheduleAPL(nextEvent.at);
              }

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
              yield* logger.warn(
                `Simulation hit max iteration limit (${maxIterations}). Possible infinite event loop.`,
              );
            }

            // Publish final state
            const finalState = yield* state.getState();
            yield* PubSub.publish(snapshotPubSub, finalState);

            const eventsProcessed = yield* Ref.get(eventsProcessedRef);

            // Clear rotation provider
            yield* rotationProvider.clear();

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
