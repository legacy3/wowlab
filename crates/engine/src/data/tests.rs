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

// ============================================================================
// DataResolver Tests
// ============================================================================

#[test]
fn local_resolver_creation() {
    use std::path::PathBuf;
    let resolver = LocalResolver::new(PathBuf::from("/tmp/nonexistent"));
    // Should create without error - lazy loading means no IO until first access
    assert!(true);
}

#[test]
fn resolver_config_local() {
    use std::path::PathBuf;
    let config = ResolverConfig::Local {
        data_dir: PathBuf::from("/tmp/test"),
    };
    // Should construct without error
    match config {
        ResolverConfig::Local { data_dir } => {
            assert_eq!(data_dir.to_str().unwrap(), "/tmp/test");
        }
        #[cfg(feature = "supabase")]
        _ => panic!("Expected Local config"),
    }
}

#[cfg(feature = "supabase")]
#[test]
fn resolver_config_supabase() {
    let config = ResolverConfig::Supabase {
        patch: Some("11.1.0".to_string()),
    };
    match config {
        ResolverConfig::Supabase { patch } => {
            assert_eq!(patch, Some("11.1.0".to_string()));
        }
        _ => panic!("Expected Supabase config"),
    }
}

#[test]
fn resolver_error_display() {
    let err = ResolverError::SpellNotFound(12345);
    assert!(err.to_string().contains("12345"));

    let err = ResolverError::TalentTreeNotFound(253);
    assert!(err.to_string().contains("253"));

    let err = ResolverError::ItemNotFound(99999);
    assert!(err.to_string().contains("99999"));

    let err = ResolverError::AuraNotFound(54321);
    assert!(err.to_string().contains("54321"));
}

/// Integration test for LocalResolver.
/// Run with: WOWLAB_DATA_DIR=/path/to/data cargo test -p engine local_resolver_integration -- --ignored --nocapture
#[test]
#[ignore = "requires WOWLAB_DATA_DIR env var"]
fn local_resolver_integration() {
    use std::path::PathBuf;

    let data_dir = match std::env::var("WOWLAB_DATA_DIR") {
        Ok(path) => PathBuf::from(path),
        Err(_) => {
            eprintln!("Skipping: WOWLAB_DATA_DIR not set");
            return;
        }
    };

    if !data_dir.exists() {
        panic!("WOWLAB_DATA_DIR does not exist: {:?}", data_dir);
    }

    let resolver = LocalResolver::new(data_dir.clone());
    let rt = tokio::runtime::Runtime::new().unwrap();

    // Test get_spell
    let spell = rt.block_on(resolver.get_spell(34026)).expect("Failed to load Kill Command");
    assert_eq!(spell.id, 34026);
    assert_eq!(spell.name, "Kill Command");
    println!("get_spell: {} ({})", spell.name, spell.id);

    // Test get_spells (batch)
    let spells = rt.block_on(resolver.get_spells(&[34026, 193455, 185358]))
        .expect("Failed to load spells batch");
    assert!(!spells.is_empty());
    println!("get_spells: loaded {} spells", spells.len());

    // Test get_talent_tree
    let tree = rt.block_on(resolver.get_talent_tree(253)).expect("Failed to load BM talent tree");
    assert_eq!(tree.spec_id, 253);
    assert!(!tree.nodes.is_empty());
    println!("get_talent_tree: {} with {} nodes", tree.spec_name, tree.nodes.len());

    // Test get_item
    let item = rt.block_on(resolver.get_item(207170)).expect("Failed to load item");
    assert_eq!(item.id, 207170);
    println!("get_item: {} ({})", item.name, item.id);

    // Test get_aura - note: not all spells have aura data
    match rt.block_on(resolver.get_aura(19574)) {
        Ok(aura) => {
            assert_eq!(aura.spell_id, 19574);
            println!("get_aura: spell_id {}", aura.spell_id);
        }
        Err(ResolverError::AuraNotFound(id)) => {
            println!("get_aura: no aura data for spell {} (expected for some spells)", id);
        }
        Err(e) => panic!("Unexpected error loading aura: {}", e),
    }

    // Test search_spells
    let results = rt.block_on(resolver.search_spells("Kill Command", 5))
        .expect("Failed to search spells");
    assert!(!results.is_empty());
    println!("search_spells: found {} results for 'Kill Command'", results.len());

    println!("LocalResolver integration test PASSED");
}

/// Integration test for SupabaseResolver.
/// Run with: cargo test -p engine --features supabase supabase_resolver_integration -- --ignored --nocapture
/// Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.
#[cfg(feature = "supabase")]
#[test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY env vars"]
fn supabase_resolver_integration() {
    use crate::data::SupabaseResolver;

    let resolver = match SupabaseResolver::from_env(Some("test")) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Skipping: {}", e);
            return;
        }
    };

    let rt = tokio::runtime::Runtime::new().unwrap();

    // Test get_spell
    let spell = rt.block_on(resolver.get_spell(34026)).expect("Failed to load Kill Command");
    assert_eq!(spell.id, 34026);
    println!("get_spell: {} ({})", spell.name, spell.id);

    // Test get_talent_tree
    let tree = rt.block_on(resolver.get_talent_tree(253)).expect("Failed to load BM talent tree");
    assert_eq!(tree.spec_id, 253);
    println!("get_talent_tree: {} with {} nodes", tree.spec_name, tree.nodes.len());

    // Test get_item
    let item = rt.block_on(resolver.get_item(207170)).expect("Failed to load item");
    assert_eq!(item.id, 207170);
    println!("get_item: {} ({})", item.name, item.id);

    // Test get_aura - note: not all spells have aura data
    match rt.block_on(resolver.get_aura(19574)) {
        Ok(aura) => {
            assert_eq!(aura.spell_id, 19574);
            println!("get_aura: spell_id {}", aura.spell_id);
        }
        Err(e) => {
            println!("get_aura: no aura data for spell 19574 ({})", e);
        }
    }

    // Test search_spells
    let results = rt.block_on(resolver.search_spells("Kill Command", 5))
        .expect("Failed to search spells");
    println!("search_spells: found {} results", results.len());

    // Print cache stats
    let stats = resolver.cache_stats();
    println!("Cache stats - memory: spells={}, talents={}, items={}, auras={}",
        stats.memory.spells, stats.memory.talents, stats.memory.items, stats.memory.auras);

    println!("SupabaseResolver integration test PASSED");
}
