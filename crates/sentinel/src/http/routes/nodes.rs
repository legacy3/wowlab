use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Extension, Json, Router};
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use serde::Deserialize;
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::http::auth::VerifiedNode;
use crate::state::ServerState;

/// Create router for node API endpoints.
pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/nodes/register", post(register))
        .route("/nodes/heartbeat", post(heartbeat))
        .route("/nodes/token", post(refresh_token))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
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
    // Check if node already exists
    let existing = sqlx::query_as::<_, (uuid::Uuid, String, Option<uuid::Uuid>)>(
        "SELECT id, claim_code, user_id FROM nodes WHERE public_key = $1",
    )
    .bind(&node.public_key)
    .fetch_optional(&state.db)
    .await;

    match existing {
        Ok(Some((id, claim_code, user_id))) => {
            let beacon_token =
                wowlab_centrifuge::token::generate(&id.to_string(), &state.config.centrifugo_token_secret).ok();

            return (
                StatusCode::OK,
                Json(json!({
                    "id": id,
                    "claimCode": claim_code,
                    "claimed": user_id.is_some(),
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

    // Derive claim code from public key
    let pubkey_bytes = match BASE64.decode(&node.public_key) {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "Invalid public key" })),
            )
                .into_response()
        }
    };
    let claim_code = derive_claim_code(&pubkey_bytes);

    let total_cores = payload.total_cores.unwrap_or(4);
    let max_parallel = payload.enabled_cores.unwrap_or(total_cores);
    let name = payload.hostname.as_deref().unwrap_or("WowLab Node");
    let platform = payload.platform.as_deref().unwrap_or("unknown");

    let result = sqlx::query_as::<_, (uuid::Uuid, String)>(
        r#"INSERT INTO nodes (public_key, claim_code, name, total_cores, max_parallel, platform, version, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING id, claim_code"#,
    )
    .bind(&node.public_key)
    .bind(&claim_code)
    .bind(name)
    .bind(total_cores)
    .bind(max_parallel)
    .bind(platform)
    .bind(payload.version.as_deref())
    .fetch_one(&state.db)
    .await;

    match result {
        Ok((id, code)) => {
            let beacon_token =
                wowlab_centrifuge::token::generate(&id.to_string(), &state.config.centrifugo_token_secret).ok();

            (
                StatusCode::OK,
                Json(json!({
                    "id": id,
                    "claimCode": code,
                    "claimed": false,
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

#[derive(Deserialize)]
pub struct HeartbeatRequest {
    status: Option<String>,
}

async fn heartbeat(
    State(state): State<Arc<ServerState>>,
    Extension(node): Extension<VerifiedNode>,
    Json(payload): Json<HeartbeatRequest>,
) -> Response {
    let status = payload.status.as_deref().unwrap_or("online");

    let result = sqlx::query_as::<_, (uuid::Uuid, String, i32, String)>(
        r#"UPDATE nodes
           SET status = $1, last_seen_at = now()
           WHERE public_key = $2 AND user_id IS NOT NULL
           RETURNING id, name, max_parallel, status"#,
    )
    .bind(status)
    .bind(&node.public_key)
    .fetch_optional(&state.db)
    .await;

    match result {
        Ok(Some((id, name, max_parallel, node_status))) => (
            StatusCode::OK,
            Json(json!({
                "id": id,
                "name": name,
                "maxParallel": max_parallel,
                "status": node_status,
            })),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Node not found or not claimed" })),
        )
            .into_response(),
        Err(e) => {
            tracing::error!(error = %e, "Failed to update node heartbeat");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response()
        }
    }
}

/// Derive a 6-character base32 claim code from the public key.
/// SHA-256(pubkey) → first 4 bytes → base32 → first 6 chars → uppercase.
fn derive_claim_code(pubkey_bytes: &[u8]) -> String {
    let hash = Sha256::digest(pubkey_bytes);
    let val = u32::from_be_bytes([hash[0], hash[1], hash[2], hash[3]]);

    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let mut result = String::with_capacity(6);
    for shift in [27, 22, 17, 12, 7, 2] {
        let idx = ((val >> shift) & 0x1F) as usize;
        result.push(ALPHABET[idx] as char);
    }
    result
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
            match wowlab_centrifuge::token::generate(&id.to_string(), &state.config.centrifugo_token_secret) {
                Ok(token) => (
                    StatusCode::OK,
                    Json(json!({ "beaconToken": token })),
                )
                    .into_response(),
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
