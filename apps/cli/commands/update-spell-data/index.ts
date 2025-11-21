import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import { createCache } from "@wowlab/services/Data";
import { loadAllSpellTables } from "./loader.js";
import { transformSpell } from "./transform.js";
import {
  createSupabaseClient,
  clearAllSpells,
  insertSpellsInBatches,
} from "./supabase.js";
import { CliOptions, SpellDataFlat } from "./types.js";

const showDryRunPreview = (spells: SpellDataFlat[]) =>
  Effect.gen(function* () {
    yield* Effect.log("DRY RUN - showing first 3 spells:");
    for (const spell of spells.slice(0, 3)) {
      yield* Effect.log(JSON.stringify(spell, null, 2));
    }
  });

const parseSpellIds = (input: string, allIds: number[]): number[] => {
  if (input === "all") {
    return allIds;
  }

  return input
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
};

const updateSpellDataProgram = (options: CliOptions) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting spell data import...");

    const supabase = yield* createSupabaseClient();

    if (options.clear && !options.dryRun) {
      yield* clearAllSpells(supabase);
    }

    const rawData = yield* loadAllSpellTables();
    const cache = createCache({
      ...rawData,
      item: [],
      itemEffect: [],
      itemSparse: [],
    });

    const allSpellIds = Array.from(cache.spellMisc.keys());
    const spellIds =
      options.spells === "all"
        ? allSpellIds
        : parseSpellIds(options.spells, allSpellIds);

    yield* Effect.logInfo(`Processing ${spellIds.length} spells...`);

    const transformedSpells = yield* Effect.forEach(
      spellIds,
      (spellId) =>
        transformSpell(spellId, cache).pipe(
          Effect.catchTag("SpellNotFoundError", () => Effect.succeed(null)),
        ),
      { concurrency: "unbounded" },
    );

    const validSpells = transformedSpells.filter(
      (s): s is SpellDataFlat => s !== null,
    );

    if (options.dryRun) {
      yield* showDryRunPreview(validSpells);
      return 0;
    }

    const inserted = yield* insertSpellsInBatches(
      supabase,
      validSpells,
      options.batch,
    );

    yield* Effect.logInfo(`✓ Import complete! Inserted ${inserted} spells`);
    return 0;
  });

export const updateSpellDataCommand = Command.make(
  "update-spell-data",
  {
    batch: Options.integer("batch").pipe(Options.withDefault(1000)),
    clear: Options.boolean("clear").pipe(Options.withDefault(false)),
    dryRun: Options.boolean("dry-run").pipe(Options.withDefault(false)),
    spells: Options.text("spells").pipe(Options.withDefault("all")),
  },
  updateSpellDataProgram,
);
