import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { initSync, Simulator } from "../../wasm/engine.js";

import type {
  WasmBatchResult,
  WasmWorkerBatch,
  WasmWorkerInit,
} from "../workers/wasm-worker.js";

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of simulation iterations"),
  Options.withDefault(10000),
);

const workersOpt = Options.integer("workers").pipe(
  Options.withAlias("w"),
  Options.withDescription("Number of worker threads (-1 = auto)"),
  Options.withDefault(-1),
);

const batchSizeOpt = Options.integer("batch-size").pipe(
  Options.withAlias("b"),
  Options.withDescription("Simulations per worker batch"),
  Options.withDefault(5000),
);

const createConfig = () => ({
  player: {
    name: "Test Hunter",
    spec: "beast_mastery",
    stats: {
      agility: 5000,
      intellect: 0,
      strength: 0,
      stamina: 4000,
      crit_rating: 1000,
      haste_rating: 800,
      mastery_rating: 600,
      versatility_rating: 400,
      crit_pct: 25.0,
      haste_pct: 15.0,
      mastery_pct: 20.0,
      versatility_pct: 5.0,
    },
    resources: {
      resource_type: "focus",
      max: 100,
      regen_per_second: 10,
      initial: 100,
    },
  },
  spells: [
    {
      id: 34026,
      name: "Kill Command",
      cooldown: 6.0,
      gcd: 1.5,
      cast_time: 0,
      charges: 2,
      cost: { resource_type: "focus", amount: 30 },
      damage: {
        base_min: 1000,
        base_max: 1200,
        ap_coefficient: 1.2,
        sp_coefficient: 0,
        weapon_coefficient: 0,
      },
      effects: [],
      is_gcd: true,
      is_harmful: true,
    },
    {
      id: 56641,
      name: "Cobra Shot",
      cooldown: 0,
      gcd: 1.5,
      cast_time: 0,
      charges: 0,
      cost: { resource_type: "focus", amount: 35 },
      damage: {
        base_min: 500,
        base_max: 600,
        ap_coefficient: 0.6,
        sp_coefficient: 0,
        weapon_coefficient: 0,
      },
      effects: [],
      is_gcd: true,
      is_harmful: true,
    },
  ],
  auras: [],
  rotation: [],
  duration: 60,
  target: {
    level_diff: 3,
    max_health: 10000000,
    armor: 0,
  },
});

const runSingleThreaded = (iterations: number) =>
  Effect.gen(function* () {
    yield* Effect.log("Initializing WASM engine (single-threaded)...");

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const wasmPath = path.resolve(__dirname, "../../wasm/engine_bg.wasm");
    const wasmBuffer = fs.readFileSync(wasmPath);
    initSync({ module: wasmBuffer });

    const config = createConfig();
    const sim = new Simulator(JSON.stringify(config));

    yield* Effect.log(`Running ${iterations.toLocaleString()} simulations...`);
    const startTime = performance.now();
    const result = sim.run_batch(iterations, BigInt(Date.now()));
    const elapsed = performance.now() - startTime;

    sim.free();

    return { result, elapsed, workerCount: 1 };
  });

const createWorker = (config: object): Promise<Worker> => {
  return new Promise((resolve, reject) => {
    const workerPath = fileURLToPath(
      new URL("../workers/wasm-worker-bootstrap.mjs", import.meta.url),
    );
    const worker = new Worker(workerPath);

    let ready = false;

    worker.on("message", (msg) => {
      if (msg.type === "started") {
        // Worker started, send init
        const initMsg: WasmWorkerInit = { type: "init", config };
        worker.postMessage(initMsg);
      } else if (msg.type === "ready") {
        ready = true;
        resolve(worker);
      } else if (msg.type === "error" && !ready) {
        reject(new Error(msg.error));
      }
    });

    worker.on("error", reject);
  });
};

const runBatchOnWorker = (
  worker: Worker,
  batchId: number,
  iterations: number,
  baseSeed: number,
): Promise<WasmBatchResult> => {
  return new Promise((resolve, reject) => {
    const handler = (msg: {
      type: string;
      result?: WasmBatchResult;
      error?: string;
    }) => {
      if (msg.type === "result" && msg.result) {
        worker.off("message", handler);
        resolve(msg.result);
      } else if (msg.type === "error") {
        worker.off("message", handler);
        reject(new Error(msg.error));
      }
    };

    worker.on("message", handler);

    const batchMsg: WasmWorkerBatch = {
      type: "batch",
      batchId,
      iterations,
      baseSeed,
    };
    worker.postMessage(batchMsg);
  });
};

const runWithWorkers = (
  iterations: number,
  workerCount: number,
  batchSize: number,
) =>
  Effect.gen(function* () {
    yield* Effect.log(`Initializing ${workerCount} WASM workers...`);

    const config = createConfig();

    // Create all workers
    const workers = yield* Effect.promise(() =>
      Promise.all(
        Array.from({ length: workerCount }, () => createWorker(config)),
      ),
    );

    // Increase max listeners to avoid warnings with many batches
    for (const worker of workers) {
      worker.setMaxListeners(500);
    }

    yield* Effect.log(
      `Running ${iterations.toLocaleString()} simulations across ${workerCount} workers...`,
    );

    const startTime = performance.now();

    // Distribute work across workers in batches
    const batchPromises: Promise<WasmBatchResult>[] = [];
    let simsRemaining = iterations;
    let batchId = 0;

    // Round-robin distribute batches to workers
    while (simsRemaining > 0) {
      const workerIdx = batchId % workerCount;
      const simsInBatch = Math.min(batchSize, simsRemaining);
      const baseSeed = Date.now() + batchId * 1000000;

      batchPromises.push(
        runBatchOnWorker(workers[workerIdx], batchId, simsInBatch, baseSeed),
      );

      simsRemaining -= simsInBatch;
      batchId++;
    }

    // Wait for all batches
    const results = yield* Effect.promise(() => Promise.all(batchPromises));
    const elapsed = performance.now() - startTime;

    // Aggregate results
    let totalCasts = 0;
    let minDps = Infinity;
    let maxDps = -Infinity;
    let dpsSum = 0;
    let totalSims = 0;

    for (const r of results) {
      totalCasts += r.totalCasts;
      minDps = Math.min(minDps, r.minDps);
      maxDps = Math.max(maxDps, r.maxDps);
      dpsSum += r.meanDps * r.iterations;
      totalSims += r.iterations;
    }

    // Terminate workers
    for (const worker of workers) {
      worker.terminate();
    }

    return {
      result: {
        mean_dps: dpsSum / totalSims,
        min_dps: minDps,
        max_dps: maxDps,
        total_casts: totalCasts,
      },
      elapsed,
      workerCount,
    };
  });

export const testWasmCommand = Command.make(
  "test-wasm",
  { iterations: iterationsOpt, workers: workersOpt, batchSize: batchSizeOpt },
  ({ iterations, workers, batchSize }) =>
    Effect.gen(function* () {
      const workerCount =
        workers === -1 ? Math.max(1, os.cpus().length - 1) : workers;
      const useWorkers = workerCount > 1;

      const {
        result,
        elapsed,
        workerCount: actualWorkers,
      } = useWorkers
        ? yield* runWithWorkers(iterations, workerCount, batchSize)
        : yield* runSingleThreaded(iterations);

      yield* Effect.log("");
      yield* Effect.log("┌───────────────────────────────────────────────┐");
      yield* Effect.log("│           WASM Engine Test Results            │");
      yield* Effect.log("├───────────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Workers:          ${actualWorkers.toString().padStart(24)}  │`,
      );
      yield* Effect.log(
        `│  Iterations:       ${iterations.toLocaleString().padStart(24)}  │`,
      );
      yield* Effect.log(
        `│  Elapsed:          ${elapsed.toFixed(2).padStart(21)}ms  │`,
      );
      yield* Effect.log(
        `│  Throughput:       ${((iterations / elapsed) * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(19)} sims/s  │`,
      );
      yield* Effect.log(
        `│  Per sim:          ${((elapsed / iterations) * 1000).toFixed(2).padStart(21)}μs  │`,
      );
      yield* Effect.log("├───────────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Mean DPS:         ${result.mean_dps.toFixed(1).padStart(24)}  │`,
      );
      yield* Effect.log(
        `│  Min DPS:          ${result.min_dps.toFixed(1).padStart(24)}  │`,
      );
      yield* Effect.log(
        `│  Max DPS:          ${result.max_dps.toFixed(1).padStart(24)}  │`,
      );
      yield* Effect.log(
        `│  Total Casts:      ${result.total_casts.toLocaleString().padStart(24)}  │`,
      );
      yield* Effect.log("└───────────────────────────────────────────────┘");
    }),
);
