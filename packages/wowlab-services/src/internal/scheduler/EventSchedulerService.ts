import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";
import { Map } from "immutable";
import TinyQueue from "tinyqueue";

interface SchedulerState {
  counter: number;
  currentTime: number;
  index: Map<Schemas.Branded.EventID, Events.ScheduledEvent>;
  queue: TinyQueue<Events.ScheduledEvent>;
}

const eventComparator = (
  a: Events.ScheduledEvent,
  b: Events.ScheduledEvent,
): number => {
  if (a.time !== b.time) {
    return a.time - b.time;
  }

  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  return a.id.localeCompare(b.id);
};

const createEmptyState = (): SchedulerState => ({
  counter: 0,
  currentTime: 0,
  index: Map<Schemas.Branded.EventID, Events.ScheduledEvent>(),
  queue: new TinyQueue<Events.ScheduledEvent>([], eventComparator),
});

export class EventSchedulerService extends Effect.Service<EventSchedulerService>()(
  "EventSchedulerService",
  {
    effect: Effect.gen(function* () {
      const stateRef = yield* Ref.make<SchedulerState>(createEmptyState());

      // Create PubSub for event stream
      const eventPubSub = yield* PubSub.unbounded<Events.ScheduledEvent>();

      return {
        clear: () => Ref.set(stateRef, createEmptyState()),

        dequeue: () =>
          Ref.modify(stateRef, (state) => {
            const event = state.queue.pop();
            if (!event) {
              return [undefined, state] as const;
            }

            return [
              event,
              {
                ...state,
                currentTime: event.time,
                index: state.index.delete(event.id),
              },
            ] as const;
          }),

        events: eventPubSub,

        isEmpty: () =>
          Ref.get(stateRef).pipe(
            Effect.map((state) => state.queue.length === 0),
          ),

        peek: () =>
          Ref.get(stateRef).pipe(Effect.map((state) => state.queue.peek())),

        schedule: (event: Events.ScheduledEvent) =>
          Effect.gen(function* () {
            yield* Ref.update(stateRef, (state) => {
              state.queue.push(event);

              return {
                ...state,
                index: state.index.set(event.id, event),
              };
            });

            // Publish event to stream for observers
            yield* PubSub.publish(eventPubSub, event);
          }),

        size: () =>
          Ref.get(stateRef).pipe(Effect.map((state) => state.queue.length)),
      };
    }),
  },
) {}
