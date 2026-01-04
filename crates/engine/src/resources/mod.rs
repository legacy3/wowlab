//! Resource system for WoW simulation.
//!
//! Supports multiple resources per unit with proper tracking:
//! - Primary resources: Focus, Energy, Mana, Rage, Runic Power, etc.
//! - Secondary resources: Combo Points, Chi, Holy Power, etc.
//! - Special resources: Runes (DK), Soul Shards (Warlock)
//!
//! # Architecture
//!
//! ```text
//! UnitResources
//! ├── primary: ResourcePool      (Focus, Energy, Mana, etc.)
//! ├── secondary: Option<ResourcePool>  (Combo Points, Chi, etc.)
//! └── runes: Option<RuneSet>     (Death Knight only)
//! ```
//!
//! # Example
//!
//! ```ignore
//! let mut resources = UnitResources::new(ResourcePoolConfig {
//!     resource_type: ResourceType::Focus,
//!     max: 100.0,
//!     base_regen: 10.0,
//!     initial: 100.0,
//! });
//!
//! // Spend resources
//! if resources.primary.can_spend(30.0) {
//!     resources.primary.spend(30.0);
//! }
//!
//! // Regenerate with haste
//! resources.primary.regen(1.0, 1.2); // 1 second, 20% haste
//! ```

mod pool;
mod runes;
mod types;
mod unit;

pub use pool::{ResourcePool, ResourceMetrics};
pub use runes::{Rune, RuneState, RuneSet};
pub use types::ResourceType;
pub use unit::UnitResources;

/// Configuration for a resource pool.
#[derive(Debug, Clone, Copy, Default)]
pub struct ResourcePoolConfig {
    /// Type of resource.
    pub resource_type: ResourceType,
    /// Maximum resource value.
    pub max: f32,
    /// Base regeneration per second (before haste).
    pub base_regen: f32,
    /// Initial value at combat start.
    pub initial: f32,
}

/// Configuration for a unit's complete resource setup.
#[derive(Debug, Clone, Default)]
pub struct UnitResourcesConfig {
    /// Primary resource (required).
    pub primary: ResourcePoolConfig,
    /// Secondary resource (optional, e.g., Combo Points for Rogues).
    pub secondary: Option<ResourcePoolConfig>,
    /// Whether this unit uses runes (Death Knight).
    pub uses_runes: bool,
}
