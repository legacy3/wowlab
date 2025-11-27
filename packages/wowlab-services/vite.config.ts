import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Accessors: "src/Accessors.ts",
    Data: "src/Data.ts",
    index: "src/index.ts",
    Log: "src/Log.ts",
    Metadata: "src/Metadata.ts",
    Profile: "src/Profile.ts",
    Rng: "src/Rng.ts",
    Rotation: "src/Rotation.ts",
    State: "src/State.ts",
    Unit: "src/Unit.ts",
  },
});
