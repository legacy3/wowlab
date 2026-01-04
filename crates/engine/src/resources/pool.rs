//! Resource pool implementation.
//!
//! A ResourcePool tracks a single resource type with:
//! - Current/max values
//! - Regeneration (haste-scaled for applicable types)
//! - Usage metrics (gained, spent, overflow)

use super::types::ResourceType;
use super::ResourcePoolConfig;

/// Metrics for resource usage tracking.
#[derive(Debug, Clone, Copy, Default)]
pub struct ResourceMetrics {
    /// Total resources gained this iteration.
    pub gained: f32,
    /// Total resources spent this iteration.
    pub spent: f32,
    /// Total resources wasted due to capping.
    pub overflow: f32,
    /// Number of gain events.
    pub gain_count: u32,
    /// Number of spend events.
    pub spend_count: u32,
}

impl ResourceMetrics {
    /// Reset all metrics to zero.
    #[inline]
    pub fn reset(&mut self) {
        *self = Self::default();
    }

    /// Resource efficiency: gained / (gained + overflow).
    /// Returns 1.0 if no resources were generated.
    #[inline]
    pub fn efficiency(&self) -> f32 {
        let total = self.gained + self.overflow;
        if total > 0.0 {
            self.gained / total
        } else {
            1.0
        }
    }

    /// Average gain per event.
    #[inline]
    pub fn avg_gain(&self) -> f32 {
        if self.gain_count > 0 {
            self.gained / self.gain_count as f32
        } else {
            0.0
        }
    }

    /// Average spend per event.
    #[inline]
    pub fn avg_spend(&self) -> f32 {
        if self.spend_count > 0 {
            self.spent / self.spend_count as f32
        } else {
            0.0
        }
    }
}

/// A resource pool for a single resource type.
///
/// Handles regeneration, spending, gaining, and tracking for one resource.
/// Multiple pools can be combined in `UnitResources` for multi-resource classes.
#[derive(Debug, Clone, Copy)]
pub struct ResourcePool {
    /// Current resource value.
    current: f32,
    /// Maximum resource value.
    max: f32,
    /// Base regeneration per second (before haste).
    base_regen: f32,
    /// Type of this resource.
    resource_type: ResourceType,
    /// Initial value (for reset).
    initial: f32,
    /// Usage metrics.
    metrics: ResourceMetrics,
}

impl ResourcePool {
    /// Create a new resource pool from configuration.
    pub fn new(config: ResourcePoolConfig) -> Self {
        Self {
            current: config.initial,
            max: config.max,
            base_regen: config.base_regen,
            resource_type: config.resource_type,
            initial: config.initial,
            metrics: ResourceMetrics::default(),
        }
    }

    /// Create a pool with specific values (for testing or special cases).
    pub fn with_values(resource_type: ResourceType, current: f32, max: f32, base_regen: f32) -> Self {
        Self {
            current,
            max,
            base_regen,
            resource_type,
            initial: current,
            metrics: ResourceMetrics::default(),
        }
    }

    // === Accessors ===

    /// Current resource value.
    #[inline(always)]
    pub fn current(&self) -> f32 {
        self.current
    }

    /// Maximum resource value.
    #[inline(always)]
    pub fn max(&self) -> f32 {
        self.max
    }

    /// Base regeneration per second (before haste).
    #[inline(always)]
    pub fn base_regen(&self) -> f32 {
        self.base_regen
    }

    /// Resource type.
    #[inline(always)]
    pub fn resource_type(&self) -> ResourceType {
        self.resource_type
    }

    /// Current resource as percentage of max (0.0 - 1.0).
    #[inline]
    pub fn percent(&self) -> f32 {
        if self.max > 0.0 {
            self.current / self.max
        } else {
            0.0
        }
    }

    /// Deficit (max - current).
    #[inline]
    pub fn deficit(&self) -> f32 {
        self.max - self.current
    }

    /// Whether pool is at maximum.
    #[inline]
    pub fn is_full(&self) -> bool {
        self.current >= self.max
    }

    /// Whether pool is empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.current <= 0.0
    }

    /// Get usage metrics.
    #[inline]
    pub fn metrics(&self) -> &ResourceMetrics {
        &self.metrics
    }

    // === Regeneration ===

    /// Calculate effective regen rate with haste.
    /// Only regenerating resources (Focus, Energy, Mana, Essence) scale with haste.
    #[inline]
    pub fn effective_regen(&self, haste_mult: f32) -> f32 {
        if self.resource_type.is_regenerating() {
            self.base_regen * haste_mult
        } else {
            self.base_regen
        }
    }

    /// Apply regeneration over elapsed time.
    ///
    /// # Arguments
    /// * `elapsed_secs` - Time elapsed in seconds
    /// * `haste_mult` - Haste multiplier (1.0 = no haste, 1.2 = 20% haste)
    ///
    /// # Returns
    /// Actual amount regenerated (may be less if capped).
    #[inline]
    pub fn regen(&mut self, elapsed_secs: f32, haste_mult: f32) -> f32 {
        if self.base_regen <= 0.0 || elapsed_secs <= 0.0 {
            return 0.0;
        }

        let amount = self.effective_regen(haste_mult) * elapsed_secs;
        self.gain_internal(amount, false) // Don't count regen ticks individually
    }

    // === Spending ===

    /// Check if we can spend the given amount.
    #[inline(always)]
    pub fn can_spend(&self, amount: f32) -> bool {
        self.current >= amount
    }

    /// Spend resources. Returns true if successful, false if insufficient.
    ///
    /// If insufficient resources, nothing is spent.
    #[inline]
    pub fn spend(&mut self, amount: f32) -> bool {
        if self.current >= amount {
            self.current -= amount;
            self.metrics.spent += amount;
            self.metrics.spend_count += 1;
            true
        } else {
            false
        }
    }

    /// Spend resources, allowing partial spend if insufficient.
    /// Returns the actual amount spent.
    #[inline]
    pub fn spend_partial(&mut self, amount: f32) -> f32 {
        let actual = amount.min(self.current);
        if actual > 0.0 {
            self.current -= actual;
            self.metrics.spent += actual;
            self.metrics.spend_count += 1;
        }
        actual
    }

    /// Force spend (can go negative). Use with caution.
    #[inline]
    pub fn spend_unchecked(&mut self, amount: f32) {
        self.current -= amount;
        self.metrics.spent += amount;
        self.metrics.spend_count += 1;
    }

    // === Gaining ===

    /// Gain resources, capped at max.
    /// Returns actual amount gained (may be less due to cap).
    #[inline]
    pub fn gain(&mut self, amount: f32) -> f32 {
        self.gain_internal(amount, true)
    }

    /// Internal gain with optional metric tracking.
    #[inline(always)]
    fn gain_internal(&mut self, amount: f32, track_count: bool) -> f32 {
        if amount <= 0.0 {
            return 0.0;
        }

        let space = self.max - self.current;
        let actual = amount.min(space);
        let overflow = amount - actual;

        self.current += actual;
        self.metrics.gained += actual;
        self.metrics.overflow += overflow;

        if track_count {
            self.metrics.gain_count += 1;
        }

        actual
    }

    /// Set current value directly (for initialization or special effects).
    #[inline]
    pub fn set_current(&mut self, value: f32) {
        self.current = value.clamp(0.0, self.max);
    }

    /// Modify max value (e.g., from buffs).
    #[inline]
    pub fn set_max(&mut self, value: f32) {
        self.max = value.max(0.0);
        // Clamp current to new max
        if self.current > self.max {
            self.current = self.max;
        }
    }

    // === State Management ===

    /// Reset to initial state (for new iteration).
    #[inline]
    pub fn reset(&mut self) {
        self.current = self.initial;
        self.metrics.reset();
    }

    /// Reset to full (max value).
    #[inline]
    pub fn reset_full(&mut self) {
        self.current = self.max;
        self.metrics.reset();
    }

    // === Prediction ===

    /// Time until resource reaches target value via regeneration.
    /// Returns None if no regen or already at/above target.
    #[inline]
    pub fn time_to_reach(&self, target: f32, haste_mult: f32) -> Option<f32> {
        if self.current >= target {
            return Some(0.0);
        }

        let effective_regen = self.effective_regen(haste_mult);
        if effective_regen <= 0.0 {
            return None;
        }

        let needed = target - self.current;
        Some(needed / effective_regen)
    }

    /// Time until full via regeneration.
    #[inline]
    pub fn time_to_full(&self, haste_mult: f32) -> Option<f32> {
        self.time_to_reach(self.max, haste_mult)
    }
}

impl Default for ResourcePool {
    fn default() -> Self {
        Self::new(ResourcePoolConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_focus_pool() -> ResourcePool {
        ResourcePool::new(ResourcePoolConfig {
            resource_type: ResourceType::Focus,
            max: 100.0,
            base_regen: 10.0,
            initial: 100.0,
        })
    }

    #[test]
    fn test_new_pool() {
        let pool = make_focus_pool();
        assert_eq!(pool.current(), 100.0);
        assert_eq!(pool.max(), 100.0);
        assert_eq!(pool.base_regen(), 10.0);
        assert!(pool.is_full());
    }

    #[test]
    fn test_spend() {
        let mut pool = make_focus_pool();

        assert!(pool.spend(30.0));
        assert_eq!(pool.current(), 70.0);
        assert_eq!(pool.metrics().spent, 30.0);
        assert_eq!(pool.metrics().spend_count, 1);

        // Can't spend more than we have
        assert!(!pool.spend(80.0));
        assert_eq!(pool.current(), 70.0); // Unchanged
    }

    #[test]
    fn test_gain_with_overflow() {
        let mut pool = make_focus_pool();
        pool.set_current(80.0);

        let gained = pool.gain(30.0);
        assert_eq!(gained, 20.0); // Only 20 space available
        assert_eq!(pool.current(), 100.0);
        assert_eq!(pool.metrics().gained, 20.0);
        assert_eq!(pool.metrics().overflow, 10.0);
    }

    #[test]
    fn test_regen_with_haste() {
        let mut pool = make_focus_pool();
        pool.set_current(50.0);

        // 1 second at 20% haste = 10 * 1.2 = 12 focus
        let gained = pool.regen(1.0, 1.2);
        assert_eq!(gained, 12.0);
        assert_eq!(pool.current(), 62.0);
    }

    #[test]
    fn test_regen_no_haste_for_rage() {
        let mut pool = ResourcePool::new(ResourcePoolConfig {
            resource_type: ResourceType::Rage,
            max: 100.0,
            base_regen: 0.0, // Rage doesn't regen passively
            initial: 0.0,
        });

        // Even with haste, no regen
        let gained = pool.regen(1.0, 1.5);
        assert_eq!(gained, 0.0);
    }

    #[test]
    fn test_time_to_reach() {
        let mut pool = make_focus_pool();
        pool.set_current(50.0);

        // Need 30 more focus at 10/s = 3 seconds
        let time = pool.time_to_reach(80.0, 1.0);
        assert_eq!(time, Some(3.0));

        // With 50% haste: 10 * 1.5 = 15/s, 30 / 15 = 2 seconds
        let time = pool.time_to_reach(80.0, 1.5);
        assert_eq!(time, Some(2.0));

        // Already at target
        let time = pool.time_to_reach(50.0, 1.0);
        assert_eq!(time, Some(0.0));
    }

    #[test]
    fn test_efficiency() {
        let mut pool = make_focus_pool();
        pool.set_current(90.0);

        pool.gain(20.0); // 10 actual, 10 overflow
        assert_eq!(pool.metrics().efficiency(), 0.5);
    }

    #[test]
    fn test_reset() {
        let mut pool = make_focus_pool();
        pool.spend(50.0);
        pool.gain(10.0);

        pool.reset();

        assert_eq!(pool.current(), 100.0); // Back to initial
        assert_eq!(pool.metrics().spent, 0.0);
        assert_eq!(pool.metrics().gained, 0.0);
    }
}
