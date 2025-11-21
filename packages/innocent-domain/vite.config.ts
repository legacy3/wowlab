import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Entities: resolve(__dirname, "src/Entities.ts"),
    Errors: resolve(__dirname, "src/Errors.ts"),
    Events: resolve(__dirname, "src/Events.ts"),
    Profile: resolve(__dirname, "src/Profile.ts"),
    State: resolve(__dirname, "src/State.ts"),
  },
});
