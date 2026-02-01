use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

use crate::notifications::events::{
    COLOR_PR_CLOSED, COLOR_PR_MERGED, COLOR_PR_OPENED, COLOR_PR_REOPENED,
};
use crate::notifications::{Notification, NotificationEvent};
use crate::state::ServerState;
use crate::utils::markdown as md;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub id: String,
    pub message: String,
    pub author: GitAuthor,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitAuthor {
    pub name: String,
    pub username: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct GitPushPayload {
    #[serde(rename = "ref")]
    pub git_ref: String,
    pub before: String,
    pub after: String,
    pub commits: Vec<GitCommit>,
    pub repository: GitRepository,
    pub pusher: GitPusher,
    pub compare: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct GitRepository {
    pub name: String,
    pub full_name: String,
    pub html_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GitPusher {
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GitPrPayload {
    pub action: String,
    pub number: u64,
    pub pull_request: GitPullRequest,
    pub repository: GitRepository,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct GitPullRequest {
    pub title: String,
    pub html_url: String,
    pub user: GitUser,
    pub merged: Option<bool>,
    pub state: String,
    pub body: Option<String>,
    pub additions: Option<u64>,
    pub deletions: Option<u64>,
    pub changed_files: Option<u64>,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct GitUser {
    pub login: String,
    pub avatar_url: String,
}

fn verify_signature(secret: &[u8], signature: &str, body: &[u8]) -> bool {
    let Some(expected) = signature.strip_prefix("sha256=") else {
        return false;
    };

    let Ok(mut mac) = Hmac::<Sha256>::new_from_slice(secret) else {
        return false;
    };
    mac.update(body);
    let computed = hex::encode(mac.finalize().into_bytes());

    // Constant-time comparison
    computed.len() == expected.len()
        && computed
            .bytes()
            .zip(expected.bytes())
            .fold(0u8, |acc, (a, b)| acc | (a ^ b))
            == 0
}

pub async fn handle(
    State(state): State<Arc<ServerState>>,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    let Some(ref secret) = state.config.github_webhook_secret else {
        tracing::error!("SENTINEL_GITHUB_WEBHOOK_SECRET not configured");
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    // Verify signature
    let signature = headers
        .get("X-Hub-Signature-256")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if !verify_signature(secret.as_bytes(), signature, &body) {
        tracing::warn!("Invalid GitHub webhook signature");
        return StatusCode::UNAUTHORIZED.into_response();
    }

    // Determine event type
    let event_type = headers
        .get("X-GitHub-Event")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    use crate::telemetry::{record_github_webhook, GitHubEvent};

    match event_type {
        "push" => {
            record_github_webhook(GitHubEvent::Push);
            handle_push(&state, &body).await
        }
        "pull_request" => {
            record_github_webhook(GitHubEvent::PullRequest);
            handle_pr(&state, &body).await
        }
        "ping" => {
            record_github_webhook(GitHubEvent::Ping);
            tracing::info!("Received GitHub ping webhook");
            StatusCode::OK.into_response()
        }
        _ => {
            tracing::debug!(event = event_type, "Ignoring GitHub event");
            StatusCode::OK.into_response()
        }
    }
}

async fn handle_push(state: &ServerState, body: &[u8]) -> Response {
    let payload: GitPushPayload = match serde_json::from_slice(body) {
        Ok(p) => p,
        Err(e) => {
            tracing::error!(error = %e, "Failed to parse GitHub push payload");
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid payload" })),
            )
                .into_response();
        }
    };

    // Extract branch name from ref (refs/heads/main -> main)
    let branch = payload
        .git_ref
        .strip_prefix("refs/heads/")
        .unwrap_or(&payload.git_ref);

    tracing::info!(
        repo = %payload.repository.full_name,
        branch = %branch,
        commits = payload.commits.len(),
        pusher = %payload.pusher.name,
        "Received GitHub push"
    );

    // Skip if no commits (e.g., branch deletion)
    if payload.commits.is_empty() {
        return StatusCode::OK.into_response();
    }

    // Build commit summary
    let commit_summary = payload
        .commits
        .iter()
        .take(5)
        .map(|c| md::commit(&c.id, &c.message))
        .collect::<Vec<_>>()
        .join("\n");

    let description = if payload.commits.len() > 5 {
        format!(
            "{}\n... and {} more",
            commit_summary,
            payload.commits.len() - 5
        )
    } else {
        commit_summary
    };

    // Generate AI summary of the diff as thread content
    let thread_content = generate_ai_summary(state, &payload.compare).await;

    let mut notification = Notification::new(
        NotificationEvent::GitPush,
        format!(
            "[{}] {} pushed {} commit{} to {}",
            payload.repository.name,
            payload.pusher.name,
            payload.commits.len(),
            if payload.commits.len() == 1 { "" } else { "s" },
            branch
        ),
        description,
    )
    .url(&payload.compare);

    if let Some(content) = thread_content {
        let short_hash = &payload.after[..7];
        notification = notification
            .thread_content(content)
            .thread_name(format!("Summary #{}", short_hash));
    }

    if let Err(e) = state.notification_tx.send(notification) {
        tracing::error!(error = %e, "Failed to send push notification");
    }

    StatusCode::OK.into_response()
}

async fn generate_ai_summary(state: &ServerState, compare_url: &str) -> Option<String> {
    let ai_client = state.ai_client.as_ref()?;

    // Fetch the diff from GitHub (compare_url + .diff)
    let diff_url = format!("{}.diff", compare_url);
    let diff = fetch_github_diff(&diff_url).await.ok()?;

    if diff.trim().is_empty() {
        return None;
    }

    // Truncation is handled by the AI client using tiktoken
    use crate::telemetry::{record_ai_summary, AiSummaryStatus};

    match ai_client.summarize_diff(&diff).await {
        Ok(summary) => {
            record_ai_summary(AiSummaryStatus::Success);
            Some(summary)
        }
        Err(e) => {
            record_ai_summary(AiSummaryStatus::Error);
            tracing::warn!(error = %e, "Failed to generate AI diff summary");
            None
        }
    }
}

async fn fetch_github_diff(url: &str) -> Result<String, reqwest::Error> {
    reqwest::Client::new()
        .get(url)
        .header("Accept", "application/vnd.github.v3.diff")
        .header("User-Agent", "wowlab-sentinel")
        .send()
        .await?
        .error_for_status()?
        .text()
        .await
}

async fn handle_pr(state: &ServerState, body: &[u8]) -> Response {
    let payload: GitPrPayload = match serde_json::from_slice(body) {
        Ok(p) => p,
        Err(e) => {
            tracing::error!(error = %e, "Failed to parse GitHub PR payload");
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid payload" })),
            )
                .into_response();
        }
    };

    tracing::info!(
        repo = %payload.repository.full_name,
        pr = payload.number,
        action = %payload.action,
        title = %payload.pull_request.title,
        user = %payload.pull_request.user.login,
        "Received GitHub PR event"
    );

    // Only notify on relevant actions
    let (action_text, color) = match payload.action.as_str() {
        "opened" => ("opened", COLOR_PR_OPENED),
        "closed" if payload.pull_request.merged == Some(true) => ("merged", COLOR_PR_MERGED),
        "closed" => ("closed", COLOR_PR_CLOSED),
        "reopened" => ("reopened", COLOR_PR_REOPENED),
        _ => return StatusCode::OK.into_response(),
    };

    let mut description = format!(
        "{} {} this pull request",
        md::bold(&payload.pull_request.user.login),
        action_text
    );

    // Add stats if available
    if let (Some(additions), Some(deletions), Some(files)) = (
        payload.pull_request.additions,
        payload.pull_request.deletions,
        payload.pull_request.changed_files,
    ) {
        description.push_str(&format!(
            "\n{} in {} file{}",
            md::diff_stats(additions, deletions),
            files,
            if files == 1 { "" } else { "s" }
        ));
    }

    let notification = Notification::new(
        NotificationEvent::GitPr,
        format!(
            "[{}] PR #{}: {}",
            payload.repository.name, payload.number, payload.pull_request.title
        ),
        description,
    )
    .url(&payload.pull_request.html_url)
    .color(color);

    if let Err(e) = state.notification_tx.send(notification) {
        tracing::error!(error = %e, "Failed to send PR notification");
    }

    StatusCode::OK.into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verify_signature() {
        let secret = b"test-secret";
        let body = b"test body content";

        // Compute expected signature
        let mut mac = Hmac::<Sha256>::new_from_slice(secret).unwrap();
        mac.update(body);
        let expected = format!("sha256={}", hex::encode(mac.finalize().into_bytes()));

        assert!(verify_signature(secret, &expected, body));
        assert!(!verify_signature(secret, "sha256=invalid", body));
        assert!(!verify_signature(secret, "invalid-format", body));
    }
}
