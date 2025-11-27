import type * as Schemas from "@wowlab/core/Schemas";

// Initial setup message sent once per worker
export interface WorkerInit {
  type: "init";
  rotationName: string;
  spells: Schemas.Spell.SpellDataFlat[];
}

// Batch request - lightweight, no spell data
export interface SimulationBatch {
  type: "batch";
  batchId: number;
  duration: number;
  simIds: number[];
}

// Union type for worker messages
export type SimulationRequest = WorkerInit | SimulationBatch;

export interface SingleSimResult {
  casts: number;
  duration: number;
  error?: string;
  simId: number;
}

export interface SimulationResult {
  batchId: number;
  results: SingleSimResult[];
}
