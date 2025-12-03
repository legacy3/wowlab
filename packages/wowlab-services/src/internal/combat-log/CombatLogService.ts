/**
 * Combat Log Service
 *
 * High-level service that combines the event queue and handler registry.
 * Provides a unified API for emitting events and subscribing to handlers.
 */
import type * as CombatLog from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";

import { EventQueue } from "./EventQueue.js";
import {
  HandlerRegistry,
  type EventFilter,
  type EventHandler,
  type HandlerOptions,
  type Subscription,
} from "./HandlerRegistry.js";

/**
 * CombatLogService - unified API for combat log events
 */
export class CombatLogService extends Effect.Service<CombatLogService>()(
  "CombatLogService",
  {
    dependencies: [EventQueue.Default, HandlerRegistry.Default],
    effect: Effect.gen(function* () {
      const eventQueue = yield* EventQueue;
      const registry = yield* HandlerRegistry;

      return {
        // ====================================================================
        // Event Queue Operations
        // ====================================================================

        /**
         * Emit a single event to the queue
         */
        emit: (event: CombatLog.CombatLog.CombatLogEvent) =>
          eventQueue.offer(event),

        /**
         * Emit multiple events to the queue
         */
        emitBatch: (events: readonly CombatLog.CombatLog.CombatLogEvent[]) =>
          eventQueue.offerAll(events),

        /**
         * Take the next event from the queue (suspends if empty)
         */
        take: eventQueue.take,

        /**
         * Take all events from the queue
         */
        takeAll: eventQueue.takeAll,

        /**
         * Poll for the next event (returns Option, doesn't suspend)
         */
        poll: eventQueue.poll,

        /**
         * Get the current queue size
         */
        queueSize: eventQueue.size,

        /**
         * Check if the queue is empty
         */
        isQueueEmpty: eventQueue.isEmpty,

        // ====================================================================
        // Handler Registry Operations
        // ====================================================================

        /**
         * Subscribe to events matching a filter
         */
        on: <E extends CombatLog.CombatLog.CombatLogEvent, R, Err>(
          filter: EventFilter,
          handler: EventHandler<E, R, Err>,
          options?: HandlerOptions,
        ): Effect.Effect<Subscription> => registry.on(filter, handler, options),

        /**
         * Convenience: subscribe to a specific spell event
         */
        onSpell: <R, Err>(
          subevent: CombatLog.CombatLog.Subevent,
          spellId: number,
          handler: EventHandler<CombatLog.CombatLog.SpellEvent, R, Err>,
          options?: HandlerOptions,
        ): Effect.Effect<Subscription> =>
          registry.onSpell(subevent, spellId, handler, options),

        /**
         * Get all handlers for an event
         */
        getHandlers: registry.getHandlers,

        /**
         * Unsubscribe a handler by ID
         */
        unsubscribe: registry.unsubscribe,

        /**
         * Clear all handlers
         */
        clearHandlers: registry.clear,

        /**
         * Get the number of registered handlers
         */
        handlerCount: registry.count,

        // ====================================================================
        // Lifecycle
        // ====================================================================

        /**
         * Shutdown the service
         */
        shutdown: eventQueue.shutdown,

        /**
         * Wait for shutdown
         */
        awaitShutdown: eventQueue.awaitShutdown,
      };
    }),
  },
) {}
