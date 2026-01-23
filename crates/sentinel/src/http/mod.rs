mod routes;

use std::sync::Arc;

use axum::routing::get;
use axum::Router;

use crate::state::ServerState;

pub async fn run(state: Arc<ServerState>) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let app = Router::new()
        .route("/", get(routes::index::handler))
        .route("/status", get(routes::status::handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("HTTP server listening on :8080");
    axum::serve(listener, app).await?;
    Ok(())
}
