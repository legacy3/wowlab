import type * as Schemas from "@wowlab/core/Schemas";
import type { ResourceSnapshot } from "./transformers";

// NOTE: Browser-based TS simulation has been replaced by Rust engine.
// These types are kept for result display compatibility.

/**
 * Definition for a rotation (legacy - browser simulation removed).
 * New rotations use Rhai scripts executed by the Rust engine.
 */
export interface RotationDefinition {
  readonly name: string;
  readonly spellIds: readonly number[];
}

/**
 * Configuration for running a simulation (legacy).
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
