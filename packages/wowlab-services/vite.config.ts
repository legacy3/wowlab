import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Data: "src/Data.ts",
    Accessors: "src/Accessors.ts",
    index: "src/index.ts",
    Log: "src/Log.ts",
    Metadata: "src/Metadata.ts",
    Profile: "src/Profile.ts",
    Rng: "src/Rng.ts",
    Scheduler: "src/Scheduler.ts",
    Simulation: "src/Simulation.ts",
    Spell: "src/Spell.ts",
    State: "src/State.ts",
    Unit: "src/Unit.ts",
  },
});
