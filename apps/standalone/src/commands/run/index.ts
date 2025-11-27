import { Args, Command } from "@effect/cli";
import * as Schemas from "@wowlab/core/Schemas";
import * as Unit from "@wowlab/services/Unit";
import * as Effect from "effect/Effect";

import { loadSpells } from "../../data/spell-loader.js";
import { createSupabaseClient } from "../../data/supabase.js";
import { rotations } from "../../rotations/index.js";
import { createRotationRuntime } from "../../runtime/RotationRuntime.js";

const rotationArgument = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("beast-mastery"),
);

export const runCommand = Command.make(
  "run",
  { rotation: rotationArgument },
  ({ rotation }) =>
    Effect.gen(function* () {
      const selectedRotation = rotations[rotation as keyof typeof rotations];

      if (!selectedRotation) {
        yield* Effect.logError(
          `Rotation '${rotation}' not found. Available rotations: ${Object.keys(
            rotations,
          ).join(", ")}`,
        );
        return;
      }

      yield* Effect.log(`Loading spells for: ${selectedRotation.name}`);

      // Load spell data from Supabase
      const supabase = yield* createSupabaseClient;
      const spells = yield* Effect.promise(() =>
        loadSpells(supabase, selectedRotation.spellIds),
      );

      yield* Effect.log(`Loaded ${spells.length} spells`);

      // Create managed runtime and ensure proper disposal
      yield* Effect.acquireUseRelease(
        Effect.sync(() => createRotationRuntime({ spells })),
        (runtime) => {
          const program = Effect.gen(function* () {
            yield* Effect.log(`Running rotation: ${selectedRotation.name}`);
            yield* Effect.log("---");

            // Create player unit with spells
            const playerId = Schemas.Branded.UnitID("player-1");
            const player = selectedRotation.setupPlayer(playerId, spells);

            // Register player in state
            const unitService = yield* Unit.UnitService;
            yield* unitService.add(player);

            // Run the rotation - it will log each cast
            yield* selectedRotation.run(playerId);

            yield* Effect.log("---");
            yield* Effect.log("Rotation complete");
          });

          return Effect.promise(() => runtime.runPromise(program));
        },
        (runtime) => Effect.promise(() => runtime.dispose()),
      );
    }),
);
