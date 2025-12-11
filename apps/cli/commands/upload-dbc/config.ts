import { Dbc } from "@wowlab/core/Schemas";

import type { TableConfig } from "../shared/loader.js";

export interface DbcTableMapping<T = unknown> extends TableConfig<T> {
  readonly tableName: string;
}

// prettier-ignore
export const DBC_TABLES = {
  chrClasses: { file: "ChrClasses.csv", schema: Dbc.ChrClassesRowSchema, tableName: "chr_classes" },
  chrSpecialization: { file: "ChrSpecialization.csv", schema: Dbc.ChrSpecializationRowSchema, tableName: "chr_specialization" },
  contentTuningXExpected: { file: "ContentTuningXExpected.csv", schema: Dbc.ContentTuningXExpectedRowSchema, tableName: "content_tuning_x_expected" },
  difficulty: { file: "Difficulty.csv", schema: Dbc.DifficultyRowSchema, tableName: "difficulty" },
  expectedStat: { file: "ExpectedStat.csv", schema: Dbc.ExpectedStatRowSchema, tableName: "expected_stat" },
  expectedStatMod: { file: "ExpectedStatMod.csv", schema: Dbc.ExpectedStatModRowSchema, tableName: "expected_stat_mod" },
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema, tableName: "item" },
  itemAppearance: { file: "ItemAppearance.csv", schema: Dbc.ItemAppearanceRowSchema, tableName: "item_appearance" },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema, tableName: "item_effect" },
  itemModifiedAppearance: { file: "ItemModifiedAppearance.csv", schema: Dbc.ItemModifiedAppearanceRowSchema, tableName: "item_modified_appearance" },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema, tableName: "item_sparse" },
  itemXItemEffect: { file: "ItemXItemEffect.csv", schema: Dbc.ItemXItemEffectRowSchema, tableName: "item_x_item_effect" },
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema, tableName: "manifest_interface_data" },
  skillLineXTraitTree: { file: "SkillLineXTraitTree.csv", schema: Dbc.SkillLineXTraitTreeRowSchema, tableName: "skill_line_x_trait_tree" },
  specializationSpells: { file: "SpecializationSpells.csv", schema: Dbc.SpecializationSpellsRowSchema, tableName: "specialization_spells" },
  spell: { file: "Spell.csv", schema: Dbc.SpellRowSchema, tableName: "spell" },
  spellAuraOptions: { file: "SpellAuraOptions.csv", schema: Dbc.SpellAuraOptionsRowSchema, tableName: "spell_aura_options" },
  spellAuraRestrictions: { file: "SpellAuraRestrictions.csv", schema: Dbc.SpellAuraRestrictionsRowSchema, tableName: "spell_aura_restrictions" },
  spellCastingRequirements: { file: "SpellCastingRequirements.csv", schema: Dbc.SpellCastingRequirementsRowSchema, tableName: "spell_casting_requirements" },
  spellCastTimes: { file: "SpellCastTimes.csv", schema: Dbc.SpellCastTimesRowSchema, tableName: "spell_cast_times" },
  spellCategories: { file: "SpellCategories.csv", schema: Dbc.SpellCategoriesRowSchema, tableName: "spell_categories" },
  spellCategory: { file: "SpellCategory.csv", schema: Dbc.SpellCategoryRowSchema, tableName: "spell_category" },
  spellClassOptions: { file: "SpellClassOptions.csv", schema: Dbc.SpellClassOptionsRowSchema, tableName: "spell_class_options" },
  spellCooldowns: { file: "SpellCooldowns.csv", schema: Dbc.SpellCooldownsRowSchema, tableName: "spell_cooldowns" },
  spellDescriptionVariables: { file: "SpellDescriptionVariables.csv", schema: Dbc.SpellDescriptionVariablesRowSchema, tableName: "spell_description_variables" },
  spellDuration: { file: "SpellDuration.csv", schema: Dbc.SpellDurationRowSchema, tableName: "spell_duration" },
  spellEffect: { file: "SpellEffect.csv", schema: Dbc.SpellEffectRowSchema, tableName: "spell_effect" },
  spellEmpower: { file: "SpellEmpower.csv", schema: Dbc.SpellEmpowerRowSchema, tableName: "spell_empower" },
  spellEmpowerStage: { file: "SpellEmpowerStage.csv", schema: Dbc.SpellEmpowerStageRowSchema, tableName: "spell_empower_stage" },
  spellInterrupts: { file: "SpellInterrupts.csv", schema: Dbc.SpellInterruptsRowSchema, tableName: "spell_interrupts" },
  spellLearnSpell: { file: "SpellLearnSpell.csv", schema: Dbc.SpellLearnSpellRowSchema, tableName: "spell_learn_spell" },
  spellLevels: { file: "SpellLevels.csv", schema: Dbc.SpellLevelsRowSchema, tableName: "spell_levels" },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema, tableName: "spell_misc" },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema, tableName: "spell_name" },
  spellPower: { file: "SpellPower.csv", schema: Dbc.SpellPowerRowSchema, tableName: "spell_power" },
  spellProcsPerMinute: { file: "SpellProcsPerMinute.csv", schema: Dbc.SpellProcsPerMinuteRowSchema, tableName: "spell_procs_per_minute" },
  spellProcsPerMinuteMod: { file: "SpellProcsPerMinuteMod.csv", schema: Dbc.SpellProcsPerMinuteModRowSchema, tableName: "spell_procs_per_minute_mod" },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema, tableName: "spell_radius" },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema, tableName: "spell_range" },
  spellReplacement: { file: "SpellReplacement.csv", schema: Dbc.SpellReplacementRowSchema, tableName: "spell_replacement" },
  spellShapeshift: { file: "SpellShapeshift.csv", schema: Dbc.SpellShapeshiftRowSchema, tableName: "spell_shapeshift" },
  spellShapeshiftForm: { file: "SpellShapeshiftForm.csv", schema: Dbc.SpellShapeshiftFormRowSchema, tableName: "spell_shapeshift_form" },
  spellTargetRestrictions: { file: "SpellTargetRestrictions.csv", schema: Dbc.SpellTargetRestrictionsRowSchema, tableName: "spell_target_restrictions" },
  spellTotems: { file: "SpellTotems.csv", schema: Dbc.SpellTotemsRowSchema, tableName: "spell_totems" },
  spellXDescriptionVariables: { file: "SpellXDescriptionVariables.csv", schema: Dbc.SpellXDescriptionVariablesRowSchema, tableName: "spell_x_description_variables" },
  talent: { file: "Talent.csv", schema: Dbc.TalentRowSchema, tableName: "talent" },
  traitDefinition: { file: "TraitDefinition.csv", schema: Dbc.TraitDefinitionRowSchema, tableName: "trait_definition" },
  traitEdge: { file: "TraitEdge.csv", schema: Dbc.TraitEdgeRowSchema, tableName: "trait_edge" },
  traitNode: { file: "TraitNode.csv", schema: Dbc.TraitNodeRowSchema, tableName: "trait_node" },
  traitNodeEntry: { file: "TraitNodeEntry.csv", schema: Dbc.TraitNodeEntryRowSchema, tableName: "trait_node_entry" },
  traitNodeXTraitNodeEntry: { file: "TraitNodeXTraitNodeEntry.csv", schema: Dbc.TraitNodeXTraitNodeEntryRowSchema, tableName: "trait_node_x_trait_node_entry" },
  traitSubTree: { file: "TraitSubTree.csv", schema: Dbc.TraitSubTreeRowSchema, tableName: "trait_sub_tree" },
  traitTree: { file: "TraitTree.csv", schema: Dbc.TraitTreeRowSchema, tableName: "trait_tree" },
  traitTreeLoadout: { file: "TraitTreeLoadout.csv", schema: Dbc.TraitTreeLoadoutRowSchema, tableName: "trait_tree_loadout" },
  traitTreeLoadoutEntry: { file: "TraitTreeLoadoutEntry.csv", schema: Dbc.TraitTreeLoadoutEntryRowSchema, tableName: "trait_tree_loadout_entry" },
} as const;

export type DbcTableKey = keyof typeof DBC_TABLES;

export const DBC_TABLE_KEYS = Object.keys(DBC_TABLES) as DbcTableKey[];
