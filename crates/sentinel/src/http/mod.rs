pub mod auth;
mod routes;

use std::sync::Arc;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;
use tokio_util::sync::CancellationToken;
use tower_http::trace::TraceLayer;

use crate::state::ServerState;

pub async fn run(state: Arc<ServerState>, shutdown: CancellationToken) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Node API routes (require Ed25519 auth)
    let node_api = Router::new()
        .route("/nodes/register", post(routes::nodes::register))
        .route("/nodes/heartbeat", post(routes::nodes::heartbeat))
        .route("/chunks/complete", post(routes::chunks::complete))
        .layer(middleware::from_fn(auth::verify_node));

    let app = Router::new()
        .route("/", get(routes::index::handler))
        .route("/favicon.ico", get(routes::favicon::handler))
        .route("/status", get(routes::status::handler))
        .route("/metrics", get(routes::metrics::handler))
        .merge(node_api)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("HTTP server listening on :8080");
    axum::serve(listener, app)
        .with_graceful_shutdown(async move { shutdown.cancelled().await })
        .await?;
    Ok(())
}
