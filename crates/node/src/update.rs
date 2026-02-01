//! Self-update via GitHub releases.

const REPO_OWNER: &str = "legacy3";
const REPO_NAME: &str = "wowlab";

pub fn check_for_update(
    current_version: &str,
) -> Result<Option<String>, Box<dyn std::error::Error>> {
    let releases = self_update::backends::github::ReleaseList::configure()
        .repo_owner(REPO_OWNER)
        .repo_name(REPO_NAME)
        .build()?
        .fetch()?;

    if let Some(latest) = releases.first() {
        if self_update::version::bump_is_greater(current_version, &latest.version)? {
            return Ok(Some(latest.version.clone()));
        }
    }
    Ok(None)
}

/// Returns Ok(true) if updated, Ok(false) if already on latest.
pub fn update(bin_name: &str, current_version: &str) -> Result<bool, Box<dyn std::error::Error>> {
    tracing::info!("Checking for updates (current: {})", current_version);

    let status = self_update::backends::github::Update::configure()
        .repo_owner(REPO_OWNER)
        .repo_name(REPO_NAME)
        .bin_name(bin_name)
        .identifier(bin_name) // Match asset by bin_name prefix (e.g., "node-headless-v*")
        .show_download_progress(false)
        .no_confirm(true)
        .current_version(current_version)
        .build()?
        .update()?;

    if status.updated() {
        tracing::info!("Updated to version {}", status.version());
        Ok(true)
    } else {
        tracing::debug!("Already on latest version");
        Ok(false)
    }
}
