import { Command } from "@effect/cli";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as fs from "node:fs";
import * as path from "node:path";

import { MANIFEST_PATH, OUTPUT_ROOT, TALENTS_PATH } from "./config";
import { extractSpellEntriesBySpec } from "./extractors";
import { buildManifestFile, buildSpecSpellListFile } from "./generators";
import { RaidbotsTalentsSchema } from "./types";

const ensureDirectory = (directory: string): Effect.Effect<void> =>
  Effect.sync(() => fs.mkdirSync(directory, { recursive: true }));

const writeFile = (filePath: string, content: string): Effect.Effect<void> =>
  Effect.sync(() => fs.writeFileSync(filePath, content, "utf-8"));

const generateSpellsProgram = Effect.gen(function* () {
  const talentsJson = yield* Effect.try({
    catch: (error) =>
      new Error(`Failed to read talents.json: ${String(error)}`),
    try: () => fs.readFileSync(TALENTS_PATH, "utf-8"),
  });

  const talentsData = yield* Effect.sync(() => JSON.parse(talentsJson));

  const talents = yield* Schema.decodeUnknown(RaidbotsTalentsSchema)(
    talentsData,
  ).pipe(
    Effect.mapError(
      (error) => new Error(`Schema validation failed: ${String(error)}`),
    ),
  );

  const specMaps = extractSpellEntriesBySpec(talents);

  const totalSpells = specMaps.reduce(
    (sum, spec) => sum + spec.spells.length,
    0,
  );
  yield* Effect.log(
    `Extracted ${totalSpells} spells across ${specMaps.length} specs from talents data`,
  );

  yield* ensureDirectory(OUTPUT_ROOT);

  yield* Effect.forEach(
    specMaps,
    (spec) =>
      Effect.gen(function* () {
        const specDirectory = path.join(
          OUTPUT_ROOT,
          spec.classSlug,
          spec.specSlug,
        );
        yield* ensureDirectory(specDirectory);
        yield* ensureDirectory(path.join(specDirectory, "overrides"));
        yield* ensureDirectory(path.join(specDirectory, "modifiers"));

        const specFilePath = path.join(specDirectory, "spellList.ts");
        const code = buildSpecSpellListFile(spec);
        yield* writeFile(specFilePath, code);
      }),
    { concurrency: "unbounded" },
  );

  const manifest = buildManifestFile(specMaps);
  yield* writeFile(MANIFEST_PATH, manifest);

  yield* Effect.log(
    `Generated spell lists under ${OUTPUT_ROOT} and manifest ${MANIFEST_PATH}`,
  );

  return totalSpells;
});

export const generateSpellsCommand = Command.make(
  "generate-spells",
  {},
  () => generateSpellsProgram,
);
