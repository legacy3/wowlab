#!/usr/bin/env tsx

// Usage: pnpm --filter @apps/cli check-circular

import { NodeContext, NodeRuntime } from "@effect/platform-node";
import * as FileSystem from "@effect/platform/FileSystem";
import * as Array from "effect/Array";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import madge from "madge";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "../../..");

interface Target {
  readonly name: string;
  readonly path: string;
}

const scanDirectory = (dirName: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const dirPath = path.join(workspaceRoot, dirName);

    const entries = yield* fs
      .readDirectory(dirPath)
      .pipe(Effect.catchAll(() => Effect.succeed([])));

    return yield* pipe(
      entries,
      Array.map((entry) => {
        const entryPath = path.join(dirPath, entry);

        return fs.stat(entryPath).pipe(
          Effect.map((stat) => ({
            entry,
            isDirectory: stat.type === "Directory",
          })),
          Effect.catchAll(() => Effect.succeed({ entry, isDirectory: false })),
        );
      }),
      Effect.all,
      Effect.map(
        Array.filter((item) => item.isDirectory && !item.entry.startsWith(".")),
      ),
      Effect.map(
        Array.map((item) => {
          const targetPath =
            dirName === "packages"
              ? `${dirName}/${item.entry}/src`
              : `${dirName}/${item.entry}`;

          return {
            name: `${dirName}/${item.entry}`,
            path: targetPath,
          };
        }),
      ),
    );
  });

const checkTarget = (target: Target) =>
  Effect.gen(function* () {
    const fullPath = path.join(workspaceRoot, target.path);

    yield* Effect.logInfo(`Checking ${target.name}...`);

    const result = yield* Effect.tryPromise({
      catch: (error) =>
        new Error(error instanceof Error ? error.message : String(error)),
      try: () =>
        madge(fullPath, {
          excludeRegExp: [
            /node_modules/,
            /\.next/,
            /dist/,
            /build/,
            /\.d\.ts$/,
          ],
          fileExtensions: ["ts", "tsx"],
        }),
    }).pipe(
      Effect.catchAll((error) =>
        Effect.gen(function* () {
          yield* Effect.logWarning(
            `[WARN] ${target.name}: Could not analyze (${error.message})`,
          );

          return null;
        }),
      ),
    );

    if (result === null) {
      return { circular: [], target };
    }

    const circular = result.circular();

    if (circular.length > 0) {
      console.log(
        `\n[FAIL] ${target.name}: Found ${circular.length} circular dependency chain(s):\n`,
      );

      circular.forEach((chain: string[], index: number) => {
        console.log(`  ${index + 1}. ${chain.join(" -> ")}`);
      });

      console.log("");
    } else {
      console.log(`[OK] ${target.name}: No circular dependencies\n`);
    }

    return { circular, target };
  });

const program = Effect.gen(function* () {
  yield* Effect.logInfo("Checking for circular dependencies...\n");

  const packages = yield* scanDirectory("packages");
  const apps = yield* scanDirectory("apps");

  const targets = [...packages, ...apps];
  const results = yield* pipe(targets, Array.map(checkTarget), Effect.all);
  const hasCircular = results.some((result) => result.circular.length > 0);

  if (hasCircular) {
    yield* Effect.logError("\nCircular dependencies found!");
    yield* Effect.fail(new Error("Circular dependencies detected"));
  } else {
    yield* Effect.logInfo("\nNo circular dependencies found!");
  }
});

program.pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
