/**
 * Event Queue Service
 *
 * An unbounded queue for combat log events using Effect.Queue.
 * Events are processed in FIFO order.
 */
import type * as CombatLog from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";
import * as Queue from "effect/Queue";

/**
 * EventQueue service for managing combat log events.
 * Uses an unbounded queue to store events.
 */
export class EventQueue extends Effect.Service<EventQueue>()("EventQueue", {
  effect: Effect.gen(function* () {
    const queue = yield* Queue.unbounded<CombatLog.CombatLog.CombatLogEvent>();

    return {
      /**
       * Add a single event to the queue
       */
      offer: (event: CombatLog.CombatLog.CombatLogEvent) =>
        Queue.offer(queue, event),

      /**
       * Add multiple events to the queue
       */
      offerAll: (events: readonly CombatLog.CombatLog.CombatLogEvent[]) =>
        Queue.offerAll(queue, events),

      /**
       * Take the next event from the queue (suspends if empty)
       */
      take: Queue.take(queue),

      /**
       * Take all events from the queue (returns empty if none)
       */
      takeAll: Queue.takeAll(queue),

      /**
       * Poll for the next event (returns Option, doesn't suspend)
       */
      poll: Queue.poll(queue),

      /**
       * Get the current queue size
       */
      size: Queue.size(queue),

      /**
       * Check if the queue is empty
       */
      isEmpty: Effect.map(Queue.size(queue), (s) => s === 0),

      /**
       * Shutdown the queue
       */
      shutdown: Queue.shutdown(queue),

      /**
       * Wait for the queue to shutdown
       */
      awaitShutdown: Queue.awaitShutdown(queue),
    };
  }),
}) {}
