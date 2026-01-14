//! Data loading module.
//!
//! This module provides:
//! - **DataResolver trait**: Abstract interface for loading game data
//! - **LocalResolver**: Loads from local CSV files (default, offline, portable)
//! - **SupabaseResolver**: Loads from Supabase API (optional, requires `supabase` feature)
//! - **External tuning**: Runtime tuning capabilities without recompilation

mod loader;
mod local;
mod resolver;
#[cfg(feature = "supabase")]
mod supabase;
mod tuning;

pub use loader::*;
pub use local::LocalResolver;
pub use resolver::{DataResolver, ResolverConfig, ResolverError};
#[cfg(feature = "supabase")]
pub use supabase::SupabaseResolver;
pub use tuning::*;

use std::sync::Arc;

/// Create a resolver from configuration.
///
/// # Example
///
/// ```ignore
/// use engine::data::{create_resolver, ResolverConfig};
/// use std::path::PathBuf;
///
/// // Local mode (default)
/// let resolver = create_resolver(ResolverConfig::Local {
///     data_dir: PathBuf::from("./data"),
/// })?;
///
/// // Supabase mode (requires feature)
/// #[cfg(feature = "supabase")]
/// let resolver = create_resolver(ResolverConfig::Supabase {
///     patch: Some("11.1.0".to_string()),
/// })?;
/// ```
pub fn create_resolver(config: ResolverConfig) -> Result<Arc<dyn DataResolver>, ResolverError> {
    match config {
        ResolverConfig::Local { data_dir } => {
            tracing::info!(data_dir = %data_dir.display(), "Creating LocalResolver");
            Ok(Arc::new(LocalResolver::new(data_dir)))
        }
        #[cfg(feature = "supabase")]
        ResolverConfig::Supabase { patch } => {
            tracing::info!("Creating SupabaseResolver");
            let resolver = SupabaseResolver::from_env(patch.as_deref())?;
            Ok(Arc::new(resolver))
        }
    }
}

#[cfg(test)]
mod tests;
