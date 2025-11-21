import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    index: "src/index.ts",
    Actions: "src/Actions.ts",
    Context: "src/Context.ts",
  },
  external: ["@wowlab/core", "@wowlab/services"],
});
