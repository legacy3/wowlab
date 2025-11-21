import { Command, Options } from "@effect/cli";
import * as Effect from "effect/Effect";
import { createCache } from "@wowlab/services/Data";
import { loadAllItemTables } from "./loader.js";
import { transformItem } from "./transform.js";
import {
  createSupabaseClient,
  clearAllItems,
  insertItemsInBatches,
} from "./supabase.js";
import { CliOptions, ItemDataFlat } from "./types.js";

const showDryRunPreview = (items: ItemDataFlat[]) =>
  Effect.gen(function* () {
    yield* Effect.log("DRY RUN - showing first 3 items:");
    for (const item of items.slice(0, 3)) {
      yield* Effect.log(JSON.stringify(item, null, 2));
    }
  });

const parseItemIds = (input: string, allIds: number[]): number[] => {
  if (input === "all") return allIds;
  return input
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
};

const updateItemDataProgram = (options: CliOptions) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Starting item data import...");

    const supabase = yield* createSupabaseClient();

    if (options.clear && !options.dryRun) {
      yield* clearAllItems(supabase);
    }

    const rawData = yield* loadAllItemTables();
    const cache = createCache({
      ...rawData,
      spell: [],
      spellEffect: [],
      spellMisc: [],
      spellName: [],
      spellCastTimes: [],
      spellCooldowns: [],
      spellDuration: [],
      spellRadius: [],
      spellRange: [],
      spellCategories: [],
      spellCategory: [],
    });

    const allItemIds = Array.from(cache.item.keys());
    const itemIds =
      options.items === "all"
        ? allItemIds
        : parseItemIds(options.items, allItemIds);

    yield* Effect.logInfo(`Processing ${itemIds.length} items...`);

    const transformedItems = yield* Effect.forEach(
      itemIds,
      (itemId) =>
        transformItem(itemId, cache).pipe(
          Effect.catchTag("ItemNotFoundError", () => Effect.succeed(null)),
        ),
      { concurrency: "unbounded" },
    );

    const validItems = transformedItems.filter(
      (s): s is ItemDataFlat => s !== null,
    );

    if (options.dryRun) {
      yield* showDryRunPreview(validItems);
      return 0;
    }

    const inserted = yield* insertItemsInBatches(
      supabase,
      validItems,
      options.batch,
    );

    yield* Effect.logInfo(`✓ Import complete! Inserted ${inserted} items`);
    return 0;
  });

export const updateItemDataCommand = Command.make(
  "update-item-data",
  {
    batch: Options.integer("batch").pipe(Options.withDefault(1000)),
    clear: Options.boolean("clear").pipe(Options.withDefault(false)),
    dryRun: Options.boolean("dry-run").pipe(Options.withDefault(false)),
    items: Options.text("items").pipe(Options.withDefault("all")),
  },
  updateItemDataProgram,
);
