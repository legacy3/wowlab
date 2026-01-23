mod routes;

use std::sync::Arc;

use axum::routing::get;
use axum::Router;
use tokio_util::sync::CancellationToken;
use tower_http::trace::TraceLayer;

use crate::state::ServerState;

pub async fn run(state: Arc<ServerState>, shutdown: CancellationToken) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app = Router::new()
        .route("/", get(routes::index::handler))
        .route("/favicon.ico", get(routes::favicon::handler))
        .route("/status", get(routes::status::handler))
        .route("/metrics", get(routes::metrics::handler))
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("HTTP server listening on :8080");
    axum::serve(listener, app)
        .with_graceful_shutdown(async move { shutdown.cancelled().await })
        .await?;
    Ok(())
}
