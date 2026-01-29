//! HTTP server for the sentinel service.
//!
//! Provides:
//! - Public endpoints: `/`, `/favicon.ico`, `/status`, `/metrics`
//! - Node API: `/nodes/register`, `/nodes/heartbeat`, `/chunks/complete`
//! - Webhooks: `/webhooks/github`, `/webhooks/vercel`

pub mod auth;
mod routes;

use std::sync::Arc;

use tokio_util::sync::CancellationToken;
use tower_http::trace::TraceLayer;

use crate::state::ServerState;

/// Run the HTTP server.
pub async fn run(
    state: Arc<ServerState>,
    shutdown: CancellationToken,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let port = state.config.http_port;
    let app = routes::router()
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("[::]:{}", port)).await?;
    tracing::info!("HTTP server listening on :{}", port);

    axum::serve(listener, app)
        .with_graceful_shutdown(async move { shutdown.cancelled().await })
        .await?;

    Ok(())
}
