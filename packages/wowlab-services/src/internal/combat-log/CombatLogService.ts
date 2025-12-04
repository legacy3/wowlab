import type * as CombatLog from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";

import { EventQueue, type SimulationEvent } from "./EventQueue.js";
import {
  HandlerRegistry,
  type EventFilter,
  type EventHandler,
  type HandlerOptions,
  type Subscription,
} from "./HandlerRegistry.js";

export class CombatLogService extends Effect.Service<CombatLogService>()(
  "CombatLogService",
  {
    dependencies: [EventQueue.Default, HandlerRegistry.Default],
    effect: Effect.gen(function* () {
      const eventQueue = yield* EventQueue;
      const registry = yield* HandlerRegistry;

      return {
        awaitShutdown: eventQueue.awaitShutdown,

        clearHandlers: registry.clear,

        emit: (event: SimulationEvent) => eventQueue.offer(event),

        emitBatch: (events: readonly SimulationEvent[]) =>
          eventQueue.offerAll(events),

        getHandlers: registry.getHandlers,

        handlerCount: registry.count,

        isQueueEmpty: eventQueue.isEmpty,

        on: <E extends CombatLog.CombatLog.CombatLogEvent, R, Err>(
          filter: EventFilter,
          handler: EventHandler<E, R, Err>,
          options?: HandlerOptions,
        ): Effect.Effect<Subscription> => registry.on(filter, handler, options),

        onSpell: <R, Err>(
          subevent: CombatLog.CombatLog.Subevent,
          spellId: number,
          handler: EventHandler<CombatLog.CombatLog.SpellEvent, R, Err>,
          options?: HandlerOptions,
        ): Effect.Effect<Subscription> =>
          registry.onSpell(subevent, spellId, handler, options),

        poll: eventQueue.poll,

        queueSize: eventQueue.size,

        shutdown: eventQueue.shutdown,

        take: eventQueue.take,

        takeAll: eventQueue.takeAll,

        unsubscribe: registry.unsubscribe,
      };
    }),
  },
) {}
