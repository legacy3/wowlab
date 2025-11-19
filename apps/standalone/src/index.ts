import * as Layers from "@packages/innocent-bootstrap/Layers";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";

import { StandaloneMetadataServiceLayer } from "./metadata.js";
import { runSimulation } from "./simulation.js";

const main = async () => {
  console.log("=".repeat(60));
  console.log("WowLab Standalone Simulation Test");
  console.log("=".repeat(60));

  const appLayer = Layers.AppLayer.create(StandaloneMetadataServiceLayer);

  const program = runSimulation.pipe(Effect.scoped, Effect.provide(appLayer));

  const exit = await Effect.runPromiseExit(program);

  console.log("=".repeat(60));

  if (Exit.isSuccess(exit)) {
    console.log("✅ SUCCESS");
    console.log(JSON.stringify(exit.value, null, 2));
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
