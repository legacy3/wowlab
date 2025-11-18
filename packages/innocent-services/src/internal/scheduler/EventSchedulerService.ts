import * as Events from "@packages/innocent-domain/Events";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";
import TinyQueue from "tinyqueue";

/**
 * Service for managing simulation events in a priority queue.
 *
 * Events are ordered by:
 * 1. Time (earlier first)
 * 2. Priority (higher first)
 * 3. ID (stable sort)
 *
 * Uses tinyqueue (binary heap) wrapped in Effect.Ref for O(log n) operations.
 */
export class EventSchedulerService extends Effect.Service<EventSchedulerService>()(
  "EventSchedulerService",
  {
    effect: Effect.gen(function* () {
      // Create mutable priority queue wrapped in Ref
      const queueRef = yield* Ref.make(
        new TinyQueue<Events.SimulationEvent>([], Events.compareEvents),
      );

      // Create PubSub for event stream
      const eventPubSub = yield* PubSub.unbounded<Events.SimulationEvent>();

      return {
        clear: () =>
          Ref.set(
            queueRef,
            new TinyQueue<Events.SimulationEvent>([], Events.compareEvents),
          ),

        dequeue: () =>
          Ref.modify(queueRef, (queue) => {
            const next = queue.pop();
            return [next ? Option.some(next) : Option.none(), queue];
          }),

        events: eventPubSub,

        hasEvents: () =>
          Ref.get(queueRef).pipe(Effect.map((queue) => queue.length > 0)),

        peek: () =>
          Ref.get(queueRef).pipe(
            Effect.map((queue) => {
              const next = queue.peek();
              return next ? Option.some(next) : Option.none();
            }),
          ),

        schedule: (event: Events.SimulationEvent) =>
          Effect.gen(function* () {
            yield* Ref.update(queueRef, (queue) => {
              queue.push(event);
              return queue;
            });

            // Publish event to stream for observers
            yield* PubSub.publish(eventPubSub, event);
          }),

        size: () => Ref.get(queueRef).pipe(Effect.map((queue) => queue.length)),
      };
    }),
  },
) {}
