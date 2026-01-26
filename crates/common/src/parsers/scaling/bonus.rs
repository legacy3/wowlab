//! Item bonus application
//!
//! Applies item bonuses to compute scaled stats from WoW's DBC data.
//!
//! Key bonus types:
//! - Type 1 (ILEVEL): Directly modifies item level by value_0
//! - Type 2 (MOD): Modifies a stat (stat_type=value_0, alloc=value_1)
//! - Type 11 (SCALING): Uses curve for scaling (curve_id=value_0)
//! - Type 13 (SCALING_2): Alternate scaling curve
//! - Type 14 (ILEVEL_CURVE): Sets ilevel from curve
//! - Type 42 (SET_ILEVEL_2): Sets item level to value_0

use crate::types::data::{
    AppliedBonus, ItemQuality, ItemScalingData, ItemStat, ScaledItemStats, ScaledStat,
};

use super::curve::interpolate_curve;
use super::stats::{get_stat_budget, get_stat_name};

/// Bonus type constants from WoW's ItemBonus DBC
mod bonus_type {
    pub const ILEVEL: i32 = 1;
    pub const MOD: i32 = 2;
    pub const QUALITY: i32 = 3;
    pub const SOCKET: i32 = 6;
    pub const SCALING: i32 = 11;
    pub const SCALING_2: i32 = 13;
    pub const ILEVEL_CURVE: i32 = 14;
    pub const SET_ILEVEL_2: i32 = 42;
}

/// Apply item bonuses to compute scaled stats.
///
/// # Arguments
/// * `base_item_level` - The item's base item level before bonuses
/// * `base_stats` - The item's base stats (stat_type, alloc_percent pairs)
/// * `quality` - The item quality (affects stat budget)
/// * `bonus_ids` - List of bonus IDs to apply
/// * `scaling_data` - The scaling data bundle
/// * `player_level` - Optional player level for curve interpolation (defaults to 80)
///
/// # Returns
/// Computed scaled stats including final item level and stat values
pub fn apply_item_bonuses(
    base_item_level: i32,
    base_stats: &[ItemStat],
    quality: i32,
    bonus_ids: &[i32],
    scaling_data: &ItemScalingData,
    player_level: Option<i32>,
) -> ScaledItemStats {
    let player_level = player_level.unwrap_or(80);
    let quality = ItemQuality::from(quality);

    // Collect all bonuses from all bonus IDs
    let mut all_bonuses = Vec::new();
    for &bonus_id in bonus_ids {
        if let Some(bonuses) = scaling_data.bonuses.get(&bonus_id) {
            all_bonuses.extend(bonuses.iter());
        }
    }

    // Sort by order_index for consistent application
    all_bonuses.sort_by_key(|b| b.order_index);

    // First pass: calculate final item level
    let mut item_level = base_item_level;
    let mut applied = Vec::new();

    for bonus in &all_bonuses {
        match bonus.bonus_type {
            bonus_type::ILEVEL => {
                // Type 1: Add value_0 to item level
                item_level += bonus.value_0;
                applied.push(AppliedBonus {
                    bonus_list_id: bonus.parent_item_bonus_list_id,
                    bonus_type: bonus.bonus_type,
                    description: format!("Item level {:+}", bonus.value_0),
                });
            }
            bonus_type::ILEVEL_CURVE => {
                // Type 14: Set item level from curve at player level
                if let Some(new_ilvl) = interpolate_curve(scaling_data, bonus.value_0, player_level as f64) {
                    item_level = new_ilvl.round() as i32;
                    applied.push(AppliedBonus {
                        bonus_list_id: bonus.parent_item_bonus_list_id,
                        bonus_type: bonus.bonus_type,
                        description: format!("Item level {} (from curve)", item_level),
                    });
                }
            }
            bonus_type::SET_ILEVEL_2 => {
                // Type 42: Set item level directly
                item_level = bonus.value_0;
                applied.push(AppliedBonus {
                    bonus_list_id: bonus.parent_item_bonus_list_id,
                    bonus_type: bonus.bonus_type,
                    description: format!("Item level set to {}", bonus.value_0),
                });
            }
            _ => {}
        }
    }

    // Get stat budget for the final item level
    // Slot index 0 is typically used for most items
    let budget = get_stat_budget(scaling_data, item_level, quality, 0).unwrap_or(0.0);

    // Second pass: calculate stats
    let mut stats_map: std::collections::HashMap<i32, f64> = std::collections::HashMap::new();

    // Apply base stats with budget
    for stat in base_stats {
        let value = stat.value as f64 * budget * 0.0001;
        *stats_map.entry(stat.stat_type).or_default() += value;
    }

    // Apply stat modifiers from bonuses
    for bonus in &all_bonuses {
        match bonus.bonus_type {
            bonus_type::MOD => {
                // Type 2: Add stat modifier (stat_type=value_0, alloc=value_1)
                let stat_type = bonus.value_0;
                let alloc = bonus.value_1 as f64;
                let value = alloc * budget * 0.0001;
                *stats_map.entry(stat_type).or_default() += value;

                applied.push(AppliedBonus {
                    bonus_list_id: bonus.parent_item_bonus_list_id,
                    bonus_type: bonus.bonus_type,
                    description: format!(
                        "+{} {} (alloc {})",
                        value.round() as i32,
                        get_stat_name(stat_type),
                        alloc as i32
                    ),
                });
            }
            bonus_type::SCALING | bonus_type::SCALING_2 => {
                // Type 11/13: Scaling from curve
                if let Some(scaled_value) = interpolate_curve(scaling_data, bonus.value_0, player_level as f64) {
                    let stat_type = bonus.value_1;
                    if stat_type > 0 {
                        *stats_map.entry(stat_type).or_default() += scaled_value;
                        applied.push(AppliedBonus {
                            bonus_list_id: bonus.parent_item_bonus_list_id,
                            bonus_type: bonus.bonus_type,
                            description: format!(
                                "+{} {} (scaled)",
                                scaled_value.round() as i32,
                                get_stat_name(stat_type)
                            ),
                        });
                    }
                }
            }
            _ => {}
        }
    }

    // Convert to final stats
    let stats: Vec<ScaledStat> = stats_map
        .into_iter()
        .map(|(stat_type, value)| ScaledStat {
            stat_type,
            stat_name: get_stat_name(stat_type).to_string(),
            value: value.round() as i32,
        })
        .filter(|s| s.value != 0)
        .collect();

    ScaledItemStats {
        item_level,
        stats,
        applied_bonuses: applied,
    }
}

/// Get a human-readable description for a bonus type.
pub fn get_bonus_description(bonus_type: i32) -> &'static str {
    match bonus_type {
        bonus_type::ILEVEL => "Item Level Modifier",
        bonus_type::MOD => "Stat Modifier",
        bonus_type::QUALITY => "Quality Modifier",
        bonus_type::SOCKET => "Socket",
        bonus_type::SCALING => "Scaling Curve",
        bonus_type::SCALING_2 => "Scaling Curve (Alt)",
        bonus_type::ILEVEL_CURVE => "Item Level Curve",
        bonus_type::SET_ILEVEL_2 => "Set Item Level",
        _ => "Unknown",
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use crate::types::data::{CurveFlat, CurvePointFlat, ItemBonusFlat, RandPropPointsFlat};

    fn make_scaling_data() -> ItemScalingData {
        let mut data = ItemScalingData::default();

        // Add some rand prop points for ilvl 600
        data.rand_prop_points.insert(
            600,
            RandPropPointsFlat {
                id: 600,
                epic_f_0: 4275.0,
                epic_f_1: 3206.0,
                epic_f_2: 2404.0,
                epic_f_3: 2137.0,
                epic_f_4: 2137.0,
                ..Default::default()
            },
        );

        // Add a bonus that increases ilevel by 10
        data.bonuses.insert(
            100,
            vec![ItemBonusFlat {
                id: 1,
                parent_item_bonus_list_id: 100,
                bonus_type: 1, // ILEVEL
                value_0: 10,
                value_1: 0,
                value_2: 0,
                value_3: 0,
                order_index: 0,
            }],
        );

        data
    }

    #[test]
    fn test_apply_ilevel_bonus() {
        let data = make_scaling_data();
        let base_stats = vec![ItemStat {
            stat_type: 3, // Agility
            value: 10000, // Alloc percent
        }];

        let result = apply_item_bonuses(590, &base_stats, 4, &[100], &data, None);

        // Base 590 + bonus 10 = 600
        assert_eq!(result.item_level, 600);
        assert!(!result.applied_bonuses.is_empty());
    }

    #[test]
    fn test_no_bonuses() {
        let data = make_scaling_data();
        let base_stats = vec![ItemStat {
            stat_type: 3,
            value: 10000,
        }];

        let result = apply_item_bonuses(600, &base_stats, 4, &[], &data, None);
        assert_eq!(result.item_level, 600);
    }

    /// Test with actual So'leah's Secret Technique data
    /// Base ilvl: 155, Expected scaled ilvl: 717
    /// Bonus 10029 has type=1 (ILEVEL), value_0=562
    /// So: 155 + 562 = 717
    #[test]
    fn test_soleah_secret_technique() {
        let mut data = ItemScalingData::default();

        // Bonus 10029: type=1 (ILEVEL), value_0=562
        data.bonuses.insert(
            10029,
            vec![ItemBonusFlat {
                id: 21627,
                parent_item_bonus_list_id: 10029,
                bonus_type: 1, // ILEVEL
                value_0: 562,
                value_1: 0,
                value_2: 0,
                value_3: 0,
                order_index: 0,
            }],
        );

        // Other bonuses (type 0 = no-op, type 3 = quality, type 4 = name suffix, etc.)
        data.bonuses.insert(
            6652,
            vec![ItemBonusFlat {
                id: 12792,
                parent_item_bonus_list_id: 6652,
                bonus_type: 0,
                value_0: 0,
                value_1: 0,
                value_2: 0,
                value_3: 0,
                order_index: 0,
            }],
        );

        data.bonuses.insert(
            10390,
            vec![ItemBonusFlat {
                id: 22157,
                parent_item_bonus_list_id: 10390,
                bonus_type: 4, // Name suffix
                value_0: 14095,
                value_1: 0,
                value_2: 0,
                value_3: 0,
                order_index: 0,
            }],
        );

        // Add rand prop points for ilvl 717
        data.rand_prop_points.insert(
            717,
            RandPropPointsFlat {
                id: 717,
                epic_f_0: 5000.0,
                ..Default::default()
            },
        );

        let base_stats = vec![ItemStat {
            stat_type: 71, // Agility
            value: 6666,
        }];

        let bonus_ids = vec![10390, 6652, 10383, 13444, 10029, 10255];
        let result = apply_item_bonuses(155, &base_stats, 3, &bonus_ids, &data, Some(80));

        // Base 155 + bonus 562 = 717
        assert_eq!(result.item_level, 717, "Expected ilvl 717, got {}", result.item_level);
    }
}
