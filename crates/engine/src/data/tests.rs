use super::*;
use crate::spec::{SpellBuilder, AuraBuilder, AuraEffect};
use crate::types::{SpellIdx, AuraIdx, ResourceType, DamageSchool};
use std::collections::HashMap;

// ============================================================================
// TuningData Tests
// ============================================================================

#[test]
fn tuning_data_empty() {
    let tuning = TuningData::empty();
    assert!(tuning.is_empty());
}

#[test]
fn tuning_data_merge_spells() {
    let mut base = TuningData::empty();
    base.spell.insert("kill_command".into(), SpellTuning {
        cooldown: Some(7.5),
        cost_focus: Some(30.0),
        ..Default::default()
    });

    let mut override_data = TuningData::empty();
    override_data.spell.insert("kill_command".into(), SpellTuning {
        cooldown: Some(6.0),
        ap_coefficient: Some(2.5),
        ..Default::default()
    });

    base.merge(override_data);

    let kc = base.spell.get("kill_command").unwrap();
    assert_eq!(kc.cooldown, Some(6.0)); // Overridden
    assert_eq!(kc.cost_focus, Some(30.0)); // Preserved
    assert_eq!(kc.ap_coefficient, Some(2.5)); // Added
}

#[test]
fn tuning_data_parse_toml() {
    let toml_str = r#"
        [spell.kill_command]
        cooldown = 7.5
        cost_focus = 30.0
        ap_coefficient = 2.0

        [aura.bestial_wrath]
        duration = 15.0
        damage_multiplier = 1.25

        [class]
        focus_regeneration = 5.0
    "#;

    let tuning: TuningData = toml::from_str(toml_str).unwrap();

    assert!(!tuning.is_empty());
    assert!(tuning.spell.contains_key("kill_command"));
    assert!(tuning.aura.contains_key("bestial_wrath"));
    assert!(tuning.class.is_some());

    let kc = tuning.spell.get("kill_command").unwrap();
    assert_eq!(kc.cooldown, Some(7.5));
    assert_eq!(kc.cost_focus, Some(30.0));
}

// ============================================================================
// Spell Override Tests
// ============================================================================

#[test]
fn spell_cooldown_override() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Kill Command")
            .cooldown(7.5)
            .cost(ResourceType::Focus, 30.0)
            .physical_damage(2.0)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("kill_command".to_string(), SpellTuning {
        cooldown: Some(6.0),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    assert_eq!(spells[0].cooldown.as_secs_f32(), 6.0);
}

#[test]
fn spell_damage_coefficients_override() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Cobra Shot")
            .spell_damage(DamageSchool::Nature, 0.4)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("cobra_shot".to_string(), SpellTuning {
        sp_coefficient: Some(0.5),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    assert_eq!(spells[0].damage.as_ref().unwrap().sp_coefficient, 0.5);
}

#[test]
fn spell_charges_override() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Barbed Shot")
            .charges(2, 12.0)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("barbed_shot".to_string(), SpellTuning {
        charges: Some(3),
        recharge_time: Some(10.0),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    assert_eq!(spells[0].charges, 3);
    assert_eq!(spells[0].charge_time.as_secs_f32(), 10.0);
}

#[test]
fn spell_resource_cost_override() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Kill Command")
            .cost(ResourceType::Focus, 30.0)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("kill_command".to_string(), SpellTuning {
        cost_focus: Some(25.0),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    let cost = spells[0].costs.iter()
        .find(|c| c.resource == ResourceType::Focus)
        .unwrap();
    assert_eq!(cost.amount, 25.0);
}

#[test]
fn spell_resource_gain_override() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Barbed Shot")
            .gain(ResourceType::Focus, 5.0)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("barbed_shot".to_string(), SpellTuning {
        focus_gain: Some(10.0),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    let gain = spells[0].gains.iter()
        .find(|g| g.resource == ResourceType::Focus)
        .unwrap();
    assert_eq!(gain.amount, 10.0);
}

#[test]
fn spell_name_normalization() {
    let mut spells = vec![
        SpellBuilder::new(SpellIdx(1), "Kill Command")
            .cooldown(7.5)
            .build(),
        SpellBuilder::new(SpellIdx(2), "Multi-Shot")
            .cooldown(0.0)
            .build(),
    ];

    let mut overrides = HashMap::new();
    overrides.insert("kill_command".to_string(), SpellTuning {
        cooldown: Some(6.0),
        ..Default::default()
    });
    overrides.insert("multi_shot".to_string(), SpellTuning {
        cooldown: Some(1.5),
        ..Default::default()
    });

    apply_spell_overrides(&mut spells, &overrides);

    assert_eq!(spells[0].cooldown.as_secs_f32(), 6.0);
    assert_eq!(spells[1].cooldown.as_secs_f32(), 1.5);
}

// ============================================================================
// Aura Override Tests
// ============================================================================

#[test]
fn aura_duration_override() {
    let mut auras = vec![
        AuraBuilder::buff(AuraIdx(1), "Bestial Wrath", 15.0)
            .damage_multiplier(1.25)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("bestial_wrath".to_string(), AuraTuning {
        duration: Some(20.0),
        ..Default::default()
    });

    apply_aura_overrides(&mut auras, &overrides);

    assert_eq!(auras[0].duration.as_secs_f32(), 20.0);
}

#[test]
fn aura_stacks_override() {
    let mut auras = vec![
        AuraBuilder::buff(AuraIdx(1), "Frenzy", 8.0)
            .stacks(3)
            .haste(0.10)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("frenzy".to_string(), AuraTuning {
        max_stacks: Some(5),
        haste_per_stack: Some(0.08),
        ..Default::default()
    });

    apply_aura_overrides(&mut auras, &overrides);

    assert_eq!(auras[0].max_stacks, 5);
}

#[test]
fn aura_damage_multiplier_override() {
    let mut auras = vec![
        AuraBuilder::buff(AuraIdx(1), "Bestial Wrath", 15.0)
            .damage_multiplier(1.25)
            .build()
    ];

    let mut overrides = HashMap::new();
    overrides.insert("bestial_wrath".to_string(), AuraTuning {
        damage_multiplier: Some(1.50),
        ..Default::default()
    });

    apply_aura_overrides(&mut auras, &overrides);

    let has_updated_mult = auras[0].effects.iter().any(|e| {
        matches!(e, AuraEffect::DamageMultiplier { amount, .. } if (*amount - 1.50).abs() < 0.001)
    });
    assert!(has_updated_mult, "Damage multiplier should be 1.50");
}
