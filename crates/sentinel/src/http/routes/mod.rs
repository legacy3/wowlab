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
pub fn router() -> Router<Arc<ServerState>> {
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

    // Compose all routes
    Router::new()
        .merge(public)
        .merge(node_api)
        .merge(webhooks::router())
}
