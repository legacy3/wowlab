import { Args, Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { loadSpells } from "../../data/spell-loader.js";
import { createSupabaseClient } from "../../data/supabase.js";
import { runRotationWithRuntime } from "../../framework/runner.js";
import { rotations } from "../../rotations/index.js";
import { createRotationRuntime } from "../../runtime/RotationRuntime.js";

const rotationArgument = Args.text({ name: "rotation" }).pipe(
  Args.withDescription("The name of the rotation to run"),
  Args.withDefault("fire-mage"),
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

      // Load spell data from Supabase
      yield* Effect.log("Loading spell data from Supabase...");

      const supabase = yield* createSupabaseClient;
      const spells = yield* Effect.promise(() =>
        loadSpells(supabase, selectedRotation.spellIds),
      );

      yield* Effect.log(`Loaded ${spells.length} spells from Supabase`);

      // Create runtime with loaded spell data
      const runtime = createRotationRuntime({
        spells,
      });

      try {
        yield* Effect.promise(() =>
          runRotationWithRuntime(runtime, selectedRotation, spells),
        );
      } finally {
        yield* Effect.promise(() => runtime.dispose());
      }
    }),
);
