import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    index: "src/index.ts",
    Simc: "src/Simc.ts",
  },
});
