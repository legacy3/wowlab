import type * as Schemas from "@wowlab/core/Schemas";
import { defineHandler, type EventHandler } from "../registry";

export interface ResourceSnapshot {
  readonly _tag: "RESOURCE_SNAPSHOT";
  readonly timestamp: number;
  readonly focus: number;
  readonly maxFocus: number;
}

export function isResourceSnapshot(
  event: Schemas.CombatLog.CombatLogEvent | ResourceSnapshot,
): event is ResourceSnapshot {
  return "_tag" in event && event._tag === "RESOURCE_SNAPSHOT";
}

export const resourceSnapshotHandler: EventHandler<
  ResourceSnapshot,
  "RESOURCE_SNAPSHOT"
> = {
  tags: ["RESOURCE_SNAPSHOT"],
  handle: (event, ctx) => {
    ctx.emit.resource({
      type: "resource",
      id: ctx.ids.next("res"),
      timestamp: event.timestamp,
      focus: event.focus,
      maxFocus: event.maxFocus,
    });
  },
};

export const energizeHandler = defineHandler(
  ["SPELL_ENERGIZE"] as const,
  () => {},
);

export const drainHandler = defineHandler(["SPELL_DRAIN"] as const, () => {});
