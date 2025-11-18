import { Command, Options } from "@effect/cli";
import { createCache } from "@packages/innocent-services/Data";
import * as Effect from "effect/Effect";

import type { CliOptions, SpellDataFlat } from "./types";

import { DBC_DATA_DIR } from "./config";
import { loadAllDbcTables } from "./dbc-loader";
import { collectAllSpellIdsFromSpellbook } from "./spell-collector";
import {
  clearAllSpells,
  createSupabaseClient,
  insertSpellsInBatches,
} from "./supabase";
import { parseSpellIds, transformSpells } from "./transform";

const showDryRunPreview = (spells: SpellDataFlat[]) =>
  Effect.gen(function* () {
    yield* Effect.log("DRY RUN - showing first 3 spells:");
    for (const spell of spells.slice(0, 3)) {
      yield* Effect.log(JSON.stringify(spell, null, 2));
    }
  });

const updateSpellDataProgram = (options: CliOptions) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting spell data migration...");

    const supabase = yield* createSupabaseClient();

    if (options.clear && !options.dryRun) {
      yield* clearAllSpells(supabase);
    }

    yield* Effect.logInfo("Loading DBC data...");
    const rawData = yield* loadAllDbcTables(DBC_DATA_DIR);
    const cache = createCache(rawData);
    yield* Effect.logInfo("Cache created!");

    const spellIds =
      options.spells === "auto"
        ? yield* collectAllSpellIdsFromSpellbook()
        : parseSpellIds(options.spells, cache);

    yield* Effect.logInfo(`Processing ${spellIds.length} spells...`);
    yield* Effect.logDebug(`Spell IDs: ${spellIds.join(", ")}`);

    const transformedSpells = yield* transformSpells(spellIds, cache);
    yield* Effect.logInfo(`Transformed ${transformedSpells.length} spells`);

    if (options.dryRun) {
      yield* showDryRunPreview(transformedSpells);
      return 0;
    }

    const inserted = yield* insertSpellsInBatches(
      supabase,
      transformedSpells,
      options.batch,
    );
    yield* Effect.logInfo(`✓ Migration complete! Inserted ${inserted} spells`);

    return 0;
  });

const CLI_OPTIONS = {
  batch: Options.integer("batch").pipe(
    Options.withDefault(1000),
    Options.withDescription(
      "Batch size for insertions (max 1000 for Supabase)",
    ),
  ),
  clear: Options.boolean("clear").pipe(
    Options.withDefault(false),
    Options.withDescription("Clear all existing spell data before inserting"),
  ),
  dryRun: Options.boolean("dry-run").pipe(
    Options.withDefault(false),
    Options.withDescription("Preview without inserting into database"),
  ),
  spells: Options.text("spells").pipe(
    Options.withDefault("auto"),
    Options.withDescription(
      'Spell IDs to import: "auto" (from spellbook, default), "all" (all DBC spells), or comma-separated IDs',
    ),
  ),
};

export const updateSpellDataCommand = Command.make(
  "update-spell-data",
  CLI_OPTIONS,
  updateSpellDataProgram,
);
