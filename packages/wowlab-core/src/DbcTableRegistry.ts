import type * as Schema from "effect/Schema";

import * as AST from "effect/SchemaAST";

import { Dbc } from "./Schemas.js";

export interface DbcTableMapping<T = unknown> {
  readonly file: string;
  readonly schema: Schema.Schema<T, any>;
  readonly tableName: string;
}

// prettier-ignore
export const DBC_TABLES = {
  armorLocation: { file: "ArmorLocation.csv", schema: Dbc.ArmorLocationRowSchema, tableName: "armor_location" },
  chrClasses: { file: "ChrClasses.csv", schema: Dbc.ChrClassesRowSchema, tableName: "chr_classes" },
  chrClassRaceSex: { file: "ChrClassRaceSex.csv", schema: Dbc.ChrClassRaceSexRowSchema, tableName: "chr_class_race_sex" },
  chrRaceRacialAbility: { file: "ChrRaceRacialAbility.csv", schema: Dbc.ChrRaceRacialAbilityRowSchema, tableName: "chr_race_racial_ability" },
  chrRaces: { file: "ChrRaces.csv", schema: Dbc.ChrRacesRowSchema, tableName: "chr_races" },
  chrSpecialization: { file: "ChrSpecialization.csv", schema: Dbc.ChrSpecializationRowSchema, tableName: "chr_specialization" },
  combatCondition: { file: "CombatCondition.csv", schema: Dbc.CombatConditionRowSchema, tableName: "combat_condition" },
  contentTuning: { file: "ContentTuning.csv", schema: Dbc.ContentTuningRowSchema, tableName: "content_tuning" },
  contentTuningXDifficulty: { file: "ContentTuningXDifficulty.csv", schema: Dbc.ContentTuningXDifficultyRowSchema, tableName: "content_tuning_x_difficulty" },
  contentTuningXExpected: { file: "ContentTuningXExpected.csv", schema: Dbc.ContentTuningXExpectedRowSchema, tableName: "content_tuning_x_expected" },
  curve: { file: "Curve.csv", schema: Dbc.CurveRowSchema, tableName: "curve" },
  curvePoint: { file: "CurvePoint.csv", schema: Dbc.CurvePointRowSchema, tableName: "curve_point" },
  difficulty: { file: "Difficulty.csv", schema: Dbc.DifficultyRowSchema, tableName: "difficulty" },
  expectedStat: { file: "ExpectedStat.csv", schema: Dbc.ExpectedStatRowSchema, tableName: "expected_stat" },
  expectedStatMod: { file: "ExpectedStatMod.csv", schema: Dbc.ExpectedStatModRowSchema, tableName: "expected_stat_mod" },
  gemProperties: { file: "GemProperties.csv", schema: Dbc.GemPropertiesRowSchema, tableName: "gem_properties" },
  globalCurve: { file: "GlobalCurve.csv", schema: Dbc.GlobalCurveRowSchema, tableName: "global_curve" },
  item: { file: "Item.csv", schema: Dbc.ItemRowSchema, tableName: "item" },
  itemAppearance: { file: "ItemAppearance.csv", schema: Dbc.ItemAppearanceRowSchema, tableName: "item_appearance" },
  itemArmorQuality: { file: "ItemArmorQuality.csv", schema: Dbc.ItemArmorQualityRowSchema, tableName: "item_armor_quality" },
  itemArmorShield: { file: "ItemArmorShield.csv", schema: Dbc.ItemArmorShieldRowSchema, tableName: "item_armor_shield" },
  itemArmorTotal: { file: "ItemArmorTotal.csv", schema: Dbc.ItemArmorTotalRowSchema, tableName: "item_armor_total" },
  itemBonus: { file: "ItemBonus.csv", schema: Dbc.ItemBonusRowSchema, tableName: "item_bonus" },
  itemBonusList: { file: "ItemBonusList.csv", schema: Dbc.ItemBonusListRowSchema, tableName: "item_bonus_list" },
  itemBonusListGroup: { file: "ItemBonusListGroup.csv", schema: Dbc.ItemBonusListGroupRowSchema, tableName: "item_bonus_list_group" },
  itemBonusListGroupEntry: { file: "ItemBonusListGroupEntry.csv", schema: Dbc.ItemBonusListGroupEntryRowSchema, tableName: "item_bonus_list_group_entry" },
  itemBonusSeason: { file: "ItemBonusSeason.csv", schema: Dbc.ItemBonusSeasonRowSchema, tableName: "item_bonus_season" },
  itemBonusSeasonUpgradeCost: { file: "ItemBonusSeasonUpgradeCost.csv", schema: Dbc.ItemBonusSeasonUpgradeCostRowSchema, tableName: "item_bonus_season_upgrade_cost" },
  itemBonusTree: { file: "ItemBonusTree.csv", schema: Dbc.ItemBonusTreeRowSchema, tableName: "item_bonus_tree" },
  itemBonusTreeNode: { file: "ItemBonusTreeNode.csv", schema: Dbc.ItemBonusTreeNodeRowSchema, tableName: "item_bonus_tree_node" },
  itemClass: { file: "ItemClass.csv", schema: Dbc.ItemClassRowSchema, tableName: "item_class" },
  itemDamageOneHand: { file: "ItemDamageOneHand.csv", schema: Dbc.ItemDamageOneHandRowSchema, tableName: "item_damage_one_hand" },
  itemDamageOneHandCaster: { file: "ItemDamageOneHandCaster.csv", schema: Dbc.ItemDamageOneHandCasterRowSchema, tableName: "item_damage_one_hand_caster" },
  itemDamageTwoHand: { file: "ItemDamageTwoHand.csv", schema: Dbc.ItemDamageTwoHandRowSchema, tableName: "item_damage_two_hand" },
  itemDamageTwoHandCaster: { file: "ItemDamageTwoHandCaster.csv", schema: Dbc.ItemDamageTwoHandCasterRowSchema, tableName: "item_damage_two_hand_caster" },
  itemEffect: { file: "ItemEffect.csv", schema: Dbc.ItemEffectRowSchema, tableName: "item_effect" },
  itemModifiedAppearance: { file: "ItemModifiedAppearance.csv", schema: Dbc.ItemModifiedAppearanceRowSchema, tableName: "item_modified_appearance" },
  itemNameDescription: { file: "ItemNameDescription.csv", schema: Dbc.ItemNameDescriptionRowSchema, tableName: "item_name_description" },
  itemSet: { file: "ItemSet.csv", schema: Dbc.ItemSetRowSchema, tableName: "item_set" },
  itemSetSpell: { file: "ItemSetSpell.csv", schema: Dbc.ItemSetSpellRowSchema, tableName: "item_set_spell" },
  itemSparse: { file: "ItemSparse.csv", schema: Dbc.ItemSparseRowSchema, tableName: "item_sparse" },
  itemSubClass: { file: "ItemSubClass.csv", schema: Dbc.ItemSubClassRowSchema, tableName: "item_sub_class" },
  itemXBonusTree: { file: "ItemXBonusTree.csv", schema: Dbc.ItemXBonusTreeRowSchema, tableName: "item_x_bonus_tree" },
  itemXItemEffect: { file: "ItemXItemEffect.csv", schema: Dbc.ItemXItemEffectRowSchema, tableName: "item_x_item_effect" },
  journalEncounter: { file: "JournalEncounter.csv", schema: Dbc.JournalEncounterRowSchema, tableName: "journal_encounter" },
  journalEncounterItem: { file: "JournalEncounterItem.csv", schema: Dbc.JournalEncounterItemRowSchema, tableName: "journal_encounter_item" },
  journalInstance: { file: "JournalInstance.csv", schema: Dbc.JournalInstanceRowSchema, tableName: "journal_instance" },
  manifestInterfaceData: { file: "ManifestInterfaceData.csv", schema: Dbc.ManifestInterfaceDataRowSchema, tableName: "manifest_interface_data" },
  modifiedCraftingReagentItem: { file: "ModifiedCraftingReagentItem.csv", schema: Dbc.ModifiedCraftingReagentItemRowSchema, tableName: "modified_crafting_reagent_item" },
  modifierTree: { file: "ModifierTree.csv", schema: Dbc.ModifierTreeRowSchema, tableName: "modifier_tree" },
  overrideSpellData: { file: "OverrideSpellData.csv", schema: Dbc.OverrideSpellDataRowSchema, tableName: "override_spell_data" },
  pvpScalingEffect: { file: "PvpScalingEffect.csv", schema: Dbc.PvpScalingEffectRowSchema, tableName: "pvp_scaling_effect" },
  pvpScalingEffectType: { file: "PvpScalingEffectType.csv", schema: Dbc.PvpScalingEffectTypeRowSchema, tableName: "pvp_scaling_effect_type" },
  randPropPoints: { file: "RandPropPoints.csv", schema: Dbc.RandPropPointsRowSchema, tableName: "rand_prop_points" },
  skillLineAbility: { file: "SkillLineAbility.csv", schema: Dbc.SkillLineAbilityRowSchema, tableName: "skill_line_ability" },
  skillLineXTraitTree: { file: "SkillLineXTraitTree.csv", schema: Dbc.SkillLineXTraitTreeRowSchema, tableName: "skill_line_x_trait_tree" },
  specializationSpells: { file: "SpecializationSpells.csv", schema: Dbc.SpecializationSpellsRowSchema, tableName: "specialization_spells" },
  specSetMember: { file: "SpecSetMember.csv", schema: Dbc.SpecSetMemberRowSchema, tableName: "spec_set_member" },
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
  spellEquippedItems: { file: "SpellEquippedItems.csv", schema: Dbc.SpellEquippedItemsRowSchema, tableName: "spell_equipped_items" },
  spellInterrupts: { file: "SpellInterrupts.csv", schema: Dbc.SpellInterruptsRowSchema, tableName: "spell_interrupts" },
  spellItemEnchantment: { file: "SpellItemEnchantment.csv", schema: Dbc.SpellItemEnchantmentRowSchema, tableName: "spell_item_enchantment" },
  spellLabel: { file: "SpellLabel.csv", schema: Dbc.SpellLabelRowSchema, tableName: "spell_label" },
  spellLearnSpell: { file: "SpellLearnSpell.csv", schema: Dbc.SpellLearnSpellRowSchema, tableName: "spell_learn_spell" },
  spellLevels: { file: "SpellLevels.csv", schema: Dbc.SpellLevelsRowSchema, tableName: "spell_levels" },
  spellMisc: { file: "SpellMisc.csv", schema: Dbc.SpellMiscRowSchema, tableName: "spell_misc" },
  spellName: { file: "SpellName.csv", schema: Dbc.SpellNameRowSchema, tableName: "spell_name" },
  spellPower: { file: "SpellPower.csv", schema: Dbc.SpellPowerRowSchema, tableName: "spell_power" },
  spellPowerDifficulty: { file: "SpellPowerDifficulty.csv", schema: Dbc.SpellPowerDifficultyRowSchema, tableName: "spell_power_difficulty" },
  spellProcsPerMinute: { file: "SpellProcsPerMinute.csv", schema: Dbc.SpellProcsPerMinuteRowSchema, tableName: "spell_procs_per_minute" },
  spellProcsPerMinuteMod: { file: "SpellProcsPerMinuteMod.csv", schema: Dbc.SpellProcsPerMinuteModRowSchema, tableName: "spell_procs_per_minute_mod" },
  spellRadius: { file: "SpellRadius.csv", schema: Dbc.SpellRadiusRowSchema, tableName: "spell_radius" },
  spellRange: { file: "SpellRange.csv", schema: Dbc.SpellRangeRowSchema, tableName: "spell_range" },
  spellReplacement: { file: "SpellReplacement.csv", schema: Dbc.SpellReplacementRowSchema, tableName: "spell_replacement" },
  spellScaling: { file: "SpellScaling.csv", schema: Dbc.SpellScalingRowSchema, tableName: "spell_scaling" },
  spellShapeshift: { file: "SpellShapeshift.csv", schema: Dbc.SpellShapeshiftRowSchema, tableName: "spell_shapeshift" },
  spellShapeshiftForm: { file: "SpellShapeshiftForm.csv", schema: Dbc.SpellShapeshiftFormRowSchema, tableName: "spell_shapeshift_form" },
  spellTargetRestrictions: { file: "SpellTargetRestrictions.csv", schema: Dbc.SpellTargetRestrictionsRowSchema, tableName: "spell_target_restrictions" },
  spellTotems: { file: "SpellTotems.csv", schema: Dbc.SpellTotemsRowSchema, tableName: "spell_totems" },
  spellXDescriptionVariables: { file: "SpellXDescriptionVariables.csv", schema: Dbc.SpellXDescriptionVariablesRowSchema, tableName: "spell_x_description_variables" },
  talent: { file: "Talent.csv", schema: Dbc.TalentRowSchema, tableName: "talent" },
  traitCond: { file: "TraitCond.csv", schema: Dbc.TraitCondRowSchema, tableName: "trait_cond" },
  traitCost: { file: "TraitCost.csv", schema: Dbc.TraitCostRowSchema, tableName: "trait_cost" },
  traitCurrency: { file: "TraitCurrency.csv", schema: Dbc.TraitCurrencyRowSchema, tableName: "trait_currency" },
  traitDefinition: { file: "TraitDefinition.csv", schema: Dbc.TraitDefinitionRowSchema, tableName: "trait_definition" },
  traitDefinitionEffectPoints: { file: "TraitDefinitionEffectPoints.csv", schema: Dbc.TraitDefinitionEffectPointsRowSchema, tableName: "trait_definition_effect_points" },
  traitEdge: { file: "TraitEdge.csv", schema: Dbc.TraitEdgeRowSchema, tableName: "trait_edge" },
  traitNode: { file: "TraitNode.csv", schema: Dbc.TraitNodeRowSchema, tableName: "trait_node" },
  traitNodeEntry: { file: "TraitNodeEntry.csv", schema: Dbc.TraitNodeEntryRowSchema, tableName: "trait_node_entry" },
  traitNodeGroup: { file: "TraitNodeGroup.csv", schema: Dbc.TraitNodeGroupRowSchema, tableName: "trait_node_group" },
  traitNodeGroupXTraitCond: { file: "TraitNodeGroupXTraitCond.csv", schema: Dbc.TraitNodeGroupXTraitCondRowSchema, tableName: "trait_node_group_x_trait_cond" },
  traitNodeGroupXTraitCost: { file: "TraitNodeGroupXTraitCost.csv", schema: Dbc.TraitNodeGroupXTraitCostRowSchema, tableName: "trait_node_group_x_trait_cost" },
  traitNodeGroupXTraitNode: { file: "TraitNodeGroupXTraitNode.csv", schema: Dbc.TraitNodeGroupXTraitNodeRowSchema, tableName: "trait_node_group_x_trait_node" },
  traitNodeXTraitCond: { file: "TraitNodeXTraitCond.csv", schema: Dbc.TraitNodeXTraitCondRowSchema, tableName: "trait_node_x_trait_cond" },
  traitNodeXTraitNodeEntry: { file: "TraitNodeXTraitNodeEntry.csv", schema: Dbc.TraitNodeXTraitNodeEntryRowSchema, tableName: "trait_node_x_trait_node_entry" },
  traitSubTree: { file: "TraitSubTree.csv", schema: Dbc.TraitSubTreeRowSchema, tableName: "trait_sub_tree" },
  traitTree: { file: "TraitTree.csv", schema: Dbc.TraitTreeRowSchema, tableName: "trait_tree" },
  traitTreeLoadout: { file: "TraitTreeLoadout.csv", schema: Dbc.TraitTreeLoadoutRowSchema, tableName: "trait_tree_loadout" },
  traitTreeLoadoutEntry: { file: "TraitTreeLoadoutEntry.csv", schema: Dbc.TraitTreeLoadoutEntryRowSchema, tableName: "trait_tree_loadout_entry" },
  traitTreeXTraitCurrency: { file: "TraitTreeXTraitCurrency.csv", schema: Dbc.TraitTreeXTraitCurrencyRowSchema, tableName: "trait_tree_x_trait_currency" },
  uiTextureAtlasElement: { file: "UiTextureAtlasElement.csv", schema: Dbc.UiTextureAtlasElementRowSchema, tableName: "ui_texture_atlas_element" },
} as const;

export type DbcRow<T extends DbcTableName> = Schema.Schema.Type<
  DbcTableEntryFor<T>["schema"]
>;
export type DbcTableEntry = (typeof DBC_TABLES)[DbcTableKey];
export type DbcTableEntryFor<T extends DbcTableName> = Extract<
  DbcTableEntry,
  { readonly tableName: T }
>;
export type DbcTableKey = keyof typeof DBC_TABLES;

export type DbcTableName = DbcTableEntry["tableName"];

export const DBC_TABLE_KEYS = Object.keys(DBC_TABLES) as DbcTableKey[];
export const DBC_TABLE_NAMES = Object.values(DBC_TABLES).map(
  (t) => t.tableName,
) as DbcTableName[];

const tableNameSet = new Set<string>(DBC_TABLE_NAMES);

export const isValidDbcTable = (table: string): table is DbcTableName =>
  tableNameSet.has(table);

export const getDbcTableEntry = (
  tableName: string,
): DbcTableEntry | undefined => {
  if (!isValidDbcTable(tableName)) return undefined;
  const entry = Object.values(DBC_TABLES).find(
    (t) => t.tableName === tableName,
  );
  return entry;
};

// TODO Verify this against effect docs
export interface DbcFieldInfo {
  name: string;
  optional: boolean;
  type: string;
}

// TODO Verify this against effect docs
export function getDbcTableFields(tableName: string): DbcFieldInfo[] | null {
  const entry = getDbcTableEntry(tableName);
  if (!entry) {
    return null;
  }

  const ast = entry.schema.ast;
  if (!AST.isTypeLiteral(ast)) {
    return null;
  }

  const fields: DbcFieldInfo[] = [];

  for (const prop of ast.propertySignatures) {
    fields.push({
      name: String(prop.name),
      optional: prop.isOptional,
      type: getTypeString(prop.type),
    });
  }

  return fields;
}

// TODO Verify this against effect docs
function getTypeString(ast: AST.AST): string {
  if (AST.isStringKeyword(ast)) {
    return "string";
  }

  if (AST.isNumberKeyword(ast)) {
    return "number";
  }

  if (AST.isBooleanKeyword(ast)) {
    return "boolean";
  }

  if (AST.isLiteral(ast)) {
    if (ast.literal === null) {
      return "null";
    }

    return `"${String(ast.literal)}"`;
  }

  if (AST.isUndefinedKeyword(ast)) {
    return "undefined";
  }

  if (AST.isUnion(ast)) {
    const types = ast.types.map(getTypeString);

    if (types.length === 2 && types.includes("null")) {
      const other = types.find((t) => t !== "null");
      return `${other} | null`;
    }

    return types.join(" | ");
  }

  if (AST.isTupleType(ast)) {
    return `[${ast.elements.map((e) => getTypeString(e.type)).join(", ")}]`;
  }

  if (AST.isTypeLiteral(ast)) {
    return "object";
  }

  if (AST.isTransformation(ast)) {
    return getTypeString(ast.to);
  }

  if (AST.isRefinement(ast)) {
    return getTypeString(ast.from);
  }

  if (AST.isSuspend(ast)) {
    return getTypeString(ast.f());
  }

  const annotations = ast.annotations;
  if (annotations[AST.IdentifierAnnotationId]) {
    return String(annotations[AST.IdentifierAnnotationId]);
  }

  return "unknown";
}
