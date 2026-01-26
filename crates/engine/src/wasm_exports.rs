//! WASM exports for the engine crate.
//!
//! Provides schema definitions and metadata for the frontend editor.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::rotation::{get_var_path_schema, validate_rotation, Rotation};
use wowlab_common::types::{Attribute, DamageSchool, RatingType, ResourceType};

// Spec-related imports (require JIT for spec implementations)
#[cfg(feature = "jit")]
use crate::handler::SpecHandler;
#[cfg(feature = "jit")]
use crate::specs::hunter::bm::BmHunter;
#[cfg(feature = "jit")]
use crate::specs::hunter::mm::MmHunter;
#[cfg(feature = "jit")]
use std::sync::OnceLock;

// ============================================================================
// Spec Coverage Types (require JIT feature for spec implementations)
// ============================================================================

/// Information about an implemented spec.
#[cfg(feature = "jit")]
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SpecInfo {
    /// WoW API spec ID (e.g., 253 for BM Hunter).
    pub wow_spec_id: u32,
    /// WoW API class ID (e.g., 3 for Hunter).
    pub wow_class_id: u32,
    /// Human-readable display name.
    pub display_name: String,
    /// Number of implemented spells.
    pub spell_count: usize,
    /// Number of implemented auras.
    pub aura_count: usize,
    /// Number of implemented talents.
    pub talent_count: usize,
}

/// Detailed coverage information for a spec.
#[cfg(feature = "jit")]
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SpecCoverage {
    /// WoW API spec ID.
    pub wow_spec_id: u32,
    /// WoW API class ID.
    pub wow_class_id: u32,
    /// Human-readable display name.
    pub display_name: String,
    /// List of implemented spell IDs (WoW spell IDs).
    pub spell_ids: Vec<u32>,
    /// List of implemented aura IDs (WoW spell IDs).
    pub aura_ids: Vec<u32>,
    /// List of implemented talent names.
    pub talent_names: Vec<String>,
}

/// Spell definition for frontend display.
#[cfg(feature = "jit")]
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SpellDefInfo {
    /// WoW spell ID.
    pub id: u32,
    /// Spell name.
    pub name: String,
    /// Cooldown in seconds.
    pub cooldown: f32,
    /// Focus/resource cost.
    pub cost: f32,
    /// Number of charges (0 = no charges).
    pub charges: u8,
}

/// Aura definition for frontend display.
#[cfg(feature = "jit")]
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct AuraDefInfo {
    /// WoW spell ID.
    pub id: u32,
    /// Aura name.
    pub name: String,
    /// Duration in seconds.
    pub duration: f32,
    /// Max stacks.
    pub max_stacks: u8,
    /// Whether it's a debuff.
    pub is_debuff: bool,
}

// ============================================================================
// Handler Initialization (for coverage queries only, requires JIT)
// ============================================================================

/// Initialize BM Hunter static data for coverage queries.
#[cfg(feature = "jit")]
fn ensure_bm_hunter_initialized() {
    static INIT: OnceLock<()> = OnceLock::new();
    INIT.get_or_init(|| {
        let _ = BmHunter::init_rotation(r#"{"actions":[]}"#);
    });
}

/// Initialize MM Hunter static data for coverage queries.
#[cfg(feature = "jit")]
fn ensure_mm_hunter_initialized() {
    static INIT: OnceLock<()> = OnceLock::new();
    INIT.get_or_init(|| {
        let _ = MmHunter::init_rotation(r#"{"actions":[]}"#);
    });
}

/// Get handler by WoW spec ID for coverage queries.
#[cfg(feature = "jit")]
fn get_handler_for_coverage(wow_spec_id: u32) -> Option<Box<dyn SpecHandler>> {
    match wow_spec_id {
        253 => {
            ensure_bm_hunter_initialized();
            Some(Box::new(BmHunter::new()))
        }
        254 => {
            ensure_mm_hunter_initialized();
            Some(Box::new(MmHunter::new()))
        }
        _ => None,
    }
}

/// Get all implemented handlers for coverage queries.
#[cfg(feature = "jit")]
fn get_all_handlers() -> Vec<Box<dyn SpecHandler>> {
    ensure_bm_hunter_initialized();
    ensure_mm_hunter_initialized();
    vec![Box::new(BmHunter::new()), Box::new(MmHunter::new())]
}

/// Field definition for condition schema (used by editor).
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
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
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
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
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ResourceTypeInfo {
    pub name: String,
    pub value: u8,
    pub base_max: u32,
    pub has_passive_regen: bool,
}

/// Damage school info for UI.
#[derive(Clone, Debug, Serialize, Deserialize, tsify::Tsify)]
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

// ============================================================================
// Spec Coverage Exports (require JIT feature)
// ============================================================================

/// Get all implemented specs with their coverage counts.
#[cfg(feature = "jit")]
#[wasm_bindgen(js_name = getImplementedSpecs)]
pub fn get_implemented_specs() -> Result<JsValue, JsValue> {
    let handlers = get_all_handlers();
    let specs: Vec<SpecInfo> = handlers
        .iter()
        .map(|h| SpecInfo {
            wow_spec_id: h.wow_spec_id(),
            wow_class_id: h.wow_class_id(),
            display_name: h.display_name().to_string(),
            spell_count: h.spell_definitions().len(),
            aura_count: h.aura_definitions().len(),
            talent_count: h.talent_names().len(),
        })
        .collect();

    serde_wasm_bindgen::to_value(&specs).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get detailed coverage for a specific spec by WoW spec ID.
#[cfg(feature = "jit")]
#[wasm_bindgen(js_name = getSpecCoverage)]
pub fn get_spec_coverage(wow_spec_id: u32) -> Result<JsValue, JsValue> {
    let handler = get_handler_for_coverage(wow_spec_id)
        .ok_or_else(|| JsValue::from_str(&format!("Spec {} not implemented", wow_spec_id)))?;

    let coverage = SpecCoverage {
        wow_spec_id: handler.wow_spec_id(),
        wow_class_id: handler.wow_class_id(),
        display_name: handler.display_name().to_string(),
        spell_ids: handler.spell_definitions().iter().map(|s| s.id.0).collect(),
        aura_ids: handler.aura_definitions().iter().map(|a| a.id.0).collect(),
        talent_names: handler.talent_names(),
    };

    serde_wasm_bindgen::to_value(&coverage).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get spell definitions for a specific spec by WoW spec ID.
#[cfg(feature = "jit")]
#[wasm_bindgen(js_name = getSpellDefs)]
pub fn get_spell_defs(wow_spec_id: u32) -> Result<JsValue, JsValue> {
    let handler = get_handler_for_coverage(wow_spec_id)
        .ok_or_else(|| JsValue::from_str(&format!("Spec {} not implemented", wow_spec_id)))?;

    let spells: Vec<SpellDefInfo> = handler
        .spell_definitions()
        .iter()
        .map(|s| SpellDefInfo {
            id: s.id.0,
            name: s.name.clone(),
            cooldown: s.cooldown.as_secs_f32(),
            cost: s.costs.first().map(|c| c.amount).unwrap_or(0.0),
            charges: s.charges,
        })
        .collect();

    serde_wasm_bindgen::to_value(&spells).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get aura definitions for a specific spec by WoW spec ID.
#[cfg(feature = "jit")]
#[wasm_bindgen(js_name = getAuraDefs)]
pub fn get_aura_defs(wow_spec_id: u32) -> Result<JsValue, JsValue> {
    let handler = get_handler_for_coverage(wow_spec_id)
        .ok_or_else(|| JsValue::from_str(&format!("Spec {} not implemented", wow_spec_id)))?;

    let auras: Vec<AuraDefInfo> = handler
        .aura_definitions()
        .iter()
        .map(|a| AuraDefInfo {
            id: a.id.0,
            name: a.name.clone(),
            duration: a.duration.as_secs_f32(),
            max_stacks: a.max_stacks,
            is_debuff: a.flags.is_debuff,
        })
        .collect();

    serde_wasm_bindgen::to_value(&auras).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get talent names for a specific spec by WoW spec ID.
#[cfg(feature = "jit")]
#[wasm_bindgen(js_name = getTalentNames)]
pub fn get_talent_names(wow_spec_id: u32) -> Result<JsValue, JsValue> {
    let handler = get_handler_for_coverage(wow_spec_id)
        .ok_or_else(|| JsValue::from_str(&format!("Spec {} not implemented", wow_spec_id)))?;

    let talents = handler.talent_names();
    serde_wasm_bindgen::to_value(&talents).map_err(|e| JsValue::from_str(&e.to_string()))
}

// ============================================================================
// Rotation Exports
// ============================================================================

/// Parse a rotation from JSON.
///
/// Returns the parsed rotation or null if invalid JSON.
#[wasm_bindgen(js_name = parseRotation)]
pub fn parse_rotation_json(json: &str) -> Result<JsValue, JsValue> {
    match serde_json::from_str::<Rotation>(json) {
        Ok(rotation) => {
            serde_wasm_bindgen::to_value(&rotation).map_err(|e| JsValue::from_str(&e.to_string()))
        }
        Err(e) => Err(JsValue::from_str(&format!("Parse error: {}", e))),
    }
}

/// Validate a rotation JSON and return validation results.
///
/// Returns ValidationResult with errors and warnings.
#[wasm_bindgen(js_name = validateRotation)]
pub fn validate_rotation_json(json: &str) -> Result<JsValue, JsValue> {
    let rotation: Rotation = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

    let result = validate_rotation(&rotation);
    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get the VarPath schema for the rotation editor.
///
/// Returns a categorized list of all available VarPath variants.
#[wasm_bindgen(js_name = getVarPathSchema)]
pub fn get_var_path_schema_wasm() -> Result<JsValue, JsValue> {
    let schema = get_var_path_schema();
    serde_wasm_bindgen::to_value(&schema).map_err(|e| JsValue::from_str(&e.to_string()))
}
