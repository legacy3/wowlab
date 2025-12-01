import type { SupabaseClient } from "@supabase/supabase-js";

import { Command, Options } from "@effect/cli";
import * as FileSystem from "@effect/platform/FileSystem";
import { parseCsvData } from "@wowlab/services/Data";
import { LogService } from "@wowlab/services/Log";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as path from "node:path";

import { DBC_DATA_DIR } from "../shared/dbc-config.js";
import {
  createSupabaseClient,
  insertInBatches,
  MissingEnvironmentError,
  SupabaseError,
} from "../shared/supabase.js";
import { DBC_TABLE_KEYS, DBC_TABLES, type DbcTableKey } from "./config.js";

const BATCH_SIZE = 1000;

const tableOption = Options.choice("table", DBC_TABLE_KEYS).pipe(
  Options.optional,
  Options.withDescription(
    "Specific table to upload. If not provided, uploads all tables.",
  ),
);

const dryRunOption = Options.boolean("dry-run").pipe(
  Options.withDefault(false),
  Options.withDescription(
    "Parse CSV files and show row counts without uploading to Supabase.",
  ),
);

const fromOption = Options.choice("from", DBC_TABLE_KEYS).pipe(
  Options.optional,
  Options.withDescription(
    "Start uploading from this table (inclusive), skipping all tables before it.",
  ),
);

const truncateTable = (
  supabase: SupabaseClient,
  tableName: string,
): Effect.Effect<void, SupabaseError> =>
  Effect.gen(function* () {
    const { error } = yield* Effect.tryPromise({
      catch: (cause) =>
        new SupabaseError({
          message: String(cause),
          operation: `truncate ${tableName}`,
        }),
      try: () =>
        supabase.schema("raw_dbc").from(tableName).delete().neq("ID", -999999),
    });

    if (error) {
      return yield* Effect.fail(
        new SupabaseError({
          message: error.message,
          operation: `truncate ${tableName}`,
        }),
      );
    }
  });

const uploadTable = (
  supabase: SupabaseClient,
  tableKey: DbcTableKey,
  dryRun: boolean,
) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const tableConfig = DBC_TABLES[tableKey];
    const { file, tableName } = tableConfig;
    const schema = tableConfig.schema as Schema.Schema.Any;

    yield* Effect.logInfo(`Loading ${file}...`);

    const content = yield* fs
      .readFileString(path.join(DBC_DATA_DIR, file), "utf8")
      .pipe(
        Effect.mapError(
          (e) =>
            new SupabaseError({
              message: String(e),
              operation: `read ${file}`,
            }),
        ),
      );

    // @ts-ignore TODO Not sure how to properly pass a dynamic schema
    const data = yield* parseCsvData(content, schema).pipe(
      Effect.mapError(
        (e) =>
          new SupabaseError({
            message: String(e),
            operation: `parse ${file}`,
          }),
      ),
    );

    yield* Effect.logInfo(`Parsed ${data.length} rows from ${file}`);

    if (dryRun) {
      yield* Effect.logInfo(
        `[DRY RUN] Would upload ${data.length} rows to ${tableName}`,
      );
      return data.length;
    }

    // Truncate existing data
    yield* Effect.logInfo(`Truncating ${tableName}...`);
    yield* truncateTable(supabase, tableName);

    // Insert in batches
    yield* Effect.logInfo(`Inserting ${data.length} rows into ${tableName}...`);

    const insertBatch = (batch: unknown[]) =>
      Effect.gen(function* () {
        const { error } = yield* Effect.tryPromise({
          catch: (cause) =>
            new SupabaseError({
              message: String(cause),
              operation: `insert ${tableName}`,
            }),
          try: () => supabase.schema("raw_dbc").from(tableName).insert(batch),
        });

        if (error) {
          return yield* Effect.fail(
            new SupabaseError({
              message: error.message,
              operation: `insert ${tableName}`,
            }),
          );
        }

        return batch.length;
      });

    const count = yield* insertInBatches(
      data,
      BATCH_SIZE,
      insertBatch,
      tableName,
    );

    yield* Effect.logInfo(`✓ Uploaded ${count} rows to ${tableName}`);
    return count;
  });

const uploadDbcProgram = (
  tableFilter: Option.Option<DbcTableKey>,
  dryRun: boolean,
  fromTable: Option.Option<DbcTableKey>,
): Effect.Effect<
  number,
  MissingEnvironmentError | SupabaseError,
  FileSystem.FileSystem | LogService
> =>
  Effect.gen(function* () {
    const supabase = yield* createSupabaseClient();

    let tablesToUpload = Option.isSome(tableFilter)
      ? [tableFilter.value]
      : DBC_TABLE_KEYS;

    // If --from is specified, skip tables before it
    if (Option.isSome(fromTable)) {
      const fromIndex = tablesToUpload.indexOf(fromTable.value);
      if (fromIndex > 0) {
        yield* Effect.logInfo(
          `Skipping ${fromIndex} tables before ${fromTable.value}...`,
        );

        tablesToUpload = tablesToUpload.slice(fromIndex);
      }
    }

    const modeLabel = dryRun ? "[DRY RUN] " : "";
    yield* Effect.logInfo(
      `${modeLabel}Uploading ${tablesToUpload.length} tables to raw_dbc schema...`,
    );

    let totalRows = 0;
    for (const tableKey of tablesToUpload) {
      const count = yield* uploadTable(supabase, tableKey, dryRun);
      totalRows += count;
    }

    yield* Effect.logInfo(`\n${modeLabel}✓ Complete! Total rows: ${totalRows}`);

    return totalRows;
  });

export const uploadDbcCommand = Command.make(
  "upload-dbc",
  { dryRun: dryRunOption, from: fromOption, table: tableOption },
  ({ dryRun, from, table }) => uploadDbcProgram(table, dryRun, from),
);
