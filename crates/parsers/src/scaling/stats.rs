//! Stat budget and stat name utilities
//!
//! Provides lookup for stat budgets from RandPropPoints and stat type names.

use wowlab_types::data::{ItemQuality, ItemScalingData, RandPropPointsFlat};

/// Get the stat budget for an item level and quality.
///
/// The budget is used to calculate stat values:
/// `stat_value = stat_alloc * budget * 0.0001`
///
/// # Arguments
/// * `scaling_data` - The scaling data bundle
/// * `item_level` - The item level (used as key into rand_prop_points)
/// * `quality` - The item quality tier
/// * `slot_index` - The slot modifier index (0-4, affects budget tier)
///
/// # Returns
/// The stat budget value, or None if not found
pub fn get_stat_budget(
    scaling_data: &ItemScalingData,
    item_level: i32,
    quality: ItemQuality,
    slot_index: usize,
) -> Option<f64> {
    let rpp = scaling_data.rand_prop_points.get(&item_level)?;
    get_stat_budget_from_rpp(rpp, quality, slot_index)
}

/// Get stat budget directly from RandPropPoints row.
pub fn get_stat_budget_from_rpp(
    rpp: &RandPropPointsFlat,
    quality: ItemQuality,
    slot_index: usize,
) -> Option<f64> {
    let slot_index = slot_index.min(4); // Clamp to valid range

    let budget = match quality {
        ItemQuality::Epic | ItemQuality::Legendary | ItemQuality::Artifact => match slot_index {
            0 => rpp.epic_f_0,
            1 => rpp.epic_f_1,
            2 => rpp.epic_f_2,
            3 => rpp.epic_f_3,
            _ => rpp.epic_f_4,
        },
        ItemQuality::Rare => match slot_index {
            0 => rpp.superior_f_0,
            1 => rpp.superior_f_1,
            2 => rpp.superior_f_2,
            3 => rpp.superior_f_3,
            _ => rpp.superior_f_4,
        },
        ItemQuality::Heirloom => match slot_index {
            0 => rpp.superior_f_0,
            1 => rpp.superior_f_1,
            2 => rpp.superior_f_2,
            3 => rpp.superior_f_3,
            _ => rpp.superior_f_4,
        },
        ItemQuality::Uncommon => match slot_index {
            0 => rpp.good_f_0,
            1 => rpp.good_f_1,
            2 => rpp.good_f_2,
            3 => rpp.good_f_3,
            _ => rpp.good_f_4,
        },
        // Poor and Common items typically don't have scaling stats
        _ => return None,
    };

    Some(budget)
}

/// Get a human-readable name for a stat type ID.
///
/// These IDs come from WoW's item stat types.
pub fn get_stat_name(stat_type: i32) -> &'static str {
    match stat_type {
        0 => "Mana",
        1 => "Health",
        3 => "Agility",
        4 => "Strength",
        5 => "Intellect",
        6 => "Spirit",
        7 => "Stamina",
        // Combat ratings
        32 => "Critical Strike",
        35 => "Resilience",
        36 => "Haste",
        37 => "Expertise",
        40 => "Versatility",
        49 => "Mastery",
        // Secondary
        57 => "PvP Power",
        59 => "Multistrike",
        61 => "Versatility (bonus)",
        62 => "Bonus Armor",
        63 => "Fire Resistance",
        64 => "Frost Resistance",
        65 => "Shadow Resistance",
        66 => "Nature Resistance",
        67 => "Arcane Resistance",
        71 => "Agility or Strength or Intellect",
        72 => "Agility or Strength",
        73 => "Agility or Intellect",
        74 => "Strength or Intellect",
        // Tertiary
        91 => "Avoidance",
        92 => "Sturdiness",
        93 => "Leech",
        94 => "Speed",
        95 => "Indestructible",
        // Weapon stats
        45 => "Spell Power",
        46 => "Health Regen",
        47 => "Spell Penetration",
        48 => "Block",
        50 => "Attack Power",
        // Unknown/other
        _ => "Unknown",
    }
}

/// Get whether a stat type is a primary stat.
pub fn is_primary_stat(stat_type: i32) -> bool {
    matches!(stat_type, 3 | 4 | 5 | 7 | 71 | 72 | 73 | 74)
}

/// Get whether a stat type is a secondary rating.
pub fn is_secondary_stat(stat_type: i32) -> bool {
    matches!(stat_type, 32 | 36 | 40 | 49)
}

/// Get whether a stat type is a tertiary stat.
pub fn is_tertiary_stat(stat_type: i32) -> bool {
    matches!(stat_type, 91 | 93 | 94)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stat_names() {
        assert_eq!(get_stat_name(3), "Agility");
        assert_eq!(get_stat_name(4), "Strength");
        assert_eq!(get_stat_name(5), "Intellect");
        assert_eq!(get_stat_name(7), "Stamina");
        assert_eq!(get_stat_name(32), "Critical Strike");
        assert_eq!(get_stat_name(36), "Haste");
        assert_eq!(get_stat_name(40), "Versatility");
        assert_eq!(get_stat_name(49), "Mastery");
    }

    #[test]
    fn test_stat_categories() {
        assert!(is_primary_stat(3));
        assert!(is_primary_stat(4));
        assert!(!is_primary_stat(32));

        assert!(is_secondary_stat(32));
        assert!(is_secondary_stat(36));
        assert!(!is_secondary_stat(3));

        assert!(is_tertiary_stat(91));
        assert!(is_tertiary_stat(93));
        assert!(!is_tertiary_stat(32));
    }
}
