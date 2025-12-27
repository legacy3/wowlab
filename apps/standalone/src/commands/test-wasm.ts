import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { initSync, Simulator } from "../../wasm/engine.js";

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of simulation iterations"),
  Options.withDefault(10000),
);

export const testWasmCommand = Command.make(
  "test-wasm",
  { iterations: iterationsOpt },
  ({ iterations }) =>
    Effect.gen(function* () {
      yield* Effect.log("Initializing WASM engine...");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const wasmPath = path.resolve(__dirname, "../../wasm/engine_bg.wasm");
      const wasmBuffer = fs.readFileSync(wasmPath);
      initSync({ module: wasmBuffer });

      const config = {
        spells: [
          { id: 34026, cooldown: 6.0, gcd: 1.5, cast_time: 0, charges: 2 }, // Kill Command
          { id: 56641, cooldown: 0, gcd: 1.5, cast_time: 0, charges: 0 }, // Cobra Shot (filler)
        ],
        resources: { focus: 100, focus_max: 100, focus_regen: 10 },
        duration: 60,
      };

      yield* Effect.log("Creating simulator...");
      const sim = new Simulator(JSON.stringify(config));

      // Single run test
      yield* Effect.log("Running single simulation...");
      const singleResult = sim.run(BigInt(12345));
      yield* Effect.log(`Single run: ${JSON.stringify(singleResult)}`);

      // Batch run test
      yield* Effect.log(`Running batch of ${iterations} simulations...`);
      const startTime = performance.now();
      const batchResult = sim.run_batch(iterations, BigInt(Date.now()));
      const elapsed = performance.now() - startTime;

      yield* Effect.log("");
      yield* Effect.log("┌─────────────────────────────────────────┐");
      yield* Effect.log("│         WASM Engine Test Results        │");
      yield* Effect.log("├─────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Iterations:       ${iterations.toString().padStart(18)}  │`,
      );
      yield* Effect.log(
        `│  Elapsed:          ${elapsed.toFixed(2).padStart(15)}ms  │`,
      );
      yield* Effect.log(
        `│  Throughput:       ${((iterations / elapsed) * 1000).toFixed(0).padStart(13)} sims/s  │`,
      );
      yield* Effect.log(
        `│  Per sim:          ${((elapsed / iterations) * 1000).toFixed(2).padStart(15)}μs  │`,
      );
      yield* Effect.log("├─────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Mean DPS:         ${batchResult.mean_dps.toFixed(1).padStart(18)}  │`,
      );
      yield* Effect.log(
        `│  Min DPS:          ${batchResult.min_dps.toFixed(1).padStart(18)}  │`,
      );
      yield* Effect.log(
        `│  Max DPS:          ${batchResult.max_dps.toFixed(1).padStart(18)}  │`,
      );
      yield* Effect.log(
        `│  Total Casts:      ${batchResult.total_casts.toString().padStart(18)}  │`,
      );
      yield* Effect.log("└─────────────────────────────────────────┘");

      sim.free();
    }),
);
