import * as Effect from "effect/Effect";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import type { SourceMetadata } from "./types";

import { OUTPUT_PATH, WOW_DOCS_PATH, WOW_UI_SOURCE_PATH } from "./config";
import { generateIndexFile, generateTypeScriptEnum } from "./generators";
import { parseLuaEnums } from "./parsers";

export const getWowSourceMetadata = (): Effect.Effect<SourceMetadata> =>
  Effect.gen(function* () {
    const versionPath = path.join(WOW_UI_SOURCE_PATH, "version.txt");
    const version = yield* Effect.sync(() =>
      fs.readFileSync(versionPath, "utf-8").trim(),
    );

    const commit = yield* Effect.sync(() =>
      execSync("git rev-parse HEAD", {
        cwd: WOW_UI_SOURCE_PATH,
        encoding: "utf-8",
      }).trim(),
    );

    const url = `https://github.com/Gethe/wow-ui-source/tree/${commit}`;

    return { commit, url, version };
  });

export const getDocumentationFiles = (): Effect.Effect<string[]> =>
  Effect.sync(() =>
    fs
      .readdirSync(WOW_DOCS_PATH)
      .filter((f) => f.endsWith("Documentation.lua"))
      .map((f) => path.join(WOW_DOCS_PATH, f)),
  );

export const processFile = (
  filePath: string,
  metadata: SourceMetadata,
): Effect.Effect<Map<string, string>> =>
  Effect.gen(function* () {
    const content = yield* Effect.sync(() =>
      fs.readFileSync(filePath, "utf-8"),
    );
    const enums = yield* parseLuaEnums(content);

    const enumCodes = yield* Effect.all(
      enums.map((enumDef) => generateTypeScriptEnum(enumDef, metadata)),
      { concurrency: "unbounded" },
    );

    const results = new Map<string, string>();
    enums.forEach((enumDef, index) => {
      results.set(enumDef.Name, enumCodes[index]);
    });

    return results;
  });

export const writeEnumFiles = (
  allEnums: Map<string, string>,
): Effect.Effect<number> =>
  Effect.gen(function* () {
    yield* Effect.sync(() => {
      if (!fs.existsSync(OUTPUT_PATH)) {
        fs.mkdirSync(OUTPUT_PATH, { recursive: true });
      }
    });

    const writeOperations = Array.from(allEnums.entries()).map(([name, code]) =>
      Effect.sync(() => {
        const outputFile = path.join(OUTPUT_PATH, `${name}.ts`);
        fs.writeFileSync(outputFile, code, "utf-8");
      }),
    );

    yield* Effect.all(writeOperations, { concurrency: "unbounded" });

    const indexContent = yield* generateIndexFile(Array.from(allEnums.keys()));
    yield* Effect.sync(() => {
      fs.writeFileSync(
        path.join(OUTPUT_PATH, "index.ts"),
        indexContent,
        "utf-8",
      );
    });

    return allEnums.size;
  });

export const runCommand = (
  command: string,
  description: string,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    const rootDir = path.join(process.cwd(), "packages", "wowlab-core");
    yield* Effect.logInfo(`${description}...`);
    yield* Effect.try({
      catch: (error) => new Error(`${description} failed: ${error}`),
      try: () =>
        execSync(command, {
          cwd: rootDir,
          stdio: "inherit",
        }),
    });
    yield* Effect.logInfo(`${description} complete`);
  }).pipe(
    Effect.catchAll((error) =>
      Effect.sync(() => console.error(`Warning: ${error.message}`)),
    ),
  );

export const lintAndFormatGeneratedFiles = (): Effect.Effect<void> =>
  Effect.gen(function* () {
    yield* runCommand("npm run lint:fix", "Lint fixes");
    yield* runCommand("npm run format", "Formatting");
  });
