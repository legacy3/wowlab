use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Extension, Json, Router};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::http::auth::VerifiedNode;
use crate::state::ServerState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct JobProgressEvent {
    r#type: &'static str,
    payload: JobProgressPayload,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct JobProgressPayload {
    status: String,
    chunks_completed: i64,
    chunks_total: i64,
    completed_at: Option<String>,
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new().route("/chunks/complete", post(complete))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CompleteRequest {
    chunk_id: uuid::Uuid,
    result: ChunkResult,
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ChunkResult {
    mean_dps: f64,
    #[allow(dead_code)]
    std_dps: f64,
    min_dps: f64,
    max_dps: f64,
    iterations: i64,
}

async fn complete(
    State(state): State<Arc<ServerState>>,
    Extension(node): Extension<VerifiedNode>,
    Json(payload): Json<CompleteRequest>,
) -> Response {
    let node_row = sqlx::query_as::<_, (uuid::Uuid,)>("SELECT id FROM nodes WHERE public_key = $1")
        .bind(&node.public_key)
        .fetch_optional(&state.db)
        .await;

    let node_id = match node_row {
        Ok(Some((id,))) => id,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "Node not found" })),
            )
                .into_response()
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to query node");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response();
        }
    };

    let result_json = json!({
        "meanDps": payload.result.mean_dps,
        "stdDps": payload.result.std_dps,
        "minDps": payload.result.min_dps,
        "maxDps": payload.result.max_dps,
        "iterations": payload.result.iterations,
    });

    let chunk_row = sqlx::query_as::<_, (uuid::Uuid, uuid::Uuid)>(
        r#"UPDATE jobs_chunks
           SET status = 'completed', result = $1, completed_at = now()
           WHERE id = $2 AND node_id = $3 AND status = 'running'
           RETURNING id, job_id"#,
    )
    .bind(&result_json)
    .bind(payload.chunk_id)
    .bind(node_id)
    .fetch_optional(&state.db)
    .await;

    let job_id = match chunk_row {
        Ok(Some((_, job_id))) => {
            metrics::gauge!(crate::telemetry::CHUNKS_RUNNING).decrement(1.0);
            job_id
        }
        Ok(None) => {
            let existing = sqlx::query_as::<_, (String, uuid::Uuid)>(
                "SELECT status, node_id FROM jobs_chunks WHERE id = $1",
            )
            .bind(payload.chunk_id)
            .fetch_optional(&state.db)
            .await;

            return match existing {
                Ok(Some((status, owner_id))) => {
                    if owner_id != node_id {
                        (
                            StatusCode::FORBIDDEN,
                            Json(json!({ "error": "Chunk not owned by this node" })),
                        )
                            .into_response()
                    } else if status == "completed" {
                        (
                            StatusCode::OK,
                            Json(json!({ "success": true, "alreadyCompleted": true, "jobComplete": false })),
                        )
                            .into_response()
                    } else {
                        (
                            StatusCode::BAD_REQUEST,
                            Json(json!({ "error": format!("Chunk in unexpected status: {}", status) })),
                        )
                            .into_response()
                    }
                }
                Ok(None) => (
                    StatusCode::NOT_FOUND,
                    Json(json!({ "error": "Chunk not found" })),
                )
                    .into_response(),
                Err(e) => {
                    tracing::error!(error = %e, "Failed to query chunk");
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!({ "error": "Database error" })),
                    )
                        .into_response()
                }
            };
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to update chunk");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response();
        }
    };

    let completed_chunks = sqlx::query_as::<_, (Value,)>(
        "SELECT result FROM jobs_chunks WHERE job_id = $1 AND status = 'completed'",
    )
    .bind(job_id)
    .fetch_all(&state.db)
    .await;

    let chunks = match completed_chunks {
        Ok(rows) => rows,
        Err(e) => {
            tracing::error!(error = %e, "Failed to query completed chunks");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
                .into_response();
        }
    };

    let total_iterations: i64 = chunks
        .iter()
        .map(|(r,)| r.get("iterations").and_then(|v| v.as_i64()).unwrap_or(0))
        .sum();

    let pending_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM jobs_chunks WHERE job_id = $1 AND status != 'completed'",
    )
    .bind(job_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or(1);

    if pending_count == 0 && !chunks.is_empty() {
        let mean_dps = if total_iterations > 0 {
            chunks
                .iter()
                .map(|(r,)| {
                    let m = r.get("meanDps").and_then(|v| v.as_f64()).unwrap_or(0.0);
                    let i = r.get("iterations").and_then(|v| v.as_i64()).unwrap_or(0) as f64;
                    m * i
                })
                .sum::<f64>()
                / total_iterations as f64
        } else {
            0.0
        };

        let min_dps = chunks
            .iter()
            .filter_map(|(r,)| r.get("minDps").and_then(|v| v.as_f64()))
            .fold(f64::INFINITY, f64::min);

        let max_dps = chunks
            .iter()
            .filter_map(|(r,)| r.get("maxDps").and_then(|v| v.as_f64()))
            .fold(f64::NEG_INFINITY, f64::max);

        let aggregated = json!({
            "meanDps": mean_dps,
            "minDps": min_dps,
            "maxDps": max_dps,
            "totalIterations": total_iterations,
            "chunksCompleted": chunks.len(),
        });

        let _ = sqlx::query(
            r#"UPDATE jobs
               SET status = 'completed', result = $1, completed_iterations = $2, completed_at = now()
               WHERE id = $3"#,
        )
        .bind(&aggregated)
        .bind(total_iterations)
        .bind(job_id)
        .execute(&state.db)
        .await;

        let event = JobProgressEvent {
            r#type: "updated",
            payload: JobProgressPayload {
                status: "completed".to_string(),
                chunks_completed: chunks.len() as i64,
                chunks_total: chunks.len() as i64,
                completed_at: Some(Utc::now().to_rfc3339()),
            },
        };

        state.publish(&format!("jobs:{job_id}"), &event).await;
        state.publish("jobs:all", &event).await;

        metrics::counter!(crate::telemetry::CHUNKS_COMPLETED).increment(1);

        return (
            StatusCode::OK,
            Json(json!({ "success": true, "jobComplete": true })),
        )
            .into_response();
    }

    let _ = sqlx::query(
        r#"UPDATE jobs
           SET status = 'running', completed_iterations = $1
           WHERE id = $2 AND status IN ('pending', 'running')"#,
    )
    .bind(total_iterations)
    .bind(job_id)
    .execute(&state.db)
    .await;

    let (chunks_completed, chunks_total): (i64, i64) = sqlx::query_as(
        "SELECT COUNT(*) FILTER (WHERE status = 'completed'), COUNT(*) FROM jobs_chunks WHERE job_id = $1",
    )
    .bind(job_id)
    .fetch_one(&state.db)
    .await
    .unwrap_or((0, 0));

    let event = JobProgressEvent {
        r#type: "updated",
        payload: JobProgressPayload {
            status: "running".to_string(),
            chunks_completed,
            chunks_total,
            completed_at: None,
        },
    };

    state.publish(&format!("jobs:{job_id}"), &event).await;

    metrics::counter!(crate::telemetry::CHUNKS_COMPLETED).increment(1);

    (
        StatusCode::OK,
        Json(json!({ "success": true, "jobComplete": false })),
    )
        .into_response()
}
