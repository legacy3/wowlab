import * as Events from "@wowlab/core/Events";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import TinyQueue from "tinyqueue";

export class EventSchedulerService extends Effect.Service<EventSchedulerService>()(
  "EventSchedulerService",
  {
    effect: Effect.gen(function* () {
      const queueRef = yield* Ref.make(
        new TinyQueue<Events.SimulationEvent>([], (a, b) => a.time - b.time),
      );

      return {
        schedule: (event: Events.SimulationEvent) =>
          Ref.update(queueRef, (queue) => {
            queue.push(event);
            return queue;
          }),

        dequeue: () =>
          Ref.modify(queueRef, (queue) => {
            const event = queue.pop();
            return [event, queue] as const;
          }),

        peek: () => Ref.get(queueRef).pipe(Effect.map((queue) => queue.peek())),

        clear: () =>
          Ref.set(
            queueRef,
            new TinyQueue<Events.SimulationEvent>(
              [],
              (a, b) => a.time - b.time,
            ),
          ),
      };
    }),
  },
) {}
