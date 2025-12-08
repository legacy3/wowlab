/**
 * Handler Registry
 *
 * Provides a pluggable system for registering event handlers.
 * New event types can be supported by adding new handler modules.
 */
import type * as Schemas from "@wowlab/core/Schemas";
import type { CombatData } from "@/atoms/timeline";
import { createContext, type TransformContext } from "./context";

type CombatLogEvent = Schemas.CombatLog.CombatLogEvent;

/**
 * Base constraint for events that can be handled.
 */
type BaseEvent = { readonly _tag: string };

/**
 * A handler for one or more event tags.
 *
 * The E type parameter allows handlers to work with extended event unions
 * (e.g., CombatLogEvent | ResourceSnapshot).
 *
 * @example
 * ```ts
 * const damageHandler = defineHandler(
 *   ["SPELL_DAMAGE", "SPELL_PERIODIC_DAMAGE"] as const,
 *   (event, ctx) => {
 *     ctx.emit.damage({ ... });
 *   },
 * );
 * ```
 */
export interface EventHandler<
  E extends BaseEvent = CombatLogEvent,
  T extends E["_tag"] = E["_tag"],
> {
  readonly tags: readonly T[];
  handle(event: Extract<E, { _tag: T }>, ctx: TransformContext): void;
}

/**
 * Union type of all possible handler instantiations for a given event union.
 * This allows combining handlers with different specific tags into a single array.
 */
export type AnyEventHandler<E extends BaseEvent = CombatLogEvent> = {
  [Tag in E["_tag"]]: EventHandler<E, Tag>;
}[E["_tag"]];

/**
 * Creates a transformer function from a set of handlers.
 *
 * The transformer processes events in order, delegating to the appropriate
 * handler based on the event's _tag. Unknown tags are silently ignored.
 */
export function createTransformer<E extends BaseEvent>(
  handlers: readonly AnyEventHandler<E>[],
): (events: readonly E[], durationMs: number) => CombatData {
  // Build tag -> handler lookup
  type HandlerLookup = Partial<
    Record<E["_tag"], (event: E, ctx: TransformContext) => void>
  >;
  const lookup: HandlerLookup = {};

  for (const handler of handlers) {
    for (const tag of handler.tags) {
      lookup[tag as E["_tag"]] = handler.handle as (
        event: E,
        ctx: TransformContext,
      ) => void;
    }
  }

  return (events, durationMs) => {
    const ctx = createContext(durationMs);

    for (const event of events) {
      const handler = lookup[event._tag as E["_tag"]];
      if (handler) {
        handler(event, ctx);
      }
    }

    return ctx.flush();
  };
}

/**
 * Helper to define a handler with proper typing for CombatLogEvent handlers.
 */
export function defineHandler<T extends CombatLogEvent["_tag"]>(
  tags: readonly T[],
  handle: (
    event: Extract<CombatLogEvent, { _tag: T }>,
    ctx: TransformContext,
  ) => void,
): EventHandler<CombatLogEvent, T> {
  return { tags, handle };
}
