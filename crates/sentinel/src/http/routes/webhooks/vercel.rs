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

#[derive(Debug, Clone, Deserialize)]
pub struct VercelDeploymentPayload {
    #[serde(rename = "type")]
    pub event_type: String,
    pub payload: VercelPayloadInner,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct VercelPayloadInner {
    pub deployment: VercelDeployment,
    pub project: VercelProject,
    pub target: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct VercelDeployment {
    pub id: String,
    pub url: String,
    /// The project name used in the deployment URL
    pub name: String,
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
}

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

pub async fn handle(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    let Some(ref secret) = state.config.vercel_webhook_secret else {
        tracing::error!("SENTINEL_VERCEL_WEBHOOK_SECRET not configured");
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
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

    use crate::telemetry::{record_vercel_webhook, VercelEvent};

    let project_name = &payload.payload.deployment.name;

    tracing::info!(
        project = %project_name,
        deployment_url = %payload.payload.deployment.url,
        event_type = %payload.event_type,
        "Received Vercel deployment webhook"
    );

    // Only notify on known deployment events
    let (event, status_text, color) = match payload.event_type.as_str() {
        "deployment.ready" => (
            VercelEvent::DeploymentReady,
            "deployed successfully",
            COLOR_DEPLOY_SUCCESS,
        ),
        "deployment.succeeded" => (
            VercelEvent::DeploymentSucceeded,
            "deployed successfully",
            COLOR_DEPLOY_SUCCESS,
        ),
        "deployment.error" => (
            VercelEvent::DeploymentError,
            "failed to deploy",
            COLOR_DEPLOY_FAILED,
        ),
        "deployment.created" => (
            VercelEvent::DeploymentCreated,
            "started building",
            COLOR_DEPLOY_BUILDING,
        ),
        _ => return StatusCode::OK.into_response(),
    };

    record_vercel_webhook(event);

    let mut description = format!("{} {}", md::bold(project_name), status_text);

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
        format!("[{}] Deployment {}", project_name, status_text),
        description,
    )
    .url(format!("https://{}", payload.payload.deployment.url))
    .color(color);

    if let Err(e) = state.notification_tx.send(notification) {
        tracing::error!(error = %e, "Failed to send deployment notification");
    }

    StatusCode::OK.into_response()
}
