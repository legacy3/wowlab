import { Args, Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { rotations } from "../../rotations/index.js";

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

      yield* Effect.log(`Selected rotation: ${selectedRotation.name}`);
      yield* Effect.log("TODO: Implement with new combat log architecture");
    }),
);
