use schemars::JsonSchema;
use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
pub enum ColType {
    Int,
    Text,
    Bool,
    Float,
}

#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Column {
    pub name: &'static str,
    #[serde(rename = "type")]
    pub typ: ColType,
}

#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Table {
    pub name: &'static str,
    pub columns: &'static [Column],
}

const fn col(name: &'static str, typ: ColType) -> Column {
    Column { name, typ }
}

use ColType::*;

pub static TABLES: &[Table] = &[
    Table {
        name: "game.spells",
        columns: &[
            col("id", Int),
            col("patch_version", Text),
            col("name", Text),
            col("description", Text),
            col("aura_description", Text),
            col("file_name", Text),
            col("is_passive", Bool),
            col("cast_time", Int),
            col("recovery_time", Int),
            col("start_recovery_time", Int),
            col("mana_cost", Int),
            col("power_cost", Int),
            col("power_cost_pct", Float),
            col("power_type", Int),
            col("charge_recovery_time", Int),
            col("max_charges", Int),
            col("range_max_0", Float),
            col("range_max_1", Float),
            col("range_min_0", Float),
            col("range_min_1", Float),
            col("cone_degrees", Float),
            col("radius_max", Float),
            col("radius_min", Float),
            col("defense_type", Int),
            col("school_mask", Int),
            col("bonus_coefficient_from_ap", Float),
            col("effect_bonus_coefficient", Float),
            col("interrupt_aura_0", Int),
            col("interrupt_aura_1", Int),
            col("interrupt_channel_0", Int),
            col("interrupt_channel_1", Int),
            col("interrupt_flags", Int),
            col("duration", Int),
            col("max_duration", Int),
            col("can_empower", Bool),
            col("dispel_type", Int),
            col("facing_caster_flags", Int),
            col("speed", Float),
            col("spell_class_mask_1", Int),
            col("spell_class_mask_2", Int),
            col("spell_class_mask_3", Int),
            col("spell_class_mask_4", Int),
            col("spell_class_set", Int),
            col("base_level", Int),
            col("max_level", Int),
            col("max_passive_aura_level", Int),
            col("spell_level", Int),
            col("caster_aura_spell", Int),
            col("caster_aura_state", Int),
            col("exclude_caster_aura_spell", Int),
            col("exclude_caster_aura_state", Int),
            col("exclude_target_aura_spell", Int),
            col("exclude_target_aura_state", Int),
            col("target_aura_spell", Int),
            col("target_aura_state", Int),
            col("replacement_spell_id", Int),
            col("shapeshift_exclude_0", Int),
            col("shapeshift_exclude_1", Int),
            col("shapeshift_mask_0", Int),
            col("shapeshift_mask_1", Int),
            col("stance_bar_order", Int),
            col("required_totem_category_0", Int),
            col("required_totem_category_1", Int),
            col("totem_0", Int),
            col("totem_1", Int),
        ],
    },
    Table {
        name: "game.items",
        columns: &[
            col("id", Int),
            col("patch_version", Text),
            col("name", Text),
            col("description", Text),
            col("file_name", Text),
            col("item_level", Int),
            col("quality", Int),
            col("required_level", Int),
            col("binding", Int),
            col("buy_price", Int),
            col("sell_price", Int),
            col("max_count", Int),
            col("stackable", Int),
            col("speed", Int),
            col("class_id", Int),
            col("subclass_id", Int),
            col("inventory_type", Int),
            col("socket_bonus_enchant_id", Int),
            col("allowable_class", Int),
            col("expansion_id", Int),
            col("item_set_id", Int),
            col("dmg_variance", Float),
            col("gem_properties", Int),
            col("modified_crafting_reagent_item_id", Int),
        ],
    },
    Table {
        name: "game.auras",
        columns: &[
            col("spell_id", Int),
            col("patch_version", Text),
            col("base_duration_ms", Int),
            col("max_duration_ms", Int),
            col("max_stacks", Int),
            col("periodic_type", Text),
            col("tick_period_ms", Int),
            col("refresh_behavior", Text),
            col("duration_hasted", Bool),
            col("hasted_ticks", Bool),
            col("pandemic_refresh", Bool),
            col("rolling_periodic", Bool),
            col("tick_may_crit", Bool),
            col("tick_on_application", Bool),
        ],
    },
    Table {
        name: "game.specs",
        columns: &[
            col("id", Int),
            col("patch_version", Text),
            col("name", Text),
            col("description", Text),
            col("class_id", Int),
            col("class_name", Text),
            col("role", Int),
            col("order_index", Int),
            col("icon_file_id", Int),
            col("primary_stat_priority", Int),
            col("mastery_spell_id_0", Int),
            col("mastery_spell_id_1", Int),
            col("file_name", Text),
        ],
    },
    Table {
        name: "game.specs_traits",
        columns: &[
            col("spec_id", Int),
            col("patch_version", Text),
            col("spec_name", Text),
            col("class_name", Text),
            col("tree_id", Int),
        ],
    },
    Table {
        name: "game.classes",
        columns: &[
            col("id", Int),
            col("patch_version", Text),
            col("name", Text),
            col("filename", Text),
            col("icon_file_id", Int),
            col("color", Text),
            col("spell_class_set", Int),
            col("primary_stat_priority", Int),
            col("roles_mask", Int),
            col("file_name", Text),
        ],
    },
];

pub fn get_table(name: &str) -> Option<&'static Table> {
    TABLES.iter().find(|t| t.name == name)
}

pub fn get_column(table: &Table, col_name: &str) -> Option<&'static Column> {
    table.columns.iter().find(|c| c.name == col_name)
}
