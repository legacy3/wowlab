import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import { Map } from "immutable";

import type { CliOptions, ItemDataFlat } from "./types";

import { DBC_DATA_DIR } from "./config";
import { loadAllDbcTables } from "./dbc-loader";
import {
  clearAllItems,
  createSupabaseClient,
  insertItemsInBatches,
} from "./supabase";
import { parseItemIds, transformItems } from "./transform";

const showDryRunPreview = (items: ItemDataFlat[]) =>
  Effect.gen(function* () {
    yield* Effect.log("DRY RUN - showing first 3 items:");
    for (const item of items.slice(0, 3)) {
      yield* Effect.log(JSON.stringify(item, null, 2));
    }
  });

const updateItemDataProgram = (options: CliOptions) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting item data migration...");

    const supabase = yield* createSupabaseClient();

    if (options.clear && !options.dryRun) {
      yield* clearAllItems(supabase);
    }

    yield* Effect.logInfo("Loading DBC data...");
    const rawData = yield* loadAllDbcTables(DBC_DATA_DIR);
    yield* Effect.logInfo("DBC data loaded!");

    const itemIds =
      options.items === "all"
        ? yield* Effect.sync(() =>
            parseItemIds(options.items, {
              fileData: Map(),
              item: Map(rawData.item.map((row) => [row.ID, row])),
              itemSparse: Map(),
            }),
          )
        : parseItemIds(options.items, {
            fileData: Map(),
            item: Map(rawData.item.map((row) => [row.ID, row])),
            itemSparse: Map(),
          });

    yield* Effect.logInfo(`Processing ${itemIds.length} items...`);
    yield* Effect.logDebug(`Item IDs: ${itemIds.join(", ")}`);

    const transformedItems = yield* transformItems(itemIds, rawData);
    yield* Effect.logInfo(`Transformed ${transformedItems.length} items`);

    if (options.dryRun) {
      yield* showDryRunPreview(transformedItems);
      return 0;
    }

    const inserted = yield* insertItemsInBatches(
      supabase,
      transformedItems,
      options.batch,
    );
    yield* Effect.logInfo(`✓ Migration complete! Inserted ${inserted} items`);

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
    Options.withDescription("Clear all existing item data before inserting"),
  ),
  dryRun: Options.boolean("dry-run").pipe(
    Options.withDefault(false),
    Options.withDescription("Preview without inserting into database"),
  ),
  items: Options.text("items").pipe(
    Options.withDefault("all"),
    Options.withDescription(
      'Item IDs to import: "all" (all DBC items, default), or comma-separated IDs',
    ),
  ),
};

export const updateItemDataCommand = Command.make(
  "update-item-data",
  CLI_OPTIONS,
  updateItemDataProgram,
);
