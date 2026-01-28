use std::collections::HashMap;

use poise::serenity_prelude::GuildId;
use sqlx::PgPool;
use uuid::Uuid;

use super::PendingChunk;
use crate::state::ServerState;

/// Assign pending chunks to eligible online nodes using backlog-aware distribution.
pub async fn assign_pending_chunks(
    state: &ServerState,
    pending: &[PendingChunk],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if pending.is_empty() {
        return Ok(());
    }

    let job_ids: Vec<Uuid> = pending.iter().map(|c| c.job_id).collect();

    // 1. Get job metadata for the pending chunks
    let jobs = fetch_jobs(&state.db, &job_ids).await?;

    // 2. Get online nodes with their Discord IDs (from auth.identities)
    let mut nodes = fetch_online_nodes(&state.db).await?;
    metrics::gauge!(crate::telemetry::NODES_ONLINE).set(nodes.len() as f64);
    if nodes.is_empty() {
        tracing::debug!("No online nodes available");
        return Ok(());
    }

    // 3. Get permissions per node
    let node_ids: Vec<Uuid> = nodes.iter().map(|n| n.id).collect();
    let permissions = fetch_permissions(&state.db, &node_ids).await?;

    // 4. Get current backlog per node
    let backlogs = fetch_backlogs(&state.db).await?;
    for node in &mut nodes {
        node.backlog = *backlogs.get(&node.id).unwrap_or(&0);
    }

    // 5. Assign each chunk to the node with the most available capacity
    let mut assignments: Vec<Assignment> = Vec::new();

    for chunk in pending {
        let job = match jobs.get(&chunk.job_id) {
            Some(j) => j,
            None => continue,
        };

        let target = nodes
            .iter_mut()
            .filter(|n| is_eligible(n, job, &permissions, &state.filters))
            .filter(|n| n.backlog < n.capacity)
            .max_by_key(|n| n.capacity - n.backlog);

        if let Some(node) = target {
            assignments.push(Assignment {
                chunk_id: chunk.id,
                node_id: node.id,
            });
            node.backlog += 1;
        }
    }

    if assignments.is_empty() {
        tracing::debug!("No eligible nodes for pending chunks");
        return Ok(());
    }

    // 6. Batch update chunks with assignments
    batch_assign(&state.db, &assignments).await?;
    metrics::counter!(crate::telemetry::CHUNKS_ASSIGNED).increment(assignments.len() as u64);
    tracing::debug!(count = assignments.len(), "Assigned chunks to nodes");

    Ok(())
}

/// Check if a node is eligible to run a chunk based on the job's access settings.
pub fn is_eligible(
    node: &OnlineNode,
    job: &JobInfo,
    permissions: &[NodePermission],
    filters: &crate::utils::filter_refresh::FilterMap,
) -> bool {
    // Owner can always run their own jobs
    if node.user_id == job.user_id {
        return true;
    }

    match job.access_type.as_deref() {
        Some("public") => true,
        Some("user") => permissions.iter().any(|p| {
            p.node_id == node.id
                && p.access_type == "user"
                && p.target_id.as_deref() == Some(&job.user_id.to_string())
        }),
        Some("discord") => {
            let node_discord_id = match &node.discord_id {
                Some(id) => id,
                None => return false,
            };
            let target_guild = match &job.discord_server_id {
                Some(id) => id,
                None => return false,
            };

            let map = match filters.try_read() {
                Ok(m) => m,
                Err(_) => return false,
            };

            let guild_id: GuildId = target_guild.parse::<u64>().unwrap_or_default().into();
            match map.get(&guild_id) {
                Some(gf) => gf.filter.might_contain(node_discord_id),
                None => false,
            }
        }
        // No access_type = owner only
        _ => false,
    }
}

async fn fetch_jobs(db: &PgPool, job_ids: &[Uuid]) -> Result<HashMap<Uuid, JobInfo>, sqlx::Error> {
    let rows = sqlx::query_as::<_, JobInfo>(
        "SELECT id, user_id, access_type, discord_server_id
         FROM public.jobs
         WHERE id = ANY($1)",
    )
    .bind(job_ids)
    .fetch_all(db)
    .await?;

    Ok(rows.into_iter().map(|j| (j.id, j)).collect())
}

async fn fetch_online_nodes(db: &PgPool) -> Result<Vec<OnlineNode>, sqlx::Error> {
    let rows = sqlx::query_as::<_, OnlineNodeRow>(
        "SELECT n.id, n.user_id, n.total_cores, n.max_parallel,
                i.provider_id as discord_id
         FROM public.nodes n
         LEFT JOIN auth.identities i
           ON i.user_id = n.user_id AND i.provider = 'discord'
         WHERE n.status = 'online'",
    )
    .fetch_all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| OnlineNode {
            id: r.id,
            user_id: r.user_id,
            discord_id: r.discord_id,
            capacity: (r.max_parallel as usize).min(r.total_cores as usize),
            backlog: 0,
        })
        .collect())
}

async fn fetch_permissions(
    db: &PgPool,
    node_ids: &[Uuid],
) -> Result<Vec<NodePermission>, sqlx::Error> {
    sqlx::query_as::<_, NodePermission>(
        "SELECT node_id, access_type, target_id FROM public.nodes_permissions
         WHERE node_id = ANY($1)",
    )
    .bind(node_ids)
    .fetch_all(db)
    .await
}

async fn fetch_backlogs(db: &PgPool) -> Result<HashMap<Uuid, usize>, sqlx::Error> {
    let rows = sqlx::query_as::<_, BacklogRow>(
        "SELECT node_id, COUNT(*)::int as count
         FROM public.jobs_chunks
         WHERE status = 'running' AND node_id IS NOT NULL
         GROUP BY node_id",
    )
    .fetch_all(db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| (r.node_id, r.count as usize))
        .collect())
}

async fn batch_assign(db: &PgPool, assignments: &[Assignment]) -> Result<(), sqlx::Error> {
    let chunk_ids: Vec<Uuid> = assignments.iter().map(|a| a.chunk_id).collect();
    let node_ids: Vec<Uuid> = assignments.iter().map(|a| a.node_id).collect();

    sqlx::query(
        "UPDATE public.jobs_chunks
         SET node_id = data.node_id, status = 'running', claimed_at = now()
         FROM (SELECT unnest($1::uuid[]) as chunk_id, unnest($2::uuid[]) as node_id) data
         WHERE jobs_chunks.id = data.chunk_id",
    )
    .bind(&chunk_ids)
    .bind(&node_ids)
    .execute(db)
    .await?;

    Ok(())
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct JobInfo {
    pub id: Uuid,
    pub user_id: Uuid,
    pub access_type: Option<String>,
    pub discord_server_id: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct OnlineNodeRow {
    id: Uuid,
    user_id: Uuid,
    total_cores: i32,
    max_parallel: i32,
    discord_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct OnlineNode {
    pub id: Uuid,
    pub user_id: Uuid,
    pub discord_id: Option<String>,
    pub capacity: usize,
    pub backlog: usize,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct NodePermission {
    pub node_id: Uuid,
    pub access_type: String,
    pub target_id: Option<String>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
struct BacklogRow {
    node_id: Uuid,
    count: i32,
}

struct Assignment {
    chunk_id: Uuid,
    node_id: Uuid,
}
