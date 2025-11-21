import * as Effect from "effect/Effect";
import * as path from "node:path";
import { parseCsvData, ParseError } from "@wowlab/services/Data";
import { Dbc } from "@wowlab/core/Schemas";
import { ITEM_TABLES, DBC_DATA_DIR } from "../shared/dbc-config.js";
import { FileSystem } from "@effect/platform";

export interface RawItemData {
  item: Dbc.ItemRow[];
  itemEffect: Dbc.ItemEffectRow[];
  itemSparse: Dbc.ItemSparseRow[];
}

export const loadAllItemTables = Effect.gen(function* () {
  yield* Effect.logInfo("Loading item tables from wowlab-data...");

  const fs = yield* FileSystem.FileSystem;

  const results = yield* Effect.all(
    ITEM_TABLES.map(({ file, schema }) =>
      Effect.gen(function* () {
        const content = yield* fs.readFileString(
          path.join(DBC_DATA_DIR, file),
          "utf8",
        );
        return yield* parseCsvData(content, schema as any);
      }),
    ),
    { concurrency: "unbounded" },
  );

  const item = results[0] as unknown as Dbc.ItemRow[];
  const itemEffect = results[1] as unknown as Dbc.ItemEffectRow[];
  const itemSparse = results[2] as unknown as Dbc.ItemSparseRow[];

  yield* Effect.logInfo(`Loaded ${item.length} items`);

  return {
    item,
    itemEffect,
    itemSparse,
  };
});
