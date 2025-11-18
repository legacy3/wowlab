import * as Effect from "effect/Effect";
import JSONbig from "json-bigint";
import * as fs from "node:fs";
import * as path from "node:path";

import { DBC_TABLE_CONFIG } from "./config";
import { FileReadError, JsonParseError } from "./errors";

// Configure json-bigint to use native BigInt for large integers
// This prevents precision loss for 64-bit bitmask values like AllowableRace/AllowableClass
const JSONBigInt = JSONbig({ useNativeBigInt: true });

export interface RawItemDBCData {
  fileData: (typeof DBC_TABLE_CONFIG)[2]["type"][];
  item: (typeof DBC_TABLE_CONFIG)[0]["type"][];
  itemEffect: (typeof DBC_TABLE_CONFIG)[3]["type"][];
  itemSparse: (typeof DBC_TABLE_CONFIG)[1]["type"][];
  itemXItemEffect: (typeof DBC_TABLE_CONFIG)[4]["type"][];
}

const loadDbcFile = <T>(
  filePath: string,
): Effect.Effect<T[], FileReadError | JsonParseError> =>
  Effect.gen(function* () {
    const content = yield* Effect.tryPromise({
      catch: (cause) => new FileReadError({ cause, filePath }),
      try: async () => fs.promises.readFile(filePath, "utf-8"),
    });

    const items = yield* Effect.try({
      catch: (cause) => new JsonParseError({ cause, filePath }),
      try: () => JSONBigInt.parse(content) as T[],
    });

    return items;
  });

export const loadAllDbcTables = (
  dataDir: string,
): Effect.Effect<RawItemDBCData, FileReadError | JsonParseError> =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`Loading item DBC data from ${dataDir}...`);

    const results = yield* Effect.all(
      [
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[0]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[0].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[1]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[1].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[2]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[2].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[3]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[3].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[4]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[4].file),
        ),
      ],
      { concurrency: "unbounded" },
    );

    yield* Effect.logDebug(
      `Loaded ${results[0].length} items from ${dataDir.split("/").pop()}`,
    );

    return {
      fileData: results[2],
      item: results[0],
      itemEffect: results[3],
      itemSparse: results[1],
      itemXItemEffect: results[4],
    };
  });
