import * as Runtime from "@wowlab/runtime";
import * as Metadata from "@wowlab/services/Metadata";
import * as Simulation from "@wowlab/services/Simulation";
import * as Effect from "effect/Effect";

const testProgram = Effect.gen(function* () {
  const sim = yield* Simulation.SimulationService;

  console.log("Starting Phase 7 Verification...");

  // Run a short simulation
  const result = yield* sim.run(1000);

  console.log("Simulation ran successfully. Final time:", result.finalTime);

  return { success: true };
});

// Create the app layer
const metadataLayer = Metadata.InMemoryMetadata({
  items: [],
  spells: [],
});

const appLayer = Runtime.createAppLayer({
  metadata: metadataLayer,
});

// Run the program
Effect.runPromise(Effect.provide(testProgram, appLayer))
  .then(() => console.log("Phase 7 Verification Complete"))
  .catch((error) => {
    console.error("Phase 7 Verification Failed:", error);
    process.exit(1);
  });
