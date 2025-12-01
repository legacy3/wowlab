import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
      },
      formats: ["es"],
    },
    minify: false,
    outDir: "build",
    rollupOptions: {
      // Bundle @wowlab/* packages, keep other deps external
      external: [
        /^@effect\//,
        /^effect(\/|$)/,
        /^@supabase\//,
        /^node:/,
        "module",
      ],
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
