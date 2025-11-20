import { resolve } from "node:path";

import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Branded: resolve(__dirname, "src/Branded.ts"),
    Character: resolve(__dirname, "src/Character.ts"),
    Dbc: resolve(__dirname, "src/Dbc.ts"),
    Enums: resolve(__dirname, "src/Enums.ts"),
    Item: resolve(__dirname, "src/Item.ts"),
    Spell: resolve(__dirname, "src/Spell.ts"),
  },
  external: ["effect", "immutable", /^@packages\//],
});
