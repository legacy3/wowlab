import { Events } from "@wowlab/core";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

export interface HandlerDefinition<
  T extends Events.EventType = Events.EventType,
> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly eventType: T;
  readonly name: string;
  readonly priority: number;
}

export interface HandlerRegistration<
  T extends Events.EventType = Events.EventType,
> {
  readonly callback: Events.ExecutionCallback<T>;
  readonly name: string;
  readonly priority: number;
}

/**
 * Central registry for event handlers.
 * Handlers are registered at bootstrap and auto-injected into events.
 *
 * Priority guide:
 * - 0-20: Critical pre-processing (state cleanup, validation)
 * - 20-50: Core game logic (damage, healing, resource changes)
 * - 50-100: Secondary effects (procs, triggers, modifiers)
 * - 100+: Post-processing (logging, metrics, cleanup)
 */
export class EventHandlerRegistry extends Effect.Service<EventHandlerRegistry>()(
  "EventHandlerRegistry",
  {
    effect: Effect.sync(() => {
      const handlers = new Map<
        Events.EventType,
        Array<HandlerRegistration<any>>
      >();

      return {
        /**
         * Register a handler for an event type.
         * Lower priority numbers execute first (0 = highest priority).
         */
        register: <T extends Events.EventType>(
          eventType: T,
          name: string,
          callback: Events.ExecutionCallback<T>,
          priority: number = 100,
        ) => {
          const list = handlers.get(eventType) ?? [];
          list.push({ callback, name, priority });
          // Sort by priority ascending (lower = higher priority)
          list.sort((a, b) => a.priority - b.priority);
          handlers.set(eventType, list);
        },

        /**
         * Register multiple handlers at once.
         */
        registerMany: (definitions: ReadonlyArray<HandlerDefinition>) =>
          Effect.sync(() => {
            for (const def of definitions) {
              const list = handlers.get(def.eventType) ?? [];
              list.push({
                callback: def.callback,
                name: def.name,
                priority: def.priority,
              });
              list.sort((a, b) => a.priority - b.priority);
              handlers.set(def.eventType, list);
            }
          }),

        /**
         * Get all registered handlers for an event type.
         * Returns handlers in priority order (lowest priority value first).
         */
        getHandlers: <T extends Events.EventType>(
          eventType: T,
        ): ReadonlyArray<Events.ExecutionCallback<T>> => {
          const list = handlers.get(eventType) ?? [];
          return list.map((h) => h.callback);
        },

        /**
         * Get handler registrations with metadata.
         * Useful for debugging.
         */
        getHandlerInfo: <T extends Events.EventType>(
          eventType: T,
        ): ReadonlyArray<HandlerRegistration<T>> => {
          return handlers.get(eventType) ?? [];
        },

        /**
         * Clear all handlers for an event type.
         * Useful for testing.
         */
        clear: (eventType: Events.EventType) => {
          handlers.delete(eventType);
        },

        /**
         * Clear all handlers.
         * Useful for testing.
         */
        clearAll: () => {
          handlers.clear();
        },
      };
    }),
  },
) {}

/**
 * Helper to create a handler definition.
 */
export const defineHandler = <T extends Events.EventType>(
  eventType: T,
  name: string,
  callback: Events.ExecutionCallback<T>,
  priority: number,
): HandlerDefinition<T> => ({
  callback,
  eventType,
  name,
  priority,
});
