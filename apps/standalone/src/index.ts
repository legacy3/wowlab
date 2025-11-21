import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";

import { runRotation } from "./framework/runner.js";
import { FireMageRotation } from "./rotations/fire-mage.js";

const main = async () => {
  console.log("=".repeat(60));
  console.log("WowLab Standalone Runner");
  console.log("=".repeat(60));

  // In the future, we could select rotation from CLI args
  const program = runRotation(FireMageRotation);

  const exit = await Effect.runPromiseExit(program);

  console.log("=".repeat(60));

  if (Exit.isSuccess(exit)) {
    console.log("✅ SUCCESS");
    console.log(exit.value);
    process.exit(0);
  } else {
    console.log("❌ FAILURE");
    console.error(Cause.pretty(exit.cause, { renderErrorCause: true }));
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
