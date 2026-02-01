use std::sync::Arc;

use axum::body::Body;
use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::Json;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};

use crate::state::ServerState;

#[derive(Clone, Debug)]
pub struct VerifiedNode {
    pub public_key: String,
}

#[derive(Clone, Debug)]
pub struct AuthenticatedUser {
    pub user_id: uuid::Uuid,
}

pub async fn verify_claim_token(
    State(state): State<Arc<ServerState>>,
    mut request: axum::http::Request<axum::body::Body>,
    next: axum::middleware::Next,
) -> axum::response::Response {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "));

    let Some(token) = token else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({
                "error": "Missing Authorization header"
            })),
        )
            .into_response();
    };

    let user_id: Option<uuid::Uuid> =
        sqlx::query_scalar("SELECT id FROM user_settings WHERE claim_token = $1")
            .bind(token)
            .fetch_optional(&state.db)
            .await
            .ok()
            .flatten();

    let Some(user_id) = user_id else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({
                "error": "Invalid claim token"
            })),
        )
            .into_response();
    };

    request
        .extensions_mut()
        .insert(AuthenticatedUser { user_id });
    next.run(request).await
}

const MAX_CLOCK_SKEW: u64 = 300; // 5 minutes
const MAX_BODY_SIZE: usize = 1024 * 1024; // 1 MB

/// Headers: X-Node-Key, X-Node-Sig (base64), X-Node-Ts (unix seconds).
/// Message: "{timestamp}\0{method}\0{host}\0{path}\0{body_sha256}"
pub async fn verify_node(request: Request, next: Next) -> Response {
    let (parts, body) = request.into_parts();

    let pubkey_b64 = match parts.headers.get("X-Node-Key") {
        Some(v) => v.to_str().unwrap_or("").to_string(),
        None => return auth_error("Missing X-Node-Key"),
    };
    let sig_b64 = match parts.headers.get("X-Node-Sig") {
        Some(v) => v.to_str().unwrap_or("").to_string(),
        None => return auth_error("Missing X-Node-Sig"),
    };
    let ts_str = match parts.headers.get("X-Node-Ts") {
        Some(v) => v.to_str().unwrap_or("").to_string(),
        None => return auth_error("Missing X-Node-Ts"),
    };
    let host = parts
        .headers
        .get("Host")
        .and_then(|v| v.to_str().ok())
        .map(|h| h.split(':').next().unwrap_or(h)) // Strip port if present
        .unwrap_or("");

    // Validate timestamp freshness
    let timestamp: u64 = match ts_str.parse() {
        Ok(t) => t,
        Err(_) => return auth_error("Invalid timestamp"),
    };
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    if now.abs_diff(timestamp) > MAX_CLOCK_SKEW {
        return auth_error("Timestamp expired");
    }

    // Decode key and signature
    let pubkey_bytes: [u8; 32] = match BASE64.decode(&pubkey_b64) {
        Ok(b) => match b.try_into() {
            Ok(arr) => arr,
            Err(_) => return auth_error("Invalid key length"),
        },
        Err(_) => return auth_error("Invalid key encoding"),
    };
    let sig_bytes: [u8; 64] = match BASE64.decode(&sig_b64) {
        Ok(b) => match b.try_into() {
            Ok(arr) => arr,
            Err(_) => return auth_error("Invalid signature length"),
        },
        Err(_) => return auth_error("Invalid signature encoding"),
    };

    // Read body bytes
    let body_bytes = match axum::body::to_bytes(body, MAX_BODY_SIZE).await {
        Ok(b) => b,
        Err(_) => return auth_error("Body too large"),
    };

    // Build canonical message using shared function
    let message = wowlab_common::build_sign_message(
        timestamp,
        parts.method.as_str(),
        host,
        parts.uri.path(),
        &body_bytes,
    );

    // Verify Ed25519 signature
    let verifying_key = match VerifyingKey::from_bytes(&pubkey_bytes) {
        Ok(k) => k,
        Err(_) => return auth_error("Invalid public key"),
    };
    let signature = Signature::from_bytes(&sig_bytes);

    if verifying_key
        .verify(message.as_bytes(), &signature)
        .is_err()
    {
        return auth_error("Invalid signature");
    }

    // Rebuild request with body restored and verified node in extensions
    let mut request = Request::from_parts(parts, Body::from(body_bytes));
    request.extensions_mut().insert(VerifiedNode {
        public_key: pubkey_b64,
    });

    next.run(request).await
}

fn auth_error(msg: &str) -> Response {
    (
        StatusCode::UNAUTHORIZED,
        axum::Json(serde_json::json!({ "error": msg })),
    )
        .into_response()
}
