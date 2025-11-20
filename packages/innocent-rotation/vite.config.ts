import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Actions: resolve(__dirname, "src/Actions.ts"),
    Context: resolve(__dirname, "src/Context.ts"),
  },
  external: ["effect", "immutable", /^@packages\//],
});
