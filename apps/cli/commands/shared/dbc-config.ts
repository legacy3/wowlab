import { Dbc } from "@wowlab/core/Schemas";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DBC_DATA_DIR = path.join(
  __dirname,
  "../../../../third_party/wowlab-data/data/tables",
);

// prettier-ignore
export const SPELL_TABLES = {
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema },
  spell: { file: "Spell.csv", schema: Dbc.SpellRowSchema },
  spellCastTimes: { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema },
  spellCategories: { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema },
  spellCategory: { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema },
  spellClassOptions: { file: "SpellClassOptions.csv", schema: Dbc.SpellClassOptionsRowSchema },
  spellCooldowns: { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema },
  spellDuration: { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema },
  spellEffect: { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema },
  spellEmpower: { file: "SpellEmpower.csv", schema: Dbc.SpellEmpowerRowSchema },
  spellEmpowerStage: { file: "SpellEmpowerStage.csv", schema: Dbc.SpellEmpowerStageRowSchema },
  spellInterrupts: { file: "SpellInterrupts.csv", schema: Dbc.SpellInterruptsRowSchema },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema },
  spellPower: { file: "SpellPower.csv", schema: Dbc.SpellPowerRowSchema },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema },
} as const;

// prettier-ignore
export const ITEM_TABLES = {
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema },
  itemXItemEffect: { file: "ItemXItemEffect.csv", schema: Dbc.ItemXItemEffectRowSchema },
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema },
} as const;
