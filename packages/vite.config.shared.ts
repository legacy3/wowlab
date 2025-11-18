import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export interface PackageConfig {
  entries: Record<string, string>;
  external: string[];
}

export function createPackageConfig(config: PackageConfig) {
  return defineConfig({
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "./src"),
      },
    },
    build: {
      lib: {
        entry: config.entries,
        formats: ["es"],
      },
      rollupOptions: {
        external: config.external,
      },
      outDir: "build",
    },
    plugins: [
      dts({
        outDir: "build",
        include: ["src/**/*.ts"],
        exclude: ["**/*.test.ts", "**/*.spec.ts"],
      }),
    ],
  });
}
