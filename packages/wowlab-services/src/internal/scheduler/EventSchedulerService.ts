import * as Errors from "@wowlab/core/Errors";
import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";
import { Map, Set } from "immutable";
import TinyQueue from "tinyqueue";

interface SchedulerState {
  counter: number;
  currentTime: number;
  index: Map<Schemas.Branded.EventID, Events.ScheduledEvent>;
  queue: TinyQueue<Events.ScheduledEvent>;
  tombstones: Set<Schemas.Branded.EventID>;
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
  tombstones: Set<Schemas.Branded.EventID>(),
});

const compactQueue = (state: SchedulerState): SchedulerState => {
  const newQueue = new TinyQueue<Events.ScheduledEvent>([], eventComparator);

  state.index.forEach((event) => {
    newQueue.push(event);
  });

  return {
    ...state,
    queue: newQueue,
    tombstones: Set<Schemas.Branded.EventID>(),
  };
};

const peekSkippingTombstones = (
  state: SchedulerState,
): Events.ScheduledEvent | undefined => {
  while (state.queue.length > 0) {
    const event = state.queue.peek();
    if (!event) {
      return undefined;
    }

    if (state.tombstones.has(event.id)) {
      state.queue.pop();
    } else {
      return event;
    }
  }

  return undefined;
};

export class EventSchedulerService extends Effect.Service<EventSchedulerService>()(
  "EventSchedulerService",
  {
    effect: Effect.gen(function* () {
      const stateRef = yield* Ref.make<SchedulerState>(createEmptyState());

      // Create PubSub for event stream
      const eventPubSub = yield* PubSub.unbounded<Events.ScheduledEvent>();

      return {
        cancel: (id: Schemas.Branded.EventID) =>
          Ref.update(stateRef, (state) => {
            // Lazy tombstone: mark as dead and remove from index
            const newState = {
              ...state,
              index: state.index.delete(id),
              tombstones: state.tombstones.add(id),
            };

            // Compact if too many tombstones
            if (
              newState.tombstones.size > newState.queue.length / 2 &&
              newState.queue.length > 0
            ) {
              return compactQueue(newState);
            }

            return newState;
          }),

        cancelWhere: (predicate: (event: Events.ScheduledEvent) => boolean) =>
          Ref.update(stateRef, (state) => {
            // Filter index, keeping only events that don't match predicate
            const newIndex = state.index.filter((event) => !predicate(event));

            // Rebuild queue from filtered index
            const newQueue = new TinyQueue<Events.ScheduledEvent>(
              [],
              eventComparator,
            );

            newIndex.forEach((event) => {
              newQueue.push(event);
            });

            return {
              ...state,
              index: newIndex,
              queue: newQueue,
              tombstones: Set<Schemas.Branded.EventID>(),
            };
          }),

        clear: () => Ref.set(stateRef, createEmptyState()),

        dequeue: () =>
          Ref.modify(stateRef, (state) => {
            // Skip tombstoned events
            const event = peekSkippingTombstones(state);
            if (!event) {
              return [undefined, state] as const;
            }

            // Remove from queue (already popped by peekSkippingTombstones if it was clean)
            state.queue.pop();

            return [
              event,
              {
                ...state,
                currentTime: event.time,
                index: state.index.delete(event.id),
                tombstones: state.tombstones.delete(event.id),
              },
            ] as const;
          }),

        events: eventPubSub,

        isEmpty: () =>
          Ref.get(stateRef).pipe(Effect.map((state) => state.index.size === 0)),

        peek: () =>
          Ref.modify(stateRef, (state) => {
            const event = peekSkippingTombstones(state);
            return [event, state] as const;
          }),

        schedule: (event: Events.ScheduledEvent) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);

            // Enforce time monotonicity: cannot schedule in the past
            if (event.time < state.currentTime) {
              return yield* Effect.fail(
                new Errors.ScheduleInPast({
                  currentTime: state.currentTime,
                  eventTime: event.time,
                }),
              );
            }

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

        setCurrentTime: (time: number) =>
          Ref.update(stateRef, (state) => ({
            ...state,
            currentTime: time,
          })),

        size: () =>
          Ref.get(stateRef).pipe(Effect.map((state) => state.index.size)),
      };
    }),
  },
) {}
