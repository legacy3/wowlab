import { Command, Options } from "@effect/cli";
import * as Schemas from "@wowlab/core/Schemas";
import * as Entities from "@wowlab/core/Entities";
import * as State from "@wowlab/services/State";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

import { loadAuras, loadSpells } from "../data/spell-loader.js";
import { supabaseClient } from "../data/supabase.js";
import { createTargetDummy } from "../framework/rotation-utils.js";
import { createRotationPlayer } from "../framework/types.js";
import { rotations } from "../rotations/index.js";
import { createRotationRuntime } from "../runtime/RotationRuntime.js";

const iterationsOpt = Options.integer("iterations").pipe(
  Options.withAlias("n"),
  Options.withDescription("Number of simulation iterations"),
  Options.withDefault(100),
);

const durationOpt = Options.integer("duration").pipe(
  Options.withAlias("d"),
  Options.withDescription("Simulation duration in seconds"),
  Options.withDefault(60),
);

export const profileCommand = Command.make(
  "profile",
  { iterations: iterationsOpt, duration: durationOpt },
  ({ iterations, duration }) =>
    Effect.gen(function* () {
      const rotation = rotations["beast-mastery"];

      yield* Effect.log("Loading spell data...");
      const [spells, auras] = yield* Effect.all([
        loadSpells(supabaseClient, rotation.spellIds),
        loadAuras(supabaseClient, rotation.spellIds),
      ]);

      yield* Effect.log(
        `Profiling ${iterations} iterations of ${duration}s simulation`,
      );
      yield* Effect.log("---");

      // Timing accumulators
      let totalRotationTime = 0;
      let totalStateResetTime = 0;
      let totalUnitSetupTime = 0;
      let rotationCalls = 0;

      // Create runtime once
      const runtime = createRotationRuntime({ spells, auras });

      const runSingleSim = (simId: number) =>
        Effect.gen(function* () {
          const playerId = Schemas.Branded.UnitID(`player-${simId}`);
          const targetId = Schemas.Branded.UnitID(`target-${simId}`);

          // Time: State reset
          const stateResetStart = performance.now();
          const stateService = yield* State.StateService;
          yield* stateService.setState(Entities.GameState.createGameState());
          totalStateResetTime += performance.now() - stateResetStart;

          // Time: Unit setup
          const unitSetupStart = performance.now();
          const player = createRotationPlayer(rotation, playerId, spells);
          const target = createTargetDummy(targetId);
          const unitService = yield* Unit.UnitService;
          yield* unitService.add(player);
          yield* unitService.add(target);
          totalUnitSetupTime += performance.now() - unitSetupStart;

          // Simulation loop
          let casts = 0;
          while (true) {
            const state = yield* stateService.getState();
            if (state.currentTime >= duration) {
              break;
            }

            // Time: Rotation execution
            const rotationStart = performance.now();
            yield* Effect.catchAll(
              rotation.run(playerId, targetId),
              () => Effect.void,
            );
            totalRotationTime += performance.now() - rotationStart;
            rotationCalls++;

            casts++;
          }

          return casts;
        });

      const overallStart = performance.now();

      // Run all simulations
      const results = yield* Effect.promise(() =>
        runtime.runPromise(
          Effect.gen(function* () {
            const allCasts: number[] = [];
            for (let i = 0; i < iterations; i++) {
              const casts = yield* runSingleSim(i);
              allCasts.push(casts);
            }
            return allCasts;
          }),
        ),
      );

      const overallElapsed = performance.now() - overallStart;

      // Calculate results
      const totalCasts = results.reduce((a, b) => a + b, 0);
      const avgCastsPerSim = totalCasts / iterations;

      yield* Effect.log("");
      yield* Effect.log("┌─────────────────────────────────────────┐");
      yield* Effect.log("│           Profiling Results             │");
      yield* Effect.log("├─────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Iterations:          ${iterations.toString().padStart(15)}  │`,
      );
      yield* Effect.log(
        `│  Total Casts:         ${totalCasts.toString().padStart(15)}  │`,
      );
      yield* Effect.log(
        `│  Avg Casts/Sim:       ${avgCastsPerSim.toFixed(1).padStart(15)}  │`,
      );
      yield* Effect.log("├─────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Total Time:          ${overallElapsed.toFixed(1).padStart(12)}ms  │`,
      );
      yield* Effect.log(
        `│  State Reset:         ${totalStateResetTime.toFixed(1).padStart(12)}ms  │`,
      );
      yield* Effect.log(
        `│  Unit Setup:          ${totalUnitSetupTime.toFixed(1).padStart(12)}ms  │`,
      );
      yield* Effect.log(
        `│  Rotation Code:       ${totalRotationTime.toFixed(1).padStart(12)}ms  │`,
      );
      yield* Effect.log("├─────────────────────────────────────────┤");
      const otherTime =
        overallElapsed -
        totalStateResetTime -
        totalUnitSetupTime -
        totalRotationTime;
      yield* Effect.log(
        `│  Other (Effect OH):   ${otherTime.toFixed(1).padStart(12)}ms  │`,
      );
      yield* Effect.log("├─────────────────────────────────────────┤");
      const rotationPct = ((totalRotationTime / overallElapsed) * 100).toFixed(
        1,
      );
      const otherPct = ((otherTime / overallElapsed) * 100).toFixed(1);
      yield* Effect.log(
        `│  Rotation %:          ${rotationPct.padStart(14)}%  │`,
      );
      yield* Effect.log(`│  Other %:             ${otherPct.padStart(14)}%  │`);
      yield* Effect.log("├─────────────────────────────────────────┤");
      yield* Effect.log(
        `│  Rotation calls:      ${rotationCalls.toString().padStart(15)}  │`,
      );
      yield* Effect.log(
        `│  Avg per call:        ${((totalRotationTime / rotationCalls) * 1000).toFixed(2).padStart(13)}μs  │`,
      );
      yield* Effect.log("└─────────────────────────────────────────┘");

      yield* Effect.promise(() => runtime.dispose());
    }),
);
