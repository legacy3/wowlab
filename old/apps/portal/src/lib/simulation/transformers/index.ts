import type * as Schemas from "@wowlab/core/Schemas";
import type { CombatData } from "@/atoms/timeline";
import { createTransformer, type AnyEventHandler } from "./registry";
import {
  castHandlers,
  auraHandlers,
  damageHandlers,
  resourceSnapshotHandler,
  energizeHandler,
  drainHandler,
  type ResourceSnapshot,
} from "./handlers";

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

type TransformEvent = Schemas.CombatLog.CombatLogEvent | ResourceSnapshot;
type TransformHandler = AnyEventHandler<TransformEvent>;

const defaultHandlers: TransformHandler[] = [
  ...castHandlers,
  ...auraHandlers,
  ...damageHandlers,
  resourceSnapshotHandler,
  energizeHandler,
  drainHandler,
] as TransformHandler[];

const defaultTransformer = createTransformer<TransformEvent>(defaultHandlers);

export function transformEvents(
  events: readonly Schemas.CombatLog.CombatLogEvent[],
  durationMs: number,
): CombatData {
  return defaultTransformer(events, durationMs);
}

export function transformEventsWithResources(
  events: readonly TransformEvent[],
  durationMs: number,
): CombatData {
  return defaultTransformer(events, durationMs);
}
