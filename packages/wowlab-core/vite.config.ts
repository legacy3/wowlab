import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    index: "src/index.ts",
    Schemas: "src/Schemas.ts",
    Entities: "src/Entities.ts",
    Events: "src/Events.ts",
    Errors: "src/Errors.ts",
  },
});
