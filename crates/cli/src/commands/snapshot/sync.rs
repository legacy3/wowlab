//! Sync command - Write transformed data to Supabase Postgres

use std::time::Instant;

use anyhow::Result;
use indicatif::{ProgressBar, ProgressStyle};
use snapshot_parser::{
    transform::{
        transform_all_auras, transform_all_items, transform_all_specs, transform_all_spells,
        transform_all_talent_trees,
    },
    AuraDataFlat, DbcData, ItemDataFlat, SpecDataFlat, SpellDataFlat, TalentTreeFlat,
};
use sqlx::{PgPool, Postgres, QueryBuilder};

use super::{SyncArgs, SyncTable};

// Postgres bind limit is 65535. Calculate safe batch sizes per table.
const SPELL_COLUMNS: usize = 72;
const ITEM_COLUMNS: usize = 32;
const AURA_COLUMNS: usize = 14;
const TALENT_COLUMNS: usize = 10;
const SPEC_COLUMNS: usize = 12;

const SPELL_BATCH: usize = 65535 / SPELL_COLUMNS - 1; // ~909
const ITEM_BATCH: usize = 65535 / ITEM_COLUMNS - 1; // ~2047
const AURA_BATCH: usize = 65535 / AURA_COLUMNS - 1; // ~4680
const TALENT_BATCH: usize = 65535 / TALENT_COLUMNS - 1; // ~6552
const SPEC_BATCH: usize = 65535 / SPEC_COLUMNS - 1; // ~5460

/// Check if a table should be synced based on the filter
fn should_sync(tables: &[SyncTable], table: SyncTable) -> bool {
    tables.is_empty() || tables.contains(&table)
}

pub async fn run_sync(args: SyncArgs) -> Result<()> {
    let total_start = Instant::now();

    // Log what we're about to do
    if args.tables.is_empty() {
        tracing::info!("Syncing ALL tables for patch {}", args.patch);
    } else {
        let table_names: Vec<_> = args.tables.iter().map(|t| t.to_string()).collect();
        tracing::info!(
            "Syncing tables [{}] for patch {}",
            table_names.join(", "),
            args.patch
        );
    }

    let database_url = std::env::var("SUPABASE_DB_URL").map_err(|_| {
        anyhow::anyhow!(
            "SUPABASE_DB_URL not set. Get it from Supabase Dashboard -> Settings -> Database -> Connection string"
        )
    })?;

    tracing::info!("Connecting to database...");
    let connect_start = Instant::now();
    let pool = PgPool::connect(&database_url).await?;
    tracing::info!(
        "Connected to database in {:.2}s",
        connect_start.elapsed().as_secs_f64()
    );

    tracing::info!("Loading DBC data from {:?}", args.data_dir);
    let load_start = Instant::now();
    let dbc = DbcData::load_all(&args.data_dir)?;
    tracing::info!(
        "Loaded DBC data in {:.2}s",
        load_start.elapsed().as_secs_f64()
    );

    // Transform only the tables we need
    tracing::info!("Transforming data...");
    let transform_start = Instant::now();

    let spells = if should_sync(&args.tables, SyncTable::Spells) {
        tracing::debug!("Transforming spells...");
        let start = Instant::now();
        let result = transform_all_spells(&dbc);
        tracing::info!(
            "  Spells: {} records in {:.2}s",
            result.len(),
            start.elapsed().as_secs_f64()
        );
        Some(result)
    } else {
        None
    };

    let talent_trees = if should_sync(&args.tables, SyncTable::Talents) {
        tracing::debug!("Transforming talents...");
        let start = Instant::now();
        let result = transform_all_talent_trees(&dbc);
        tracing::info!(
            "  Talents: {} records in {:.2}s",
            result.len(),
            start.elapsed().as_secs_f64()
        );
        Some(result)
    } else {
        None
    };

    let items = if should_sync(&args.tables, SyncTable::Items) {
        tracing::debug!("Transforming items...");
        let start = Instant::now();
        let result = transform_all_items(&dbc);
        tracing::info!(
            "  Items: {} records in {:.2}s",
            result.len(),
            start.elapsed().as_secs_f64()
        );
        Some(result)
    } else {
        None
    };

    let auras = if should_sync(&args.tables, SyncTable::Auras) {
        tracing::debug!("Transforming auras...");
        let start = Instant::now();
        let result = transform_all_auras(&dbc);
        tracing::info!(
            "  Auras: {} records in {:.2}s",
            result.len(),
            start.elapsed().as_secs_f64()
        );
        Some(result)
    } else {
        None
    };

    let specs = if should_sync(&args.tables, SyncTable::Specs) {
        tracing::debug!("Transforming specs...");
        let start = Instant::now();
        let result = transform_all_specs(&dbc);
        tracing::info!(
            "  Specs: {} records in {:.2}s",
            result.len(),
            start.elapsed().as_secs_f64()
        );
        Some(result)
    } else {
        None
    };

    tracing::info!(
        "Transformation complete in {:.2}s",
        transform_start.elapsed().as_secs_f64()
    );

    if args.dry_run {
        tracing::info!("Dry run - not writing to database");
        tracing::info!(
            "Total time: {:.2}s",
            total_start.elapsed().as_secs_f64()
        );
        return Ok(());
    }

    // Begin transaction
    tracing::info!("Beginning database transaction...");
    let mut tx = pool.begin().await?;

    // Clean old data if requested
    if !args.no_clean {
        tracing::info!("Cleaning old data for patch {}...", args.patch);
        let clean_start = Instant::now();
        cleanup_patch(&mut tx, &args.patch, &args.tables).await?;
        tracing::info!(
            "Cleanup complete in {:.2}s",
            clean_start.elapsed().as_secs_f64()
        );
    }

    // Insert data
    let insert_start = Instant::now();

    if let Some(ref data) = spells {
        tracing::info!("Inserting {} spells (batch size: {})...", data.len(), SPELL_BATCH);
        let start = Instant::now();
        insert_spells_bulk(&mut tx, data, &args.patch).await?;
        tracing::info!(
            "  Spells inserted in {:.2}s ({:.0} rows/sec)",
            start.elapsed().as_secs_f64(),
            data.len() as f64 / start.elapsed().as_secs_f64()
        );
    }

    if let Some(ref data) = talent_trees {
        tracing::info!("Inserting {} talent trees (batch size: {})...", data.len(), TALENT_BATCH);
        let start = Instant::now();
        insert_talents_bulk(&mut tx, data, &args.patch).await?;
        tracing::info!(
            "  Talents inserted in {:.2}s ({:.0} rows/sec)",
            start.elapsed().as_secs_f64(),
            data.len() as f64 / start.elapsed().as_secs_f64()
        );
    }

    if let Some(ref data) = items {
        tracing::info!("Inserting {} items (batch size: {})...", data.len(), ITEM_BATCH);
        let start = Instant::now();
        insert_items_bulk(&mut tx, data, &args.patch).await?;
        tracing::info!(
            "  Items inserted in {:.2}s ({:.0} rows/sec)",
            start.elapsed().as_secs_f64(),
            data.len() as f64 / start.elapsed().as_secs_f64()
        );
    }

    if let Some(ref data) = auras {
        tracing::info!("Inserting {} auras (batch size: {})...", data.len(), AURA_BATCH);
        let start = Instant::now();
        insert_auras_bulk(&mut tx, data, &args.patch).await?;
        tracing::info!(
            "  Auras inserted in {:.2}s ({:.0} rows/sec)",
            start.elapsed().as_secs_f64(),
            data.len() as f64 / start.elapsed().as_secs_f64()
        );
    }

    if let Some(ref data) = specs {
        tracing::info!("Inserting {} specs (batch size: {})...", data.len(), SPEC_BATCH);
        let start = Instant::now();
        insert_specs_bulk(&mut tx, data, &args.patch).await?;
        tracing::info!(
            "  Specs inserted in {:.2}s ({:.0} rows/sec)",
            start.elapsed().as_secs_f64(),
            data.len() as f64 / start.elapsed().as_secs_f64()
        );
    }

    tracing::info!(
        "All inserts complete in {:.2}s",
        insert_start.elapsed().as_secs_f64()
    );

    // Commit transaction
    tracing::info!("Committing transaction...");
    let commit_start = Instant::now();
    tx.commit().await?;
    tracing::info!(
        "Transaction committed in {:.2}s",
        commit_start.elapsed().as_secs_f64()
    );

    tracing::info!(
        "Sync complete for patch {} in {:.2}s",
        args.patch,
        total_start.elapsed().as_secs_f64()
    );

    Ok(())
}

async fn cleanup_patch(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    patch: &str,
    tables: &[SyncTable],
) -> Result<()> {
    if should_sync(tables, SyncTable::Spells) {
        let result = sqlx::query("DELETE FROM spell_data_flat WHERE patch_version = $1")
            .bind(patch)
            .execute(&mut **tx)
            .await?;
        tracing::debug!("  Deleted {} rows from spell_data_flat", result.rows_affected());
    }
    if should_sync(tables, SyncTable::Talents) {
        let result = sqlx::query("DELETE FROM talent_tree_flat WHERE patch_version = $1")
            .bind(patch)
            .execute(&mut **tx)
            .await?;
        tracing::debug!("  Deleted {} rows from talent_tree_flat", result.rows_affected());
    }
    if should_sync(tables, SyncTable::Items) {
        let result = sqlx::query("DELETE FROM item_data_flat WHERE patch_version = $1")
            .bind(patch)
            .execute(&mut **tx)
            .await?;
        tracing::debug!("  Deleted {} rows from item_data_flat", result.rows_affected());
    }
    if should_sync(tables, SyncTable::Auras) {
        let result = sqlx::query("DELETE FROM aura_data_flat WHERE patch_version = $1")
            .bind(patch)
            .execute(&mut **tx)
            .await?;
        tracing::debug!("  Deleted {} rows from aura_data_flat", result.rows_affected());
    }
    if should_sync(tables, SyncTable::Specs) {
        let result = sqlx::query("DELETE FROM spec_data_flat WHERE patch_version = $1")
            .bind(patch)
            .execute(&mut **tx)
            .await?;
        tracing::debug!("  Deleted {} rows from spec_data_flat", result.rows_affected());
    }
    Ok(())
}

async fn insert_spells_bulk(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    spells: &[SpellDataFlat],
    patch: &str,
) -> Result<()> {
    let pb = ProgressBar::new(spells.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("  Spells [{bar:40}] {pos}/{len} ({percent}%)")
            .unwrap(),
    );

    let total_chunks = (spells.len() + SPELL_BATCH - 1) / SPELL_BATCH;
    for (chunk_idx, chunk) in spells.chunks(SPELL_BATCH).enumerate() {
        tracing::debug!(
            "    Processing spell batch {}/{} ({} rows)",
            chunk_idx + 1,
            total_chunks,
            chunk.len()
        );

        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO spell_data_flat (
                id, patch_version, name, description, aura_description, description_variables,
                file_name, is_passive, knowledge_source, cast_time, recovery_time, start_recovery_time,
                mana_cost, power_cost, power_cost_pct, power_type, charge_recovery_time, max_charges,
                range_max_0, range_max_1, range_min_0, range_min_1, cone_degrees, radius_max, radius_min,
                defense_type, school_mask, bonus_coefficient_from_ap, effect_bonus_coefficient,
                interrupt_aura_0, interrupt_aura_1, interrupt_channel_0, interrupt_channel_1, interrupt_flags,
                duration, max_duration, can_empower, empower_stages, dispel_type, facing_caster_flags, speed,
                spell_class_mask_1, spell_class_mask_2, spell_class_mask_3, spell_class_mask_4, spell_class_set,
                base_level, max_level, max_passive_aura_level, spell_level,
                caster_aura_spell, caster_aura_state, exclude_caster_aura_spell, exclude_caster_aura_state,
                exclude_target_aura_spell, exclude_target_aura_state, target_aura_spell, target_aura_state,
                replacement_spell_id, shapeshift_exclude_0, shapeshift_exclude_1, shapeshift_mask_0, shapeshift_mask_1,
                stance_bar_order, required_totem_category_0, required_totem_category_1, totem_0, totem_1,
                attributes, effect_trigger_spell, implicit_target, learn_spells
            ) ",
        );

        qb.push_values(chunk, |mut b, spell| {
            b.push_bind(spell.id)
                .push_bind(patch)
                .push_bind(&spell.name)
                .push_bind(&spell.description)
                .push_bind(&spell.aura_description)
                .push_bind(&spell.description_variables)
                .push_bind(&spell.file_name)
                .push_bind(spell.is_passive)
                .push_bind(serde_json::to_value(&spell.knowledge_source).unwrap())
                .push_bind(spell.cast_time)
                .push_bind(spell.recovery_time)
                .push_bind(spell.start_recovery_time)
                .push_bind(spell.mana_cost)
                .push_bind(spell.power_cost)
                .push_bind(spell.power_cost_pct)
                .push_bind(spell.power_type)
                .push_bind(spell.charge_recovery_time)
                .push_bind(spell.max_charges)
                .push_bind(spell.range_max_0)
                .push_bind(spell.range_max_1)
                .push_bind(spell.range_min_0)
                .push_bind(spell.range_min_1)
                .push_bind(spell.cone_degrees)
                .push_bind(spell.radius_max)
                .push_bind(spell.radius_min)
                .push_bind(spell.defense_type)
                .push_bind(spell.school_mask)
                .push_bind(spell.bonus_coefficient_from_ap)
                .push_bind(spell.effect_bonus_coefficient)
                .push_bind(spell.interrupt_aura_0)
                .push_bind(spell.interrupt_aura_1)
                .push_bind(spell.interrupt_channel_0)
                .push_bind(spell.interrupt_channel_1)
                .push_bind(spell.interrupt_flags)
                .push_bind(spell.duration)
                .push_bind(spell.max_duration)
                .push_bind(spell.can_empower)
                .push_bind(serde_json::to_value(&spell.empower_stages).unwrap())
                .push_bind(spell.dispel_type)
                .push_bind(spell.facing_caster_flags)
                .push_bind(spell.speed)
                .push_bind(spell.spell_class_mask_1)
                .push_bind(spell.spell_class_mask_2)
                .push_bind(spell.spell_class_mask_3)
                .push_bind(spell.spell_class_mask_4)
                .push_bind(spell.spell_class_set)
                .push_bind(spell.base_level)
                .push_bind(spell.max_level)
                .push_bind(spell.max_passive_aura_level)
                .push_bind(spell.spell_level)
                .push_bind(spell.caster_aura_spell)
                .push_bind(spell.caster_aura_state)
                .push_bind(spell.exclude_caster_aura_spell)
                .push_bind(spell.exclude_caster_aura_state)
                .push_bind(spell.exclude_target_aura_spell)
                .push_bind(spell.exclude_target_aura_state)
                .push_bind(spell.target_aura_spell)
                .push_bind(spell.target_aura_state)
                .push_bind(spell.replacement_spell_id)
                .push_bind(spell.shapeshift_exclude_0)
                .push_bind(spell.shapeshift_exclude_1)
                .push_bind(spell.shapeshift_mask_0)
                .push_bind(spell.shapeshift_mask_1)
                .push_bind(spell.stance_bar_order)
                .push_bind(spell.required_totem_category_0)
                .push_bind(spell.required_totem_category_1)
                .push_bind(spell.totem_0)
                .push_bind(spell.totem_1)
                .push_bind(&spell.attributes)
                .push_bind(&spell.effect_trigger_spell)
                .push_bind(&spell.implicit_target)
                .push_bind(serde_json::to_value(&spell.learn_spells).unwrap());
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET patch_version = EXCLUDED.patch_version, name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()");
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_talents_bulk(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    trees: &[TalentTreeFlat],
    patch: &str,
) -> Result<()> {
    let pb = ProgressBar::new(trees.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("  Talents [{bar:40}] {pos}/{len} ({percent}%)")
            .unwrap(),
    );

    for chunk in trees.chunks(TALENT_BATCH) {
        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO talent_tree_flat (spec_id, patch_version, spec_name, class_name, tree_id, all_node_ids, nodes, edges, sub_trees, point_limits) ",
        );

        qb.push_values(chunk, |mut b, tree| {
            b.push_bind(tree.spec_id)
                .push_bind(patch)
                .push_bind(&tree.spec_name)
                .push_bind(&tree.class_name)
                .push_bind(tree.tree_id)
                .push_bind(&tree.all_node_ids)
                .push_bind(serde_json::to_value(&tree.nodes).unwrap())
                .push_bind(serde_json::to_value(&tree.edges).unwrap())
                .push_bind(serde_json::to_value(&tree.sub_trees).unwrap())
                .push_bind(serde_json::to_value(&tree.point_limits).unwrap());
        });

        qb.push(" ON CONFLICT (spec_id) DO UPDATE SET patch_version = EXCLUDED.patch_version, spec_name = EXCLUDED.spec_name, nodes = EXCLUDED.nodes, edges = EXCLUDED.edges, sub_trees = EXCLUDED.sub_trees, point_limits = EXCLUDED.point_limits, updated_at = NOW()");
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_items_bulk(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    items: &[ItemDataFlat],
    patch: &str,
) -> Result<()> {
    let pb = ProgressBar::new(items.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("  Items [{bar:40}] {pos}/{len} ({percent}%)")
            .unwrap(),
    );

    let total_chunks = (items.len() + ITEM_BATCH - 1) / ITEM_BATCH;
    for (chunk_idx, chunk) in items.chunks(ITEM_BATCH).enumerate() {
        tracing::debug!(
            "    Processing item batch {}/{} ({} rows)",
            chunk_idx + 1,
            total_chunks,
            chunk.len()
        );

        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO item_data_flat (
                id, patch_version, name, description, file_name, item_level, quality,
                required_level, binding, buy_price, sell_price, max_count, stackable, speed,
                class_id, subclass_id, inventory_type, classification, stats, effects,
                sockets, socket_bonus_enchant_id, flags, allowable_class, allowable_race,
                expansion_id, item_set_id, set_info, drop_sources, dmg_variance,
                gem_properties, modified_crafting_reagent_item_id
            ) ",
        );

        qb.push_values(chunk, |mut b, item| {
            b.push_bind(item.id)
                .push_bind(patch)
                .push_bind(&item.name)
                .push_bind(&item.description)
                .push_bind(&item.file_name)
                .push_bind(item.item_level)
                .push_bind(item.quality)
                .push_bind(item.required_level)
                .push_bind(item.binding)
                .push_bind(item.buy_price)
                .push_bind(item.sell_price)
                .push_bind(item.max_count)
                .push_bind(item.stackable)
                .push_bind(item.speed)
                .push_bind(item.class_id)
                .push_bind(item.subclass_id)
                .push_bind(item.inventory_type)
                .push_bind(serde_json::to_value(&item.classification).unwrap())
                .push_bind(serde_json::to_value(&item.stats).unwrap())
                .push_bind(serde_json::to_value(&item.effects).unwrap())
                .push_bind(&item.sockets)
                .push_bind(item.socket_bonus_enchant_id)
                .push_bind(&item.flags)
                .push_bind(item.allowable_class)
                .push_bind(item.allowable_race)
                .push_bind(item.expansion_id)
                .push_bind(item.item_set_id)
                .push_bind(serde_json::to_value(&item.set_info).unwrap())
                .push_bind(serde_json::to_value(&item.drop_sources).unwrap())
                .push_bind(item.dmg_variance)
                .push_bind(item.gem_properties)
                .push_bind(item.modified_crafting_reagent_item_id);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET patch_version = EXCLUDED.patch_version, name = EXCLUDED.name, description = EXCLUDED.description, updated_at = NOW()");
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_auras_bulk(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    auras: &[AuraDataFlat],
    patch: &str,
) -> Result<()> {
    let pb = ProgressBar::new(auras.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("  Auras [{bar:40}] {pos}/{len} ({percent}%)")
            .unwrap(),
    );

    let total_chunks = (auras.len() + AURA_BATCH - 1) / AURA_BATCH;
    for (chunk_idx, chunk) in auras.chunks(AURA_BATCH).enumerate() {
        tracing::debug!(
            "    Processing aura batch {}/{} ({} rows)",
            chunk_idx + 1,
            total_chunks,
            chunk.len()
        );

        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO aura_data_flat (
                spell_id, patch_version, base_duration_ms, max_duration_ms, max_stacks,
                periodic_type, tick_period_ms, refresh_behavior, duration_hasted, hasted_ticks,
                pandemic_refresh, rolling_periodic, tick_may_crit, tick_on_application
            ) ",
        );

        qb.push_values(chunk, |mut b, aura| {
            let periodic_type: Option<String> = aura
                .periodic_type
                .as_ref()
                .and_then(|t| serde_json::to_value(t).ok())
                .and_then(|v| v.as_str().map(|s| s.to_string()));
            let refresh_behavior = serde_json::to_value(&aura.refresh_behavior)
                .ok()
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .unwrap_or_else(|| "pandemic".to_string());

            b.push_bind(aura.spell_id)
                .push_bind(patch)
                .push_bind(aura.base_duration_ms)
                .push_bind(aura.max_duration_ms)
                .push_bind(aura.max_stacks)
                .push_bind(periodic_type)
                .push_bind(aura.tick_period_ms)
                .push_bind(refresh_behavior)
                .push_bind(aura.duration_hasted)
                .push_bind(aura.hasted_ticks)
                .push_bind(aura.pandemic_refresh)
                .push_bind(aura.rolling_periodic)
                .push_bind(aura.tick_may_crit)
                .push_bind(aura.tick_on_application);
        });

        qb.push(" ON CONFLICT (spell_id) DO UPDATE SET patch_version = EXCLUDED.patch_version, updated_at = NOW()");
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_specs_bulk(
    tx: &mut sqlx::Transaction<'_, Postgres>,
    specs: &[SpecDataFlat],
    patch: &str,
) -> Result<()> {
    let pb = ProgressBar::new(specs.len() as u64);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("  Specs [{bar:40}] {pos}/{len} ({percent}%)")
            .unwrap(),
    );

    for chunk in specs.chunks(SPEC_BATCH) {
        tracing::debug!("    Processing spec batch ({} rows)", chunk.len());

        let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
            "INSERT INTO spec_data_flat (
                id, patch_version, name, description, class_id, class_name,
                role, order_index, icon_file_id, primary_stat_priority,
                mastery_spell_id_0, mastery_spell_id_1
            ) ",
        );

        qb.push_values(chunk, |mut b, spec| {
            b.push_bind(spec.id)
                .push_bind(patch)
                .push_bind(&spec.name)
                .push_bind(&spec.description)
                .push_bind(spec.class_id)
                .push_bind(&spec.class_name)
                .push_bind(spec.role)
                .push_bind(spec.order_index)
                .push_bind(spec.icon_file_id)
                .push_bind(spec.primary_stat_priority)
                .push_bind(spec.mastery_spell_id_0)
                .push_bind(spec.mastery_spell_id_1);
        });

        qb.push(" ON CONFLICT (id) DO UPDATE SET patch_version = EXCLUDED.patch_version, name = EXCLUDED.name, description = EXCLUDED.description, class_name = EXCLUDED.class_name, updated_at = NOW()");
        qb.build().execute(&mut **tx).await?;
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}
