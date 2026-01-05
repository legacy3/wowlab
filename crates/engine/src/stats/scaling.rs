/// Item level to stat scaling
pub struct ItemLevelScaling;

impl ItemLevelScaling {
    /// Base item level for current tier
    pub const BASE_ILVL: u32 = 623;

    /// Primary stat per item level
    pub fn primary_per_ilvl(ilvl: u32) -> f32 {
        // Approximate scaling, adjust based on actual values
        let base = 2000.0;
        let per_level = 40.0;
        base + (ilvl.saturating_sub(Self::BASE_ILVL) as f32) * per_level
    }

    /// Weapon DPS per item level
    pub fn weapon_dps(ilvl: u32, weapon_speed: f32) -> f32 {
        let base_dps = 100.0 + (ilvl.saturating_sub(Self::BASE_ILVL) as f32) * 5.0;
        base_dps * weapon_speed / 2.6 // Normalize to 2.6 speed
    }
}
