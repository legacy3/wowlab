import * as Entities from "@wowlab/core/Entities";
import * as Errors from "@wowlab/core/Errors";
import * as Events from "@wowlab/core/Events";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as PubSub from "effect/PubSub";
import * as Ref from "effect/Ref";
import { Map, Set } from "immutable";
import { customAlphabet } from "nanoid";
import TinyQueue from "tinyqueue";

export type ScheduledInput =
  | { type: Events.EventType.APL_EVALUATE; at: number }
  | {
      type: Events.EventType.SPELL_CAST_START;
      at: number;
      spell: Entities.Spell.Spell;
      targetId: Schemas.Branded.UnitID | null;
    }
  | {
      type: Events.EventType.SPELL_CAST_COMPLETE;
      at: number;
      spell: Entities.Spell.Spell;
      targetId: Schemas.Branded.UnitID | null;
    }
  | {
      type: Events.EventType.SPELL_COOLDOWN_READY;
      at: number;
      spell: Entities.Spell.Spell;
    }
  | {
      type: Events.EventType.SPELL_CHARGE_READY;
      at: number;
      spell: Entities.Spell.Spell;
    }
  | {
      type: Events.EventType.PROJECTILE_IMPACT;
      at: number;
      projectileId: Schemas.Branded.ProjectileID;
      spell: Entities.Spell.Spell;
      casterUnitId: Schemas.Branded.UnitID;
      targetUnitId: Schemas.Branded.UnitID;
      damage: number;
    }
  | {
      type: Events.EventType.AURA_EXPIRE;
      at: number;
      aura: Entities.Aura.Aura;
      unitId: Schemas.Branded.UnitID;
    }
  | {
      type: Events.EventType.AURA_STACK_DECAY;
      at: number;
      aura: Entities.Aura.Aura;
      unitId: Schemas.Branded.UnitID;
    }
  | { type: Events.EventType.PERIODIC_POWER; at: number }
  | { type: Events.EventType.PERIODIC_SPELL; at: number };

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

const buildEvent = (
  input: ScheduledInput,
  counter: number,
): Events.ScheduledEvent => {
  const id = generateEventId(counter);
  const priority = Events.EVENT_PRIORITY[input.type];

  switch (input.type) {
    case Events.EventType.APL_EVALUATE:
      return {
        execute: Effect.void,
        id,
        payload: {},
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.AURA_EXPIRE:
      return {
        execute: Effect.void,
        id,
        payload: { aura: input.aura, unitId: input.unitId },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.AURA_STACK_DECAY:
      return {
        execute: Effect.void,
        id,
        payload: { aura: input.aura, unitId: input.unitId },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.PERIODIC_POWER:
      return {
        execute: Effect.void,
        id,
        payload: {},
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.PERIODIC_SPELL:
      return {
        execute: Effect.void,
        id,
        payload: {},
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.PROJECTILE_IMPACT:
      return {
        execute: Effect.void,
        id,
        payload: {
          casterUnitId: input.casterUnitId,
          damage: input.damage,
          projectileId: input.projectileId,
          spell: input.spell,
          targetUnitId: input.targetUnitId,
        },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.SPELL_CAST_COMPLETE:
      return {
        execute: Effect.void,
        id,
        payload: { spell: input.spell, targetId: input.targetId },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.SPELL_CAST_START:
      return {
        execute: Effect.void,
        id,
        payload: { spell: input.spell, targetId: input.targetId },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.SPELL_CHARGE_READY:
      return {
        execute: Effect.void,
        id,
        payload: { spell: input.spell },
        priority,
        time: input.at,
        type: input.type,
      };

    case Events.EventType.SPELL_COOLDOWN_READY:
      return {
        execute: Effect.void,
        id,
        payload: { spell: input.spell },
        priority,
        time: input.at,
        type: input.type,
      };
  }
};

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

        scheduleInput: (input: ScheduledInput) =>
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

            // Build event from input
            const event = buildEvent(input, state.counter);

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
): ScheduledInput => ({
  at,
  spell,
  type: Events.EventType.SPELL_COOLDOWN_READY,
});

/**
 * Creates a SPELL_CHARGE_READY event input.
 */
export const chargeReady = (
  spell: Entities.Spell.Spell,
  at: number,
): ScheduledInput => ({
  at,
  spell,
  type: Events.EventType.SPELL_CHARGE_READY,
});

/**
 * Creates an AURA_EXPIRE event input.
 */
export const auraExpire = (
  aura: Entities.Aura.Aura,
  unitId: Schemas.Branded.UnitID,
  at: number,
): ScheduledInput => ({
  at,
  aura,
  type: Events.EventType.AURA_EXPIRE,
  unitId,
});

/**
 * Creates an AURA_STACK_DECAY event input.
 */
export const auraStackDecay = (
  aura: Entities.Aura.Aura,
  unitId: Schemas.Branded.UnitID,
  at: number,
): ScheduledInput => ({
  at,
  aura,
  type: Events.EventType.AURA_STACK_DECAY,
  unitId,
});

/**
 * Creates a PERIODIC_POWER event input.
 */
export const periodicPower = (at: number): ScheduledInput => ({
  at,
  type: Events.EventType.PERIODIC_POWER,
});

/**
 * Creates a PERIODIC_SPELL event input.
 */
export const periodicSpell = (at: number): ScheduledInput => ({
  at,
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
): ScheduledInput => ({
  at,
  casterUnitId,
  damage,
  projectileId,
  spell,
  targetUnitId,
  type: Events.EventType.PROJECTILE_IMPACT,
});
