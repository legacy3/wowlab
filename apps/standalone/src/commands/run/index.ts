import { Args, Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import { runRotation } from "../../framework/runner.js";
import { rotations } from "../../rotations/index.js";

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

      yield* runRotation(selectedRotation);
    }),
);
