import * as Runtime from "@wowlab/runtime";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { StandaloneMetadataServiceLayer } from "./metadata.js";
import { runSimulation } from "./simulation.js";

const main = async () => {
  console.log("=".repeat(60));
  console.log("WowLab Standalone Simulation");
  console.log("=".repeat(60));

  // Create the application layer with standalone metadata
  const appLayer = Runtime.createAppLayer({
    metadata: StandaloneMetadataServiceLayer,
  });

  // Configure logging
  const program = runSimulation.pipe(
    Effect.provide(appLayer),
    Effect.provide(Logger.pretty),
    Effect.provide(Logger.minimumLogLevel(LogLevel.Debug)),
  );

  const exit = await Effect.runPromiseExit(program);

  console.log("=".repeat(60));

  if (Exit.isSuccess(exit)) {
    console.log("✅ SUCCESS");
    console.log(`Snapshots: ${exit.value.snapshots}`);
    console.log(`Events: ${exit.value.events.length}`);
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
