//! Unit resources - container for all resources a unit can have.
//!
//! Supports:
//! - Primary resource (Focus, Energy, Mana, Rage, etc.)
//! - Secondary resource (Combo Points, Chi, Holy Power, etc.)
//! - Runes (Death Knight)

use super::pool::ResourcePool;
use super::runes::RuneSet;
use super::types::ResourceType;
use super::{ResourcePoolConfig, UnitResourcesConfig};

/// Complete resource state for a unit.
///
/// Handles multi-resource classes like:
/// - Rogue: Energy + Combo Points
/// - Monk: Energy/Mana + Chi
/// - Death Knight: Runic Power + Runes
/// - Paladin: Mana + Holy Power
#[derive(Debug, Clone)]
pub struct UnitResources {
    /// Primary resource (required).
    pub primary: ResourcePool,
    /// Secondary resource (optional).
    pub secondary: Option<ResourcePool>,
    /// Death Knight runes (optional).
    pub runes: Option<RuneSet>,
}

impl UnitResources {
    /// Create resources from configuration.
    pub fn new(config: UnitResourcesConfig) -> Self {
        Self {
            primary: ResourcePool::new(config.primary),
            secondary: config.secondary.map(ResourcePool::new),
            runes: if config.uses_runes {
                Some(RuneSet::default())
            } else {
                None
            },
        }
    }

    /// Create with just a primary resource.
    pub fn primary_only(config: ResourcePoolConfig) -> Self {
        Self {
            primary: ResourcePool::new(config),
            secondary: None,
            runes: None,
        }
    }

    /// Create for a dual-resource class (e.g., Rogue, Monk).
    pub fn dual(primary: ResourcePoolConfig, secondary: ResourcePoolConfig) -> Self {
        Self {
            primary: ResourcePool::new(primary),
            secondary: Some(ResourcePool::new(secondary)),
            runes: None,
        }
    }

    /// Create for Death Knight (Runic Power + Runes).
    pub fn death_knight(runic_power: ResourcePoolConfig, rune_recharge_ms: u32) -> Self {
        Self {
            primary: ResourcePool::new(runic_power),
            secondary: None,
            runes: Some(RuneSet::new(rune_recharge_ms)),
        }
    }

    // === Quick access to primary ===

    /// Check if can spend primary resource.
    #[inline(always)]
    pub fn can_spend(&self, amount: f32) -> bool {
        self.primary.can_spend(amount)
    }

    /// Spend primary resource.
    #[inline(always)]
    pub fn spend(&mut self, amount: f32) -> bool {
        self.primary.spend(amount)
    }

    /// Gain primary resource.
    #[inline(always)]
    pub fn gain(&mut self, amount: f32) -> f32 {
        self.primary.gain(amount)
    }

    /// Regenerate primary resource.
    #[inline(always)]
    pub fn regen(&mut self, elapsed_secs: f32, haste_mult: f32) -> f32 {
        self.primary.regen(elapsed_secs, haste_mult)
    }

    /// Current primary resource.
    #[inline(always)]
    pub fn current(&self) -> f32 {
        self.primary.current()
    }

    /// Max primary resource.
    #[inline(always)]
    pub fn max(&self) -> f32 {
        self.primary.max()
    }

    /// Primary resource type.
    #[inline(always)]
    pub fn resource_type(&self) -> ResourceType {
        self.primary.resource_type()
    }

    // === Secondary resource ===

    /// Check if has secondary resource.
    #[inline]
    pub fn has_secondary(&self) -> bool {
        self.secondary.is_some()
    }

    /// Get secondary resource pool.
    #[inline]
    pub fn secondary(&self) -> Option<&ResourcePool> {
        self.secondary.as_ref()
    }

    /// Get secondary resource pool mutably.
    #[inline]
    pub fn secondary_mut(&mut self) -> Option<&mut ResourcePool> {
        self.secondary.as_mut()
    }

    /// Spend secondary resource (e.g., combo points).
    #[inline]
    pub fn spend_secondary(&mut self, amount: f32) -> bool {
        if let Some(ref mut secondary) = self.secondary {
            secondary.spend(amount)
        } else {
            false
        }
    }

    /// Gain secondary resource (e.g., combo points).
    #[inline]
    pub fn gain_secondary(&mut self, amount: f32) -> f32 {
        if let Some(ref mut secondary) = self.secondary {
            secondary.gain(amount)
        } else {
            0.0
        }
    }

    /// Current secondary resource.
    #[inline]
    pub fn secondary_current(&self) -> f32 {
        self.secondary.as_ref().map(|s| s.current()).unwrap_or(0.0)
    }

    // === Runes (Death Knight) ===

    /// Check if has rune system.
    #[inline]
    pub fn has_runes(&self) -> bool {
        self.runes.is_some()
    }

    /// Get rune set.
    #[inline]
    pub fn runes(&self) -> Option<&RuneSet> {
        self.runes.as_ref()
    }

    /// Get rune set mutably.
    #[inline]
    pub fn runes_mut(&mut self) -> Option<&mut RuneSet> {
        self.runes.as_mut()
    }

    /// Count ready runes.
    #[inline]
    pub fn ready_runes(&self) -> u8 {
        self.runes.as_ref().map(|r| r.ready_count()).unwrap_or(0)
    }

    /// Spend runes.
    #[inline]
    pub fn spend_runes(&mut self, count: u8, current_time: u32, haste_mult: f32) -> u8 {
        if let Some(ref mut runes) = self.runes {
            runes.spend(count, current_time, haste_mult)
        } else {
            0
        }
    }

    // === State management ===

    /// Update all resources (regen, rune recharge, etc.).
    pub fn update(&mut self, current_time: u32, elapsed_secs: f32, haste_mult: f32) {
        // Primary regen
        self.primary.regen(elapsed_secs, haste_mult);

        // Secondary regen (if it regenerates)
        if let Some(ref mut secondary) = self.secondary {
            secondary.regen(elapsed_secs, haste_mult);
        }

        // Rune updates
        if let Some(ref mut runes) = self.runes {
            runes.update(current_time);
        }
    }

    /// Reset all resources to initial state.
    pub fn reset(&mut self) {
        self.primary.reset();
        if let Some(ref mut secondary) = self.secondary {
            secondary.reset();
        }
        if let Some(ref mut runes) = self.runes {
            runes.reset();
        }
    }

    // === Prediction ===

    /// Time until primary resource reaches target.
    #[inline]
    pub fn time_to_resource(&self, target: f32, haste_mult: f32) -> Option<f32> {
        self.primary.time_to_reach(target, haste_mult)
    }

    /// Effective regen rate for primary resource.
    #[inline]
    pub fn effective_regen(&self, haste_mult: f32) -> f32 {
        self.primary.effective_regen(haste_mult)
    }
}

impl Default for UnitResources {
    fn default() -> Self {
        Self::primary_only(ResourcePoolConfig {
            resource_type: ResourceType::Mana,
            max: 100.0,
            base_regen: 0.0,
            initial: 100.0,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hunter_resources() -> UnitResources {
        UnitResources::primary_only(ResourcePoolConfig {
            resource_type: ResourceType::Focus,
            max: 100.0,
            base_regen: 10.0,
            initial: 100.0,
        })
    }

    fn rogue_resources() -> UnitResources {
        UnitResources::dual(
            ResourcePoolConfig {
                resource_type: ResourceType::Energy,
                max: 100.0,
                base_regen: 10.0,
                initial: 100.0,
            },
            ResourcePoolConfig {
                resource_type: ResourceType::ComboPoints,
                max: 5.0,
                base_regen: 0.0,
                initial: 0.0,
            },
        )
    }

    fn dk_resources() -> UnitResources {
        UnitResources::death_knight(
            ResourcePoolConfig {
                resource_type: ResourceType::RunicPower,
                max: 100.0,
                base_regen: 0.0,
                initial: 0.0,
            },
            10000, // 10s rune recharge
        )
    }

    #[test]
    fn test_hunter_single_resource() {
        let mut resources = hunter_resources();

        assert!(resources.can_spend(30.0));
        assert!(resources.spend(30.0));
        assert_eq!(resources.current(), 70.0);

        // Regen with haste
        resources.regen(1.0, 1.2);
        assert_eq!(resources.current(), 82.0); // 70 + 12
    }

    #[test]
    fn test_rogue_dual_resource() {
        let mut resources = rogue_resources();

        // Spend energy
        assert!(resources.spend(40.0));
        assert_eq!(resources.current(), 60.0);

        // Gain combo points
        resources.gain_secondary(1.0);
        assert_eq!(resources.secondary_current(), 1.0);

        // Spend combo points
        resources.gain_secondary(4.0); // Now at 5
        assert!(resources.spend_secondary(5.0));
        assert_eq!(resources.secondary_current(), 0.0);
    }

    #[test]
    fn test_dk_with_runes() {
        let mut resources = dk_resources();

        assert!(resources.has_runes());
        assert_eq!(resources.ready_runes(), 6);

        // Spend 2 runes
        let spent = resources.spend_runes(2, 0, 1.0);
        assert_eq!(spent, 2);
        assert_eq!(resources.ready_runes(), 4);

        // Gain runic power
        resources.gain(20.0);
        assert_eq!(resources.current(), 20.0);
    }

    #[test]
    fn test_reset() {
        let mut resources = rogue_resources();

        resources.spend(50.0);
        resources.gain_secondary(3.0);

        resources.reset();

        assert_eq!(resources.current(), 100.0);
        assert_eq!(resources.secondary_current(), 0.0);
    }
}
