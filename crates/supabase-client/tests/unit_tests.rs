//! Unit tests for supabase-client

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::time::Duration;

use supabase_client::{
    CacheConfig, ItemSummary, RetryConfig, SpellCost, SpellTiming, SupabaseClient, SupabaseError,
    with_retry,
};
use wiremock::matchers::{header, method, path_regex};
use wiremock::{Mock, MockServer, ResponseTemplate};

// ============================================================================
// Client Tests
// ============================================================================

#[test]
fn test_new_client() {
    // Just verify construction doesn't panic
    let _client = SupabaseClient::new("https://example.supabase.co", "test_key");
}

#[test]
fn test_new_client_trailing_slash() {
    // Trailing slash should be handled gracefully
    let _client = SupabaseClient::new("https://example.supabase.co/", "test_key");
}

// ============================================================================
// Cache Tests
// ============================================================================

#[test]
fn test_cache_config_default() {
    let config = CacheConfig::default();
    assert_eq!(config.ttl, Duration::from_secs(300));
    assert_eq!(config.max_entries, 10_000);
}

// ============================================================================
// Retry Tests
// ============================================================================

#[tokio::test]
async fn test_with_retry_success_first_try() {
    let config = RetryConfig::default();
    let result = with_retry(&config, || async { Ok::<_, SupabaseError>(42) }).await;
    assert_eq!(result.unwrap(), 42);
}

#[tokio::test]
async fn test_with_retry_success_after_retries() {
    let config = RetryConfig {
        max_attempts: 3,
        initial_delay_ms: 1,
        max_delay_ms: 10,
        backoff_factor: 2.0,
    };

    let counter = Arc::new(AtomicU32::new(0));
    let counter_clone = counter.clone();

    let result = with_retry(&config, || {
        let c = counter_clone.clone();
        async move {
            let count = c.fetch_add(1, Ordering::SeqCst);
            if count < 2 {
                Err(SupabaseError::Server {
                    status: 500,
                    message: "test".to_string(),
                })
            } else {
                Ok(42)
            }
        }
    })
    .await;

    assert_eq!(result.unwrap(), 42);
    assert_eq!(counter.load(Ordering::SeqCst), 3);
}

#[tokio::test]
async fn test_with_retry_non_retryable_error() {
    let config = RetryConfig::default();
    let counter = Arc::new(AtomicU32::new(0));
    let counter_clone = counter.clone();

    let result: Result<i32, _> = with_retry(&config, || {
        let c = counter_clone.clone();
        async move {
            c.fetch_add(1, Ordering::SeqCst);
            Err(SupabaseError::NotFound {
                resource: "test".to_string(),
                key: "id".to_string(),
                value: "1".to_string(),
            })
        }
    })
    .await;

    assert!(matches!(result, Err(SupabaseError::NotFound { .. })));
    assert_eq!(counter.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn test_with_retry_max_attempts_exceeded() {
    let config = RetryConfig {
        max_attempts: 3,
        initial_delay_ms: 1,
        max_delay_ms: 10,
        backoff_factor: 2.0,
    };

    let counter = Arc::new(AtomicU32::new(0));
    let counter_clone = counter.clone();

    let result: Result<i32, _> = with_retry(&config, || {
        let c = counter_clone.clone();
        async move {
            c.fetch_add(1, Ordering::SeqCst);
            Err(SupabaseError::Server {
                status: 500,
                message: "test".to_string(),
            })
        }
    })
    .await;

    assert!(matches!(result, Err(SupabaseError::Server { .. })));
    assert_eq!(counter.load(Ordering::SeqCst), 3);
}

// ============================================================================
// Partial Types Tests
// ============================================================================

#[test]
fn test_spell_timing_columns() {
    assert!(SpellTiming::COLUMNS.contains(&"id"));
    assert!(SpellTiming::COLUMNS.contains(&"castTime"));
}

#[test]
fn test_spell_cost_columns() {
    assert!(SpellCost::COLUMNS.contains(&"powerType"));
    assert!(SpellCost::COLUMNS.contains(&"manaCost"));
}

#[test]
fn test_item_summary_columns() {
    assert!(ItemSummary::COLUMNS.contains(&"name"));
    assert!(ItemSummary::COLUMNS.contains(&"itemLevel"));
}

// ============================================================================
// Query Tests (with wiremock)
// ============================================================================

fn mock_spell_json() -> &'static str {
    r#"[{
        "id": 53351,
        "name": "Kill Shot",
        "description": "Test spell",
        "auraDescription": "",
        "descriptionVariables": "",
        "fileName": "ability_hunter_killshot",
        "isPassive": false,
        "knowledgeSource": {"source": "unknown"},
        "castTime": 0,
        "recoveryTime": 0,
        "startRecoveryTime": 1500,
        "manaCost": 0,
        "powerCost": 10,
        "powerCostPct": 0.0,
        "powerType": 2,
        "chargeRecoveryTime": 0,
        "maxCharges": 0,
        "rangeMax0": 40.0,
        "rangeMax1": 0.0,
        "rangeMin0": 0.0,
        "rangeMin1": 0.0,
        "coneDegrees": 0.0,
        "radiusMax": 0.0,
        "radiusMin": 0.0,
        "defenseType": 0,
        "schoolMask": 1,
        "bonusCoefficientFromAp": 0.0,
        "effectBonusCoefficient": 0.0,
        "interruptAura0": 0,
        "interruptAura1": 0,
        "interruptChannel0": 0,
        "interruptChannel1": 0,
        "interruptFlags": 0,
        "duration": 0,
        "maxDuration": 0,
        "canEmpower": false,
        "empowerStages": [],
        "dispelType": 0,
        "facingCasterFlags": 0,
        "speed": 0.0,
        "spellClassMask1": 0,
        "spellClassMask2": 0,
        "spellClassMask3": 0,
        "spellClassMask4": 0,
        "spellClassSet": 9,
        "baseLevel": 0,
        "maxLevel": 0,
        "maxPassiveAuraLevel": 0,
        "spellLevel": 0,
        "casterAuraSpell": 0,
        "casterAuraState": 0,
        "excludeCasterAuraSpell": 0,
        "excludeCasterAuraState": 0,
        "excludeTargetAuraSpell": 0,
        "excludeTargetAuraState": 0,
        "targetAuraSpell": 0,
        "targetAuraState": 0,
        "replacementSpellId": 0,
        "shapeshiftExclude0": 0,
        "shapeshiftExclude1": 0,
        "shapeshiftMask0": 0,
        "shapeshiftMask1": 0,
        "stanceBarOrder": 0,
        "requiredTotemCategory0": 0,
        "requiredTotemCategory1": 0,
        "totem0": 0,
        "totem1": 0,
        "attributes": [],
        "effectTriggerSpell": [],
        "implicitTarget": [],
        "learnSpells": []
    }]"#
}

#[tokio::test]
async fn test_get_spell() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"^/rest/v1/spell_data_flat.*"))
        .and(header("apikey", "test_key"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string(mock_spell_json())
                .insert_header("content-type", "application/json"),
        )
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key");
    let spell = client.get_spell(53351, None).await.unwrap();

    assert_eq!(spell.id, 53351);
    assert_eq!(spell.name, "Kill Shot");
}

#[tokio::test]
async fn test_get_spell_not_found() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"^/rest/v1/spell_data_flat.*"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string("[]")
                .insert_header("content-type", "application/json"),
        )
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key");
    let result = client.get_spell(99999, None).await;

    assert!(matches!(result, Err(SupabaseError::NotFound { .. })));
}

#[tokio::test]
async fn test_get_spells_empty() {
    let client = SupabaseClient::new("https://example.supabase.co", "test_key");
    let result = client.get_spells(&[], None).await.unwrap();
    assert!(result.is_empty());
}

#[tokio::test]
async fn test_search_spells_url_encoding() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"/rest/v1/spell_data_flat.*"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string("[]")
                .insert_header("content-type", "application/json"),
        )
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key");
    let result = client.search_spells("Death's Advance", 10).await.unwrap();
    assert!(result.is_empty());
}
