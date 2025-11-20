import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Config: resolve(__dirname, "src/Config.ts"),
    Spells: resolve(__dirname, "src/Spells.ts"),
  },
  external: ["effect", "immutable", /^@packages\//],
});
