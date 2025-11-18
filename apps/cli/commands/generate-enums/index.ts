import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";

import {
  getDocumentationFiles,
  getWowSourceMetadata,
  lintAndFormatGeneratedFiles,
  processFile,
  writeEnumFiles,
} from "./file-ops";

const generateEnumsProgram = Effect.gen(function* () {
  yield* Effect.logInfo("Scanning WoW UI documentation files...");

  const metadata = yield* getWowSourceMetadata();
  yield* Effect.logInfo(`WoW Version: ${metadata.version}`);
  yield* Effect.logInfo(`Commit: ${metadata.commit.substring(0, 7)}`);

  const files = yield* getDocumentationFiles();
  yield* Effect.logInfo(`Found ${files.length} documentation files`);

  const fileResults = yield* Effect.all(
    files.map((file) => processFile(file, metadata)),
    { concurrency: "unbounded" },
  );

  const allEnums = new Map<string, string>();
  let fileCount = 0;
  let enumCount = 0;

  for (const enums of fileResults) {
    if (enums.size > 0) {
      fileCount++;
      for (const [name, code] of enums) {
        allEnums.set(name, code);
        enumCount++;
      }
    }
  }

  yield* Effect.logInfo(`Extracted ${enumCount} enums from ${fileCount} files`);
  yield* Effect.logInfo(`Generating TypeScript files...`);

  const writtenCount = yield* writeEnumFiles(allEnums);

  yield* Effect.logInfo(`Generated ${writtenCount} TypeScript files`);
  yield* Effect.logInfo(`Updated index.ts with ${allEnums.size} exports`);

  yield* lintAndFormatGeneratedFiles();

  yield* Effect.logInfo(`Done!`);
});

export const generateEnumsCommand = Command.make(
  "generate-enums",
  {},
  () => generateEnumsProgram,
);
