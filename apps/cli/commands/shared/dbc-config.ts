import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Dbc } from "@wowlab/core/Schemas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DBC_DATA_DIR = path.join(
  __dirname,
  "../../../../third_party/wowlab-data/data/tables",
);

export const SPELL_TABLES = {
  spell: { file: "Spell.csv", schema: Dbc.SpellRowSchema },
  spellEffect: { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema },
  spellCastTimes: {
    file: "SpellCastTimes.csv",
    schema: Dbc.SpellCastTimesRowSchema,
  },
  spellCooldowns: {
    file: "SpellCooldowns.csv",
    schema: Dbc.SpellCooldownsRowSchema,
  },
  spellDuration: {
    file: "SpellDuration.csv",
    schema: Dbc.SpellDurationRowSchema,
  },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema },
  spellCategories: {
    file: "SpellCategories.csv",
    schema: Dbc.SpellCategoriesRowSchema,
  },
  spellCategory: {
    file: "SpellCategory.csv",
    schema: Dbc.SpellCategoryRowSchema,
  },
} as const;

export const ITEM_TABLES = {
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema },
} as const;
