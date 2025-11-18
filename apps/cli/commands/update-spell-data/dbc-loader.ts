import type { RawDBCData } from "@packages/innocent-services/Data";

import * as Effect from "effect/Effect";
import * as fs from "node:fs";
import * as path from "node:path";
import StreamArray from "stream-json/streamers/StreamArray";

import { DBC_TABLE_CONFIG } from "./config";
import { FileReadError, JsonParseError } from "./errors";

const loadDbcFile = <T>(
  filePath: string,
): Effect.Effect<T[], FileReadError | JsonParseError> =>
  Effect.gen(function* () {
    const items: T[] = [];

    yield* Effect.tryPromise({
      catch: (cause) => new FileReadError({ cause, filePath }),
      try: async () => {
        const stream = fs.createReadStream(filePath);
        const jsonStream = stream.pipe(StreamArray.withParser());

        for await (const { value } of jsonStream) {
          items.push(value as T);
        }
      },
    });

    return items;
  });

export const loadAllDbcTables = (
  dataDir: string,
): Effect.Effect<RawDBCData, FileReadError | JsonParseError> =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`Loading DBC data from ${dataDir}...`);

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
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[5]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[5].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[6]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[6].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[7]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[7].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[8]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[8].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[9]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[9].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[10]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[10].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[11]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[11].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[12]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[12].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[13]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[13].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[14]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[14].file),
        ),
        loadDbcFile<(typeof DBC_TABLE_CONFIG)[15]["type"]>(
          path.join(dataDir, DBC_TABLE_CONFIG[15].file),
        ),
      ],
      { concurrency: "unbounded" },
    );

    yield* Effect.logDebug(
      `Loaded ${results[11].length} spells from ${dataDir.split("/").pop()}`,
    );

    return {
      fileData: results[0],
      spellCastingRequirements: results[1],
      spellCastTimes: results[2],
      spellCategories: results[3],
      spellCategory: results[4],
      spellCooldowns: results[5],
      spellDuration: results[6],
      spellEffect: results[7],
      spellEmpower: results[8],
      spellEmpowerStage: results[9],
      spellInterrupts: results[10],
      spellMisc: results[11],
      spellName: results[12],
      spellRadius: results[13],
      spellRange: results[14],
      spellTargetRestrictions: results[15],
    };
  });
