//! Self-update functionality for node binaries.

const REPO_OWNER: &str = "legacy3";
const REPO_NAME: &str = "wowlab";

/// Check if a newer version is available.
pub fn check_for_update(current_version: &str) -> Result<Option<String>, Box<dyn std::error::Error>> {
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

/// Check and update if a newer version is available.
/// Returns Ok(true) if updated, Ok(false) if already on latest.
pub fn update(bin_name: &str, current_version: &str) -> Result<bool, Box<dyn std::error::Error>> {
    println!("Checking for updates...");
    println!("Current version: {}", current_version);

    let status = self_update::backends::github::Update::configure()
        .repo_owner(REPO_OWNER)
        .repo_name(REPO_NAME)
        .bin_name(bin_name)
        .show_download_progress(true)
        .current_version(current_version)
        .build()?
        .update()?;

    if status.updated() {
        println!("Updated to version {}", status.version());
        println!("Please restart the application");
        Ok(true)
    } else {
        println!("Already on latest version");
        Ok(false)
    }
}
