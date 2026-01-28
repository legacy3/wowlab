use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use hmac::{Hmac, Mac};
use serde::Deserialize;
use sha1::Sha1;

use crate::notifications::events::{
    COLOR_DEPLOY_BUILDING, COLOR_DEPLOY_FAILED, COLOR_DEPLOY_SUCCESS,
};
use crate::notifications::{Notification, NotificationEvent};
use crate::state::ServerState;
use crate::utils::markdown as md;

/// Vercel deployment event payload.
#[derive(Debug, Clone, Deserialize)]
pub struct VercelDeploymentPayload {
    #[serde(rename = "type")]
    pub event_type: String,
    pub payload: VercelPayloadInner,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VercelPayloadInner {
    pub deployment: VercelDeployment,
    pub project: VercelProject,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct VercelDeployment {
    pub id: String,
    pub url: String,
    pub name: String,
    #[serde(rename = "readyState")]
    pub ready_state: Option<String>,
    pub meta: Option<VercelMeta>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct VercelMeta {
    #[serde(rename = "githubCommitSha")]
    pub github_commit_sha: Option<String>,
    #[serde(rename = "githubCommitMessage")]
    pub github_commit_message: Option<String>,
    #[serde(rename = "githubCommitRef")]
    pub github_commit_ref: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct VercelProject {
    pub id: String,
    pub name: String,
}

/// Verify Vercel webhook signature using HMAC-SHA1.
fn verify_signature(secret: &[u8], signature: &str, body: &[u8]) -> bool {
    let Ok(mut mac) = Hmac::<Sha1>::new_from_slice(secret) else {
        return false;
    };
    mac.update(body);
    let computed = hex::encode(mac.finalize().into_bytes());

    // Constant-time comparison
    computed.len() == signature.len()
        && computed
            .bytes()
            .zip(signature.bytes())
            .fold(0u8, |acc, (a, b)| acc | (a ^ b))
            == 0
}

/// Handle Vercel webhook requests.
pub async fn handle(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    // Get webhook secret from environment
    let secret = match std::env::var("VERCEL_WEBHOOK_SECRET") {
        Ok(s) => s,
        Err(_) => {
            tracing::error!("VERCEL_WEBHOOK_SECRET not configured");
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    // Verify signature
    let signature = headers
        .get("x-vercel-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !verify_signature(secret.as_bytes(), signature, &body) {
        tracing::warn!("Invalid Vercel webhook signature");
        return StatusCode::UNAUTHORIZED.into_response();
    }

    // Parse payload
    let payload: VercelDeploymentPayload = match serde_json::from_slice(&body) {
        Ok(p) => p,
        Err(e) => {
            tracing::error!(error = %e, "Failed to parse Vercel payload");
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid payload" })),
            )
                .into_response();
        }
    };

    let status = payload
        .payload
        .deployment
        .ready_state
        .as_deref()
        .unwrap_or("unknown");

    tracing::info!(
        project = %payload.payload.project.name,
        deployment_url = %payload.payload.deployment.url,
        status = %status,
        event_type = %payload.event_type,
        "Received Vercel deployment webhook"
    );

    // Only notify on deployment.ready or deployment.error events
    let (status_text, color) = match (payload.event_type.as_str(), status) {
        ("deployment.ready", _) | (_, "READY") => ("deployed successfully", COLOR_DEPLOY_SUCCESS),
        ("deployment.error", _) | (_, "ERROR") => ("failed to deploy", COLOR_DEPLOY_FAILED),
        ("deployment.created", _) | (_, "BUILDING") => ("started building", COLOR_DEPLOY_BUILDING),
        _ => return StatusCode::OK.into_response(),
    };

    let mut description = format!(
        "{} {}",
        md::bold(&payload.payload.project.name),
        status_text
    );

    // Add commit info if available
    if let Some(meta) = &payload.payload.deployment.meta {
        if let Some(ref branch) = meta.github_commit_ref {
            description.push_str(&format!(" from {}", md::code(branch)));
        }
        if let Some(ref msg) = meta.github_commit_message {
            let first_line = msg.lines().next().unwrap_or("");
            description.push_str(&format!("\n{}", md::quote(first_line)));
        }
    }

    let notification = Notification::new(
        NotificationEvent::Deployment,
        format!(
            "[{}] Deployment {}",
            payload.payload.project.name, status_text
        ),
        description,
    )
    .url(format!("https://{}", payload.payload.deployment.url))
    .color(color);

    if let Err(e) = state.notification_tx.send(notification) {
        tracing::error!(error = %e, "Failed to send deployment notification");
    }

    StatusCode::OK.into_response()
}
