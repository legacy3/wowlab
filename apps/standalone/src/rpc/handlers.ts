import type { Rpc } from "@effect/rpc";

import { NodeWorker } from "@effect/platform-node";
import * as Worker from "@effect/platform/Worker";
import * as WorkerError from "@effect/platform/WorkerError";
import * as Schemas from "@wowlab/core/Schemas";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorkerThread } from "node:worker_threads";

import type {
  SimulationBatch,
  SimulationResult,
  WorkerInit,
} from "../workers/types.js";

import { loadSpells } from "../data/spell-loader.js";
import { supabaseClient } from "../data/supabase.js";
import { rotations } from "../rotations/index.js";
import {
  AggregatedStatsSchema,
  RunSimulationResponse,
  SimulationResultSchema,
  SimulationRpcs,
} from "./requests.js";

// Track server start time for uptime
const serverStartTime = Date.now();

interface AggregatedStats {
  completedSims: number;
  totalCasts: number;
}

interface SimResult {
  casts: number;
  duration: number;
  simId: number;
}

// Helper to run simulations using worker threads
const runWithWorkers = (
  iterations: number,
  duration: number,
  rotationName: string,
  spells: Schemas.Spell.SpellDataFlat[],
  workerCount: number,
  batchSize: number,
): Effect.Effect<
  { stats: AggregatedStats; sampleResults: SimResult[]; elapsedMs: number },
  WorkerError.WorkerError,
  Scope.Scope | Worker.WorkerManager | Worker.Spawner
> =>
  Effect.gen(function* () {
    const startTime = performance.now();

    const pool = yield* Worker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({
      size: workerCount,
    });

    // Initialize all workers with spell data
    const initMessage: WorkerInit = {
      rotationName,
      spells,
      type: "init",
    };

    yield* Effect.all(
      Array.from({ length: workerCount }, () =>
        pool.executeEffect(initMessage),
      ),
      { concurrency: "unbounded" },
    );

    const stats: AggregatedStats = {
      completedSims: 0,
      totalCasts: 0,
    };
    const sampleResults: SimResult[] = [];

    // Process in waves
    const waveSize = workerCount * 10;
    let batchId = 0;

    for (
      let waveStart = 0;
      waveStart < iterations;
      waveStart += waveSize * batchSize
    ) {
      const waveBatches: SimulationBatch[] = [];

      for (let i = 0; i < waveSize && batchId * batchSize < iterations; i++) {
        const startSim = batchId * batchSize;
        const simsInBatch = Math.min(batchSize, iterations - startSim);

        waveBatches.push({
          batchId: batchId++,
          duration,
          simIds: Array.from(
            { length: simsInBatch },
            (_, j) => startSim + j + 1,
          ),
          type: "batch",
        });
      }

      const waveResults = yield* Effect.all(
        waveBatches.map((batch) =>
          pool
            .executeEffect(batch)
            .pipe(Effect.map((result) => result.results)),
        ),
        { concurrency: "unbounded" },
      );

      for (const batchResults of waveResults) {
        for (const result of batchResults) {
          stats.completedSims++;
          stats.totalCasts += result.casts;

          if (sampleResults.length < 10) {
            sampleResults.push({
              casts: result.casts,
              duration: result.duration,
              simId: result.simId,
            });
          }
        }
      }
    }

    const elapsedMs = performance.now() - startTime;
    return { elapsedMs, sampleResults, stats };
  });

/**
 * RPC handlers layer for the simulation server
 */
export const SimulationHandlersLive: Layer.Layer<
  | Rpc.Handler<"RunSimulation">
  | Rpc.Handler<"ListRotations">
  | Rpc.Handler<"HealthCheck">
> = SimulationRpcs.toLayer({
  HealthCheck: () =>
    Effect.succeed({
      status: "ok" as const,
      uptime: Date.now() - serverStartTime,
    }),

  ListRotations: () => Effect.succeed(Object.keys(rotations)),

  RunSimulation: ({ batchSize, duration, iterations, rotation }) =>
    Effect.gen(function* () {
      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        return yield* Effect.fail(
          `Rotation '${rotation}' not found. Available: ${Object.keys(rotations).join(", ")}`,
        );
      }

      yield* Effect.log(
        `RPC: Running ${iterations} simulations of ${selectedRotation.name} for ${duration}s`,
      );

      // Load spells
      const spells = yield* loadSpells(
        supabaseClient,
        selectedRotation.spellIds,
      );

      // Determine worker count
      const workerCount = Math.max(4, os.cpus().length - 1);

      // Get worker path
      const workerPath = fileURLToPath(
        new URL("../workers/worker-bootstrap.mjs", import.meta.url),
      );

      // Run simulations
      const { elapsedMs, sampleResults, stats } = yield* runWithWorkers(
        iterations,
        duration,
        rotation,
        spells,
        workerCount,
        batchSize,
      ).pipe(
        Effect.scoped,
        Effect.provide(
          Layer.merge(
            NodeWorker.layerManager,
            NodeWorker.layer(() => new NodeWorkerThread(workerPath)),
          ),
        ),
        Effect.mapError((e) => `Worker error: ${e}`),
      );

      const avgCasts = stats.totalCasts / stats.completedSims;
      const throughput = (stats.completedSims / elapsedMs) * 1000;

      yield* Effect.log(
        `RPC: Completed ${stats.completedSims} simulations in ${(elapsedMs / 1000).toFixed(2)}s (${Math.round(throughput)} sims/s)`,
      );

      return new RunSimulationResponse({
        sampleResults: sampleResults.map(
          (r) =>
            new SimulationResultSchema({
              casts: r.casts,
              duration: r.duration,
              simId: r.simId,
            }),
        ),
        stats: new AggregatedStatsSchema({
          avgCasts,
          completedSims: stats.completedSims,
          elapsedMs,
          throughput,
          totalCasts: stats.totalCasts,
        }),
      });
    }),
});
