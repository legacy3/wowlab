/**
 * Resource Event Handlers
 *
 * Handles RESOURCE_SNAPSHOT events (and optionally SPELL_ENERGIZE/SPELL_DRAIN).
 */
import type * as Schemas from "@wowlab/core/Schemas";
import { defineHandler, type EventHandler } from "../registry";

/**
 * Custom event type for resource snapshots.
 * These are emitted by the runner at regular intervals.
 */
export interface ResourceSnapshot {
  readonly _tag: "RESOURCE_SNAPSHOT";
  readonly timestamp: number;
  readonly focus: number;
  readonly maxFocus: number;
}

/**
 * Type guard to check if an event is a resource snapshot.
 */
export function isResourceSnapshot(
  event: Schemas.CombatLog.CombatLogEvent | ResourceSnapshot,
): event is ResourceSnapshot {
  return "_tag" in event && event._tag === "RESOURCE_SNAPSHOT";
}

/**
 * Handler for resource snapshots.
 * Uses the extended EventHandler type to handle custom events.
 */
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

/**
 * Placeholder handlers for energize/drain events.
 * Currently no-ops, but can be extended to track resource changes.
 */
export const energizeHandler = defineHandler(
  ["SPELL_ENERGIZE"] as const,
  () => {
    // Could accumulate resource gains for analysis
  },
);

export const drainHandler = defineHandler(["SPELL_DRAIN"] as const, () => {
  // Could track resource drains for analysis
});
