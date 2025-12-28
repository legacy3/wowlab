import { createPackageConfig } from "../vite.config.shared";

export default createPackageConfig({
  entries: {
    Actions: "src/Actions.ts",
    Context: "src/Context.ts",
    index: "src/index.ts",
  },
  external: ["@wowlab/core", "@wowlab/services"],
});
