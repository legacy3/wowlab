import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Accessors: resolve(__dirname, "src/Accessors.ts"),
    CastQueue: resolve(__dirname, "src/CastQueue.ts"),
    Combat: resolve(__dirname, "src/Combat.ts"),
    Data: resolve(__dirname, "src/Data.ts"),
    Lifecycle: resolve(__dirname, "src/Lifecycle.ts"),
    Log: resolve(__dirname, "src/Log.ts"),
    Metadata: resolve(__dirname, "src/Metadata.ts"),
    Modifiers: resolve(__dirname, "src/Modifiers.ts"),
    Periodic: resolve(__dirname, "src/Periodic.ts"),
    Profile: resolve(__dirname, "src/Profile.ts"),
    Projectile: resolve(__dirname, "src/Projectile.ts"),
    Rng: resolve(__dirname, "src/Rng.ts"),
    Rotation: resolve(__dirname, "src/Rotation.ts"),
    Scheduler: resolve(__dirname, "src/Scheduler.ts"),
    Simulation: resolve(__dirname, "src/Simulation.ts"),
    Spell: resolve(__dirname, "src/Spell.ts"),
    State: resolve(__dirname, "src/State.ts"),
    Unit: resolve(__dirname, "src/Unit.ts"),
  },
  external: [
    "effect",
    "immutable",
    "microdiff",
    "tinyqueue",
    "@packages/innocent-domain",
    "@packages/innocent-schemas",
  ],
});
