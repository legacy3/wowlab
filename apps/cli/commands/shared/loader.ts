import * as Effect from "effect/Effect";
import * as path from "node:path";
import { parseCsvData } from "@wowlab/services/Data";
import { DBC_DATA_DIR } from "./dbc-config.js";
import { FileSystem } from "@effect/platform";
import * as Schema from "effect/Schema";

export interface TableConfig<T = any> {
  file: string;
  schema: Schema.Schema<T, any>;
}

export const loadTables = <T extends Record<string, any>>(tables: {
  [K in keyof T]: TableConfig<T[K]>;
}) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const keys = Object.keys(tables) as (keyof T)[];

    const results = yield* Effect.forEach(
      keys,
      (key) =>
        Effect.gen(function* () {
          const config = tables[key];
          const content = yield* fs.readFileString(
            path.join(DBC_DATA_DIR, config.file),
            "utf8",
          );
          const data = yield* parseCsvData(content, config.schema);
          return [key, data] as const;
        }),
      { concurrency: "unbounded" },
    );

    return Object.fromEntries(results) as T;
  });
