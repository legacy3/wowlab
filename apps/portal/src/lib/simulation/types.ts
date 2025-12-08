import type * as Errors from "@wowlab/core/Errors";
import type * as Schemas from "@wowlab/core/Schemas";
import type * as Context from "@wowlab/rotation/Context";
import type * as Effect from "effect/Effect";
import type { ResourceSnapshot } from "./transform-events";

/**
 * Definition for a rotation that can be run by the browser simulation.
 */
export interface RotationDefinition {
  /** Display name for the rotation */
  readonly name: string;

  /** The APL logic that decides what to cast each GCD */
  readonly run: (
    playerId: Schemas.Branded.UnitID,
  ) => Effect.Effect<void, Errors.RotationError, Context.RotationContext>;

  /** All spell IDs needed by this rotation (used to load spell data) */
  readonly spellIds: readonly number[];
}

/**
 * Configuration for running a simulation.
 */
export interface SimulationConfig {
  rotation: RotationDefinition;
  spells: Schemas.Spell.SpellDataFlat[];
  durationMs: number;
}

/**
 * Combined event type for simulation results.
 * Includes both combat log events and resource snapshots.
 */
export type SimulationEvent =
  | Schemas.CombatLog.CombatLogEvent
  | ResourceSnapshot;

/**
 * Result of a simulation run.
 */
export interface SimulationResult {
  events: SimulationEvent[];
  casts: number;
  durationMs: number;
  totalDamage: number;
  dps: number;
}
