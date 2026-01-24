//! Supabase Realtime connection manager with automatic reconnect and backoff.

use crate::SupabaseError;
use std::future::Future;
use std::time::Duration;
use supabase_realtime_rs::RealtimeClientOptions;

pub use supabase_realtime_rs::RealtimeClient;

const MAX_RECONNECT_DELAY: Duration = Duration::from_secs(60);
const INITIAL_RECONNECT_DELAY: Duration = Duration::from_secs(1);
/// If a session stays alive longer than this, reset the backoff on next disconnect.
const HEALTHY_SESSION_THRESHOLD: Duration = Duration::from_secs(10);

/// Manages a Supabase Realtime WebSocket connection with automatic reconnect and
/// exponential backoff (1s initial, 60s max, jitter, reset after 10s alive).
pub struct RealtimeManager {
    ws_url: String,
    anon_key: String,
}

impl RealtimeManager {
    /// Create a new manager from a Supabase project URL and anon key.
    ///
    /// Converts the HTTPS URL to a WSS URL for the realtime endpoint.
    pub fn new(api_url: &str, anon_key: &str) -> Self {
        let ws_url = api_url
            .replace("https://", "wss://")
            .replace("http://", "ws://")
            + "/realtime/v1";

        Self {
            ws_url,
            anon_key: anon_key.to_string(),
        }
    }

    /// Run a realtime session with automatic reconnect.
    ///
    /// `session_fn` receives a connected `RealtimeClient` and should run until the
    /// connection drops (returning `Err`). When it returns, the manager waits with
    /// exponential backoff and reconnects.
    ///
    /// This function runs forever (never returns).
    pub async fn run<F, Fut>(&self, session_fn: F) -> !
    where
        F: Fn(RealtimeClient) -> Fut,
        Fut: Future<Output = Result<(), SupabaseError>>,
    {
        let mut delay = INITIAL_RECONNECT_DELAY;

        loop {
            let start = tokio::time::Instant::now();

            match self.connect_and_run(&session_fn).await {
                Ok(()) => tracing::debug!("Realtime connection closed normally"),
                Err(e) => tracing::debug!("Realtime error: {e}"),
            }

            // Reset backoff if the connection was alive long enough
            if start.elapsed() > HEALTHY_SESSION_THRESHOLD {
                delay = INITIAL_RECONNECT_DELAY;
            }

            let jitter_ms = jitter_millis();
            let jittered_delay = delay + Duration::from_millis(jitter_ms);

            tracing::debug!("Reconnecting in {jittered_delay:?}");
            tokio::time::sleep(jittered_delay).await;

            delay = (delay * 2).min(MAX_RECONNECT_DELAY);
        }
    }

    /// Run a realtime session with automatic reconnect, respecting a cancellation signal.
    ///
    /// Returns `Ok(())` when the shutdown token is cancelled.
    pub async fn run_with_shutdown<F, Fut>(
        &self,
        shutdown: tokio_util::sync::CancellationToken,
        session_fn: F,
    ) -> Result<(), SupabaseError>
    where
        F: Fn(RealtimeClient) -> Fut,
        Fut: Future<Output = Result<(), SupabaseError>>,
    {
        let mut delay = INITIAL_RECONNECT_DELAY;

        loop {
            if shutdown.is_cancelled() {
                return Ok(());
            }

            let start = tokio::time::Instant::now();

            match self.connect_and_run(&session_fn).await {
                Ok(()) => tracing::debug!("Realtime connection closed normally"),
                Err(e) => tracing::debug!("Realtime error: {e}"),
            }

            if shutdown.is_cancelled() {
                return Ok(());
            }

            if start.elapsed() > HEALTHY_SESSION_THRESHOLD {
                delay = INITIAL_RECONNECT_DELAY;
            }

            let jitter_ms = jitter_millis();
            let jittered_delay = delay + Duration::from_millis(jitter_ms);

            tracing::debug!("Reconnecting in {jittered_delay:?}");
            tokio::select! {
                _ = tokio::time::sleep(jittered_delay) => {}
                _ = shutdown.cancelled() => return Ok(()),
            }

            delay = (delay * 2).min(MAX_RECONNECT_DELAY);
        }
    }

    async fn connect_and_run<F, Fut>(&self, session_fn: &F) -> Result<(), SupabaseError>
    where
        F: Fn(RealtimeClient) -> Fut,
        Fut: Future<Output = Result<(), SupabaseError>>,
    {
        tracing::debug!("Connecting to Realtime: {}", self.ws_url);

        let client = RealtimeClient::new(
            &self.ws_url,
            RealtimeClientOptions {
                api_key: self.anon_key.clone(),
                ..RealtimeClientOptions::default()
            },
        )?;

        client.connect().await?;
        tracing::debug!("Realtime connected");

        session_fn(client).await
    }
}

fn jitter_millis() -> u64 {
    use rand::Rng;
    rand::thread_rng().gen_range(0..1000)
}
