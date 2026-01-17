//! Integration tests against real Supabase
//!
//! These tests require SUPABASE_URL and SUPABASE_ANON_KEY environment variables.
//! Run with: cargo test -p supabase-client --test integration -- --ignored

use supabase_client::{GameDataCache, RetryConfig, SpellTiming, SupabaseClient, with_retry};

fn get_client() -> Option<SupabaseClient> {
    SupabaseClient::from_env().ok()
}

// ============================================================================
// Spell Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_get_spell_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let result = client.get_spell(133, None).await;
    match result {
        Ok(spell) => {
            assert_eq!(spell.id, 133);
            println!("Spell: {} (cast time: {}ms)", spell.name, spell.cast_time);
        }
        Err(e) => println!("Spell not found or error: {}", e),
    }
}

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_get_spell_partial_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let result: Result<SpellTiming, _> = client.get_spell_partial(133, SpellTiming::COLUMNS).await;
    match result {
        Ok(timing) => {
            assert_eq!(timing.id, 133);
            println!("Timing: cast={}ms, recovery={}ms", timing.cast_time, timing.recovery_time);
        }
        Err(e) => println!("Spell not found or error: {}", e),
    }
}

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_search_spells_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let results = client.search_spells("Fire", 5).await;
    match results {
        Ok(spells) => {
            println!("Found {} spells matching 'Fire':", spells.len());
            for spell in &spells {
                println!("  {} (ID: {})", spell.name, spell.id);
            }
        }
        Err(e) => println!("Search error: {}", e),
    }
}

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_search_spells_special_chars_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let results = client.search_spells("Death's Advance", 5).await;
    match results {
        Ok(spells) => println!("Found {} spells matching \"Death's Advance\"", spells.len()),
        Err(e) => println!("Search error: {}", e),
    }
}

// ============================================================================
// GameDataCache Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_game_cache_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    let temp_dir = std::env::temp_dir().join("supabase_integration_test");
    let cache = GameDataCache::with_cache_dir(client, "11.0.0", temp_dir.clone())
        .expect("Failed to create cache");

    let start = std::time::Instant::now();
    let result1 = cache.get_spell(133).await;
    let first_duration = start.elapsed();

    match result1 {
        Ok(spell) => {
            let start = std::time::Instant::now();
            let result2 = cache.get_spell(133).await;
            let second_duration = start.elapsed();

            assert!(result2.is_ok());
            assert_eq!(result2.unwrap().id, spell.id);

            println!("First: {:?}, Second (cached): {:?}", first_duration, second_duration);
            // Cached access should be much faster
            assert!(second_duration < first_duration / 2);
        }
        Err(e) => println!("Spell not found or error: {}", e),
    }

    let stats = cache.stats();
    println!(
        "Memory: spells={}, traits={}, items={}, auras={}",
        stats.memory.spells, stats.memory.traits, stats.memory.items, stats.memory.auras
    );
    println!(
        "Disk: spells={}, traits={}, items={}, auras={}",
        stats.disk.spells, stats.disk.traits, stats.disk.items, stats.disk.auras
    );

    // Cleanup
    let _ = std::fs::remove_dir_all(&temp_dir);
}

// ============================================================================
// Retry Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_retry_logic_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    let config = RetryConfig::default();

    let result = with_retry(&config, || client.get_spell(133, None)).await;
    match result {
        Ok(spell) => println!("Got spell with retry: {}", spell.name),
        Err(e) => println!("Error with retry: {}", e),
    }
}

// ============================================================================
// Trait Tree Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_get_trait_tree_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let result = client.get_trait_tree(253).await;
    match result {
        Ok(tree) => {
            println!("Tree: {} {} - {} nodes", tree.class_name, tree.spec_name, tree.nodes.len());
        }
        Err(e) => println!("Trait tree not found or error: {}", e),
    }
}

// ============================================================================
// Item Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_get_item_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let result = client.get_item(6948, None).await;
    match result {
        Ok(item) => println!("Item: {} (ilvl: {})", item.name, item.item_level),
        Err(e) => println!("Item not found or error: {}", e),
    }
}

// ============================================================================
// Aura Tests
// ============================================================================

#[tokio::test]
#[ignore = "requires SUPABASE_URL and SUPABASE_ANON_KEY"]
async fn test_get_aura_real() {
    let client = get_client().expect("SUPABASE_URL and SUPABASE_ANON_KEY must be set");

    let result = client.get_aura(1459).await;
    match result {
        Ok(aura) => {
            println!(
                "Aura: spell_id={}, duration={}ms, max_stacks={}",
                aura.spell_id, aura.base_duration_ms, aura.max_stacks
            );
        }
        Err(e) => println!("Aura not found or error: {}", e),
    }
}
