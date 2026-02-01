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

use crate::http::auth::{self, verify_claim_token};
use crate::state::ServerState;

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

    // MCP server with claim token authentication
    if state.config.mcp_enabled {
        let mcp_service = crate::mcp::create_service(state.db.clone());
        let mcp_router =
            Router::new()
                .nest_service("/mcp", mcp_service)
                .layer(middleware::from_fn_with_state(
                    state.clone(),
                    verify_claim_token,
                ));
        router = router.merge(mcp_router);
        tracing::info!("MCP server enabled at /mcp (authentication required)");
    }

    router
}
