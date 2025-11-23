import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Accessors: "src/Accessors.ts",
    CastQueue: "src/CastQueue.ts",
    Data: "src/Data.ts",
    index: "src/index.ts",
    Lifecycle: "src/Lifecycle.ts",
    Log: "src/Log.ts",
    Metadata: "src/Metadata.ts",
    Profile: "src/Profile.ts",
    Rng: "src/Rng.ts",
    Rotation: "src/Rotation.ts",
    Scheduler: "src/Scheduler.ts",
    Simulation: "src/Simulation.ts",
    Spell: "src/Spell.ts",
    State: "src/State.ts",
    Unit: "src/Unit.ts",
  },
});
