import type * as Schemas from "@wowlab/core/Schemas";
import type { CombatData } from "@/atoms/timeline";
import { createContext, type TransformContext } from "./context";

type CombatLogEvent = Schemas.CombatLog.CombatLogEvent;
type BaseEvent = { readonly _tag: string };

export interface EventHandler<
  E extends BaseEvent = CombatLogEvent,
  T extends E["_tag"] = E["_tag"],
> {
  readonly tags: readonly T[];
  handle(event: Extract<E, { _tag: T }>, ctx: TransformContext): void;
}

export type AnyEventHandler<E extends BaseEvent = CombatLogEvent> = {
  [Tag in E["_tag"]]: EventHandler<E, Tag>;
}[E["_tag"]];

export function createTransformer<E extends BaseEvent>(
  handlers: readonly AnyEventHandler<E>[],
): (events: readonly E[], durationMs: number) => CombatData {
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

export function defineHandler<T extends CombatLogEvent["_tag"]>(
  tags: readonly T[],
  handle: (
    event: Extract<CombatLogEvent, { _tag: T }>,
    ctx: TransformContext,
  ) => void,
): EventHandler<CombatLogEvent, T> {
  return { tags, handle };
}
