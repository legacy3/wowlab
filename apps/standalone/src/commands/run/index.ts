import { Args, Command, Options } from "@effect/cli";
import * as Schemas from "@wowlab/core/Schemas";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";
import * as LogLevel from "effect/LogLevel";

import { loadSpells } from "../../data/spell-loader.js";
import { createSupabaseClient } from "../../data/supabase.js";
import { RotationDefinition } from "../../framework/types.js";
import { rotations } from "../../rotations/index.js";
import {
  createRotationRuntime,
  RotationRuntimeConfig,
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
    yield* Effect.log(`│  Iterations:    ${String(iterations).padStart(20)}  │`);
    yield* Effect.log(`│  Duration:      ${String(results[0].duration + "s").padStart(20)}  │`);
    yield* Effect.log(`│  Elapsed:       ${String(elapsed + "ms").padStart(20)}  │`);
    yield* Effect.log("├─────────────────────────────────────────┤");
    yield* Effect.log(`│  Total Casts:   ${String(totalCasts).padStart(20)}  │`);
    yield* Effect.log(`│  Avg Casts:     ${avgCasts.toFixed(1).padStart(20)}  │`);
    yield* Effect.log(`│  Throughput:    ${(throughput.toFixed(1) + " sims/s").padStart(20)}  │`);
    yield* Effect.log("└─────────────────────────────────────────┘");
  });

export const runCommand = Command.make(
  "run",
  { duration: durationOpt, iterations: iterationsOpt, rotation: rotationArg },
  ({ duration, iterations, rotation }) =>
    Effect.gen(function* () {
      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        yield* Effect.logError(
          `Rotation '${rotation}' not found. Available: ${Object.keys(rotations).join(", ")}`,
        );
        return;
      }

      yield* Effect.log(`Loading spells for: ${selectedRotation.name}`);

      const supabase = yield* createSupabaseClient;
      const spells = yield* Effect.promise(() =>
        loadSpells(supabase, selectedRotation.spellIds),
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
        yield* Effect.log(
          `Running ${iterations} parallel simulations (${duration}s each)...`,
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
      } else {
        yield* Effect.log("Simulation complete");
      }
    }),
);
