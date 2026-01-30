//! HTTP route handlers and router composition.

mod chunks;
mod favicon;
mod index;
mod metrics;
mod nodes;
mod status;
mod webhooks;

use std::sync::Arc;

use axum::middleware;
use axum::routing::get;
use axum::Router;

use crate::http::auth;
use crate::state::ServerState;

/// Create the main application router with all routes.
pub fn router(state: &Arc<ServerState>) -> Router<Arc<ServerState>> {
    // Node API routes (require Ed25519 signature verification)
    let node_api = Router::new()
        .merge(nodes::router())
        .merge(chunks::router())
        .layer(middleware::from_fn(auth::verify_node));

    // Public routes
    let public = Router::new()
        .route("/", get(index::handler))
        .route("/favicon.ico", get(favicon::handler))
        .route("/status", get(status::handler))
        .route("/metrics", get(metrics::handler));

    // Base router
    let mut router = Router::new()
        .merge(public)
        .merge(node_api)
        .merge(webhooks::router());

    // TODO Check if passing state to router is an okay thing to do
    if state.config.mcp_enabled {
        let mcp_service = crate::mcp::create_service(state.db.clone());
        router = router.nest_service("/mcp", mcp_service);
        tracing::info!("MCP server enabled at /mcp");
    }

    router
}
