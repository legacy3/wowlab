import type * as Schemas from "@wowlab/core/Schemas";

/**
 * Initial setup message sent once per worker.
 * Includes rotation code as a string for sandboxed execution.
 */
export interface WorkerInit {
  type: "init";
  /** Rotation code as JavaScript/TypeScript source string */
  code: string;
  /** Spell IDs used by the rotation (for data loading) */
  spellIds: readonly number[];
  /** Pre-loaded spell data */
  spells: Schemas.Spell.SpellDataFlat[];
  /** Pre-loaded aura data */
  auras: Schemas.Aura.AuraDataFlat[];
}

/**
 * Batch request - lightweight, no spell data.
 * Sent for each batch of simulations.
 */
export interface SimulationBatch {
  type: "batch";
  batchId: number;
  /** Simulation duration in seconds */
  duration: number;
  /** IDs for simulations in this batch */
  simIds: number[];
}

/** Union type for worker messages */
export type SimulationRequest = WorkerInit | SimulationBatch;

/** Result from a single simulation */
export interface SingleSimResult {
  simId: number;
  casts: number;
  duration: number;
  totalDamage: number;
  dps: number;
  error?: string;
}

/** Batch result returned from worker */
export interface SimulationResult {
  batchId: number;
  results: SingleSimResult[];
  /** Worker version, included in init response */
  workerVersion?: string;
}

/**
 * Error types that can occur during worker execution.
 */
export type WorkerErrorReason =
  | "WorkerCreationFailed"
  | "WorkerNotInitialized"
  | "ExecutionTimeout"
  | "CodeCompilationFailed"
  | "SimulationFailed";
