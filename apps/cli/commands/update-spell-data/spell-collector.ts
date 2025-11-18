import * as Effect from "effect/Effect";
import * as fs from "node:fs";
import * as path from "node:path";

import { FileReadError } from "./errors";

const SPELLBOOK_ROOT = path.join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "innocent-spellbook",
  "src",
  "spells",
);

const findSpellListFiles = (dir: string): string[] => {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findSpellListFiles(fullPath));
    } else if (entry.name === "spellList.ts") {
      results.push(fullPath);
    }
  }

  return results;
};

const extractSpellIdsFromFile = (
  filePath: string,
): Effect.Effect<number[], FileReadError> =>
  Effect.gen(function* () {
    const content = yield* Effect.try({
      catch: (cause) => new FileReadError({ cause, filePath }),
      try: () => fs.readFileSync(filePath, "utf-8"),
    });

    const spellIdRegex = /SpellID\((\d+)\)/g;
    const matches = content.matchAll(spellIdRegex);
    const spellIds = Array.from(matches, (match) => parseInt(match[1], 10));

    return spellIds;
  });

export const collectAllSpellIdsFromSpellbook = () =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`Scanning spellbook at ${SPELLBOOK_ROOT}...`);

    const spellListFiles = yield* Effect.sync(() =>
      findSpellListFiles(SPELLBOOK_ROOT),
    );

    yield* Effect.logInfo(
      `Found ${spellListFiles.length} spell list files in spellbook`,
    );

    const allSpellIds = yield* Effect.forEach(
      spellListFiles,
      (file) => extractSpellIdsFromFile(file),
      { concurrency: "unbounded" },
    );

    const flatSpellIds = allSpellIds.flat();
    const uniqueSpellIds = Array.from(new Set(flatSpellIds)).sort(
      (a, b) => a - b,
    );

    yield* Effect.logInfo(
      `Collected ${uniqueSpellIds.length} unique spell IDs`,
    );

    return uniqueSpellIds;
  });
