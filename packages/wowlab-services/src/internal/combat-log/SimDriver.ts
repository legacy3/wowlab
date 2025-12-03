import { HandlerError } from "@wowlab/core/Errors";
import * as CombatLog from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";

import { StateService } from "../state/StateService.js";
import { CombatLogService } from "./CombatLogService.js";
import { getEmitted, makeEmitter } from "./Emitter.js";
import { registerStateMutationHandlers } from "./handlers/index.js";

export class SimDriver extends Effect.Service<SimDriver>()("SimDriver", {
  dependencies: [CombatLogService.Default, StateService.Default],
  effect: Effect.gen(function* () {
    const combatLog = yield* CombatLogService;
    const state = yield* StateService;

    // TODO Rethink this approach
    yield* registerStateMutationHandlers(combatLog);

    /**
     * Process a single event:
     * 1. Update simulation time
     * 2. Create emitter for handlers
     * 3. Run all matching handlers (including state mutation handlers)
     * 4. Queue emitted events
     */
    const processEvent = (
      event: CombatLog.CombatLog.CombatLogEvent,
    ): Effect.Effect<void, HandlerError> =>
      Effect.gen(function* () {
        // Update simulation time
        yield* state.updateState((s) => s.set("currentTime", event.timestamp));

        // Create emitter for this event
        const emitter = yield* makeEmitter(event.timestamp);

        // Get and run handlers (sorted by priority, state mutations run last)
        const handlers = yield* combatLog.getHandlers(event);

        for (const entry of handlers) {
          const handlerEffect = entry.handler(event, emitter) as Effect.Effect<
            void,
            unknown,
            StateService
          >;

          yield* Effect.catchAll(handlerEffect, (cause) =>
            Effect.fail(
              new HandlerError({
                cause,
                eventTag: event._tag,
                handlerId: entry.id,
              }),
            ),
          ).pipe(
            Effect.provideService(StateService, state),
            Effect.withSpan(`handler:${entry.id}`),
            Effect.annotateLogs("handler", entry.id),
            Effect.annotateLogs("subevent", event._tag),
          );
        }

        // Queue emitted events (sorted by timestamp)
        const emitted = yield* getEmitted(emitter);
        if (emitted.length > 0) {
          const sorted = [...emitted].sort((a, b) => a.timestamp - b.timestamp);
          yield* combatLog.emitBatch(sorted);
        }

        // Log event
        yield* Effect.logDebug(`Processed: ${event._tag}`);
      });

    return {
      /**
       * Run simulation until endTime.
       * Processes all events with timestamp <= endTime.
       */
      run: (endTime: number): Effect.Effect<void, HandlerError> =>
        Effect.gen(function* () {
          while (true) {
            const maybeEvent = yield* combatLog.poll;

            if (Option.isNone(maybeEvent)) {
              break;
            }

            const event = maybeEvent.value;
            if (event.timestamp > endTime) {
              // Put it back and stop
              yield* combatLog.emit(event);
              break;
            }

            yield* processEvent(event);
          }
        }),

      /**
       * Process a single event (for debugging/stepping)
       */
      step: (): Effect.Effect<
        Option.Option<CombatLog.CombatLog.CombatLogEvent>,
        HandlerError
      > =>
        Effect.gen(function* () {
          const maybeEvent = yield* combatLog.poll;

          if (Option.isNone(maybeEvent)) {
            return Option.none();
          }

          const event = maybeEvent.value;
          yield* processEvent(event);

          return Option.some(event);
        }),

      /**
       * Run as Stream for advanced composition.
       * Maps HandlerError to Option.none() for the stream termination semantics.
       */
      asStream: (
        endTime: number,
      ): Stream.Stream<CombatLog.CombatLog.CombatLogEvent, HandlerError> =>
        Stream.repeatEffectOption(
          Effect.gen(function* () {
            const maybeEvent = yield* combatLog.poll;

            if (Option.isNone(maybeEvent)) {
              return yield* Effect.fail(Option.none<never>());
            }

            const event = maybeEvent.value;
            if (event.timestamp > endTime) {
              yield* combatLog.emit(event);
              return yield* Effect.fail(Option.none<never>());
            }

            // Process event and map errors to Option.some for the stream
            yield* processEvent(event).pipe(
              Effect.mapError((err) => Option.some(err)),
            );

            return event;
          }),
        ),

      /**
       * Process a single event directly (without taking from queue)
       */
      processEvent,
    };
  }),
}) {}
