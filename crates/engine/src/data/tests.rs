use super::*;

// ============================================================================
// DataResolver Tests
// ============================================================================

#[test]
fn local_resolver_creation() {
    use std::path::PathBuf;
    let _resolver = LocalResolver::new(PathBuf::from("/tmp/nonexistent"));
    // Should create without error - lazy loading means no IO until first access
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

    let err = ResolverError::TraitTreeNotFound(253);
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
    let spell = rt
        .block_on(resolver.get_spell(34026))
        .expect("Failed to load Kill Command");
    assert_eq!(spell.id, 34026);
    assert_eq!(spell.name, "Kill Command");
    println!("get_spell: {} ({})", spell.name, spell.id);

    // Test get_spells (batch)
    let spells = rt
        .block_on(resolver.get_spells(&[34026, 193455, 185358]))
        .expect("Failed to load spells batch");
    assert!(!spells.is_empty());
    println!("get_spells: loaded {} spells", spells.len());

    // Test get_trait_tree
    let tree = rt
        .block_on(resolver.get_trait_tree(253))
        .expect("Failed to load BM trait tree");
    assert_eq!(tree.spec_id, 253);
    assert!(!tree.nodes.is_empty());
    println!(
        "get_trait_tree: {} with {} nodes",
        tree.spec_name,
        tree.nodes.len()
    );

    // Test get_item
    let item = rt
        .block_on(resolver.get_item(207170))
        .expect("Failed to load item");
    assert_eq!(item.id, 207170);
    println!("get_item: {} ({})", item.name, item.id);

    // Test get_aura - note: not all spells have aura data
    match rt.block_on(resolver.get_aura(19574)) {
        Ok(aura) => {
            assert_eq!(aura.spell_id, 19574);
            println!("get_aura: spell_id {}", aura.spell_id);
        }
        Err(ResolverError::AuraNotFound(id)) => {
            println!(
                "get_aura: no aura data for spell {} (expected for some spells)",
                id
            );
        }
        Err(e) => panic!("Unexpected error loading aura: {}", e),
    }

    // Test search_spells
    let results = rt
        .block_on(resolver.search_spells("Kill Command", 5))
        .expect("Failed to search spells");
    assert!(!results.is_empty());
    println!(
        "search_spells: found {} results for 'Kill Command'",
        results.len()
    );

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
    let spell = rt
        .block_on(resolver.get_spell(34026))
        .expect("Failed to load Kill Command");
    assert_eq!(spell.id, 34026);
    println!("get_spell: {} ({})", spell.name, spell.id);

    // Test get_talent_tree
    let tree = rt
        .block_on(resolver.get_talent_tree(253))
        .expect("Failed to load BM talent tree");
    assert_eq!(tree.spec_id, 253);
    println!(
        "get_talent_tree: {} with {} nodes",
        tree.spec_name,
        tree.nodes.len()
    );

    // Test get_item
    let item = rt
        .block_on(resolver.get_item(207170))
        .expect("Failed to load item");
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
    let results = rt
        .block_on(resolver.search_spells("Kill Command", 5))
        .expect("Failed to search spells");
    println!("search_spells: found {} results", results.len());

    // Print cache stats
    let stats = resolver.cache_stats();
    println!(
        "Cache stats - memory: spells={}, talents={}, items={}, auras={}",
        stats.memory.spells, stats.memory.talents, stats.memory.items, stats.memory.auras
    );

    println!("SupabaseResolver integration test PASSED");
}
