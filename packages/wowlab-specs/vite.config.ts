import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Hunter: "src/Hunter.ts",
    index: "src/index.ts",
    Shared: "src/Shared.ts",
  },
});
