import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Entities: "src/Entities.ts",
    Errors: "src/Errors.ts",
    index: "src/index.ts",
    Schemas: "src/Schemas.ts",
  },
});
