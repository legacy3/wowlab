use std::collections::HashMap;

use poise::serenity_prelude::GuildId;
use serde::Deserialize;

use super::PendingChunk;
use crate::state::ServerState;

/// Assign pending chunks to eligible online nodes using backlog-aware distribution.
pub async fn assign_pending_chunks(
    state: &ServerState,
    pending: &[PendingChunk],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // 1. Get job owners for the pending chunks
    let job_ids: Vec<&str> = pending.iter().map(|c| c.job_id.as_str()).collect();
    let jobs = fetch_job_owners(state, &job_ids).await?;

    // 2. Get online nodes (last_seen_at within 30s)
    let mut nodes = fetch_online_nodes(state).await?;
    if nodes.is_empty() {
        tracing::debug!("No online nodes available");
        return Ok(());
    }

    // 3. Get permissions per node
    let permissions = fetch_permissions(state).await?;

    // 4. Get current backlog per node
    let backlogs = fetch_backlogs(state).await?;
    for node in &mut nodes {
        node.backlog = *backlogs.get(&node.id).unwrap_or(&0);
    }

    // 5. Assign each chunk to the least-loaded eligible node
    let mut assignments: Vec<Assignment> = Vec::new();

    for chunk in pending {
        let job = match jobs.get(&chunk.job_id) {
            Some(j) => j,
            None => continue,
        };

        // Find eligible nodes sorted by backlog
        let target = nodes
            .iter_mut()
            .filter(|n| is_eligible(n, job, &permissions, &state.filters))
            .min_by_key(|n| n.backlog);

        if let Some(node) = target {
            assignments.push(Assignment {
                chunk_id: chunk.id.clone(),
                node_id: node.id.clone(),
            });
            node.backlog += 1;
        }
    }

    if assignments.is_empty() {
        tracing::debug!("No eligible nodes for pending chunks");
        return Ok(());
    }

    // 6. Batch update chunks with assignments
    batch_assign(state, &assignments).await?;
    tracing::info!(count = assignments.len(), "Assigned chunks to nodes");

    Ok(())
}

/// Check if a node is eligible to run a chunk based on the job's access settings.
fn is_eligible(
    node: &OnlineNode,
    job: &JobOwner,
    permissions: &[NodePermission],
    filters: &crate::utils::filter_refresh::FilterMap,
) -> bool {
    // Owner can always run their own jobs
    if node.user_id == job.user_id {
        return true;
    }

    // Check access_type on the job
    match job.access_type.as_deref() {
        Some("public") => true,
        Some("user") => {
            // Check if the node has a user permission targeting the job owner
            permissions.iter().any(|p| {
                p.node_id == node.id
                    && p.access_type == "user"
                    && p.target_id.as_deref() == Some(&job.user_id)
            })
        }
        Some("discord") => {
            // Check Bloom filter in memory (zero network cost)
            let node_discord_id = match &node.discord_id {
                Some(id) => id,
                None => return false,
            };
            let target_guild = match &job.discord_server_id {
                Some(id) => id,
                None => return false,
            };

            // We can't await here (sync fn), so use try_read
            let map = match filters.try_read() {
                Ok(m) => m,
                Err(_) => return false, // Filter locked, skip this cycle
            };

            let guild_id: GuildId = target_guild
                .parse::<u64>()
                .unwrap_or_default()
                .into();
            match map.get(&guild_id) {
                Some(gf) => gf.filter.might_contain(node_discord_id),
                None => false,
            }
        }
        // No access_type = owner only (already checked above)
        _ => false,
    }
}

async fn fetch_job_owners(
    state: &ServerState,
    job_ids: &[&str],
) -> Result<HashMap<String, JobOwner>, Box<dyn std::error::Error + Send + Sync>> {
    let ids_csv = job_ids.join(",");
    let path = format!(
        "jobs?id=in.({})\
         &select=id,user_id,access_type,discord_server_id",
        ids_csv
    );
    let response = state.supabase.get(&path).await?;
    let jobs: Vec<JobOwner> = response.json().await?;
    Ok(jobs.into_iter().map(|j| (j.id.clone(), j)).collect())
}

async fn fetch_online_nodes(
    state: &ServerState,
) -> Result<Vec<OnlineNode>, Box<dyn std::error::Error + Send + Sync>> {
    let response = state
        .supabase
        .get(
            "nodes?last_seen_at=gt.now()-interval'30 seconds'\
             &select=id,user_id,discord_id",
        )
        .await?;
    let nodes: Vec<OnlineNode> = response.json().await?;
    Ok(nodes)
}

async fn fetch_permissions(
    state: &ServerState,
) -> Result<Vec<NodePermission>, Box<dyn std::error::Error + Send + Sync>> {
    let response = state
        .supabase
        .get("nodes_permissions?select=node_id,access_type,target_id")
        .await?;
    let perms: Vec<NodePermission> = response.json().await?;
    Ok(perms)
}

async fn fetch_backlogs(
    state: &ServerState,
) -> Result<HashMap<String, usize>, Box<dyn std::error::Error + Send + Sync>> {
    let response = state
        .supabase
        .get(
            "jobs_chunks?status=eq.running&node_id=not.is.null\
             &select=node_id",
        )
        .await?;
    let rows: Vec<BacklogRow> = response.json().await?;

    let mut map: HashMap<String, usize> = HashMap::new();
    for row in rows {
        if let Some(nid) = row.node_id {
            *map.entry(nid).or_default() += 1;
        }
    }
    Ok(map)
}

async fn batch_assign(
    state: &ServerState,
    assignments: &[Assignment],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    for a in assignments {
        let path = format!("jobs_chunks?id=eq.{}", a.chunk_id);
        let body = serde_json::json!({
            "node_id": a.node_id,
            "status": "running"
        });
        state.supabase.patch(&path, &body).await?;
    }
    Ok(())
}

#[derive(Debug, Clone, Deserialize)]
struct JobOwner {
    id: String,
    user_id: String,
    access_type: Option<String>,
    discord_server_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct OnlineNode {
    id: String,
    user_id: String,
    discord_id: Option<String>,
    #[serde(skip)]
    backlog: usize,
}

#[derive(Debug, Clone, Deserialize)]
struct NodePermission {
    node_id: String,
    access_type: String,
    target_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct BacklogRow {
    node_id: Option<String>,
}

struct Assignment {
    chunk_id: String,
    node_id: String,
}
