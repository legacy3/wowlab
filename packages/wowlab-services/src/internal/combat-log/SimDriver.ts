/**
 * Simulation Driver
 *
 * Event processing loop that:
 * 1. Dequeues events from the queue
 * 2. Calls registered handlers
 * 3. Queues any emitted events
 * 4. Applies state mutations
 */
import type * as CombatLog from "@wowlab/core/Schemas";

import { HandlerError } from "@wowlab/core/Errors";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";

import { StateService } from "../state/StateService.js";
import { CombatLogService } from "./CombatLogService.js";
import { getEmitted, makeEmitter } from "./Emitter.js";

/**
 * SimDriver service for processing combat log events
 */
export class SimDriver extends Effect.Service<SimDriver>()("SimDriver", {
  dependencies: [CombatLogService.Default, StateService.Default],
  effect: Effect.gen(function* () {
    const combatLog = yield* CombatLogService;
    const state = yield* StateService;

    /**
     * Apply generic state mutations based on event type.
     * These are automatic state updates that happen for all events.
     */
    const applyEventToState = (
      event: CombatLog.CombatLog.CombatLogEvent,
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        switch (event._tag) {
          case "SPELL_AURA_APPLIED":
            yield* Effect.logDebug(
              `Aura applied: ${event.spellName} on ${event.destName}`,
            );
            break;

          case "SPELL_AURA_APPLIED_DOSE":
            yield* Effect.logDebug(
              `Aura stack: ${event.spellName} (${event.amount}) on ${event.destName}`,
            );
            break;

          case "SPELL_AURA_REFRESH":
            yield* Effect.logDebug(
              `Aura refresh: ${event.spellName} on ${event.destName}`,
            );
            break;

          case "SPELL_AURA_REMOVED":
            yield* Effect.logDebug(
              `Aura removed: ${event.spellName} from ${event.destName}`,
            );
            break;

          case "SPELL_DAMAGE":
            break;

          case "SPELL_ENERGIZE":
            yield* Effect.logDebug(
              `Energize: ${event.destName} +${event.amount} power`,
            );
            break;

          case "SPELL_PERIODIC_DAMAGE":
            yield* Effect.logDebug(
              `Damage: ${event.spellName} hit ${event.destName} for ${event.amount}`,
            );
            break;

          case "SPELL_SUMMON":
            yield* Effect.logDebug(
              `Summon: ${event.sourceName} summoned ${event.destName}`,
            );
            break;

          case "SWING_DAMAGE":
            yield* Effect.logDebug(
              `Swing: ${event.sourceName} hit ${event.destName} for ${event.amount}`,
            );
            break;

          case "UNIT_DIED":
            yield* Effect.logDebug(`Unit died: ${event.destName}`);
            break;
        }
      });

    /**
     * Process a single event:
     * 1. Update simulation time
     * 2. Create emitter for handlers
     * 3. Run all matching handlers
     * 4. Queue emitted events
     * 5. Apply generic state mutations
     */
    const processEvent = (
      event: CombatLog.CombatLog.CombatLogEvent,
    ): Effect.Effect<void, HandlerError> =>
      Effect.gen(function* () {
        // Update simulation time
        yield* state.updateState((s) => s.set("currentTime", event.timestamp));

        // Create emitter for this event
        const emitter = yield* makeEmitter(event.timestamp);

        // Get and run handlers
        const handlers = yield* combatLog.getHandlers(event);

        for (const entry of handlers) {
          // Handler may have requirements, but we ignore them for now
          // The handler is responsible for providing its own context
          const handlerEffect = entry.handler(event, emitter) as Effect.Effect<
            void,
            unknown
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

        // Apply generic state mutations
        yield* applyEventToState(event);

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

            if (Option.isNone(maybeEvent)) break;

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
