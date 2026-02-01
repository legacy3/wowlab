pub mod auth;
mod routes;

use std::sync::Arc;

use tokio_util::sync::CancellationToken;
use tower_http::trace::TraceLayer;

use crate::state::ServerState;

pub async fn run(
    state: Arc<ServerState>,
    shutdown: CancellationToken,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let port = state.config.http_port;
    let app = routes::router(&state)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("[::]:{}", port)).await?;
    tracing::info!("HTTP server listening on :{}", port);

    axum::serve(listener, app)
        .with_graceful_shutdown(async move { shutdown.cancelled().await })
        .await?;

    Ok(())
}
