import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Layers: resolve(__dirname, "src/Layers.ts"),
    SpellLoader: resolve(__dirname, "src/SpellLoader.ts"),
  },
  external: [
    "effect",
    "immutable",
    "@packages/innocent-schemas",
    "@packages/innocent-domain",
    "@packages/innocent-services",
    "@packages/innocent-rotation",
    "@packages/innocent-spellbook",
    "@packages/innocent-parsers",
  ],
});
