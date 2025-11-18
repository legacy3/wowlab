import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Simc: resolve(__dirname, "src/Simc.ts"),
  },
  external: [
    "effect",
    "immutable",
    "@packages/innocent-domain",
    "@packages/innocent-schemas",
  ],
});
