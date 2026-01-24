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
        patch: "11.1.0".to_string(),
    };
    match config {
        ResolverConfig::Supabase { patch } => {
            assert_eq!(patch, "11.1.0");
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

// ============================================================================
// GameDataCache Tests
// ============================================================================

#[cfg(feature = "supabase")]
mod cache_tests {
    use crate::data::cache::GameDataCache;
    use wowlab_parsers::SpellDataFlat;
    use wowlab_supabase::SupabaseClient;

    use wiremock::matchers::{header, method, path_regex};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    fn mock_spell(id: i32, name: &str) -> SpellDataFlat {
        let mut spell = SpellDataFlat::default();
        spell.id = id;
        spell.name = name.to_string();
        spell
    }

    fn mock_spell_json(id: i32, name: &str) -> String {
        serde_json::to_string(&vec![mock_spell(id, name)]).unwrap()
    }

    fn temp_dir(suffix: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("wowlab_cache_test_{}_{}", std::process::id(), suffix))
    }

    #[test]
    fn cache_creation_empty_stats() {
        let dir = temp_dir("creation");
        let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
        let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

        let stats = cache.stats();
        assert_eq!(stats.memory.spells, 0);
        assert_eq!(stats.memory.traits, 0);
        assert_eq!(stats.memory.items, 0);
        assert_eq!(stats.memory.auras, 0);
        assert_eq!(stats.disk.spells, 0);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cache_patch_version_change_clears_disk() {
        let dir = temp_dir("patch");

        // Create cache with version 11.0.0
        {
            let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
            let _cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

            // Write mock data directly to disk
            let spell_dir = dir.join("spells");
            std::fs::create_dir_all(&spell_dir).unwrap();
            std::fs::write(
                spell_dir.join("12345.json"),
                serde_json::to_string(&mock_spell(12345, "Test")).unwrap(),
            )
            .unwrap();
        }

        // Create cache with different version - should clear
        {
            let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
            let cache = GameDataCache::with_cache_dir(client, "11.0.5", dir.clone()).unwrap();

            let stats = cache.stats();
            assert_eq!(stats.disk.spells, 0);
        }

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cache_same_patch_preserves_disk() {
        let dir = temp_dir("same_patch");

        // Create cache and write data
        {
            let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
            let _cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

            let spell_dir = dir.join("spells");
            std::fs::create_dir_all(&spell_dir).unwrap();
            std::fs::write(
                spell_dir.join("12345.json"),
                serde_json::to_string(&mock_spell(12345, "Test")).unwrap(),
            )
            .unwrap();
        }

        // Same version - data should persist
        {
            let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
            let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

            let stats = cache.stats();
            assert_eq!(stats.disk.spells, 1);
        }

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn cache_get_spell_hits_network_once() {
        let mock_server = MockServer::start().await;
        let dir = temp_dir("spell_cache");

        Mock::given(method("GET"))
            .and(path_regex(r"^/rest/v1/spells.*"))
            .and(header("Accept-Profile", "game"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string(mock_spell_json(53351, "Kill Shot"))
                    .insert_header("content-type", "application/json"),
            )
            .expect(1) // Should only hit network once
            .mount(&mock_server)
            .await;

        let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
        let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

        // First call - hits network
        let spell = cache.get_spell(53351).await.unwrap();
        assert_eq!(spell.id, 53351);
        assert_eq!(spell.name, "Kill Shot");

        // Second call - should come from memory cache
        let spell2 = cache.get_spell(53351).await.unwrap();
        assert_eq!(spell2.id, 53351);

        // Disk should be populated
        let stats = cache.stats();
        assert_eq!(stats.disk.spells, 1);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn cache_disk_persistence_across_instances() {
        let mock_server = MockServer::start().await;
        let dir = temp_dir("persist");

        Mock::given(method("GET"))
            .and(path_regex(r"^/rest/v1/spells.*"))
            .and(header("Accept-Profile", "game"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string(mock_spell_json(53351, "Kill Shot"))
                    .insert_header("content-type", "application/json"),
            )
            .expect(1) // Only one network call across both instances
            .mount(&mock_server)
            .await;

        // First instance - fetches from network
        {
            let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
            let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();
            let spell = cache.get_spell(53351).await.unwrap();
            assert_eq!(spell.name, "Kill Shot");
        }

        // Second instance - should load from disk
        {
            let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
            let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();
            let spell = cache.get_spell(53351).await.unwrap();
            assert_eq!(spell.name, "Kill Shot");
        }

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cache_invalidate_spell() {
        let dir = temp_dir("invalidate");
        let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
        let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

        // Write mock data to disk
        let spell_dir = dir.join("spells");
        std::fs::create_dir_all(&spell_dir).unwrap();
        std::fs::write(
            spell_dir.join("12345.json"),
            serde_json::to_string(&mock_spell(12345, "Test")).unwrap(),
        )
        .unwrap();

        assert_eq!(cache.stats().disk.spells, 1);

        cache.invalidate_spell(12345);

        assert_eq!(cache.stats().disk.spells, 0);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn cache_clear_all() {
        let dir = temp_dir("clear");
        let client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
        let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

        // Write data to multiple categories
        for (category, id) in [("spells", 1), ("items", 2), ("traits", 3)] {
            let cat_dir = dir.join(category);
            std::fs::create_dir_all(&cat_dir).unwrap();
            std::fs::write(cat_dir.join(format!("{}.json", id)), "{}").unwrap();
        }

        let stats = cache.stats();
        assert_eq!(stats.disk.spells, 1);
        assert_eq!(stats.disk.items, 1);
        assert_eq!(stats.disk.traits, 1);

        cache.clear_all().unwrap();

        let stats = cache.stats();
        assert_eq!(stats.disk.spells, 0);
        assert_eq!(stats.disk.items, 0);
        assert_eq!(stats.disk.traits, 0);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[tokio::test]
    async fn cache_get_spell_not_found() {
        let mock_server = MockServer::start().await;
        let dir = temp_dir("not_found");

        Mock::given(method("GET"))
            .and(path_regex(r"^/rest/v1/spells.*"))
            .respond_with(
                ResponseTemplate::new(200)
                    .set_body_string("[]")
                    .insert_header("content-type", "application/json"),
            )
            .mount(&mock_server)
            .await;

        let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
        let cache = GameDataCache::with_cache_dir(client, "11.0.0", dir.clone()).unwrap();

        let result = cache.get_spell(99999).await;
        assert!(result.is_err());

        let _ = std::fs::remove_dir_all(&dir);
    }
}

/// Integration test for SupabaseResolver.
/// Run with: cargo test -p engine --features supabase supabase_resolver_integration -- --ignored --nocapture
/// Requires SUPABASE_URL and SUPABASE_ANON_KEY env vars.
#[cfg(feature = "supabase")]
#[test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY env vars"]
fn supabase_resolver_integration() {
    use crate::data::SupabaseResolver;

    let resolver = match SupabaseResolver::from_env("test") {
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

    // Test get_trait_tree
    let tree = rt
        .block_on(resolver.get_trait_tree(253))
        .expect("Failed to load BM trait tree");
    assert_eq!(tree.spec_id, 253);
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
        "Cache stats - memory: spells={}, traits={}, items={}, auras={}",
        stats.memory.spells, stats.memory.traits, stats.memory.items, stats.memory.auras
    );

    println!("SupabaseResolver integration test PASSED");
}
