//! Database operations for snapshot sync
//!
//! Provides bulk insert operations with:
//! - Automatic batching respecting Postgres bind limits
//! - Progress tracking
//! - Upsert conflict handling

use indicatif::{ProgressBar, ProgressStyle};
use serde::Serialize;
use snapshot_parser::{
    AuraDataFlat, ClassDataFlat, GlobalColorFlat, GlobalStringFlat, ItemDataFlat, SpecDataFlat,
    SpellDataFlat, TraitTreeFlat,
};
use sqlx::{PgPool, Postgres, QueryBuilder, Transaction};

use super::SyncTable;

// ============================================================================
// Constants
// ============================================================================

/// Postgres maximum bind parameters per query.
const PG_BIND_LIMIT: usize = 65535;

/// Calculate safe batch size for a given column count.
const fn batch_size(columns: usize) -> usize {
    PG_BIND_LIMIT / columns - 1
}

// ============================================================================
// Public API
// ============================================================================

/// Connect to the database.
pub async fn connect() -> Result<PgPool, anyhow::Error> {
    let url = std::env::var("SUPABASE_DB_URL").map_err(|_| {
        anyhow::anyhow!(
            "SUPABASE_DB_URL not set. Get it from Supabase Dashboard -> Settings -> Database -> Connection string"
        )
    })?;
    Ok(PgPool::connect(&url).await?)
}

/// Check if a table should be synced based on the filter.
pub fn should_sync(tables: &[SyncTable], table: SyncTable) -> bool {
    tables.is_empty() || tables.contains(&table)
}

/// Delete existing data for a patch version.
pub async fn cleanup_patch(
    tx: &mut Transaction<'_, Postgres>,
    patch: &str,
    tables: &[SyncTable],
) -> Result<(), sqlx::Error> {
    let mappings: &[(SyncTable, &str)] = &[
        (SyncTable::Spells, "game.spells"),
        (SyncTable::Traits, "game.specs_traits"),
        (SyncTable::Items, "game.items"),
        (SyncTable::Auras, "game.auras"),
        (SyncTable::Specs, "game.specs"),
        (SyncTable::Classes, "game.classes"),
        (SyncTable::GlobalColors, "game.global_colors"),
        (SyncTable::GlobalStrings, "game.global_strings"),
    ];

    for (sync_table, table_name) in mappings {
        if should_sync(tables, *sync_table) {
            let sql = format!("DELETE FROM {} WHERE patch_version = $1", table_name);
            let result = sqlx::query(&sql).bind(patch).execute(&mut **tx).await?;
            tracing::debug!("  Deleted {} rows from {}", result.rows_affected(), table_name);
        }
    }

    Ok(())
}

// ============================================================================
// Insert Functions
// ============================================================================

pub async fn insert_spells(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[SpellDataFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "id", "patch_version", "name", "description", "aura_description", "description_variables",
        "file_name", "is_passive", "knowledge_source", "cast_time", "recovery_time", "start_recovery_time",
        "mana_cost", "power_cost", "power_cost_pct", "power_type", "charge_recovery_time", "max_charges",
        "range_max_0", "range_max_1", "range_min_0", "range_min_1", "cone_degrees", "radius_max", "radius_min",
        "defense_type", "school_mask", "bonus_coefficient_from_ap", "effect_bonus_coefficient",
        "interrupt_aura_0", "interrupt_aura_1", "interrupt_channel_0", "interrupt_channel_1", "interrupt_flags",
        "duration", "max_duration", "can_empower", "empower_stages", "dispel_type", "facing_caster_flags", "speed",
        "spell_class_mask_1", "spell_class_mask_2", "spell_class_mask_3", "spell_class_mask_4", "spell_class_set",
        "base_level", "max_level", "max_passive_aura_level", "spell_level",
        "caster_aura_spell", "caster_aura_state", "exclude_caster_aura_spell", "exclude_caster_aura_state",
        "exclude_target_aura_spell", "exclude_target_aura_state", "target_aura_spell", "target_aura_state",
        "replacement_spell_id", "shapeshift_exclude_0", "shapeshift_exclude_1", "shapeshift_mask_0", "shapeshift_mask_1",
        "stance_bar_order", "required_totem_category_0", "required_totem_category_1", "totem_0", "totem_1",
        "attributes", "effect_trigger_spell", "implicit_target", "learn_spells",
    ];

    let pb = progress_bar(rows.len(), "Spells");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.spells ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, s| {
            b.push_bind(s.id)
                .push_bind(patch)
                .push_bind(&s.name)
                .push_bind(&s.description)
                .push_bind(&s.aura_description)
                .push_bind(&s.description_variables)
                .push_bind(&s.file_name)
                .push_bind(s.is_passive)
                .push_bind(to_json(&s.knowledge_source))
                .push_bind(s.cast_time)
                .push_bind(s.recovery_time)
                .push_bind(s.start_recovery_time)
                .push_bind(s.mana_cost)
                .push_bind(s.power_cost)
                .push_bind(s.power_cost_pct)
                .push_bind(s.power_type)
                .push_bind(s.charge_recovery_time)
                .push_bind(s.max_charges)
                .push_bind(s.range_max_0)
                .push_bind(s.range_max_1)
                .push_bind(s.range_min_0)
                .push_bind(s.range_min_1)
                .push_bind(s.cone_degrees)
                .push_bind(s.radius_max)
                .push_bind(s.radius_min)
                .push_bind(s.defense_type)
                .push_bind(s.school_mask)
                .push_bind(s.bonus_coefficient_from_ap)
                .push_bind(s.effect_bonus_coefficient)
                .push_bind(s.interrupt_aura_0)
                .push_bind(s.interrupt_aura_1)
                .push_bind(s.interrupt_channel_0)
                .push_bind(s.interrupt_channel_1)
                .push_bind(s.interrupt_flags)
                .push_bind(s.duration)
                .push_bind(s.max_duration)
                .push_bind(s.can_empower)
                .push_bind(to_json(&s.empower_stages))
                .push_bind(s.dispel_type)
                .push_bind(s.facing_caster_flags)
                .push_bind(s.speed)
                .push_bind(s.spell_class_mask_1)
                .push_bind(s.spell_class_mask_2)
                .push_bind(s.spell_class_mask_3)
                .push_bind(s.spell_class_mask_4)
                .push_bind(s.spell_class_set)
                .push_bind(s.base_level)
                .push_bind(s.max_level)
                .push_bind(s.max_passive_aura_level)
                .push_bind(s.spell_level)
                .push_bind(s.caster_aura_spell)
                .push_bind(s.caster_aura_state)
                .push_bind(s.exclude_caster_aura_spell)
                .push_bind(s.exclude_caster_aura_state)
                .push_bind(s.exclude_target_aura_spell)
                .push_bind(s.exclude_target_aura_state)
                .push_bind(s.target_aura_spell)
                .push_bind(s.target_aura_state)
                .push_bind(s.replacement_spell_id)
                .push_bind(s.shapeshift_exclude_0)
                .push_bind(s.shapeshift_exclude_1)
                .push_bind(s.shapeshift_mask_0)
                .push_bind(s.shapeshift_mask_1)
                .push_bind(s.stance_bar_order)
                .push_bind(s.required_totem_category_0)
                .push_bind(s.required_totem_category_1)
                .push_bind(s.totem_0)
                .push_bind(s.totem_1)
                .push_bind(&s.attributes)
                .push_bind(&s.effect_trigger_spell)
                .push_bind(&s.implicit_target)
                .push_bind(to_json(&s.learn_spells));
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_traits(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[TraitTreeFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "spec_id", "patch_version", "spec_name", "class_name", "tree_id",
        "all_node_ids", "nodes", "edges", "sub_trees", "point_limits",
    ];

    let pb = progress_bar(rows.len(), "Traits");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.specs_traits ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, t| {
            b.push_bind(t.spec_id)
                .push_bind(patch)
                .push_bind(&t.spec_name)
                .push_bind(&t.class_name)
                .push_bind(t.tree_id)
                .push_bind(&t.all_node_ids)
                .push_bind(to_json(&t.nodes))
                .push_bind(to_json(&t.edges))
                .push_bind(to_json(&t.sub_trees))
                .push_bind(to_json(&t.point_limits));
        });

        qb.push(" ON CONFLICT (spec_id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_items(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[ItemDataFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "id", "patch_version", "name", "description", "file_name", "item_level", "quality",
        "required_level", "binding", "buy_price", "sell_price", "max_count", "stackable", "speed",
        "class_id", "subclass_id", "inventory_type", "classification", "stats", "effects",
        "sockets", "socket_bonus_enchant_id", "flags", "allowable_class", "allowable_race",
        "expansion_id", "item_set_id", "set_info", "drop_sources", "dmg_variance",
        "gem_properties", "modified_crafting_reagent_item_id",
    ];

    let pb = progress_bar(rows.len(), "Items");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.items ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, i| {
            b.push_bind(i.id)
                .push_bind(patch)
                .push_bind(&i.name)
                .push_bind(&i.description)
                .push_bind(&i.file_name)
                .push_bind(i.item_level)
                .push_bind(i.quality)
                .push_bind(i.required_level)
                .push_bind(i.binding)
                .push_bind(i.buy_price)
                .push_bind(i.sell_price)
                .push_bind(i.max_count)
                .push_bind(i.stackable)
                .push_bind(i.speed)
                .push_bind(i.class_id)
                .push_bind(i.subclass_id)
                .push_bind(i.inventory_type)
                .push_bind(to_json(&i.classification))
                .push_bind(to_json(&i.stats))
                .push_bind(to_json(&i.effects))
                .push_bind(&i.sockets)
                .push_bind(i.socket_bonus_enchant_id)
                .push_bind(&i.flags)
                .push_bind(i.allowable_class)
                .push_bind(i.allowable_race)
                .push_bind(i.expansion_id)
                .push_bind(i.item_set_id)
                .push_bind(to_json(&i.set_info))
                .push_bind(to_json(&i.drop_sources))
                .push_bind(i.dmg_variance)
                .push_bind(i.gem_properties)
                .push_bind(i.modified_crafting_reagent_item_id);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_auras(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[AuraDataFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "spell_id", "patch_version", "base_duration_ms", "max_duration_ms", "max_stacks",
        "periodic_type", "tick_period_ms", "refresh_behavior", "duration_hasted", "hasted_ticks",
        "pandemic_refresh", "rolling_periodic", "tick_may_crit", "tick_on_application",
    ];

    let pb = progress_bar(rows.len(), "Auras");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.auras ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, a| {
            let periodic_type = a
                .periodic_type
                .as_ref()
                .and_then(|t| serde_json::to_value(t).ok())
                .and_then(|v| v.as_str().map(|s| s.to_string()));

            let refresh_behavior = serde_json::to_value(&a.refresh_behavior)
                .ok()
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .unwrap_or_else(|| "pandemic".to_string());

            b.push_bind(a.spell_id)
                .push_bind(patch)
                .push_bind(a.base_duration_ms)
                .push_bind(a.max_duration_ms)
                .push_bind(a.max_stacks)
                .push_bind(periodic_type)
                .push_bind(a.tick_period_ms)
                .push_bind(refresh_behavior)
                .push_bind(a.duration_hasted)
                .push_bind(a.hasted_ticks)
                .push_bind(a.pandemic_refresh)
                .push_bind(a.rolling_periodic)
                .push_bind(a.tick_may_crit)
                .push_bind(a.tick_on_application);
        });

        qb.push(" ON CONFLICT (spell_id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_specs(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[SpecDataFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "id", "patch_version", "name", "description", "class_id", "class_name",
        "role", "order_index", "icon_file_id", "file_name", "primary_stat_priority",
        "mastery_spell_id_0", "mastery_spell_id_1",
    ];

    let pb = progress_bar(rows.len(), "Specs");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.specs ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, s| {
            b.push_bind(s.id)
                .push_bind(patch)
                .push_bind(&s.name)
                .push_bind(&s.description)
                .push_bind(s.class_id)
                .push_bind(&s.class_name)
                .push_bind(s.role)
                .push_bind(s.order_index)
                .push_bind(s.icon_file_id)
                .push_bind(&s.file_name)
                .push_bind(s.primary_stat_priority)
                .push_bind(s.mastery_spell_id_0)
                .push_bind(s.mastery_spell_id_1);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_classes(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[ClassDataFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &[
        "id", "patch_version", "name", "filename", "icon_file_id", "file_name", "color",
        "spell_class_set", "primary_stat_priority", "roles_mask",
    ];

    let pb = progress_bar(rows.len(), "Classes");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.classes ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, c| {
            b.push_bind(c.id)
                .push_bind(patch)
                .push_bind(&c.name)
                .push_bind(&c.filename)
                .push_bind(c.icon_file_id)
                .push_bind(&c.file_name)
                .push_bind(&c.color)
                .push_bind(c.spell_class_set)
                .push_bind(c.primary_stat_priority)
                .push_bind(c.roles_mask);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_global_colors(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[GlobalColorFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &["id", "patch_version", "name", "color"];

    let pb = progress_bar(rows.len(), "GlobalColors");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.global_colors ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, c| {
            b.push_bind(c.id)
                .push_bind(patch)
                .push_bind(&c.name)
                .push_bind(&c.color);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

pub async fn insert_global_strings(
    tx: &mut Transaction<'_, Postgres>,
    rows: &[GlobalStringFlat],
    patch: &str,
) -> Result<(), sqlx::Error> {
    const COLUMNS: &[&str] = &["id", "patch_version", "tag", "value", "flags"];

    let pb = progress_bar(rows.len(), "GlobalStrings");

    for chunk in rows.chunks(batch_size(COLUMNS.len())) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(format!(
            "INSERT INTO game.global_strings ({}) ",
            COLUMNS.join(", ")
        ));

        qb.push_values(chunk, |mut b, s| {
            b.push_bind(s.id)
                .push_bind(patch)
                .push_bind(&s.tag)
                .push_bind(&s.value)
                .push_bind(s.flags);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET ");
        qb.push(upsert_all_columns(COLUMNS));
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

// ============================================================================
// Helpers
// ============================================================================

/// Generate ON CONFLICT UPDATE clause for all columns except the first (primary key).
fn upsert_all_columns(columns: &[&str]) -> String {
    columns[1..]
        .iter()
        .map(|c| format!("{} = EXCLUDED.{}", c, c))
        .chain(std::iter::once("updated_at = NOW()".to_string()))
        .collect::<Vec<_>>()
        .join(", ")
}

/// Convert a value to JSON for database storage.
fn to_json<T: Serialize>(value: &T) -> serde_json::Value {
    serde_json::to_value(value).unwrap_or(serde_json::Value::Null)
}

/// Create a progress bar with consistent styling.
fn progress_bar(total: usize, label: &str) -> ProgressBar {
    let pb = ProgressBar::new(total as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template(&format!("  {} [{{bar:40}}] {{pos}}/{{len}} ({{percent}}%)", label))
            .expect("valid template"),
    );
    pb
}
