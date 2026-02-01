use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Extension, Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::http::auth::VerifiedNode;
use crate::state::ServerState;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/nodes/register", post(register))
        .route("/nodes/token", post(refresh_token))
        .route("/nodes/unlink", post(unlink))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    claim_token: String,
    hostname: Option<String>,
    total_cores: Option<i32>,
    enabled_cores: Option<i32>,
    platform: Option<String>,
    version: Option<String>,
}

async fn register(
    State(state): State<Arc<ServerState>>,
    Extension(node): Extension<VerifiedNode>,
    Json(payload): Json<RegisterRequest>,
) -> Response {
    // Validate claim token against user_settings
    let user_id: Option<uuid::Uuid> =
        sqlx::query_scalar::<_, uuid::Uuid>("SELECT id FROM user_settings WHERE claim_token = $1")
            .bind(&payload.claim_token)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();

    let user_id = match user_id {
        Some(id) => id,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Invalid claim token" })),
            )
                .into_response();
        }
    };

    // Check if node already exists
    let existing = sqlx::query_as::<_, (uuid::Uuid,)>("SELECT id FROM nodes WHERE public_key = $1")
        .bind(&node.public_key)
        .fetch_optional(&state.db)
        .await;

    match existing {
        Ok(Some((id,))) => {
            // Update existing node's user_id if it changed
            let _ = sqlx::query("UPDATE nodes SET user_id = $1 WHERE id = $2")
                .bind(user_id)
                .bind(id)
                .execute(&state.db)
                .await;

            let beacon_token = wowlab_centrifuge::token::generate(
                &id.to_string(),
                &state.config.centrifugo_token_secret,
            )
            .ok();

            return (
                StatusCode::OK,
                Json(json!({
                    "id": id,
                    "beaconToken": beacon_token,
                })),
            )
                .into_response();
        }
        Ok(None) => {} // New node, continue to insert
        Err(e) => {
            tracing::error!(error = %e, "Failed to query node");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response();
        }
    }

    let total_cores = payload.total_cores.unwrap_or(4);
    let max_parallel = payload.enabled_cores.unwrap_or(total_cores);
    let name = payload.hostname.as_deref().unwrap_or("WowLab Node");
    let platform = payload.platform.as_deref().unwrap_or("unknown");

    let result = sqlx::query_as::<_, (uuid::Uuid,)>(
        r#"INSERT INTO nodes (public_key, user_id, name, total_cores, max_parallel, platform, version, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'online')
           RETURNING id"#,
    )
    .bind(&node.public_key)
    .bind(user_id)
    .bind(name)
    .bind(total_cores)
    .bind(max_parallel)
    .bind(platform)
    .bind(payload.version.as_deref())
    .fetch_one(&state.db)
    .await;

    match result {
        Ok((id,)) => {
            let beacon_token = wowlab_centrifuge::token::generate(
                &id.to_string(),
                &state.config.centrifugo_token_secret,
            )
            .ok();

            (
                StatusCode::OK,
                Json(json!({
                    "id": id,
                    "beaconToken": beacon_token,
                })),
            )
                .into_response()
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to insert node");
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Failed to create node" })),
            )
                .into_response()
        }
    }
}

async fn refresh_token(
    State(state): State<Arc<ServerState>>,
    Extension(node): Extension<VerifiedNode>,
) -> Response {
    // Look up node by public key
    let node_row = sqlx::query_as::<_, (uuid::Uuid,)>(
        "SELECT id FROM nodes WHERE public_key = $1 AND user_id IS NOT NULL",
    )
    .bind(&node.public_key)
    .fetch_optional(&state.db)
    .await;

    match node_row {
        Ok(Some((id,))) => {
            match wowlab_centrifuge::token::generate(
                &id.to_string(),
                &state.config.centrifugo_token_secret,
            ) {
                Ok(token) => {
                    (StatusCode::OK, Json(json!({ "beaconToken": token }))).into_response()
                }
                Err(e) => {
                    tracing::error!(error = %e, "Failed to generate beacon token");
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({ "error": "Token generation failed" })),
                    )
                        .into_response()
                }
            }
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Node not found or not claimed" })),
        )
            .into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Failed to query node");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response()
        }
    }
}

async fn unlink(
    State(state): State<Arc<ServerState>>,
    Extension(node): Extension<VerifiedNode>,
) -> Response {
    let result = sqlx::query("DELETE FROM nodes WHERE public_key = $1")
        .bind(&node.public_key)
        .execute(&state.db)
        .await;

    match result {
        Ok(r) if r.rows_affected() > 0 => {
            tracing::info!(public_key = %node.public_key, "Node unlinked");
            (StatusCode::OK, Json(json!({ "success": true }))).into_response()
        }
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Node not found" })),
        )
            .into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Failed to delete node");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response()
        }
    }
}
