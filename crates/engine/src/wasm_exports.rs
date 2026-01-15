//! WASM exports for the engine crate.
//!
//! Provides schema definitions and metadata for the frontend editor.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::types::{Attribute, DamageSchool, RatingType, ResourceType};

/// Field definition for condition schema (used by editor).
#[derive(Clone, Debug, Serialize, Deserialize)]
#[derive(tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ConditionFieldDef {
    /// Field name (e.g., "BuffActive", "TargetHealthBelow").
    pub name: String,
    /// Human-readable description.
    pub description: String,
    /// Field type for UI rendering.
    pub field_type: ConditionFieldType,
    /// Whether this field takes arguments.
    pub has_args: bool,
    /// Argument type if has_args is true.
    pub arg_type: Option<String>,
}

/// Type of condition field for UI rendering.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[derive(tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum ConditionFieldType {
    /// Simple boolean condition (e.g., PetActive).
    Boolean,
    /// Takes a spell/aura index.
    Index,
    /// Takes a numeric threshold.
    Threshold,
    /// Compound condition (And/Or/Not).
    Compound,
}

/// Resource type info for UI.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[derive(tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ResourceTypeInfo {
    pub name: String,
    pub value: u8,
    pub base_max: u32,
    pub has_passive_regen: bool,
}

/// Damage school info for UI.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[derive(tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct DamageSchoolInfo {
    pub name: String,
    pub value: u8,
    pub is_physical: bool,
}

/// Get engine version.
#[wasm_bindgen(js_name = getEngineVersion)]
pub fn get_engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get condition schema for effect conditions.
#[wasm_bindgen(js_name = getEffectConditionSchema)]
pub fn get_effect_condition_schema() -> Result<JsValue, JsValue> {
    let schema = vec![
        ConditionFieldDef {
            name: "BuffActive".into(),
            description: "Buff is active on player".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx".into()),
        },
        ConditionFieldDef {
            name: "DebuffActive".into(),
            description: "Debuff is active on target".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx".into()),
        },
        ConditionFieldDef {
            name: "TalentEnabled".into(),
            description: "Talent is enabled".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("String".into()),
        },
        ConditionFieldDef {
            name: "TargetHealthBelow".into(),
            description: "Target health below percentage".into(),
            field_type: ConditionFieldType::Threshold,
            has_args: true,
            arg_type: Some("f32".into()),
        },
        ConditionFieldDef {
            name: "PlayerHealthBelow".into(),
            description: "Player health below percentage".into(),
            field_type: ConditionFieldType::Threshold,
            has_args: true,
            arg_type: Some("f32".into()),
        },
        ConditionFieldDef {
            name: "DuringBuff".into(),
            description: "During a specific buff window".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx".into()),
        },
        ConditionFieldDef {
            name: "PetActive".into(),
            description: "Pet is currently active".into(),
            field_type: ConditionFieldType::Boolean,
            has_args: false,
            arg_type: None,
        },
        ConditionFieldDef {
            name: "HasStacks".into(),
            description: "Has at least N stacks of an aura".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx, u8".into()),
        },
        ConditionFieldDef {
            name: "CooldownReady".into(),
            description: "Cooldown is ready".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("SpellIdx".into()),
        },
        ConditionFieldDef {
            name: "And".into(),
            description: "All conditions must be true".into(),
            field_type: ConditionFieldType::Compound,
            has_args: true,
            arg_type: Some("Vec<EffectCondition>".into()),
        },
        ConditionFieldDef {
            name: "Or".into(),
            description: "At least one condition must be true".into(),
            field_type: ConditionFieldType::Compound,
            has_args: true,
            arg_type: Some("Vec<EffectCondition>".into()),
        },
        ConditionFieldDef {
            name: "Not".into(),
            description: "Condition must be false".into(),
            field_type: ConditionFieldType::Compound,
            has_args: true,
            arg_type: Some("EffectCondition".into()),
        },
    ];

    serde_wasm_bindgen::to_value(&schema).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get condition schema for damage mod conditions.
#[wasm_bindgen(js_name = getModConditionSchema)]
pub fn get_mod_condition_schema() -> Result<JsValue, JsValue> {
    let schema = vec![
        ConditionFieldDef {
            name: "Always".into(),
            description: "Always applies".into(),
            field_type: ConditionFieldType::Boolean,
            has_args: false,
            arg_type: None,
        },
        ConditionFieldDef {
            name: "ForSpell".into(),
            description: "Only for specific spell".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("SpellIdx".into()),
        },
        ConditionFieldDef {
            name: "PetAbility".into(),
            description: "Only for pet abilities".into(),
            field_type: ConditionFieldType::Boolean,
            has_args: false,
            arg_type: None,
        },
        ConditionFieldDef {
            name: "BuffActive".into(),
            description: "When buff is active".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx".into()),
        },
        ConditionFieldDef {
            name: "DebuffActive".into(),
            description: "When debuff is on target".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx".into()),
        },
        ConditionFieldDef {
            name: "TargetHealthBelow".into(),
            description: "Target health below threshold".into(),
            field_type: ConditionFieldType::Threshold,
            has_args: true,
            arg_type: Some("f32".into()),
        },
        ConditionFieldDef {
            name: "OnCrit".into(),
            description: "On critical hit only".into(),
            field_type: ConditionFieldType::Boolean,
            has_args: false,
            arg_type: None,
        },
        ConditionFieldDef {
            name: "PerStack".into(),
            description: "Per stack of an aura".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("AuraIdx, f32".into()),
        },
        ConditionFieldDef {
            name: "ExecutePhase".into(),
            description: "During execute phase (target < 20%)".into(),
            field_type: ConditionFieldType::Boolean,
            has_args: false,
            arg_type: None,
        },
        ConditionFieldDef {
            name: "StatScaling".into(),
            description: "Scales with a stat".into(),
            field_type: ConditionFieldType::Threshold,
            has_args: true,
            arg_type: Some("f32".into()),
        },
        ConditionFieldDef {
            name: "TalentEnabled".into(),
            description: "Talent is enabled".into(),
            field_type: ConditionFieldType::Index,
            has_args: true,
            arg_type: Some("String".into()),
        },
        ConditionFieldDef {
            name: "And".into(),
            description: "All conditions must be true".into(),
            field_type: ConditionFieldType::Compound,
            has_args: true,
            arg_type: Some("Vec<ModCondition>".into()),
        },
        ConditionFieldDef {
            name: "Or".into(),
            description: "At least one condition must be true".into(),
            field_type: ConditionFieldType::Compound,
            has_args: true,
            arg_type: Some("Vec<ModCondition>".into()),
        },
    ];

    serde_wasm_bindgen::to_value(&schema).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get all resource types with metadata.
#[wasm_bindgen(js_name = getResourceTypes)]
pub fn get_resource_types() -> Result<JsValue, JsValue> {
    let types = vec![
        ResourceTypeInfo {
            name: "Mana".into(),
            value: ResourceType::Mana as u8,
            base_max: ResourceType::Mana.base_max(),
            has_passive_regen: ResourceType::Mana.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Rage".into(),
            value: ResourceType::Rage as u8,
            base_max: ResourceType::Rage.base_max(),
            has_passive_regen: ResourceType::Rage.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Focus".into(),
            value: ResourceType::Focus as u8,
            base_max: ResourceType::Focus.base_max(),
            has_passive_regen: ResourceType::Focus.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Energy".into(),
            value: ResourceType::Energy as u8,
            base_max: ResourceType::Energy.base_max(),
            has_passive_regen: ResourceType::Energy.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "ComboPoints".into(),
            value: ResourceType::ComboPoints as u8,
            base_max: ResourceType::ComboPoints.base_max(),
            has_passive_regen: ResourceType::ComboPoints.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Runes".into(),
            value: ResourceType::Runes as u8,
            base_max: ResourceType::Runes.base_max(),
            has_passive_regen: ResourceType::Runes.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "RunicPower".into(),
            value: ResourceType::RunicPower as u8,
            base_max: ResourceType::RunicPower.base_max(),
            has_passive_regen: ResourceType::RunicPower.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "SoulShards".into(),
            value: ResourceType::SoulShards as u8,
            base_max: ResourceType::SoulShards.base_max(),
            has_passive_regen: ResourceType::SoulShards.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "LunarPower".into(),
            value: ResourceType::LunarPower as u8,
            base_max: ResourceType::LunarPower.base_max(),
            has_passive_regen: ResourceType::LunarPower.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "HolyPower".into(),
            value: ResourceType::HolyPower as u8,
            base_max: ResourceType::HolyPower.base_max(),
            has_passive_regen: ResourceType::HolyPower.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Maelstrom".into(),
            value: ResourceType::Maelstrom as u8,
            base_max: ResourceType::Maelstrom.base_max(),
            has_passive_regen: ResourceType::Maelstrom.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Chi".into(),
            value: ResourceType::Chi as u8,
            base_max: ResourceType::Chi.base_max(),
            has_passive_regen: ResourceType::Chi.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Insanity".into(),
            value: ResourceType::Insanity as u8,
            base_max: ResourceType::Insanity.base_max(),
            has_passive_regen: ResourceType::Insanity.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "ArcaneCharges".into(),
            value: ResourceType::ArcaneCharges as u8,
            base_max: ResourceType::ArcaneCharges.base_max(),
            has_passive_regen: ResourceType::ArcaneCharges.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Fury".into(),
            value: ResourceType::Fury as u8,
            base_max: ResourceType::Fury.base_max(),
            has_passive_regen: ResourceType::Fury.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Pain".into(),
            value: ResourceType::Pain as u8,
            base_max: ResourceType::Pain.base_max(),
            has_passive_regen: ResourceType::Pain.has_passive_regen(),
        },
        ResourceTypeInfo {
            name: "Essence".into(),
            value: ResourceType::Essence as u8,
            base_max: ResourceType::Essence.base_max(),
            has_passive_regen: ResourceType::Essence.has_passive_regen(),
        },
    ];

    serde_wasm_bindgen::to_value(&types).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get all damage schools with metadata.
#[wasm_bindgen(js_name = getDamageSchools)]
pub fn get_damage_schools() -> Result<JsValue, JsValue> {
    let schools = vec![
        DamageSchoolInfo {
            name: "Physical".into(),
            value: DamageSchool::Physical as u8,
            is_physical: true,
        },
        DamageSchoolInfo {
            name: "Holy".into(),
            value: DamageSchool::Holy as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Fire".into(),
            value: DamageSchool::Fire as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Nature".into(),
            value: DamageSchool::Nature as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Frost".into(),
            value: DamageSchool::Frost as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Shadow".into(),
            value: DamageSchool::Shadow as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Arcane".into(),
            value: DamageSchool::Arcane as u8,
            is_physical: false,
        },
        DamageSchoolInfo {
            name: "Chaos".into(),
            value: DamageSchool::Chaos as u8,
            is_physical: false,
        },
    ];

    serde_wasm_bindgen::to_value(&schools).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get all attribute types.
#[wasm_bindgen(js_name = getAttributes)]
pub fn get_attributes() -> Result<JsValue, JsValue> {
    let attrs = vec![
        ("Strength", Attribute::Strength as u8),
        ("Agility", Attribute::Agility as u8),
        ("Intellect", Attribute::Intellect as u8),
        ("Stamina", Attribute::Stamina as u8),
    ];

    serde_wasm_bindgen::to_value(&attrs).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get all rating types.
#[wasm_bindgen(js_name = getRatingTypes)]
pub fn get_rating_types() -> Result<JsValue, JsValue> {
    let ratings = vec![
        ("Crit", RatingType::Crit as u8),
        ("Haste", RatingType::Haste as u8),
        ("Mastery", RatingType::Mastery as u8),
        ("Versatility", RatingType::Versatility as u8),
        ("Leech", RatingType::Leech as u8),
        ("Avoidance", RatingType::Avoidance as u8),
        ("Speed", RatingType::Speed as u8),
    ];

    serde_wasm_bindgen::to_value(&ratings).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get all derived stat types.
#[wasm_bindgen(js_name = getDerivedStats)]
pub fn get_derived_stats() -> Result<JsValue, JsValue> {
    let stats = vec![
        ("CritChance", "Crit chance percentage"),
        ("Haste", "Haste multiplier (1.3 = 30% haste)"),
        ("VersatilityDamage", "Versatility damage bonus"),
        ("VersatilityDr", "Versatility damage reduction"),
        ("Mastery", "Mastery effect value"),
    ];

    serde_wasm_bindgen::to_value(&stats).map_err(|e| JsValue::from_str(&e.to_string()))
}
