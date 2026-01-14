import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export interface PackageConfig {
  entries: Record<string, string>;
  external?: (string | RegExp)[];
}

export function createPackageConfig(config: PackageConfig) {
  const defaultExternal = [
    // Keep Effect unbundled to preserve singleton services/context
    /^effect(\/|$)/,
    "immutable",

    // Keep workspace packages external to avoid duplicate service singletons
    /^@packages\//,
    /^@wowlab\//,
  ];
  const external = [...defaultExternal, ...(config.external || [])];

  return defineConfig({
    build: {
      lib: {
        entry: config.entries,
        formats: ["es"],
      },
      minify: false,
      outDir: "build",
      rollupOptions: {
        external,
      },
      sourcemap: true,
    },
    esbuild: {
      keepNames: true,
    },
    plugins: [
      dts({
        exclude: ["**/*.test.ts", "**/*.spec.ts"],
        include: ["src/**/*.ts"],
        outDir: "build",
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "./src"),
      },
    },
  });
}
