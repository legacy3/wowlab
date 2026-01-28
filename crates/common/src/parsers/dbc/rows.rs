//! Row structs for DBC CSV tables
//!
//! Field names match the CSV column headers exactly.

use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellNameRow {
    pub ID: i32,
    pub Name_lang: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellRow {
    pub ID: i32,
    pub NameSubtext_lang: Option<String>,
    pub Description_lang: Option<String>,
    pub AuraDescription_lang: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellMiscRow {
    pub ID: i32,
    pub Attributes_0: i32,
    pub Attributes_1: i32,
    pub Attributes_2: i32,
    pub Attributes_3: i32,
    pub Attributes_4: i32,
    pub Attributes_5: i32,
    pub Attributes_6: i32,
    pub Attributes_7: i32,
    pub Attributes_8: i32,
    pub Attributes_9: i32,
    pub Attributes_10: i32,
    pub Attributes_11: i32,
    pub Attributes_12: i32,
    pub Attributes_13: i32,
    pub Attributes_14: i32,
    pub Attributes_15: i32,
    pub Attributes_16: i32,
    pub DifficultyID: i32,
    pub CastingTimeIndex: i32,
    pub DurationIndex: i32,
    pub PvPDurationIndex: i32,
    pub RangeIndex: i32,
    pub SchoolMask: i32,
    pub Speed: f32,
    pub LaunchDelay: f32,
    pub MinDuration: f32,
    pub SpellIconFileDataID: i32,
    pub ActiveIconFileDataID: i32,
    pub ContentTuningID: i32,
    pub ShowFutureSpellPlayerConditionID: i32,
    pub SpellVisualScript: i32,
    pub ActiveSpellVisualScript: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellEffectRow {
    pub ID: i32,
    pub EffectAura: i32,
    pub DifficultyID: i32,
    pub EffectIndex: i32,
    pub Effect: i32,
    pub EffectAmplitude: f32,
    pub EffectAttributes: i32,
    pub EffectAuraPeriod: i32,
    pub EffectBonusCoefficient: f64,
    pub EffectChainAmplitude: f32,
    pub EffectChainTargets: i32,
    pub EffectItemType: i32,
    pub EffectMechanic: i32,
    pub EffectPointsPerResource: f32,
    pub EffectPos_facing: f32,
    pub EffectRealPointsPerLevel: f32,
    pub EffectTriggerSpell: i32,
    pub BonusCoefficientFromAP: f64,
    pub PvpMultiplier: f32,
    pub Coefficient: f32,
    pub Variance: f32,
    pub ResourceCoefficient: f32,
    pub GroupSizeBasePointsCoefficient: f32,
    pub EffectBasePointsF: f64,
    pub ScalingClass: i32,
    #[serde(rename = "Node__Field_12_0_0_63534_001")]
    pub Node_Field: i32,
    pub EffectMiscValue_0: i32,
    pub EffectMiscValue_1: i32,
    pub EffectRadiusIndex_0: i32,
    pub EffectRadiusIndex_1: i32,
    pub EffectSpellClassMask_0: i32,
    pub EffectSpellClassMask_1: i32,
    pub EffectSpellClassMask_2: i32,
    pub EffectSpellClassMask_3: i32,
    pub ImplicitTarget_0: i32,
    pub ImplicitTarget_1: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellPowerRow {
    pub ID: i32,
    pub OrderIndex: i32,
    pub ManaCost: i32,
    pub ManaCostPerLevel: i32,
    pub ManaPerSecond: i32,
    pub PowerDisplayID: i32,
    pub AltPowerBarID: i32,
    pub PowerCostPct: f64,
    pub PowerCostMaxPct: f32,
    pub OptionalCostPct: f32,
    pub PowerPctPerSecond: f32,
    pub PowerType: i32,
    pub RequiredAuraSpellID: i32,
    pub OptionalCost: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellCooldownsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub CategoryRecoveryTime: i32,
    pub RecoveryTime: i32,
    pub StartRecoveryTime: i32,
    pub AuraSpellID: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellCategoriesRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub Category: i32,
    pub DefenseType: i32,
    pub DiminishType: i32,
    pub DispelType: i32,
    pub Mechanic: i32,
    pub PreventionType: i32,
    pub StartRecoveryCategory: i32,
    pub ChargeCategory: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellCategoryRow {
    pub ID: i32,
    pub Name_lang: Option<String>,
    pub Flags: i32,
    pub UsesPerWeek: i32,
    pub MaxCharges: i32,
    pub ChargeRecoveryTime: i32,
    pub TypeMask: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellCastTimesRow {
    pub ID: i32,
    pub Base: i32,
    pub Minimum: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellDurationRow {
    pub ID: i32,
    pub Duration: i32,
    pub MaxDuration: i32,
    #[serde(rename = "Field_12_0_0_64499_002")]
    pub Field: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellRangeRow {
    pub ID: i32,
    pub DisplayName_lang: Option<String>,
    pub DisplayNameShort_lang: Option<String>,
    pub Flags: i32,
    pub RangeMin_0: f32,
    pub RangeMin_1: f32,
    pub RangeMax_0: f32,
    pub RangeMax_1: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellRadiusRow {
    pub ID: i32,
    pub Radius: f32,
    pub RadiusPerLevel: f32,
    pub RadiusMin: f32,
    pub RadiusMax: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellClassOptionsRow {
    pub ID: i32,
    pub SpellID: i32,
    pub ModalNextSpell: i32,
    pub SpellClassSet: i32,
    pub SpellClassMask_0: i32,
    pub SpellClassMask_1: i32,
    pub SpellClassMask_2: i32,
    pub SpellClassMask_3: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellAuraRestrictionsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub CasterAuraState: i32,
    pub TargetAuraState: i32,
    pub ExcludeCasterAuraState: i32,
    pub ExcludeTargetAuraState: i32,
    pub CasterAuraSpell: i32,
    pub TargetAuraSpell: i32,
    pub ExcludeCasterAuraSpell: i32,
    pub ExcludeTargetAuraSpell: i32,
    pub CasterAuraType: i32,
    pub TargetAuraType: i32,
    pub ExcludeCasterAuraType: i32,
    pub ExcludeTargetAuraType: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellInterruptsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub InterruptFlags: i32,
    pub AuraInterruptFlags_0: i32,
    pub AuraInterruptFlags_1: i32,
    pub ChannelInterruptFlags_0: i32,
    pub ChannelInterruptFlags_1: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellEmpowerRow {
    pub ID: i32,
    pub SpellID: i32,
    #[serde(rename = "Field_10_0_0_44649_002")]
    pub Field: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellEmpowerStageRow {
    pub ID: i32,
    pub Stage: i32,
    pub DurationMs: i32,
    pub SpellEmpowerID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellTargetRestrictionsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub ConeDegrees: f32,
    pub MaxTargets: i32,
    pub MaxTargetLevel: i32,
    pub TargetCreatureType: i32,
    pub Targets: i32,
    pub Width: f32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellLevelsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub MaxLevel: i32,
    pub MaxPassiveAuraLevel: i32,
    pub BaseLevel: i32,
    pub SpellLevel: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellLearnSpellRow {
    pub ID: i32,
    pub SpellID: i32,
    pub LearnSpellID: i32,
    pub OverridesSpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellReplacementRow {
    pub ID: i32,
    pub ReplacementSpellID: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellShapeshiftRow {
    pub ID: i32,
    pub SpellID: i32,
    pub StanceBarOrder: i32,
    pub ShapeshiftExclude_0: i32,
    pub ShapeshiftExclude_1: i32,
    pub ShapeshiftMask_0: i32,
    pub ShapeshiftMask_1: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellTotemsRow {
    pub ID: i32,
    pub SpellID: i32,
    pub RequiredTotemCategoryID_0: i32,
    pub RequiredTotemCategoryID_1: i32,
    pub Totem_0: i32,
    pub Totem_1: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellDescriptionVariablesRow {
    pub ID: i32,
    pub Variables: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellXDescriptionVariablesRow {
    pub ID: i32,
    pub SpellID: i32,
    pub SpellDescriptionVariablesID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpellAuraOptionsRow {
    pub ID: i32,
    pub DifficultyID: i32,
    pub CumulativeAura: i32,
    pub ProcCategoryRecovery: i32,
    pub ProcChance: i32,
    pub ProcCharges: i32,
    pub SpellProcsPerMinuteID: i32,
    pub ProcTypeMask_0: i32,
    pub ProcTypeMask_1: i32,
    pub SpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ChrSpecializationRow {
    pub Name_lang: Option<String>,
    pub FemaleName_lang: Option<String>,
    pub Description_lang: Option<String>,
    pub ID: i32,
    pub ClassID: Option<i32>,
    pub OrderIndex: Option<i32>,
    pub PetTalentType: i32,
    pub Role: i32,
    pub Flags: i32,
    pub SpellIconFileID: i32,
    pub PrimaryStatPriority: i32,
    pub AnimReplacements: i32,
    pub MasterySpellID_0: i32,
    pub MasterySpellID_1: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ChrClassesRow {
    pub Name_lang: Option<String>,
    pub Filename: Option<String>,
    pub Name_male_lang: Option<String>,
    pub Name_female_lang: Option<String>,
    pub PetNameToken: Option<String>,
    pub Description_lang: Option<String>,
    pub RoleInfoString_lang: Option<String>,
    pub DisabledString_lang: Option<String>,
    pub Hyphenated_name_male_lang: Option<String>,
    pub Hyphenated_name_female_lang: Option<String>,
    pub CreateScreenFileDataID: i32,
    pub SelectScreenFileDataID: i32,
    pub IconFileDataID: i32,
    pub LowResScreenFileDataID: i32,
    pub Flags: i32,
    pub StartingLevel: i32,
    pub SpellTextureBlobFileDataID: i32,
    pub ArmorTypeMask: i32,
    #[serde(rename = "Field_9_0_1_34490_018")]
    pub Field_9_0_1: i32,
    pub MaleCharacterCreationVisualFallback: i32,
    pub MaleCharacterCreationIdleVisualFallback: i32,
    pub FemaleCharacterCreationVisualFallback: i32,
    pub FemaleCharacterCreationIdleVisualFallback: i32,
    pub CharacterCreationIdleGroundVisualFallback: i32,
    pub CharacterCreationGroundVisualFallback: i32,
    pub AlteredFormCharacterCreationIdleVisualFallback: i32,
    pub CharacterCreationAnimLoopWaitTimeMsFallback: i32,
    pub CinematicSequenceID: i32,
    pub DefaultSpec: i32,
    pub ID: i32,
    pub HasStrengthAttackBonus: i32,
    pub PrimaryStatPriority: i32,
    pub DisplayPower: i32,
    pub RangedAttackPowerPerAgility: i32,
    pub AttackPowerPerAgility: i32,
    pub AttackPowerPerStrength: i32,
    pub SpellClassSet: i32,
    pub ClassColorR: Option<i32>,
    pub ClassColorG: Option<i32>,
    pub ClassColorB: Option<i32>,
    pub RolesMask: i32,
    pub DamageBonusStat: i32,
    pub HasRelicSlot: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpecializationSpellsRow {
    pub Description_lang: Option<String>,
    pub ID: i32,
    pub SpecID: i32,
    pub SpellID: i32,
    pub OverridesSpellID: i32,
    pub DisplayOrder: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeRow {
    pub ID: i32,
    pub TraitTreeID: i32,
    pub PosX: i32,
    pub PosY: i32,
    pub Type: i32,
    pub Flags: i32,
    pub TraitSubTreeID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeEntryRow {
    pub ID: i32,
    pub TraitDefinitionID: i32,
    pub MaxRanks: i32,
    pub NodeEntryType: i32,
    pub TraitSubTreeID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeXTraitNodeEntryRow {
    pub ID: i32,
    pub TraitNodeID: i32,
    pub TraitNodeEntryID: i32,
    #[serde(rename = "_Index")]
    pub Index: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitDefinitionRow {
    pub OverrideName_lang: Option<String>,
    pub OverrideSubtext_lang: Option<String>,
    pub OverrideDescription_lang: Option<String>,
    pub ID: i32,
    pub SpellID: i32,
    pub OverrideIcon: i32,
    pub OverridesSpellID: i32,
    pub VisibleSpellID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitTreeLoadoutRow {
    pub ID: i32,
    pub TraitTreeID: i32,
    pub ChrSpecializationID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitTreeLoadoutEntryRow {
    pub ID: i32,
    pub TraitTreeLoadoutID: i32,
    pub SelectedTraitNodeID: i32,
    pub SelectedTraitNodeEntryID: i32,
    pub NumPoints: i32,
    pub OrderIndex: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitEdgeRow {
    pub ID: i32,
    pub VisualStyle: i32,
    pub LeftTraitNodeID: i32,
    pub RightTraitNodeID: i32,
    pub Type: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitSubTreeRow {
    pub Name_lang: Option<String>,
    pub Description_lang: Option<String>,
    pub ID: i32,
    pub UiTextureAtlasElementID: i32,
    pub TraitTreeID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitTreeXTraitCurrencyRow {
    pub ID: i32,
    #[serde(rename = "_Index")]
    pub Index: i32,
    pub TraitTreeID: i32,
    pub TraitCurrencyID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitCurrencyRow {
    pub ID: i32,
    pub Type: i32,
    pub CurrencyTypesID: i32,
    pub Flags: i32,
    pub Icon: i32,
    pub PlayerDataElementAccountID: i32,
    pub PlayerDataElementCharacterID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitCurrencySourceRow {
    pub Requirement_lang: Option<String>,
    pub ID: i32,
    pub TraitCurrencyID: i32,
    pub Amount: i32,
    pub QuestID: i32,
    pub AchievementID: i32,
    pub PlayerLevel: i32,
    pub TraitNodeEntryID: i32,
    pub OrderIndex: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitCostRow {
    pub InternalName: Option<String>,
    pub ID: i32,
    pub Amount: i32,
    pub TraitCurrencyID: i32,
    pub CurveID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeGroupRow {
    pub ID: i32,
    pub TraitTreeID: i32,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeGroupXTraitNodeRow {
    pub ID: i32,
    pub TraitNodeGroupID: i32,
    pub TraitNodeID: i32,
    #[serde(rename = "_Index")]
    pub Index: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeGroupXTraitCostRow {
    pub ID: i32,
    pub TraitNodeGroupID: i32,
    pub TraitCostID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeGroupXTraitCondRow {
    pub ID: i32,
    pub TraitCondID: i32,
    pub TraitNodeGroupID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitNodeXTraitCondRow {
    pub ID: i32,
    pub TraitCondID: i32,
    pub TraitNodeID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct TraitCondRow {
    pub ID: i32,
    pub CondType: i32,
    pub TraitTreeID: i32,
    pub GrantedRanks: i32,
    pub QuestID: i32,
    pub AchievementID: i32,
    pub SpecSetID: i32,
    pub TraitNodeGroupID: i32,
    pub TraitNodeID: i32,
    pub TraitNodeEntryID: i32,
    pub TraitCurrencyID: i32,
    pub SpentAmountRequired: i32,
    pub Flags: i32,
    pub RequiredLevel: i32,
    pub FreeSharedStringID: i32,
    pub SpendMoreSharedStringID: i32,
    pub TraitCondAccountElementID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct SpecSetMemberRow {
    pub ID: i32,
    pub ChrSpecializationID: i32,
    pub SpecSet: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ManifestInterfaceDataRow {
    pub ID: i32,
    pub FilePath: String,
    pub FileName: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct DifficultyRow {
    pub ID: i32,
    pub Name_lang: Option<String>,
    pub InstanceType: i32,
    pub OrderIndex: i32,
    pub OldEnumValue: i32,
    pub FallbackDifficultyID: i32,
    pub MinPlayers: i32,
    pub MaxPlayers: i32,
    pub Flags: i32,
    pub ItemContext: i32,
    pub ToggleDifficultyID: i32,
    pub GroupSizeHealthCurveID: i32,
    pub GroupSizeDmgCurveID: i32,
    pub GroupSizeSpellPointsCurveID: i32,
    #[serde(rename = "Field_1_15_4_56400_013")]
    pub Field: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct UiTextureAtlasElementRow {
    pub Name: String,
    pub ID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemRow {
    pub ID: i32,
    pub ClassID: i32,
    pub SubclassID: i32,
    pub Material: i32,
    pub InventoryType: i32,
    pub SheatheType: i32,
    #[serde(rename = "Sound_override_subclassID")]
    pub SoundOverrideSubclassID: i32,
    pub IconFileDataID: i32,
    pub ItemGroupSoundsID: i32,
    pub ContentTuningID: i32,
    pub ModifiedCraftingReagentItemID: i32,
    #[serde(rename = "Field_12_0_0_63534_010")]
    pub Field_12_0_0_63534_010: i32,
    pub CraftingQualityID: i32,
    #[serde(rename = "Field_11_2_7_63642_011")]
    pub Field_11_2_7_63642_011: i32,
    #[serde(rename = "Field_12_0_0_63534_013")]
    pub Field_12_0_0_63534_013: i32,
    #[serde(rename = "Field_12_0_0_63534_014")]
    pub Field_12_0_0_63534_014: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemSparseRow {
    pub ID: i32,
    pub AllowableRace: i64,
    pub Description_lang: Option<String>,
    pub Display3_lang: Option<String>,
    pub Display2_lang: Option<String>,
    pub Display1_lang: Option<String>,
    pub Display_lang: Option<String>,
    pub ExpansionID: i32,
    pub DmgVariance: f32,
    pub LimitCategory: i32,
    pub DurationInInventory: i32,
    pub QualityModifier: f32,
    pub BagFamily: i32,
    pub StartQuestID: i32,
    pub LanguageID: i32,
    pub ItemRange: f32,
    pub StatPercentageOfSocket_0: f32,
    pub StatPercentageOfSocket_1: f32,
    pub StatPercentageOfSocket_2: f32,
    pub StatPercentageOfSocket_3: f32,
    pub StatPercentageOfSocket_4: f32,
    pub StatPercentageOfSocket_5: f32,
    pub StatPercentageOfSocket_6: f32,
    pub StatPercentageOfSocket_7: f32,
    pub StatPercentageOfSocket_8: f32,
    pub StatPercentageOfSocket_9: f32,
    pub StatPercentEditor_0: i32,
    pub StatPercentEditor_1: i32,
    pub StatPercentEditor_2: i32,
    pub StatPercentEditor_3: i32,
    pub StatPercentEditor_4: i32,
    pub StatPercentEditor_5: i32,
    pub StatPercentEditor_6: i32,
    pub StatPercentEditor_7: i32,
    pub StatPercentEditor_8: i32,
    pub StatPercentEditor_9: i32,
    #[serde(rename = "StatModifier_bonusStat_0")]
    pub StatModifierBonusStat_0: i32,
    #[serde(rename = "StatModifier_bonusStat_1")]
    pub StatModifierBonusStat_1: i32,
    #[serde(rename = "StatModifier_bonusStat_2")]
    pub StatModifierBonusStat_2: i32,
    #[serde(rename = "StatModifier_bonusStat_3")]
    pub StatModifierBonusStat_3: i32,
    #[serde(rename = "StatModifier_bonusStat_4")]
    pub StatModifierBonusStat_4: i32,
    #[serde(rename = "StatModifier_bonusStat_5")]
    pub StatModifierBonusStat_5: i32,
    #[serde(rename = "StatModifier_bonusStat_6")]
    pub StatModifierBonusStat_6: i32,
    #[serde(rename = "StatModifier_bonusStat_7")]
    pub StatModifierBonusStat_7: i32,
    #[serde(rename = "StatModifier_bonusStat_8")]
    pub StatModifierBonusStat_8: i32,
    #[serde(rename = "StatModifier_bonusStat_9")]
    pub StatModifierBonusStat_9: i32,
    pub Stackable: i32,
    pub MaxCount: i32,
    pub MinReputation: i32,
    pub RequiredAbility: i32,
    pub SellPrice: i32,
    pub BuyPrice: i32,
    pub VendorStackCount: i32,
    pub PriceVariance: f32,
    pub PriceRandomValue: f32,
    pub Flags_0: i32,
    pub Flags_1: i32,
    pub Flags_2: i32,
    pub Flags_3: i32,
    pub Flags_4: i32,
    pub OppositeFactionItemID: i32,
    pub ModifiedCraftingReagentItemID: i32,
    pub ContentTuningID: i32,
    pub PlayerLevelToItemLevelCurveID: i32,
    pub ItemLevelOffsetCurveID: i32,
    pub ItemLevelOffsetItemLevel: i32,
    #[serde(rename = "Field_12_0_0_63534_034")]
    pub Field_12_0_0_63534_034: i32,
    pub ItemNameDescriptionID: i32,
    pub RequiredTransmogHoliday: i32,
    pub RequiredHoliday: i32,
    #[serde(rename = "Gem_properties")]
    pub GemProperties: i32,
    #[serde(rename = "Socket_match_enchantment_ID")]
    pub SocketMatchEnchantmentID: i32,
    pub TotemCategoryID: i32,
    pub InstanceBound: i32,
    pub ZoneBound_0: i32,
    pub ZoneBound_1: i32,
    pub ItemSet: i32,
    pub LockID: i32,
    pub PageID: i32,
    pub ItemDelay: i32,
    pub MinFactionID: i32,
    pub RequiredSkillRank: i32,
    pub RequiredSkill: i32,
    pub ItemLevel: i32,
    pub AllowableClass: i32,
    pub ArtifactID: i32,
    pub SpellWeight: i32,
    pub SpellWeightCategory: i32,
    pub SocketType_0: i32,
    pub SocketType_1: i32,
    pub SocketType_2: i32,
    pub SheatheType: i32,
    pub Material: i32,
    pub PageMaterialID: i32,
    pub Bonding: i32,
    pub DamageType: i32,
    pub ContainerSlots: i32,
    pub RequiredPVPMedal: i32,
    pub RequiredPVPRank: i32,
    pub RequiredLevel: i32,
    pub InventoryType: i32,
    pub OverallQualityID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemXItemEffectRow {
    pub ID: i32,
    pub ItemEffectID: i32,
    pub ItemID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemEffectRow {
    pub ID: i32,
    pub LegacySlotIndex: i32,
    pub TriggerType: i32,
    pub Charges: i32,
    pub CoolDownMSec: i32,
    pub CategoryCoolDownMSec: i32,
    pub SpellCategoryID: i32,
    pub SpellID: i32,
    pub ChrSpecializationID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemSetRow {
    pub ID: i32,
    pub Name_lang: Option<String>,
    pub SetFlags: i32,
    pub RequiredSkill: i32,
    pub RequiredSkillRank: i32,
    pub ItemID_0: i32,
    pub ItemID_1: i32,
    pub ItemID_2: i32,
    pub ItemID_3: i32,
    pub ItemID_4: i32,
    pub ItemID_5: i32,
    pub ItemID_6: i32,
    pub ItemID_7: i32,
    pub ItemID_8: i32,
    pub ItemID_9: i32,
    pub ItemID_10: i32,
    pub ItemID_11: i32,
    pub ItemID_12: i32,
    pub ItemID_13: i32,
    pub ItemID_14: i32,
    pub ItemID_15: i32,
    pub ItemID_16: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemSetSpellRow {
    pub ID: i32,
    pub ChrSpecID: i32,
    pub SpellID: i32,
    pub TraitSubTreeID: i32,
    pub Threshold: i32,
    pub ItemSetID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemClassRow {
    pub ID: i32,
    pub ClassName_lang: Option<String>,
    pub ClassID: i32,
    pub PriceModifier: f32,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemSubClassRow {
    pub DisplayName_lang: Option<String>,
    pub VerboseName_lang: Option<String>,
    pub ID: i32,
    pub ClassID: i32,
    pub SubClassID: i32,
    pub AuctionHouseSortOrder: i32,
    pub PrerequisiteProficiency: i32,
    pub Flags: i32,
    pub DisplayFlags: i32,
    pub WeaponSwingSize: i32,
    pub PostrequisiteProficiency: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemModifiedAppearanceRow {
    pub ID: i32,
    pub ItemID: i32,
    pub ItemAppearanceModifierID: i32,
    pub ItemAppearanceID: i32,
    pub OrderIndex: i32,
    pub TransmogSourceTypeEnum: i32,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemAppearanceRow {
    pub ID: i32,
    pub DisplayType: i32,
    pub ItemDisplayInfoID: i32,
    pub DefaultIconFileDataID: i32,
    pub UiOrder: i32,
    pub TransmogPlayerConditionID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct JournalEncounterItemRow {
    pub ID: i32,
    pub JournalEncounterID: i32,
    pub ItemID: i32,
    pub DifficultyMask: i32,
    pub FactionMask: i32,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct JournalEncounterRow {
    pub Name_lang: Option<String>,
    pub Description_lang: Option<String>,
    pub Map_0: f32,
    pub Map_1: f32,
    pub ID: i32,
    pub JournalInstanceID: i32,
    pub DungeonEncounterID: i32,
    pub OrderIndex: i32,
    pub FirstSectionID: i32,
    pub UiMapID: i32,
    pub MapDisplayConditionID: i32,
    pub Flags: i32,
    pub DifficultyMask: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct JournalInstanceRow {
    pub ID: i32,
    pub Name_lang: Option<String>,
    pub Description_lang: Option<String>,
    pub MapID: i32,
    pub BackgroundFileDataID: i32,
    pub ButtonFileDataID: i32,
    pub ButtonSmallFileDataID: i32,
    pub LoreFileDataID: i32,
    pub Flags: i32,
    pub AreaID: i32,
    pub CovenantID: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct GlobalColorRow {
    pub ID: i32,
    pub LuaConstantName: String,
    pub Color: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct GlobalStringsRow {
    pub ID: i32,
    pub BaseTag: String,
    pub TagText_lang: Option<String>,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemBonusRow {
    pub ID: i32,
    pub Value_0: i32,
    pub Value_1: i32,
    pub Value_2: i32,
    pub Value_3: i32,
    pub ParentItemBonusListID: i32,
    pub Type: i32,
    pub OrderIndex: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct CurveRow {
    pub ID: i32,
    pub Type: i32,
    pub Flags: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct CurvePointRow {
    pub Pos_0: f64,
    pub Pos_1: f64,
    pub PosPreSquish_0: f64,
    pub PosPreSquish_1: f64,
    pub ID: i32,
    pub CurveID: i32,
    pub OrderIndex: i32,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(non_snake_case)]
pub struct RandPropPointsRow {
    pub ID: i32,
    pub DamageReplaceStatF: f64,
    pub DamageSecondaryF: f64,
    pub DamageReplaceStat: i32,
    pub DamageSecondary: i32,
    pub EpicF_0: f64,
    pub EpicF_1: f64,
    pub EpicF_2: f64,
    pub EpicF_3: f64,
    pub EpicF_4: f64,
    pub SuperiorF_0: f64,
    pub SuperiorF_1: f64,
    pub SuperiorF_2: f64,
    pub SuperiorF_3: f64,
    pub SuperiorF_4: f64,
    pub GoodF_0: f64,
    pub GoodF_1: f64,
    pub GoodF_2: f64,
    pub GoodF_3: f64,
    pub GoodF_4: f64,
    pub Epic_0: i32,
    pub Epic_1: i32,
    pub Epic_2: i32,
    pub Epic_3: i32,
    pub Epic_4: i32,
    pub Superior_0: i32,
    pub Superior_1: i32,
    pub Superior_2: i32,
    pub Superior_3: i32,
    pub Superior_4: i32,
    pub Good_0: i32,
    pub Good_1: i32,
    pub Good_2: i32,
    pub Good_3: i32,
    pub Good_4: i32,
}
