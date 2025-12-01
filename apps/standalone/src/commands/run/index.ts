import { Args, Command, Options } from "@effect/cli";
import { NodeWorker } from "@effect/platform-node";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as Worker from "@effect/platform/Worker";
import * as WorkerError from "@effect/platform/WorkerError";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import * as Schemas from "@wowlab/core/Schemas";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as LogLevel from "effect/LogLevel";
import * as Option from "effect/Option";
import * as Scope from "effect/Scope";
import * as os from "node:os";
import { fileURLToPath } from "node:url";
import { Worker as NodeWorkerThread } from "node:worker_threads";

import type { RotationDefinition } from "../../framework/types.js";
import type {
  SimulationBatch,
  SimulationResult,
  WorkerInit,
} from "../../workers/types.js";

import { loadSpells } from "../../data/spell-loader.js";
import { supabaseClient } from "../../data/supabase.js";
import { rotations } from "../../rotations/index.js";
import { SimulationRpcs } from "../../rpc/requests.js";
import {
  createRotationRuntime,
  type RotationRuntimeConfig,
} from "../../runtime/RotationRuntime.js";

const rotationArg = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("beast-mastery"),
);

const durationOpt = Options.integer("duration").pipe(
  Options.withAlias("d"),
  Options.withDescription("Simulation duration in seconds"),
  Options.withDefault(10),
);

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of parallel simulations to run"),
  Options.withDefault(1),
);

const workersOpt = Options.integer("workers").pipe(
  Options.withAlias("w"),
  Options.withDescription(
    "Number of worker threads (0 = single-threaded, -1 = auto)",
  ),
  Options.withDefault(-1),
);

const batchSizeOpt = Options.integer("batch-size").pipe(
  Options.withAlias("b"),
  Options.withDescription("Simulations per worker batch"),
  Options.withDefault(100),
);

const serverOpt = Options.text("server").pipe(
  Options.withAlias("s"),
  Options.withDescription(
    "Remote server URL (e.g., http://192.168.1.100:3847). If provided, runs simulation on remote daemon instead of locally.",
  ),
  Options.optional,
);

interface SimResult {
  casts: number;
  duration: number;
  simId: number;
}

const runSimulation = (
  simId: number,
  config: RotationRuntimeConfig,
  rotation: RotationDefinition,
  duration: number,
  silent: boolean,
): Effect.Effect<SimResult> =>
  Effect.acquireUseRelease(
    Effect.sync(() =>
      createRotationRuntime({
        ...config,
        logLevel: silent ? LogLevel.None : config.logLevel,
      }),
    ),
    (runtime) =>
      Effect.promise(() =>
        runtime.runPromise(
          Effect.gen(function* () {
            const playerId = Schemas.Branded.UnitID(`player-${simId}`);
            const player = rotation.setupPlayer(playerId, config.spells);

            const unitService = yield* Unit.UnitService;
            yield* unitService.add(player);

            const stateService = yield* State.StateService;

            let casts = 0;
            while (true) {
              const state = yield* stateService.getState();
              if (state.currentTime >= duration) break;
              yield* rotation.run(playerId);
              casts++;
            }

            return { casts, duration, simId };
          }),
        ),
      ),
    (runtime) => Effect.promise(() => runtime.dispose()),
  );

const printResults = (
  results: SimResult[],
  elapsed: number,
  workerCount?: number,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const iterations = results.length;
    const totalCasts = results.reduce((sum, r) => sum + r.casts, 0);
    const avgCasts = totalCasts / iterations;
    const throughput = (iterations / elapsed) * 1000;

    yield* Effect.log("");
    yield* Effect.log("┌─────────────────────────────────────────┐");
    yield* Effect.log("│           Simulation Results            │");
    yield* Effect.log("├─────────────────────────────────────────┤");
    yield* Effect.log(
      `│  Iterations:    ${String(iterations).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Duration:      ${String(results[0].duration + "s").padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Elapsed:       ${String(elapsed.toFixed(1) + "ms").padStart(20)}  │`,
    );
    if (workerCount !== undefined && workerCount > 0) {
      yield* Effect.log(
        `│  Workers:       ${String(workerCount).padStart(20)}  │`,
      );
    }
    yield* Effect.log("├─────────────────────────────────────────┤");
    yield* Effect.log(
      `│  Total Casts:   ${String(totalCasts).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Avg Casts:     ${avgCasts.toFixed(1).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Throughput:    ${(throughput.toFixed(1) + " sims/s").padStart(20)}  │`,
    );
    yield* Effect.log("└─────────────────────────────────────────┘");
  });

const printAggregatedResults = (
  stats: AggregatedStats,
  simDuration: number,
  elapsed: number,
  workerCount: number,
  remote?: string,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const avgCasts = stats.totalCasts / stats.completedSims;
    const throughput = (stats.completedSims / elapsed) * 1000;

    // Format large numbers with commas
    const formatNum = (n: number) => n.toLocaleString();

    yield* Effect.log("");
    yield* Effect.log("┌─────────────────────────────────────────┐");
    yield* Effect.log("│           Simulation Results            │");
    yield* Effect.log("├─────────────────────────────────────────┤");
    yield* Effect.log(
      `│  Iterations:    ${formatNum(stats.completedSims).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Duration:      ${String(simDuration + "s").padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Elapsed:       ${String((elapsed / 1000).toFixed(2) + "s").padStart(20)}  │`,
    );
    if (remote) {
      yield* Effect.log(
        `│  Server:        ${remote.padStart(20).slice(-20)}  │`,
      );
    } else {
      yield* Effect.log(
        `│  Workers:       ${String(workerCount).padStart(20)}  │`,
      );
    }
    yield* Effect.log("├─────────────────────────────────────────┤");
    yield* Effect.log(
      `│  Total Casts:   ${formatNum(stats.totalCasts).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Avg Casts:     ${avgCasts.toFixed(1).padStart(20)}  │`,
    );
    yield* Effect.log(
      `│  Throughput:    ${(formatNum(Math.round(throughput)) + " sims/s").padStart(20)}  │`,
    );
    yield* Effect.log("└─────────────────────────────────────────┘");
  });

// Aggregated stats - avoids storing all results in memory
interface AggregatedStats {
  completedSims: number;
  totalCasts: number;
}

// Helper to run simulations using worker threads with streaming
const runWithWorkers = (
  iterations: number,
  duration: number,
  rotationName: string,
  spells: Schemas.Spell.SpellDataFlat[],
  workerCount: number,
  batchSize: number,
): Effect.Effect<
  { stats: AggregatedStats; sampleResults: SimResult[] },
  WorkerError.WorkerError,
  Scope.Scope | Worker.WorkerManager | Worker.Spawner
> =>
  Effect.gen(function* () {
    // Create the worker pool
    const pool = yield* Worker.makePool<
      WorkerInit | SimulationBatch,
      SimulationResult,
      never
    >({
      size: workerCount,
    });

    // Initialize all workers with spell data (sent once per worker)
    const initMessage: WorkerInit = {
      rotationName,
      spells,
      type: "init",
    };

    // Send init to each worker
    yield* Effect.all(
      Array.from({ length: workerCount }, () =>
        pool.executeEffect(initMessage),
      ),
      { concurrency: "unbounded" },
    );

    const totalBatches = Math.ceil(iterations / batchSize);
    yield* Effect.log(
      `Initialized ${workerCount} workers, processing ${totalBatches} batches...`,
    );

    // Process batches in chunks to avoid memory issues
    // Keep only aggregated stats, not all results
    const stats: AggregatedStats = {
      completedSims: 0,
      totalCasts: 0,
    };
    const sampleResults: SimResult[] = []; // Keep first few for display

    // Process in waves to limit concurrent batch objects in memory
    const waveSize = workerCount * 10; // 10 batches per worker in flight
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

      // Execute this wave
      const waveResults = yield* Effect.all(
        waveBatches.map((batch) =>
          pool
            .executeEffect(batch)
            .pipe(Effect.map((result) => result.results)),
        ),
        { concurrency: "unbounded" },
      );

      // Aggregate results immediately, don't store
      for (const batchResults of waveResults) {
        for (const result of batchResults) {
          stats.completedSims++;
          stats.totalCasts += result.casts;

          // Keep first 10 samples for display
          if (sampleResults.length < 10) {
            sampleResults.push({
              casts: result.casts,
              duration: result.duration,
              simId: result.simId,
            });
          }
        }
      }

      // Log progress for long runs
      if (iterations > 100000 && stats.completedSims % 500000 === 0) {
        yield* Effect.log(
          `Progress: ${stats.completedSims.toLocaleString()} / ${iterations.toLocaleString()} (${((stats.completedSims / iterations) * 100).toFixed(1)}%)`,
        );
      }
    }

    return { sampleResults, stats };
  });

// Run simulation on a remote server via RPC
const runRemoteSimulation = (
  serverUrl: string,
  rotation: string,
  duration: number,
  iterations: number,
  batchSize: number,
): Effect.Effect<
  { stats: AggregatedStats; elapsedMs: number },
  string,
  never
> =>
  Effect.gen(function* () {
    yield* Effect.log(`Connecting to remote server: ${serverUrl}`);

    // Create RPC client layer
    const ProtocolLive = RpcClient.layerProtocolHttp({
      url: `${serverUrl}/rpc`,
    }).pipe(
      Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
    );

    const result = yield* Effect.scoped(
      Effect.gen(function* () {
        const client = yield* RpcClient.make(SimulationRpcs);

        // Run the simulation
        const response = yield* client.RunSimulation({
          batchSize,
          duration,
          iterations,
          rotation,
        });

        return {
          elapsedMs: response.stats.elapsedMs,
          stats: {
            completedSims: response.stats.completedSims,
            totalCasts: response.stats.totalCasts,
          },
        };
      }),
    ).pipe(
      Effect.provide(ProtocolLive),
      Effect.mapError((e) => String(e)),
    );

    return result;
  });

export const runCommand = Command.make(
  "run",
  {
    batchSize: batchSizeOpt,
    duration: durationOpt,
    iterations: iterationsOpt,
    rotation: rotationArg,
    server: serverOpt,
    workers: workersOpt,
  },
  ({ batchSize, duration, iterations, rotation, server, workers }) =>
    Effect.gen(function* () {
      // Check if we're using a remote server
      if (Option.isSome(server)) {
        const serverUrl = server.value;

        yield* Effect.log(`Running simulation remotely on: ${serverUrl}`);
        yield* Effect.log(`Rotation: ${rotation}`);
        yield* Effect.log(`Duration: ${duration}s`);
        yield* Effect.log(`Iterations: ${iterations}`);
        yield* Effect.log("---");

        const startTime = performance.now();
        const result = yield* runRemoteSimulation(
          serverUrl,
          rotation,
          duration,
          iterations,
          batchSize,
        ).pipe(
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              yield* Effect.logError(`Remote simulation failed: ${error}`);
              return yield* Effect.fail(error);
            }),
          ),
        );

        const totalElapsed = performance.now() - startTime;
        yield* printAggregatedResults(
          result.stats,
          duration,
          result.elapsedMs,
          0,
          serverUrl,
        );
        yield* Effect.log(
          `Total time (including network): ${(totalElapsed / 1000).toFixed(2)}s`,
        );
        return;
      }

      // Local execution
      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        yield* Effect.logError(
          `Rotation '${rotation}' not found. Available: ${Object.keys(rotations).join(", ")}`,
        );
        return;
      }

      yield* Effect.log(`Loading spells for: ${selectedRotation.name}`);

      const spells = yield* Effect.promise(() =>
        loadSpells(supabaseClient, selectedRotation.spellIds),
      );

      yield* Effect.log(`Loaded ${spells.length} spells`);

      const config: RotationRuntimeConfig = { spells };

      // Always run at least one simulation with full logging
      yield* Effect.log(`Running rotation: ${selectedRotation.name}`);
      yield* Effect.log(`Simulation duration: ${duration}s`);
      yield* Effect.log("---");

      yield* runSimulation(1, config, selectedRotation, duration, false);

      yield* Effect.log("---");

      // Run parallel simulations if requested
      if (iterations > 1) {
        // workers=0 means single-threaded, workers=-1 (default) means auto-detect
        const useWorkers = workers !== 0;
        const workerCount =
          workers > 0 ? workers : Math.max(4, os.cpus().length - 1);

        if (useWorkers) {
          yield* Effect.log(
            `Running ${iterations.toLocaleString()} simulations using ${workerCount} worker threads...`,
          );

          const startTime = performance.now();

          // Use the bootstrap wrapper which sets up tsx properly
          const workerPath = fileURLToPath(
            new URL("../../workers/worker-bootstrap.mjs", import.meta.url),
          );

          const { stats } = yield* runWithWorkers(
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
          );

          const elapsed = performance.now() - startTime;
          yield* printAggregatedResults(stats, duration, elapsed, workerCount);
        } else {
          // Single-threaded mode (original behavior)
          yield* Effect.log(
            `Running ${iterations} parallel simulations (single-threaded)...`,
          );

          const startTime = performance.now();

          const simEffects = Array.from({ length: iterations }, (_, i) =>
            runSimulation(i + 1, config, selectedRotation, duration, true),
          );

          const results = yield* Effect.all(simEffects, {
            concurrency: "unbounded",
          });

          const elapsed = performance.now() - startTime;
          yield* printResults(results, elapsed);
        }
      } else {
        yield* Effect.log("Simulation complete");
      }
    }),
);
