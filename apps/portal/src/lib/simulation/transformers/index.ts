/**
 * Event Transformers
 *
 * Pluggable system for transforming CombatLogEvents into CombatData.
 *
 * To add support for a new event type:
 * 1. Create a handler in handlers/ using defineHandler()
 * 2. Export it from handlers/index.ts
 * 3. Add it to the defaultHandlers array below
 *
 * @example
 * ```ts
 * // handlers/healing.ts
 * export const healHandler = defineHandler(
 *   ["SPELL_HEAL", "SPELL_PERIODIC_HEAL"] as const,
 *   (event, ctx) => {
 *     ctx.emit.heal({ ... });
 *   },
 * );
 * ```
 */
import type * as Schemas from "@wowlab/core/Schemas";
import type { CombatData } from "@/atoms/timeline";
import {
  createTransformer,
  type AnyEventHandler,
  type EventHandler,
} from "./registry";
import {
  castHandlers,
  auraHandlers,
  damageHandlers,
  resourceSnapshotHandler,
  energizeHandler,
  drainHandler,
  isResourceSnapshot,
  type ResourceSnapshot,
} from "./handlers";

// Re-export types and utilities
export {
  createTransformer,
  defineHandler,
  type EventHandler,
  type AnyEventHandler,
} from "./registry";
export {
  type TransformContext,
  type TransformEmitters,
  type TransformState,
} from "./context";
export { isResourceSnapshot, type ResourceSnapshot } from "./handlers";

/**
 * Union of all event types the transformer can handle.
 * Includes standard CombatLogEvents plus custom synthetic events.
 */
type TransformEvent = Schemas.CombatLog.CombatLogEvent | ResourceSnapshot;

/**
 * Handler type for the extended event union.
 */
type TransformHandler = AnyEventHandler<TransformEvent>;

/**
 * Default handlers for all supported event types.
 * Cast to TransformHandler[] to allow mixing CombatLogEvent and ResourceSnapshot handlers.
 */
const defaultHandlers: TransformHandler[] = [
  ...castHandlers,
  ...auraHandlers,
  ...damageHandlers,
  resourceSnapshotHandler,
  energizeHandler,
  drainHandler,
] as TransformHandler[];

/**
 * Default transformer using all built-in handlers.
 */
const defaultTransformer = createTransformer<TransformEvent>(defaultHandlers);

/**
 * Transforms raw CombatLogEvents into timeline-compatible CombatData.
 *
 * Note: Combat log event timestamps are already in seconds from the simulation.
 */
export function transformEvents(
  events: readonly Schemas.CombatLog.CombatLogEvent[],
  durationMs: number,
): CombatData {
  return defaultTransformer(events, durationMs);
}

/**
 * Transforms events including resource snapshots.
 *
 * Note: All timestamps (combat log and resource snapshots) are in seconds.
 */
export function transformEventsWithResources(
  events: readonly TransformEvent[],
  durationMs: number,
): CombatData {
  return defaultTransformer(events, durationMs);
}
