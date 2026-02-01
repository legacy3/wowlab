mod github;
mod vercel;

use std::sync::Arc;

use axum::routing::post;
use axum::Router;

use crate::state::ServerState;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/webhooks/github", post(github::handle))
        .route("/webhooks/vercel", post(vercel::handle))
}
