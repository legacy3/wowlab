/**
 * Handler Registry
 *
 * Manages event handler subscriptions with filtering and priority ordering.
 */
import * as CombatLog from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import { Map } from "immutable";

import type { Emitter } from "./Emitter.js";

export interface EventFilter {
  /** Optional spell ID to match */
  readonly spellId?: number;
  /** The subevent type to match (e.g., "SPELL_CAST_SUCCESS") */
  readonly subevent: CombatLog.CombatLog.Subevent;
}

/**
 * Event handler function type.
 * Receives an event and an emitter to emit new events.
 */
export type EventHandler<
  E extends
    CombatLog.CombatLog.CombatLogEvent = CombatLog.CombatLog.CombatLogEvent,
  R = never,
  Err = never,
> = (event: E, emitter: Emitter) => Effect.Effect<void, Err, R>;

/**
 * Handler entry with metadata
 */
export interface HandlerEntry {
  readonly handler: EventHandler<
    CombatLog.CombatLog.CombatLogEvent,
    unknown,
    unknown
  >;
  readonly id: string;
  readonly priority: number;
}

/**
 * Handler options
 */
export interface HandlerOptions {
  /** Unique handler ID (auto-generated if not provided) */
  readonly id?: string;
  /** Handler priority (lower = runs first, default 100) */
  readonly priority?: number;
}

/**
 * Subscription handle for cleanup
 */
export interface Subscription {
  readonly id: string;
  readonly unsubscribe: Effect.Effect<void>;
}

export class HandlerRegistry extends Effect.Service<HandlerRegistry>()(
  "HandlerRegistry",
  {
    effect: Effect.gen(function* () {
      // Map<filterKey, HandlerEntry[]>
      const handlersRef = yield* Ref.make<Map<string, HandlerEntry[]>>(Map());
      let nextId = 0;

      /**
       * Create a filter key from an EventFilter
       */
      const makeKey = (filter: EventFilter): string =>
        filter.spellId !== undefined
          ? `${filter.subevent}:${filter.spellId}`
          : filter.subevent;

      /**
       * Subscribe to events matching a filter
       */
      const on = <E extends CombatLog.CombatLog.CombatLogEvent, R, Err>(
        filter: EventFilter,
        handler: EventHandler<E, R, Err>,
        options: HandlerOptions = {},
      ): Effect.Effect<Subscription> =>
        Effect.gen(function* () {
          const id = options.id ?? `handler-${nextId++}`;
          const priority = options.priority ?? 100;
          const key = makeKey(filter);

          yield* Ref.update(handlersRef, (m) => {
            const existing = m.get(key) ?? [];
            const updated = [
              ...existing,
              {
                handler: handler as EventHandler<
                  CombatLog.CombatLog.CombatLogEvent,
                  unknown,
                  unknown
                >,
                id,
                priority,
              },
            ].sort((a, b) => a.priority - b.priority);
            return m.set(key, updated);
          });

          return {
            id,
            unsubscribe: unsubscribe(id),
          };
        });

      /**
       * Convenience: subscribe to a specific spell event
       */
      const onSpell = <R, Err>(
        subevent: CombatLog.CombatLog.Subevent,
        spellId: number,
        handler: EventHandler<CombatLog.CombatLog.SpellEvent, R, Err>,
        options: HandlerOptions = {},
      ): Effect.Effect<Subscription> =>
        on({ spellId, subevent }, handler, options);

      /**
       * Get all handlers matching an event
       * Returns spell-specific handlers first, then general handlers
       */
      const getHandlers = (
        event: CombatLog.CombatLog.CombatLogEvent,
      ): Effect.Effect<readonly HandlerEntry[]> =>
        Effect.gen(function* () {
          const m = yield* Ref.get(handlersRef);

          // Get spell-specific handlers if applicable
          const spellId = CombatLog.CombatLog.isSpellEvent(event)
            ? event.spellId
            : undefined;
          const specificKey =
            spellId !== undefined ? `${event._tag}:${spellId}` : undefined;
          const specific = specificKey ? (m.get(specificKey) ?? []) : [];

          // Get general handlers for this subevent
          const general = m.get(event._tag) ?? [];

          // Spell-specific first, then general, both sorted by priority
          return [...specific, ...general];
        });

      /**
       * Unsubscribe a handler by ID
       */
      const unsubscribe = (id: string): Effect.Effect<void> =>
        Ref.update(handlersRef, (m) =>
          m.map((entries) => entries.filter((e) => e.id !== id)),
        );

      /**
       * Clear all handlers
       */
      const clear = (): Effect.Effect<void> => Ref.set(handlersRef, Map());

      /**
       * Get the number of registered handlers
       */
      const count = (): Effect.Effect<number> =>
        Effect.map(Ref.get(handlersRef), (m) =>
          m.reduce((acc, entries) => acc + entries.length, 0),
        );

      return {
        clear,
        count,
        getHandlers,
        on,
        onSpell,
        unsubscribe,
      };
    }),
  },
) {}
