//! SpellDataFlat - Flat representation of spell data

use serde::{Deserialize, Serialize};

use super::KnowledgeSource;

/// A spell's empower stage (for empowered abilities like Evoker spells)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EmpowerStage {
    pub stage: i32,
    pub duration_ms: i32,
}

/// A spell learned from another spell
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LearnSpell {
    pub learn_spell_id: i32,
    pub overrides_spell_id: i32,
}

/// Denormalized spell effect data for description variable resolution.
/// Contains the values needed for $s1, $t1, $x1, $a1, etc.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpellEffect {
    /// Effect index (0, 1, 2...) - used for $s1, $s2, $s3 (1-indexed in descriptions)
    pub index: i32,
    /// Effect type ID
    pub effect: i32,
    /// Aura type if this is an apply aura effect
    pub aura: i32,
    /// Base points - the $s value
    pub base_points: f64,
    /// Aura tick period in ms - the $t value
    pub period: i32,
    /// Chain targets - the $x value
    pub chain_targets: i32,
    /// Triggered spell ID
    pub trigger_spell: i32,
    /// Misc value 0 (school, mechanic, etc.)
    pub misc_value_0: i32,
    /// Misc value 1
    pub misc_value_1: i32,
    /// Radius min - for $a value
    pub radius_min: f32,
    /// Radius max - for $a value
    pub radius_max: f32,
    /// Spell coefficient
    pub coefficient: f32,
    /// Damage variance
    pub variance: f32,
    /// Bonus coefficient from spell power
    pub bonus_coefficient: f64,
    /// Bonus coefficient from attack power
    pub bonus_coefficient_from_ap: f64,
    /// Amplitude
    pub amplitude: f32,
    /// PvP multiplier
    pub pvp_multiplier: f32,
}

/// Flat spell data structure matching TypeScript SpellDataFlatSchema exactly
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellDataFlat {
    // Core
    pub id: i32,
    pub name: String,
    pub description: String,
    pub aura_description: String,
    pub description_variables: String,
    pub file_name: String,
    pub is_passive: bool,
    pub knowledge_source: KnowledgeSource,

    // Timing
    pub cast_time: i32,
    pub recovery_time: i32,
    pub start_recovery_time: i32,

    // Resources
    pub mana_cost: i32,
    pub power_cost: i32,
    pub power_cost_pct: f64,
    pub power_type: i32,

    // Charges
    pub charge_recovery_time: i32,
    pub max_charges: i32,

    // Range (enemy index 0, ally index 1)
    pub range_max_0: f32,
    pub range_max_1: f32,
    pub range_min_0: f32,
    pub range_min_1: f32,

    // Geometry
    pub cone_degrees: f32,
    pub radius_max: f32,
    pub radius_min: f32,

    // Damage/Defense
    pub defense_type: i32,
    pub school_mask: i32,

    // Scaling
    pub bonus_coefficient_from_ap: f64,
    pub effect_bonus_coefficient: f64,

    // Interrupts
    pub interrupt_aura_0: i32,
    pub interrupt_aura_1: i32,
    pub interrupt_channel_0: i32,
    pub interrupt_channel_1: i32,
    pub interrupt_flags: i32,

    // Duration
    pub duration: i32,
    pub max_duration: i32,

    // Empower
    pub can_empower: bool,
    pub empower_stages: Vec<EmpowerStage>,

    // Mechanics
    pub dispel_type: i32,
    pub facing_caster_flags: i32,
    pub speed: f32,
    pub spell_class_mask_1: i32,
    pub spell_class_mask_2: i32,
    pub spell_class_mask_3: i32,
    pub spell_class_mask_4: i32,
    pub spell_class_set: i32,

    // Levels
    pub base_level: i32,
    pub max_level: i32,
    pub max_passive_aura_level: i32,
    pub spell_level: i32,

    // Aura Restrictions
    pub caster_aura_spell: i32,
    pub caster_aura_state: i32,
    pub exclude_caster_aura_spell: i32,
    pub exclude_caster_aura_state: i32,
    pub exclude_target_aura_spell: i32,
    pub exclude_target_aura_state: i32,
    pub target_aura_spell: i32,
    pub target_aura_state: i32,

    // Replacement
    pub replacement_spell_id: i32,

    // Shapeshift
    pub shapeshift_exclude_0: i32,
    pub shapeshift_exclude_1: i32,
    pub shapeshift_mask_0: i32,
    pub shapeshift_mask_1: i32,
    pub stance_bar_order: i32,

    // Totems
    pub required_totem_category_0: i32,
    pub required_totem_category_1: i32,
    pub totem_0: i32,
    pub totem_1: i32,

    // Arrays
    pub attributes: Vec<i32>,
    pub effect_trigger_spell: Vec<i32>,
    pub implicit_target: Vec<i32>,
    pub learn_spells: Vec<LearnSpell>,

    // Effects (denormalized for spell description rendering)
    pub effects: Vec<SpellEffect>,
}

impl Default for SpellDataFlat {
    fn default() -> Self {
        Self {
            id: 0,
            name: String::new(),
            description: String::new(),
            aura_description: String::new(),
            description_variables: String::new(),
            file_name: "inv_misc_questionmark".to_string(),
            is_passive: false,
            knowledge_source: KnowledgeSource::Unknown,
            cast_time: 0,
            recovery_time: 0,
            start_recovery_time: 1500,
            mana_cost: 0,
            power_cost: 0,
            power_cost_pct: 0.0,
            power_type: -1,
            charge_recovery_time: 0,
            max_charges: 0,
            range_max_0: 0.0,
            range_max_1: 0.0,
            range_min_0: 0.0,
            range_min_1: 0.0,
            cone_degrees: 0.0,
            radius_max: 0.0,
            radius_min: 0.0,
            defense_type: 0,
            school_mask: 0,
            bonus_coefficient_from_ap: 0.0,
            effect_bonus_coefficient: 0.0,
            interrupt_aura_0: 0,
            interrupt_aura_1: 0,
            interrupt_channel_0: 0,
            interrupt_channel_1: 0,
            interrupt_flags: 0,
            duration: 0,
            max_duration: 0,
            can_empower: false,
            empower_stages: Vec::new(),
            dispel_type: 0,
            facing_caster_flags: 0,
            speed: 0.0,
            spell_class_mask_1: 0,
            spell_class_mask_2: 0,
            spell_class_mask_3: 0,
            spell_class_mask_4: 0,
            spell_class_set: 0,
            base_level: 0,
            max_level: 0,
            max_passive_aura_level: 0,
            spell_level: 0,
            caster_aura_spell: 0,
            caster_aura_state: 0,
            exclude_caster_aura_spell: 0,
            exclude_caster_aura_state: 0,
            exclude_target_aura_spell: 0,
            exclude_target_aura_state: 0,
            target_aura_spell: 0,
            target_aura_state: 0,
            replacement_spell_id: 0,
            shapeshift_exclude_0: 0,
            shapeshift_exclude_1: 0,
            shapeshift_mask_0: 0,
            shapeshift_mask_1: 0,
            stance_bar_order: 0,
            required_totem_category_0: 0,
            required_totem_category_1: 0,
            totem_0: 0,
            totem_1: 0,
            attributes: Vec::new(),
            effect_trigger_spell: Vec::new(),
            implicit_target: Vec::new(),
            learn_spells: Vec::new(),
            effects: Vec::new(),
        }
    }
}
