import * as EffectWorker from "@effect/platform/Worker";
import { BrowserWorker } from "@effect/platform-browser";
import type * as Schemas from "@wowlab/core/Schemas";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

import type {
  SimulationBatch,
  SimulationResult,
  SingleSimResult,
  WorkerInit,
} from "./types";

// --- Error Types ---

export class WorkerPoolError extends Data.TaggedError("WorkerPoolError")<{
  readonly reason: "InitializationFailed" | "ExecutionFailed";
  readonly message: string;
  readonly cause?: unknown;
}> {}

// --- Configuration ---

export interface WorkerPoolConfig {
  readonly workerCount?: number;
  readonly batchSize?: number;
}

const DEFAULT_CONFIG = {
  workerCount:
    typeof navigator !== "undefined"
      ? Math.max(2, Math.floor((navigator.hardwareConcurrency || 4) / 2))
      : 4,
  batchSize: 100,
} as const;

// --- Public Types ---

export interface SimulationParams {
  readonly code: string;
  readonly spellIds: readonly number[];
  readonly spells: Schemas.Spell.SpellDataFlat[];
  readonly auras: Schemas.Aura.AuraDataFlat[];
  readonly iterations: number;
  readonly duration: number;
}

export interface SimulationStats {
  completedSims: number;
  totalCasts: number;
  totalDamage: number;
  avgDps: number;
  errors: string[];
  workerVersion: string | null;
  bestResult: SingleSimResult | null;
}

export interface SimulationProgress {
  completed: number;
  total: number;
  elapsedMs: number;
  etaMs: number | null;
}

export type SimulationProgressCallback = (progress: SimulationProgress) => void;

// --- Stats Helpers ---

const createEmptyStats = (workerVersion: string | null): SimulationStats => ({
  completedSims: 0,
  totalCasts: 0,
  totalDamage: 0,
  avgDps: 0,
  errors: [],
  workerVersion,
  bestResult: null,
});

const aggregateResult = (
  stats: SimulationStats,
  result: SingleSimResult,
): void => {
  if (result.error) {
    stats.errors.push(result.error);
    return;
  }

  stats.completedSims++;
  stats.totalCasts += result.casts;
  stats.totalDamage += result.totalDamage;

  const isBetter =
    !stats.bestResult ||
    result.dps > stats.bestResult.dps ||
    (result.dps === 0 && !stats.bestResult.events?.length);

  if (isBetter) {
    stats.bestResult = result;
  }
};

const calculateProgress = (
  completed: number,
  total: number,
  startTime: number,
): SimulationProgress => {
  const elapsedMs = Date.now() - startTime;
  const rate = elapsedMs > 0 ? completed / (elapsedMs / 1000) : 0;
  const remaining = total - completed;
  const etaMs = rate > 0 ? Math.max(0, (remaining / rate) * 1000) : null;
  return { completed, total, elapsedMs, etaMs };
};

// --- Batch Creation ---

const createBatches = (
  iterations: number,
  duration: number,
  batchSize: number,
): SimulationBatch[] => {
  const batches: SimulationBatch[] = [];
  let batchId = 0;

  for (let start = 0; start < iterations; start += batchSize) {
    const count = Math.min(batchSize, iterations - start);
    batches.push({
      type: "batch",
      batchId: batchId++,
      duration,
      simIds: Array.from({ length: count }, (_, j) => start + j + 1),
    });
  }

  return batches;
};

// --- Worker Layer ---

const SimulationWorkerLayer = BrowserWorker.layer(
  () =>
    new Worker(new URL("./simulation-worker.ts", import.meta.url), {
      type: "module",
    }),
);

// --- Main Implementation ---

const runSimulationsInternal = (
  params: SimulationParams,
  config: Required<WorkerPoolConfig>,
  onProgress?: SimulationProgressCallback,
) =>
  Effect.gen(function* () {
    const pool = yield* EffectWorker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({ size: config.workerCount });

    // Initialize all workers
    const initMessage: WorkerInit = {
      type: "init",
      code: params.code,
      spellIds: params.spellIds,
      spells: params.spells,
      auras: params.auras,
    };

    const initResults = yield* Effect.all(
      Array.from({ length: config.workerCount }, () =>
        pool.executeEffect(initMessage),
      ),
      { concurrency: "unbounded" },
    );

    // Check for init errors
    let workerVersion: string | null = null;
    let initError: string | null = null;

    for (const result of initResults) {
      workerVersion ??= result.workerVersion ?? null;
      initError ??= result.results[0]?.error ?? null;
    }

    if (initError) {
      return yield* Effect.fail(
        new WorkerPoolError({
          reason: "InitializationFailed",
          message: `[Worker ${workerVersion ?? "unknown"}] ${initError}`,
        }),
      );
    }

    // Run simulations
    const stats = createEmptyStats(workerVersion);
    const batches = createBatches(
      params.iterations,
      params.duration,
      config.batchSize,
    );
    const startTime = Date.now();
    let processedSims = 0;

    yield* Effect.forEach(
      batches,
      (batch) =>
        Effect.gen(function* () {
          const result = yield* pool.executeEffect(batch);

          for (const simResult of result.results) {
            processedSims++;
            aggregateResult(stats, simResult);
          }

          onProgress?.(
            calculateProgress(processedSims, params.iterations, startTime),
          );
        }),
      { concurrency: config.workerCount },
    );

    if (stats.completedSims > 0) {
      stats.avgDps = stats.totalDamage / stats.completedSims / params.duration;
    }

    return stats;
  });

// --- Public API ---

export const runSimulations = (
  params: SimulationParams,
  config: WorkerPoolConfig = {},
  onProgress?: SimulationProgressCallback,
): Effect.Effect<SimulationStats, WorkerPoolError> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return runSimulationsInternal(params, cfg, onProgress).pipe(
    Effect.scoped,
    Effect.provide(SimulationWorkerLayer),
    Effect.mapError(
      (error) =>
        new WorkerPoolError({
          reason: "ExecutionFailed",
          message:
            error instanceof WorkerPoolError
              ? error.message
              : "Simulation failed",
          cause: error,
        }),
    ),
  );
};

export const runSimulationsPromise = (
  params: SimulationParams,
  config?: WorkerPoolConfig,
  onProgress?: SimulationProgressCallback,
): Promise<SimulationStats> =>
  Effect.runPromise(runSimulations(params, config, onProgress));
