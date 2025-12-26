import type * as Schemas from "@wowlab/core/Schemas";
import type { SimulationEvent } from "../simulation/types";

export interface WorkerInit {
  type: "init";
  code: string;
  spellIds: readonly number[];
  spells: Schemas.Spell.SpellDataFlat[];
  auras: Schemas.Aura.AuraDataFlat[];
}

export interface SimulationBatch {
  type: "batch";
  batchId: number;
  duration: number;
  simIds: number[];
}

export type SimulationRequest = WorkerInit | SimulationBatch;

export interface SingleSimResult {
  simId: number;
  casts: number;
  duration: number;
  totalDamage: number;
  dps: number;
  error?: string;
  events?: SimulationEvent[];
}

export interface SimulationResult {
  batchId: number;
  results: SingleSimResult[];
  workerVersion?: string;
}
