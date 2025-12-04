import type * as CombatLog from "@wowlab/core/Schemas";

import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import TinyQueue from "tinyqueue";

export type SimulationEvent =
  | CombatLog.CombatLog.CombatLogEvent
  | CombatLog.CombatLog.LabEvent;

interface QueueEntry {
  event: SimulationEvent;
  insertionOrder: number;
}

const compareEntries = (a: QueueEntry, b: QueueEntry): number => {
  const timeDiff = a.event.timestamp - b.event.timestamp;
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return a.insertionOrder - b.insertionOrder;
};

export class EventQueue extends Effect.Service<EventQueue>()("EventQueue", {
  effect: Effect.gen(function* () {
    const queueRef = yield* Ref.make(
      new TinyQueue<QueueEntry>([], compareEntries),
    );
    const counterRef = yield* Ref.make(0);

    return {
      awaitShutdown: Effect.void,

      clear: Ref.set(queueRef, new TinyQueue<QueueEntry>([], compareEntries)),

      isEmpty: Effect.gen(function* () {
        const queue = yield* Ref.get(queueRef);
        return queue.length === 0;
      }),

      offer: (event: SimulationEvent) =>
        Effect.gen(function* () {
          const order = yield* Ref.getAndUpdate(counterRef, (n) => n + 1);

          yield* Ref.update(queueRef, (queue) => {
            queue.push({ event, insertionOrder: order });
            return queue;
          });
        }),

      offerAll: (events: readonly SimulationEvent[]) =>
        Effect.gen(function* () {
          if (events.length === 0) {
            return;
          }

          const startOrder = yield* Ref.getAndUpdate(
            counterRef,
            (n) => n + events.length,
          );

          yield* Ref.update(queueRef, (queue) => {
            events.forEach((event, i) => {
              queue.push({ event, insertionOrder: startOrder + i });
            });

            return queue;
          });
        }),

      peek: Effect.gen(function* () {
        const queue = yield* Ref.get(queueRef);

        return queue.length === 0
          ? Option.none<SimulationEvent>()
          : Option.some(queue.peek()!.event);
      }),

      peekTimestamp: Effect.gen(function* () {
        const queue = yield* Ref.get(queueRef);

        return queue.length === 0
          ? Option.none<number>()
          : Option.some(queue.peek()!.event.timestamp);
      }),

      poll: Effect.gen(function* () {
        const entry = yield* Ref.modify(queueRef, (queue) => {
          const result = queue.pop();

          return [result, queue] as const;
        });

        return entry === undefined
          ? Option.none<SimulationEvent>()
          : Option.some(entry.event);
      }),

      shutdown: Effect.void,

      size: Effect.gen(function* () {
        const queue = yield* Ref.get(queueRef);

        return queue.length;
      }),

      take: Effect.gen(function* () {
        const entry = yield* Ref.modify(queueRef, (queue) => {
          const result = queue.pop();

          return [result, queue] as const;
        });

        if (entry === undefined) {
          return yield* Effect.die("Queue is empty");
        }

        return entry.event;
      }),

      takeAll: Effect.gen(function* () {
        const queue = yield* Ref.getAndSet(
          queueRef,
          new TinyQueue<QueueEntry>([], compareEntries),
        );

        const entries: QueueEntry[] = [];
        while (queue.length > 0) {
          entries.push(queue.pop()!);
        }

        return entries.map((e) => e.event) as readonly SimulationEvent[];
      }),
    };
  }),
}) {}
