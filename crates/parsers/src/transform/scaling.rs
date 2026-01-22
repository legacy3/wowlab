//! Transformation functions for item scaling DBC tables

use crate::dbc::DbcData;
use wowlab_types::data::{CurveFlat, CurvePointFlat, ItemBonusFlat, RandPropPointsFlat};

/// Transform all item bonuses from DBC data
pub fn transform_all_item_bonuses(dbc: &DbcData) -> Vec<ItemBonusFlat> {
    dbc.item_bonus
        .values()
        .flatten()
        .map(|row| ItemBonusFlat {
            id: row.ID,
            value_0: row.Value_0,
            value_1: row.Value_1,
            value_2: row.Value_2,
            value_3: row.Value_3,
            parent_item_bonus_list_id: row.ParentItemBonusListID,
            bonus_type: row.Type,
            order_index: row.OrderIndex,
        })
        .collect()
}

/// Transform all curves from DBC data
pub fn transform_all_curves(dbc: &DbcData) -> Vec<CurveFlat> {
    dbc.curve
        .values()
        .map(|row| CurveFlat {
            id: row.ID,
            curve_type: row.Type,
            flags: row.Flags,
        })
        .collect()
}

/// Transform all curve points from DBC data
pub fn transform_all_curve_points(dbc: &DbcData) -> Vec<CurvePointFlat> {
    dbc.curve_point
        .values()
        .flatten()
        .map(|row| CurvePointFlat {
            id: row.ID,
            curve_id: row.CurveID,
            order_index: row.OrderIndex,
            pos_0: row.Pos_0,
            pos_1: row.Pos_1,
            pos_pre_squish_0: row.PosPreSquish_0,
            pos_pre_squish_1: row.PosPreSquish_1,
        })
        .collect()
}

/// Transform all random property points from DBC data
pub fn transform_all_rand_prop_points(dbc: &DbcData) -> Vec<RandPropPointsFlat> {
    dbc.rand_prop_points
        .values()
        .map(|row| RandPropPointsFlat {
            id: row.ID,
            damage_replace_stat_f: row.DamageReplaceStatF,
            damage_secondary_f: row.DamageSecondaryF,
            damage_replace_stat: row.DamageReplaceStat,
            damage_secondary: row.DamageSecondary,
            epic_f_0: row.EpicF_0,
            epic_f_1: row.EpicF_1,
            epic_f_2: row.EpicF_2,
            epic_f_3: row.EpicF_3,
            epic_f_4: row.EpicF_4,
            superior_f_0: row.SuperiorF_0,
            superior_f_1: row.SuperiorF_1,
            superior_f_2: row.SuperiorF_2,
            superior_f_3: row.SuperiorF_3,
            superior_f_4: row.SuperiorF_4,
            good_f_0: row.GoodF_0,
            good_f_1: row.GoodF_1,
            good_f_2: row.GoodF_2,
            good_f_3: row.GoodF_3,
            good_f_4: row.GoodF_4,
            epic_0: row.Epic_0,
            epic_1: row.Epic_1,
            epic_2: row.Epic_2,
            epic_3: row.Epic_3,
            epic_4: row.Epic_4,
            superior_0: row.Superior_0,
            superior_1: row.Superior_1,
            superior_2: row.Superior_2,
            superior_3: row.Superior_3,
            superior_4: row.Superior_4,
            good_0: row.Good_0,
            good_1: row.Good_1,
            good_2: row.Good_2,
            good_3: row.Good_3,
            good_4: row.Good_4,
        })
        .collect()
}
