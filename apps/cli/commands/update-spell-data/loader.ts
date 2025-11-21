import * as Effect from "effect/Effect";
import * as path from "node:path";
import { parseCsvData, ParseError } from "@wowlab/services/Data";
import { Dbc } from "@wowlab/core/Schemas";
import { SPELL_TABLES, DBC_DATA_DIR } from "../shared/dbc-config.js";
import { FileSystem } from "@effect/platform";

export interface RawSpellData {
  spell: Dbc.SpellRow[];
  spellEffect: Dbc.SpellEffectRow[];
  spellMisc: Dbc.SpellMiscRow[];
  spellName: Dbc.SpellNameRow[];
  spellCastTimes: Dbc.SpellCastTimesRow[];
  spellCooldowns: Dbc.SpellCooldownsRow[];
  spellDuration: Dbc.SpellDurationRow[];
  spellRadius: Dbc.SpellRadiusRow[];
  spellRange: Dbc.SpellRangeRow[];
  spellCategories: Dbc.SpellCategoriesRow[];
  spellCategory: Dbc.SpellCategoryRow[];
}

export const loadAllSpellTables = Effect.gen(function* () {
  yield* Effect.logInfo("Loading spell tables from wowlab-data...");

  const fs = yield* FileSystem.FileSystem;

  const results = yield* Effect.all(
    SPELL_TABLES.map(({ file, schema }) =>
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

  const spell = results[0] as unknown as Dbc.SpellRow[];
  const spellEffect = results[1] as unknown as Dbc.SpellEffectRow[];
  const spellMisc = results[2] as unknown as Dbc.SpellMiscRow[];
  const spellName = results[3] as unknown as Dbc.SpellNameRow[];
  const spellCastTimes = results[4] as unknown as Dbc.SpellCastTimesRow[];
  const spellCooldowns = results[5] as unknown as Dbc.SpellCooldownsRow[];
  const spellDuration = results[6] as unknown as Dbc.SpellDurationRow[];
  const spellRadius = results[7] as unknown as Dbc.SpellRadiusRow[];
  const spellRange = results[8] as unknown as Dbc.SpellRangeRow[];
  const spellCategories = results[9] as unknown as Dbc.SpellCategoriesRow[];
  const spellCategory = results[10] as unknown as Dbc.SpellCategoryRow[];

  yield* Effect.logInfo(`Loaded ${spell.length} spells`);

  return {
    spell,
    spellEffect,
    spellMisc,
    spellName,
    spellCastTimes,
    spellCooldowns,
    spellDuration,
    spellRadius,
    spellRange,
    spellCategories,
    spellCategory,
  };
});
