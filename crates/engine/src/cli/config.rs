use crate::stats::StatCache;
use serde::{Deserialize, Serialize};
use wowlab_common::types::{RatingType, SpecId};

/// Gear configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GearConfig {
    /// Item level
    pub item_level: u16,
    /// Primary stat (agi/str/int)
    pub primary_stat: u32,
    /// Haste rating
    pub haste: u32,
    /// Crit rating
    pub crit: u32,
    /// Mastery rating
    pub mastery: u32,
    /// Versatility rating
    pub versatility: u32,
}

impl Default for GearConfig {
    fn default() -> Self {
        // Default to ~500 ilvl gear stats
        Self {
            item_level: 500,
            primary_stat: 15000,
            haste: 3000,
            crit: 3000,
            mastery: 2000,
            versatility: 1500,
        }
    }
}

impl GearConfig {
    /// Load from JSON file
    pub fn from_file(path: &str) -> Result<Self, String> {
        let content =
            std::fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))
    }

    /// Apply to stat cache
    pub fn apply_to(&self, stats: &mut StatCache, spec: SpecId) {
        use crate::stats::primary_stat_for_spec;

        // Apply primary stat based on spec
        let primary_attr = primary_stat_for_spec(spec);
        stats.primary.set(primary_attr, self.primary_stat as f32);

        // Apply secondary ratings
        stats.ratings.set(RatingType::Haste, self.haste as f32);
        stats.ratings.set(RatingType::Crit, self.crit as f32);
        stats.ratings.set(RatingType::Mastery, self.mastery as f32);
        stats
            .ratings
            .set(RatingType::Versatility, self.versatility as f32);

        // Mark for recalculation
        stats.invalidate();
    }
}

/// Fight configuration
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FightConfig {
    /// Duration in seconds
    pub duration: f32,
    /// Number of targets
    pub targets: usize,
    /// Fight type name
    pub fight_type: String,
}

impl Default for FightConfig {
    fn default() -> Self {
        Self {
            duration: 300.0,
            targets: 1,
            fight_type: "Patchwerk".to_string(),
        }
    }
}
