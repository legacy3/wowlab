import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";
import { Map, Set } from "immutable";
import { customAlphabet } from "nanoid";
import TinyQueue from "tinyqueue";

import { EventHandlerRegistry } from "../callbacks/registry/EventHandlerRegistry.js";
import { RotationProviderService } from "../rotation/RotationProviderService.js";

export type ScheduledInput<T extends Events.EventType = Events.EventType> = {
  readonly at: number;
  readonly callbacks?: ReadonlyArray<Events.ExecutionCallback<T>>;
  readonly payload: Events.EventPayloadMap[T];
  readonly type: T;
};

interface SchedulerState {
  counter: number;
  currentTime: number;
  index: Map<Schemas.Branded.EventID, Events.ScheduledEvent>;
  queue: TinyQueue<Events.ScheduledEvent>;
  tombstones: Set<Schemas.Branded.EventID>;
}

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

const generateEventId = (counter: number): Schemas.Branded.EventID => {
  return Schemas.Branded.EventID(`${counter}_${nanoid()}`);
};

/**
 * Build an event, merging registered handlers with manual callbacks.
 * Registered handlers (from registry) execute first in priority order,
 * then manual callbacks execute in array order.
 */
const buildEvent = <T extends Events.EventType>(
  input: ScheduledInput<T>,
  counter: number,
  registry: EventHandlerRegistry,
): Events.ScheduledEvent<T> => {
  const id = generateEventId(counter);
  const priority = Events.EVENT_PRIORITY[input.type];

  // Get registered handlers for this event type
  const registeredHandlers = registry.getHandlers(input.type);

  // Merge registered handlers with manual callbacks
  // Registered handlers execute first (they're already priority-sorted)
  const allCallbacks = [
    ...registeredHandlers,
    ...(input.callbacks ?? []),
  ] as ReadonlyArray<Events.ExecutionCallback>;

  return {
    at: input.at,
    callbacks: allCallbacks,
    id,
    payload: input.payload,
    priority,
    type: input.type,
  } as Events.ScheduledEvent<T>;
};

const eventComparator = (
  a: Events.ScheduledEvent,
  b: Events.ScheduledEvent,
): number => {
  if (a.at !== b.at) {
    return a.at - b.at;
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
      const registry = yield* EventHandlerRegistry;
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
                currentTime: event.at,
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
            if (event.at < state.currentTime) {
              return yield* Effect.fail(
                new Errors.ScheduleInPast({
                  currentTime: state.currentTime,
                  eventTime: event.at,
                }),
              );
            }

            // Auto-inject registered handlers
            const registeredHandlers = registry.getHandlers(event.type);
            const eventWithHandlers = {
              ...event,
              callbacks: [
                ...registeredHandlers,
                ...event.callbacks,
              ] as ReadonlyArray<Events.ExecutionCallback>,
            };

            yield* Ref.update(stateRef, (state) => {
              state.queue.push(eventWithHandlers);

              return {
                ...state,
                counter: state.counter + 1,
                index: state.index.set(eventWithHandlers.id, eventWithHandlers),
              };
            });

            // Publish event to stream for observers
            yield* PubSub.publish(eventPubSub, eventWithHandlers);
          }),

        scheduleAPL: (at: number) =>
          Effect.gen(function* () {
            const rotationProvider = yield* RotationProviderService;
            const rotationOption = yield* rotationProvider.get();

            if (Option.isNone(rotationOption)) {
              // No rotation set, skip scheduling
              return;
            }

            const rotation = rotationOption.value;
            const state = yield* Ref.get(stateRef);

            // Find existing APL event
            const existingAPL = Array.from(state.index.values()).find(
              (event) => event.type === Events.EventType.APL_EVALUATE,
            );

            if (existingAPL) {
              // If existing APL is at same or later time, drop new request
              if (existingAPL.at <= at) {
                return;
              }

              // Cancel existing APL (new one is earlier)
              yield* Ref.update(stateRef, (state) => ({
                ...state,
                index: state.index.delete(existingAPL.id),
                tombstones: state.tombstones.add(existingAPL.id),
              }));
            }

            // Schedule new APL
            const input: ScheduledInput = {
              at,
              callbacks: [
                () => rotation as Effect.Effect<void, unknown, unknown>,
              ],
              payload: {},
              type: Events.EventType.APL_EVALUATE,
            };

            const event = buildEvent(input, state.counter, registry);

            yield* Ref.update(stateRef, (state) => {
              state.queue.push(event);

              return {
                ...state,
                counter: state.counter + 1,
                index: state.index.set(event.id, event),
              };
            });

            // Publish event to stream for observers
            yield* PubSub.publish(eventPubSub, event);
          }),

        scheduleInput: <T extends Events.EventType>(input: ScheduledInput<T>) =>
          Effect.gen(function* () {
            const state = yield* Ref.get(stateRef);

            // Enforce time monotonicity: cannot schedule in the past
            if (input.at < state.currentTime) {
              return yield* Effect.fail(
                new Errors.ScheduleInPast({
                  currentTime: state.currentTime,
                  eventTime: input.at,
                }),
              );
            }

            // Build event from input with auto-injected handlers
            const event = buildEvent(input, state.counter, registry);

            yield* Ref.update(stateRef, (state) => {
              state.queue.push(event);

              return {
                ...state,
                counter: state.counter + 1,
                index: state.index.set(event.id, event),
              };
            });

            // Publish event to stream for observers
            yield* PubSub.publish(eventPubSub, event);

            return event.id;
          }),

        scheduleNextAPL: ({
          castComplete,
          gcdExpiry,
        }: {
          castComplete: number;
          gcdExpiry: number;
        }) =>
          Effect.gen(function* () {
            const at = Math.max(castComplete, gcdExpiry);

            yield* Effect.serviceOption(EventSchedulerService).pipe(
              Effect.flatMap((schedulerOption) => {
                if (Option.isSome(schedulerOption)) {
                  return schedulerOption.value.scheduleAPL(at);
                }

                return Effect.void;
              }),
            );

            return yield* Effect.interrupt;
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

// ============================================================================
// Builder Helpers
// ============================================================================

/**
 * Creates a SPELL_COOLDOWN_READY event input.
 */
export const cooldownReady = (
  spell: Entities.Spell.Spell,
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.SPELL_COOLDOWN_READY>
  > = [],
): ScheduledInput<Events.EventType.SPELL_COOLDOWN_READY> => ({
  at,
  callbacks,
  payload: { spell },
  type: Events.EventType.SPELL_COOLDOWN_READY,
});

/**
 * Creates a SPELL_CHARGE_READY event input.
 */
export const chargeReady = (
  spell: Entities.Spell.Spell,
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.SPELL_CHARGE_READY>
  > = [],
): ScheduledInput<Events.EventType.SPELL_CHARGE_READY> => ({
  at,
  callbacks,
  payload: { spell },
  type: Events.EventType.SPELL_CHARGE_READY,
});

/**
 * Creates an AURA_EXPIRE event input.
 */
export const auraExpire = (
  aura: Entities.Aura.Aura,
  unitId: Schemas.Branded.UnitID,
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.AURA_EXPIRE>
  > = [],
): ScheduledInput<Events.EventType.AURA_EXPIRE> => ({
  at,
  callbacks,
  payload: { aura, unitId },
  type: Events.EventType.AURA_EXPIRE,
});

/**
 * Creates an AURA_STACK_DECAY event input.
 */
export const auraStackDecay = (
  aura: Entities.Aura.Aura,
  unitId: Schemas.Branded.UnitID,
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.AURA_STACK_DECAY>
  > = [],
): ScheduledInput<Events.EventType.AURA_STACK_DECAY> => ({
  at,
  callbacks,
  payload: { aura, unitId },
  type: Events.EventType.AURA_STACK_DECAY,
});

/**
 * Creates a PERIODIC_POWER event input.
 */
export const periodicPower = (
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.PERIODIC_POWER>
  > = [],
): ScheduledInput<Events.EventType.PERIODIC_POWER> => ({
  at,
  callbacks,
  payload: {},
  type: Events.EventType.PERIODIC_POWER,
});

/**
 * Creates a PERIODIC_SPELL event input.
 */
export const periodicSpell = (
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.PERIODIC_SPELL>
  > = [],
): ScheduledInput<Events.EventType.PERIODIC_SPELL> => ({
  at,
  callbacks,
  payload: {},
  type: Events.EventType.PERIODIC_SPELL,
});

/**
 * Creates a PROJECTILE_IMPACT event input.
 */
export const projectileImpact = (
  projectileId: Schemas.Branded.ProjectileID,
  spell: Entities.Spell.Spell,
  casterUnitId: Schemas.Branded.UnitID,
  targetUnitId: Schemas.Branded.UnitID,
  damage: number,
  at: number,
  callbacks: ReadonlyArray<
    Events.ExecutionCallback<Events.EventType.PROJECTILE_IMPACT>
  > = [],
): ScheduledInput<Events.EventType.PROJECTILE_IMPACT> => ({
  at,
  callbacks,
  payload: {
    casterUnitId,
    damage,
    projectileId,
    spell,
    targetUnitId,
  },
  type: Events.EventType.PROJECTILE_IMPACT,
});
