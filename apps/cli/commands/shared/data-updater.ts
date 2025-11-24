import { Command, Options } from "@effect/cli";
import { SupabaseClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";

import { loadTables, TableConfig } from "./loader.js";
import { createSupabaseClient, insertInBatches } from "./supabase.js";

export interface DataUpdateConfig<
  TRawData extends Record<string, any>,
  TCache,
  TEntity extends { id: number },
> {
  clearData: (supabase: SupabaseClient) => Effect.Effect<void, any>;
  createCache: (data: TRawData) => TCache;
  entityName: string; // e.g. "spells" or "items" (plural)
  getAllIds: (cache: TCache) => number[];
  insertBatch: (
    supabase: SupabaseClient,
    batch: TEntity[],
  ) => Effect.Effect<number, any>;
  name: string;
  tables: { [K in keyof TRawData]: TableConfig<TRawData[K]> };
  transform: (id: number, cache: TCache) => Effect.Effect<TEntity | null, any>;
}

interface CliOptions {
  batch: number;
  clear: boolean;
  dryRun: boolean;
  ids: string;
}

const parseIds = (input: string, allIds: number[]): number[] => {
  if (input === "all") {
    return allIds;
  }

  return input
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));
};

const showDryRunPreview = <T>(items: T[], entityName: string) =>
  Effect.gen(function* () {
    yield* Effect.log(`DRY RUN - showing first 3 ${entityName}:`);
    for (const item of items.slice(0, 3)) {
      yield* Effect.log(JSON.stringify(item, null, 2));
    }
  });

export const createDataUpdateCommand = <
  TRawData extends Record<string, any>,
  TCache,
  TEntity extends { id: number },
>(
  config: DataUpdateConfig<TRawData, TCache, TEntity>,
) => {
  const program = (options: CliOptions) =>
    Effect.gen(function* () {
      yield* Effect.logInfo(`Starting ${config.entityName} data import...`);

      let supabase: SupabaseClient | undefined;
      if (!options.dryRun) {
        supabase = yield* createSupabaseClient();
      }

      if (options.clear && !options.dryRun && supabase) {
        yield* config.clearData(supabase);
      }

      yield* Effect.logInfo(
        `Loading ${config.entityName} tables from wowlab-data...`,
      );
      const rawData = yield* loadTables(config.tables);
      const cache = config.createCache(rawData);

      const allIds = config.getAllIds(cache);
      const ids = parseIds(options.ids, allIds);

      yield* Effect.logInfo(`Processing ${ids.length} ${config.entityName}...`);

      const transformed = yield* Effect.forEach(
        ids,
        (id) => config.transform(id, cache),
        { concurrency: "unbounded" },
      );

      const validItems = transformed.filter(
        (item): item is TEntity => item !== null,
      );

      if (options.dryRun) {
        yield* showDryRunPreview(validItems, config.entityName);
        return 0;
      }

      const inserted = yield* insertInBatches(
        validItems,
        options.batch,
        (batch) => config.insertBatch(supabase!, batch),
        config.entityName,
      );

      yield* Effect.logInfo(
        `✓ Import complete! Inserted ${inserted} ${config.entityName}`,
      );
      return 0;
    });

  return Command.make(
    config.name,
    {
      batch: Options.integer("batch").pipe(Options.withDefault(1000)),
      clear: Options.boolean("clear").pipe(Options.withDefault(false)),
      dryRun: Options.boolean("dry-run").pipe(Options.withDefault(false)),
      ids: Options.text(config.entityName).pipe(Options.withDefault("all")),
    },
    program,
  );
};
