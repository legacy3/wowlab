use super::ResourcePool;
use wowlab_common::types::{ResourceType, SimTime};

/// Handles resource regeneration
pub struct ResourceRegen;

impl ResourceRegen {
    /// Calculate regen amount for a time period
    pub fn calculate(resource_type: ResourceType, duration: SimTime, haste: f32) -> f32 {
        let base_per_sec = resource_type.base_regen_per_sec();
        if base_per_sec == 0.0 {
            return 0.0;
        }

        let seconds = duration.as_secs_f32();
        let regen_per_sec = base_per_sec * haste;

        regen_per_sec * seconds
    }

    /// Apply regen to a pool
    pub fn apply(pool: &mut ResourcePool, duration: SimTime, haste: f32) {
        let amount = Self::calculate(pool.resource_type, duration, haste);
        if amount > 0.0 {
            pool.gain(amount);
        }
    }

    /// Time until resource reaches target (for predictive gating)
    pub fn time_to_reach(pool: &ResourcePool, target: f32, haste: f32) -> Option<SimTime> {
        if pool.current >= target {
            return Some(SimTime::ZERO);
        }

        let base_per_sec = pool.resource_type.base_regen_per_sec();
        if base_per_sec == 0.0 {
            return None; // Will never reach via regen
        }

        let needed = target - pool.current;
        let regen_per_sec = base_per_sec * haste;
        let seconds = needed / regen_per_sec;

        Some(SimTime::from_secs_f32(seconds))
    }
}
