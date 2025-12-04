import * as Entities from "@wowlab/core/Entities";
import { HandlerError } from "@wowlab/core/Errors";
import * as CombatLog from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Stream from "effect/Stream";

import type { SimulationEvent } from "./EventQueue.js";

import { StateService } from "../state/StateService.js";
import { CombatLogService } from "./CombatLogService.js";
import { getEmitted, makeEmitter } from "./Emitter.js";
import { registerStateMutationHandlers } from "./handlers/index.js";

export interface EventStreamSubscribeOptions {
  readonly filter?: readonly CombatLog.CombatLog.Subevent[];
  readonly includeStateSnapshot?: boolean;
  readonly onEvent: (
    event: CombatLog.CombatLog.CombatLogEvent,
    stateSnapshot?: Entities.GameState.GameState,
  ) => Effect.Effect<void, unknown, never>;
}

export interface EventStreamSubscription {
  readonly id: string;
  readonly unsubscribe: Effect.Effect<void>;
}

interface EventStreamSubscriberEntry {
  readonly filter?: readonly CombatLog.CombatLog.Subevent[];
  readonly id: string;
  readonly includeStateSnapshot: boolean;
  readonly onEvent: (
    event: CombatLog.CombatLog.CombatLogEvent,
    stateSnapshot?: Entities.GameState.GameState,
  ) => Effect.Effect<void, unknown, never>;
}

export class SimDriver extends Effect.Service<SimDriver>()("SimDriver", {
  dependencies: [CombatLogService.Default, StateService.Default],
  effect: Effect.gen(function* () {
    const combatLog = yield* CombatLogService;
    const state = yield* StateService;

    yield* registerStateMutationHandlers(combatLog);

    const subscribersRef = yield* Ref.make<
      readonly EventStreamSubscriberEntry[]
    >([]);
    const subscriberCounterRef = yield* Ref.make(0);

    const subscribeToEventStream = (
      options: EventStreamSubscribeOptions,
    ): Effect.Effect<EventStreamSubscription> =>
      Effect.gen(function* () {
        const nextId = yield* Ref.getAndUpdate(
          subscriberCounterRef,
          (n) => n + 1,
        );
        const id = `subscriber-${nextId}`;

        const entry: EventStreamSubscriberEntry = {
          filter: options.filter,
          id,
          includeStateSnapshot: options.includeStateSnapshot ?? false,
          onEvent: options.onEvent,
        };

        yield* Ref.update(subscribersRef, (subs) => [...subs, entry]);

        return {
          id,
          unsubscribe: Ref.update(subscribersRef, (subs) =>
            subs.filter((sub) => sub.id !== id),
          ),
        };
      });

    const notifySubscribers = (
      event: CombatLog.CombatLog.CombatLogEvent,
    ): Effect.Effect<void> =>
      Effect.gen(function* () {
        const subscribers = yield* Ref.get(subscribersRef);

        if (subscribers.length === 0) {
          return;
        }

        const needsSnapshot = subscribers.some(
          (subscriber) => subscriber.includeStateSnapshot,
        );
        const snapshot = needsSnapshot ? yield* state.getState() : undefined;

        for (const subscriber of subscribers) {
          if (
            subscriber.filter &&
            subscriber.filter.length > 0 &&
            !subscriber.filter.includes(event._tag)
          ) {
            continue;
          }

          yield* Effect.catchAll(
            subscriber.onEvent(
              event,
              subscriber.includeStateSnapshot ? snapshot : undefined,
            ),
            () => Effect.void,
          );
        }
      });

    const processLabRecoveryEvent = (
      event: CombatLog.CombatLog.LabRecoveryReady,
    ): Effect.Effect<void, HandlerError> =>
      Effect.gen(function* () {
        yield* state.updateState((s) => {
          const newTime = Math.max(s.currentTime, event.timestamp);
          return s.set("currentTime", newTime);
        });
      });

    const processCLEUEvent = (
      event: CombatLog.CombatLog.CombatLogEvent,
    ): Effect.Effect<void, HandlerError> =>
      Effect.gen(function* () {
        yield* state.updateState((s) => {
          const newTime = Math.max(s.currentTime, event.timestamp);
          return s.set("currentTime", newTime);
        });

        const emitter = yield* makeEmitter(event.timestamp);
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

        const emitted = yield* getEmitted(emitter);
        if (emitted.length > 0) {
          yield* combatLog.emitBatch(emitted);
        }

        yield* notifySubscribers(event);
      });

    const processEvent = (
      event: SimulationEvent,
    ): Effect.Effect<void, HandlerError> => {
      if (CombatLog.CombatLog.isLabRecoveryReady(event)) {
        return processLabRecoveryEvent(event);
      }

      return processCLEUEvent(event);
    };

    return {
      asStream: (
        endTime: number,
      ): Stream.Stream<SimulationEvent, HandlerError> =>
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

            yield* processEvent(event).pipe(
              Effect.mapError((err) => Option.some(err)),
            );

            return event;
          }),
        ),

      processEvent,
      run: (endTime: number): Effect.Effect<void, HandlerError> =>
        Effect.gen(function* () {
          while (true) {
            const maybeEvent = yield* combatLog.poll;

            if (Option.isNone(maybeEvent)) {
              break;
            }

            const event = maybeEvent.value;
            if (event.timestamp > endTime) {
              yield* combatLog.emit(event);
              break;
            }

            yield* processEvent(event);
          }
        }),

      scheduleRecovery: (
        timestamp: number,
        category: number,
        triggeringSpellId: number,
        unitGUID: string,
      ): Effect.Effect<void> =>
        combatLog.emit(
          new CombatLog.CombatLog.LabRecoveryReady({
            category,
            timestamp,
            triggeringSpellId,
            unitGUID,
          }),
        ),

      step: (): Effect.Effect<Option.Option<SimulationEvent>, HandlerError> =>
        Effect.gen(function* () {
          const maybeEvent = yield* combatLog.poll;

          if (Option.isNone(maybeEvent)) {
            return Option.none();
          }

          const event = maybeEvent.value;
          yield* processEvent(event);

          return Option.some(event);
        }),

      subscribe: subscribeToEventStream,
    };
  }),
}) {}
