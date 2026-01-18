//! Item transformation - converts raw DBC data into ItemDataFlat

use crate::dbc::DbcData;
use crate::errors::TransformError;
use crate::flat::{
    ItemClassification, ItemDataFlat, ItemDropSource, ItemEffect, ItemSetBonus, ItemSetInfo,
    ItemStat,
};

/// Static lookup for expansion names
const EXPANSION_NAMES: &[(i32, &str)] = &[
    (0, "Classic"),
    (1, "The Burning Crusade"),
    (2, "Wrath of the Lich King"),
    (3, "Cataclysm"),
    (4, "Mists of Pandaria"),
    (5, "Warlords of Draenor"),
    (6, "Legion"),
    (7, "Battle for Azeroth"),
    (8, "Shadowlands"),
    (9, "Dragonflight"),
    (10, "The War Within"),
];

/// Static lookup for inventory type names
const INVENTORY_TYPE_NAMES: &[(i32, &str)] = &[
    (0, "Non-equippable"),
    (1, "Head"),
    (2, "Neck"),
    (3, "Shoulder"),
    (4, "Shirt"),
    (5, "Chest"),
    (6, "Waist"),
    (7, "Legs"),
    (8, "Feet"),
    (9, "Wrist"),
    (10, "Hands"),
    (11, "Finger"),
    (12, "Trinket"),
    (13, "One-Hand"),
    (14, "Shield"),
    (15, "Ranged"),
    (16, "Back"),
    (17, "Two-Hand"),
    (18, "Bag"),
    (19, "Tabard"),
    (20, "Robe"),
    (21, "Main Hand"),
    (22, "Off Hand"),
    (23, "Held In Off-Hand"),
    (24, "Ammo"),
    (25, "Thrown"),
    (26, "Ranged Right"),
    (28, "Relic"),
];

fn get_expansion_name(id: i32) -> &'static str {
    EXPANSION_NAMES
        .iter()
        .find(|(i, _)| *i == id)
        .map(|(_, name)| *name)
        .unwrap_or("Unknown")
}

fn get_inventory_type_name(id: i32) -> &'static str {
    INVENTORY_TYPE_NAMES
        .iter()
        .find(|(i, _)| *i == id)
        .map(|(_, name)| *name)
        .unwrap_or("Unknown")
}

/// Transform an item ID into flat item data
pub fn transform_item(dbc: &DbcData, item_id: i32) -> Result<ItemDataFlat, TransformError> {
    let item = dbc
        .item
        .get(&item_id)
        .ok_or(TransformError::ItemNotFound { item_id })?;

    let sparse = dbc.item_sparse.get(&item_id);

    // Resolve icon file name
    let mut icon_file_data_id = item.IconFileDataID;

    if icon_file_data_id == 0 {
        // Try to get from item appearance
        if let Some(modified_appearance) = dbc.item_modified_appearance.get(&item_id) {
            if let Some(appearance) = dbc
                .item_appearance
                .get(&modified_appearance.ItemAppearanceID)
            {
                if appearance.DefaultIconFileDataID > 0 {
                    icon_file_data_id = appearance.DefaultIconFileDataID;
                }
            }
        }
    }

    let file_name = if icon_file_data_id > 0 {
        dbc.manifest_interface_data
            .get(&icon_file_data_id)
            .map(|m| m.FileName.to_lowercase().replace(".blp", ""))
            .unwrap_or_else(|| "inv_misc_questionmark".to_string())
    } else {
        "inv_misc_questionmark".to_string()
    };

    // Resolve effects
    let effect_links = dbc.item_x_item_effect.get(&item_id);
    let effects: Vec<ItemEffect> = effect_links
        .map(|links| {
            links
                .iter()
                .filter_map(|link| {
                    dbc.item_effect
                        .get(&link.ItemEffectID)
                        .map(|effect| ItemEffect {
                            spell_id: effect.SpellID,
                            trigger_type: effect.TriggerType,
                            charges: effect.Charges,
                            cooldown: effect.CoolDownMSec,
                            category_cooldown: effect.CategoryCoolDownMSec,
                        })
                })
                .collect()
        })
        .unwrap_or_default();

    // Resolve stats
    let stats: Vec<ItemStat> = sparse
        .map(|s| {
            let stat_types = [
                s.StatModifierBonusStat_0,
                s.StatModifierBonusStat_1,
                s.StatModifierBonusStat_2,
                s.StatModifierBonusStat_3,
                s.StatModifierBonusStat_4,
                s.StatModifierBonusStat_5,
                s.StatModifierBonusStat_6,
                s.StatModifierBonusStat_7,
                s.StatModifierBonusStat_8,
                s.StatModifierBonusStat_9,
            ];
            let stat_values = [
                s.StatPercentEditor_0,
                s.StatPercentEditor_1,
                s.StatPercentEditor_2,
                s.StatPercentEditor_3,
                s.StatPercentEditor_4,
                s.StatPercentEditor_5,
                s.StatPercentEditor_6,
                s.StatPercentEditor_7,
                s.StatPercentEditor_8,
                s.StatPercentEditor_9,
            ];

            stat_types
                .iter()
                .zip(stat_values.iter())
                .filter(|(&t, _)| t != -1 && t != 0)
                .map(|(&t, &v)| ItemStat {
                    stat_type: t,
                    value: v,
                })
                .collect()
        })
        .unwrap_or_default();

    // Resolve classification
    let expansion_id = sparse.map(|s| s.ExpansionID).unwrap_or(0);
    let item_class_row = dbc.item_class_by_class_id.get(&item.ClassID);
    let item_sub_classes = dbc.item_sub_class_by_class_id.get(&item.ClassID);
    let item_sub_class_row =
        item_sub_classes.and_then(|scs| scs.iter().find(|sc| sc.SubClassID == item.SubclassID));

    let classification = Some(ItemClassification {
        class_id: item.ClassID,
        class_name: item_class_row
            .and_then(|c| c.ClassName_lang.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        subclass_id: item.SubclassID,
        subclass_name: item_sub_class_row
            .and_then(|sc| sc.DisplayName_lang.clone())
            .unwrap_or_else(|| "Unknown".to_string()),
        inventory_type: item.InventoryType,
        inventory_type_name: get_inventory_type_name(item.InventoryType).to_string(),
        expansion_id,
        expansion_name: get_expansion_name(expansion_id).to_string(),
    });

    // Resolve sockets
    let sockets: Vec<i32> = sparse
        .map(|s| {
            [s.SocketType_0, s.SocketType_1, s.SocketType_2]
                .into_iter()
                .filter(|&t| t > 0)
                .collect()
        })
        .unwrap_or_default();

    // Resolve flags
    let flags: Vec<i32> = sparse
        .map(|s| vec![s.Flags_0, s.Flags_1, s.Flags_2, s.Flags_3, s.Flags_4])
        .unwrap_or_default();

    // Resolve set info
    let item_set_id = sparse.map(|s| s.ItemSet).unwrap_or(0);
    let set_info = if item_set_id > 0 {
        dbc.item_set.get(&item_set_id).map(|item_set| {
            let item_ids: Vec<i32> = [
                item_set.ItemID_0,
                item_set.ItemID_1,
                item_set.ItemID_2,
                item_set.ItemID_3,
                item_set.ItemID_4,
                item_set.ItemID_5,
                item_set.ItemID_6,
                item_set.ItemID_7,
                item_set.ItemID_8,
                item_set.ItemID_9,
                item_set.ItemID_10,
                item_set.ItemID_11,
                item_set.ItemID_12,
                item_set.ItemID_13,
                item_set.ItemID_14,
                item_set.ItemID_15,
                item_set.ItemID_16,
            ]
            .into_iter()
            .filter(|&id| id > 0)
            .collect();

            let bonuses: Vec<ItemSetBonus> = dbc
                .item_set_spell
                .get(&item_set_id)
                .map(|spells| {
                    spells
                        .iter()
                        .map(|spell| ItemSetBonus {
                            threshold: spell.Threshold,
                            spell_id: spell.SpellID,
                            spec_id: spell.ChrSpecID,
                        })
                        .collect()
                })
                .unwrap_or_default();

            ItemSetInfo {
                set_id: item_set_id,
                set_name: item_set
                    .Name_lang
                    .clone()
                    .unwrap_or_else(|| "Unknown Set".to_string()),
                item_ids,
                bonuses,
            }
        })
    } else {
        None
    };

    // Resolve drop sources
    let drop_sources: Vec<ItemDropSource> = dbc
        .journal_encounter_item
        .get(&item_id)
        .map(|encounter_items| {
            encounter_items
                .iter()
                .filter_map(|encounter_item| {
                    let encounter = dbc
                        .journal_encounter
                        .get(&encounter_item.JournalEncounterID)?;
                    let instance = dbc.journal_instance.get(&encounter.JournalInstanceID);

                    Some(ItemDropSource {
                        instance_id: instance.map(|i| i.ID).unwrap_or(0),
                        instance_name: instance
                            .and_then(|i| i.Name_lang.clone())
                            .unwrap_or_else(|| "Unknown".to_string()),
                        encounter_id: encounter.ID,
                        encounter_name: encounter
                            .Name_lang
                            .clone()
                            .unwrap_or_else(|| "Unknown".to_string()),
                        difficulty_mask: encounter_item.DifficultyMask,
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(ItemDataFlat {
        id: item_id,
        name: sparse
            .and_then(|s| s.Display_lang.clone())
            .unwrap_or_default(),
        description: sparse
            .and_then(|s| s.Description_lang.clone())
            .unwrap_or_default(),
        file_name,
        item_level: sparse.map(|s| s.ItemLevel).unwrap_or(0),
        quality: sparse.map(|s| s.OverallQualityID).unwrap_or(0),
        required_level: sparse.map(|s| s.RequiredLevel).unwrap_or(0),
        binding: sparse.map(|s| s.Bonding).unwrap_or(0),
        buy_price: sparse.map(|s| s.BuyPrice).unwrap_or(0),
        sell_price: sparse.map(|s| s.SellPrice).unwrap_or(0),
        max_count: sparse.map(|s| s.MaxCount).unwrap_or(0),
        stackable: sparse.map(|s| s.Stackable).unwrap_or(1),
        speed: sparse.map(|s| s.ItemDelay).unwrap_or(0),
        class_id: item.ClassID,
        subclass_id: item.SubclassID,
        inventory_type: item.InventoryType,
        classification,
        stats,
        effects,
        sockets,
        socket_bonus_enchant_id: sparse.map(|s| s.SocketMatchEnchantmentID).unwrap_or(0),
        flags,
        allowable_class: sparse.map(|s| s.AllowableClass).unwrap_or(-1),
        allowable_race: sparse.map(|s| s.AllowableRace).unwrap_or(-1),
        expansion_id,
        item_set_id,
        set_info,
        drop_sources,
        dmg_variance: sparse.map(|s| s.DmgVariance).unwrap_or(0.0),
        gem_properties: sparse.map(|s| s.GemProperties).unwrap_or(0),
        modified_crafting_reagent_item_id: item.ModifiedCraftingReagentItemID,
    })
}

/// Transform all items in the database
pub fn transform_all_items(dbc: &DbcData) -> Vec<ItemDataFlat> {
    dbc.item
        .keys()
        .filter_map(|&item_id| {
            transform_item(dbc, item_id)
                .inspect_err(|e| tracing::warn!(item_id, error = %e, "Failed to transform item"))
                .ok()
        })
        .collect()
}
