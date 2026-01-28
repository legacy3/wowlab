//! Unit tests for wowlab-supabase

use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;

use wowlab_supabase::{with_retry, RetryConfig, SupabaseClient, SupabaseError};

#[test]
fn test_new_client() {
    let _client = SupabaseClient::new("https://example.supabase.co", "test_key").unwrap();
}

#[test]
fn test_new_client_trailing_slash() {
    let _client = SupabaseClient::new("https://example.supabase.co/", "test_key").unwrap();
}

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

use wiremock::matchers::{header, method, path_regex};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn test_get_request() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"^/rest/v1/test_table.*"))
        .and(header("apikey", "test_key"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string("[]")
                .insert_header("content-type", "application/json"),
        )
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
    let response = client.get("test_table?id=eq.1").await.unwrap();
    let body: Vec<serde_json::Value> = response.json().await.unwrap();
    assert!(body.is_empty());
}

#[tokio::test]
async fn test_get_server_error() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"^/rest/v1/.*"))
        .respond_with(ResponseTemplate::new(500).set_body_string("Internal Server Error"))
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
    let result = client.get("test_table").await;

    assert!(matches!(
        result,
        Err(SupabaseError::Server { status: 500, .. })
    ));
}

#[tokio::test]
async fn test_get_rate_limited() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path_regex(r"^/rest/v1/.*"))
        .respond_with(ResponseTemplate::new(429).insert_header("retry-after", "2000"))
        .mount(&mock_server)
        .await;

    let client = SupabaseClient::new(&mock_server.uri(), "test_key").unwrap();
    let result = client.get("test_table").await;

    assert!(matches!(
        result,
        Err(SupabaseError::RateLimited {
            retry_after_ms: 2000
        })
    ));
}
