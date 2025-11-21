import * as path from "node:path";
import { Dbc } from "@wowlab/core/Schemas";

export const DBC_DATA_DIR = path.join(
  process.cwd(),
  "third_party/wowlab-data/data/tables",
);

export const SPELL_TABLES = [
  { file: "Spell.csv", schema: Dbc.SpellRowSchema },
  { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema },
  { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema },
  { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema },
  { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema },
  { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema },
  { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema },
  { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema },
  { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema },
  { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema },
  { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema },
] as const;

export const ITEM_TABLES = [
  { file: "Item.csv", schema: Dbc.ItemRowSchema },
  { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema },
  { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema },
] as const;
