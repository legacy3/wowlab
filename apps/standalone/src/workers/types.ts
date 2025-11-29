import type * as Schemas from "@wowlab/core/Schemas";

// Batch request - lightweight, no spell data
export interface SimulationBatch {
  batchId: number;
  duration: number;
  simIds: number[];
  type: "batch";
}

// Union type for worker messages
export type SimulationRequest = WorkerInit | SimulationBatch;

export interface SimulationResult {
  batchId: number;
  results: SingleSimResult[];
}

export interface SingleSimResult {
  casts: number;
  duration: number;
  error?: string;
  simId: number;
}

// Initial setup message sent once per worker
export interface WorkerInit {
  rotationName: string;
  spells: Schemas.Spell.SpellDataFlat[];
  type: "init";
}
