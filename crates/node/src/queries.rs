//! Typed PostgREST query helpers for node data fetching.

use serde::Deserialize;
use wowlab_supabase::{SupabaseClient, SupabaseError};

/// A job config row from the `jobs_configs` table.
#[derive(Debug, Clone, Deserialize)]
pub struct ConfigRow {
    pub config: serde_json::Value,
}

/// A rotation row from the `rotations` table.
#[derive(Debug, Clone, Deserialize)]
pub struct RotationRow {
    pub id: String,
    pub script: String,
    pub checksum: String,
}

/// Fetch a job config by its content hash.
pub async fn fetch_config(
    client: &SupabaseClient,
    hash: &str,
) -> Result<ConfigRow, SupabaseError> {
    let path = format!(
        "jobs_configs?hash=eq.{}&select=config",
        urlencoding::encode(hash)
    );
    let rows: Vec<ConfigRow> = client.get(&path).await?.json().await?;
    rows.into_iter().next().ok_or(SupabaseError::NotFound {
        resource: "jobs_configs".to_string(),
        key: "hash".to_string(),
        value: hash.to_string(),
    })
}

/// Fetch a rotation by ID.
pub async fn fetch_rotation(
    client: &SupabaseClient,
    rotation_id: &str,
) -> Result<RotationRow, SupabaseError> {
    let path = format!(
        "rotations?id=eq.{}&select=id,script,checksum",
        urlencoding::encode(rotation_id)
    );
    let rows: Vec<RotationRow> = client.get(&path).await?.json().await?;
    rows.into_iter().next().ok_or(SupabaseError::NotFound {
        resource: "rotations".to_string(),
        key: "id".to_string(),
        value: rotation_id.to_string(),
    })
}
