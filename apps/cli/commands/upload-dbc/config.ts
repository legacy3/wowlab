import { Dbc } from "@wowlab/core/Schemas";

import type { TableConfig } from "../shared/loader.js";

export interface DbcTableMapping<T = unknown> extends TableConfig<T> {
  readonly tableName: string;
}

// prettier-ignore
export const DBC_TABLES = {
  contentTuningXExpected: { file: "ContentTuningXExpected.csv", schema: Dbc.ContentTuningXExpectedRowSchema, tableName: "content_tuning_x_expected" },
  difficulty: { file: "Difficulty.csv", schema: Dbc.DifficultyRowSchema, tableName: "difficulty" },
  expectedStat: { file: "ExpectedStat.csv", schema: Dbc.ExpectedStatRowSchema, tableName: "expected_stat" },
  expectedStatMod: { file: "ExpectedStatMod.csv", schema: Dbc.ExpectedStatModRowSchema, tableName: "expected_stat_mod" },
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema, tableName: "item" },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema, tableName: "item_effect" },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema, tableName: "item_sparse" },
  itemXItemEffect: { file: "ItemXItemEffect.csv", schema: Dbc.ItemXItemEffectRowSchema, tableName: "item_x_item_effect" },
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema, tableName: "manifest_interface_data" },
  spell: { file: "Spell.csv", schema: Dbc.SpellRowSchema, tableName: "spell" },
  spellAuraOptions: { file: "SpellAuraOptions.csv", schema: Dbc.SpellAuraOptionsRowSchema, tableName: "spell_aura_options" },
  spellCastingRequirements: { file: "SpellCastingRequirements.csv", schema: Dbc.SpellCastingRequirementsRowSchema, tableName: "spell_casting_requirements" },
  spellCastTimes: { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema, tableName: "spell_cast_times" },
  spellCategories: { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema, tableName: "spell_categories" },
  spellCategory: { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema, tableName: "spell_category" },
  spellClassOptions: { file: "SpellClassOptions.csv", schema: Dbc.SpellClassOptionsRowSchema, tableName: "spell_class_options" },
  spellCooldowns: { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema, tableName: "spell_cooldowns" },
  spellDuration: { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema, tableName: "spell_duration" },
  spellEffect: { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema, tableName: "spell_effect" },
  spellEmpower: { file: "SpellEmpower.csv", schema: Dbc.SpellEmpowerRowSchema, tableName: "spell_empower" },
  spellEmpowerStage: { file: "SpellEmpowerStage.csv", schema: Dbc.SpellEmpowerStageRowSchema, tableName: "spell_empower_stage" },
  spellInterrupts: { file: "SpellInterrupts.csv", schema: Dbc.SpellInterruptsRowSchema, tableName: "spell_interrupts" },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema, tableName: "spell_misc" },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema, tableName: "spell_name" },
  spellPower: { file: "SpellPower.csv", schema: Dbc.SpellPowerRowSchema, tableName: "spell_power" },
  spellProcsPerMinute: { file: "SpellProcsPerMinute.csv", schema: Dbc.SpellProcsPerMinuteRowSchema, tableName: "spell_procs_per_minute" },
  spellProcsPerMinuteMod: { file: "SpellProcsPerMinuteMod.csv", schema: Dbc.SpellProcsPerMinuteModRowSchema, tableName: "spell_procs_per_minute_mod" },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema, tableName: "spell_radius" },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema, tableName: "spell_range" },
  spellTargetRestrictions: { file: "SpellTargetRestrictions.csv", schema: Dbc.SpellTargetRestrictionsRowSchema, tableName: "spell_target_restrictions" },
} as const;

export type DbcTableKey = keyof typeof DBC_TABLES;

export const DBC_TABLE_KEYS = Object.keys(DBC_TABLES) as DbcTableKey[];
