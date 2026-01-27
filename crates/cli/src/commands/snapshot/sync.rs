//! Sync command - Transform DBC data and write to Supabase Postgres
//!
//! Usage:
//!   wowlab snapshot sync --patch 12.0.0 --data-dir ./data
//!   wowlab snapshot sync --patch 12.0.0 --table spells --table traits

use std::time::Instant;

use anyhow::Result;
use sqlx::PgPool;
use wowlab_common::parsers::{
    transform_all_auras, transform_all_classes, transform_all_curve_points, transform_all_curves,
    transform_all_global_colors, transform_all_global_strings, transform_all_item_bonuses,
    transform_all_items, transform_all_rand_prop_points, transform_all_specs, transform_all_spells,
    transform_all_trait_trees, DbcData,
};
use wowlab_common::{
    AuraDataFlat, ClassDataFlat, CurveFlat, CurvePointFlat, GlobalColorFlat, GlobalStringFlat,
    ItemBonusFlat, ItemDataFlat, RandPropPointsFlat, SpecDataFlat, SpellDataFlat, TraitTreeFlat,
};

use super::{db, SyncArgs, SyncTable};

// ============================================================================
// Types
// ============================================================================

/// Transformed data ready for database insertion.
struct TransformedData {
    spells: Option<Vec<SpellDataFlat>>,
    traits: Option<Vec<TraitTreeFlat>>,
    items: Option<Vec<ItemDataFlat>>,
    auras: Option<Vec<AuraDataFlat>>,
    specs: Option<Vec<SpecDataFlat>>,
    classes: Option<Vec<ClassDataFlat>>,
    global_colors: Option<Vec<GlobalColorFlat>>,
    global_strings: Option<Vec<GlobalStringFlat>>,
    item_bonuses: Option<Vec<ItemBonusFlat>>,
    curves: Option<Vec<CurveFlat>>,
    curve_points: Option<Vec<CurvePointFlat>>,
    rand_prop_points: Option<Vec<RandPropPointsFlat>>,
}

// ============================================================================
// Main Entry Point
// ============================================================================

pub async fn run_sync(args: SyncArgs) -> Result<()> {
    let total_start = Instant::now();
    log_sync_start(&args);

    // 1. Load DBC data
    let dbc = timed("Loading DBC data", || DbcData::load_all(&args.data_dir))?;

    // 2. Transform data
    tracing::info!("Transforming data...");
    let transform_start = Instant::now();
    let data = transform_data(&dbc, &args.tables);
    tracing::info!(
        "Transforming data in {:.2}s",
        transform_start.elapsed().as_secs_f64()
    );

    if args.dry_run {
        tracing::info!(
            "Dry run complete in {:.2}s",
            total_start.elapsed().as_secs_f64()
        );
        return Ok(());
    }

    // 3. Connect to database
    let pool = timed_async("Connecting to database", db::connect()).await?;

    // 4. Cleanup old data (in transaction for atomicity)
    if !args.no_clean {
        let mut tx = pool.begin().await?;
        timed_async(
            "Cleaning old data",
            db::cleanup_patch(&mut tx, &args.patch, &args.tables),
        )
        .await?;
        tx.commit().await?;
    }

    // 5. Insert new data (concurrent batches for speed)
    insert_all(&pool, &data, &args.patch).await?;

    tracing::info!(
        "Sync complete for patch {} in {:.2}s",
        args.patch,
        total_start.elapsed().as_secs_f64()
    );
    Ok(())
}

// ============================================================================
// Transform
// ============================================================================

fn transform_data(dbc: &DbcData, tables: &[SyncTable]) -> TransformedData {
    TransformedData {
        spells: transform_if(tables, SyncTable::Spells, "spells", || {
            transform_all_spells(dbc)
        }),
        traits: transform_if(tables, SyncTable::Traits, "traits", || {
            transform_all_trait_trees(dbc)
        }),
        items: transform_if(tables, SyncTable::Items, "items", || {
            transform_all_items(dbc)
        }),
        auras: transform_if(tables, SyncTable::Auras, "auras", || {
            transform_all_auras(dbc)
        }),
        specs: transform_if(tables, SyncTable::Specs, "specs", || {
            transform_all_specs(dbc)
        }),
        classes: transform_if(tables, SyncTable::Classes, "classes", || {
            transform_all_classes(dbc)
        }),
        global_colors: transform_if(tables, SyncTable::GlobalColors, "global_colors", || {
            transform_all_global_colors(dbc)
        }),
        global_strings: transform_if(tables, SyncTable::GlobalStrings, "global_strings", || {
            transform_all_global_strings(dbc)
        }),
        item_bonuses: transform_if(tables, SyncTable::ItemBonuses, "item_bonuses", || {
            transform_all_item_bonuses(dbc)
        }),
        curves: transform_if(tables, SyncTable::Curves, "curves", || {
            transform_all_curves(dbc)
        }),
        curve_points: transform_if(tables, SyncTable::CurvePoints, "curve_points", || {
            transform_all_curve_points(dbc)
        }),
        rand_prop_points: transform_if(
            tables,
            SyncTable::RandPropPoints,
            "rand_prop_points",
            || transform_all_rand_prop_points(dbc),
        ),
    }
}

fn transform_if<T, F>(tables: &[SyncTable], table: SyncTable, label: &str, f: F) -> Option<Vec<T>>
where
    F: FnOnce() -> Vec<T>,
{
    if !db::should_sync(tables, table) {
        return None;
    }

    let start = Instant::now();
    let result = f();
    tracing::info!(
        "  {}: {} records in {:.2}s",
        label,
        result.len(),
        start.elapsed().as_secs_f64()
    );
    Some(result)
}

// ============================================================================
// Insert
// ============================================================================

async fn insert_all(pool: &PgPool, data: &TransformedData, patch: &str) -> Result<()> {
    if let Some(ref rows) = data.spells {
        insert_timed("spells", rows.len(), db::insert_spells(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.traits {
        insert_timed("traits", rows.len(), db::insert_traits(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.items {
        insert_timed("items", rows.len(), db::insert_items(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.auras {
        insert_timed("auras", rows.len(), db::insert_auras(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.specs {
        insert_timed("specs", rows.len(), db::insert_specs(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.classes {
        insert_timed("classes", rows.len(), db::insert_classes(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.global_colors {
        insert_timed(
            "global_colors",
            rows.len(),
            db::insert_global_colors(pool, rows, patch),
        )
        .await?;
    }
    if let Some(ref rows) = data.global_strings {
        insert_timed(
            "global_strings",
            rows.len(),
            db::insert_global_strings(pool, rows, patch),
        )
        .await?;
    }
    if let Some(ref rows) = data.item_bonuses {
        insert_timed(
            "item_bonuses",
            rows.len(),
            db::insert_item_bonuses(pool, rows, patch),
        )
        .await?;
    }
    if let Some(ref rows) = data.curves {
        insert_timed("curves", rows.len(), db::insert_curves(pool, rows, patch)).await?;
    }
    if let Some(ref rows) = data.curve_points {
        insert_timed(
            "curve_points",
            rows.len(),
            db::insert_curve_points(pool, rows, patch),
        )
        .await?;
    }
    if let Some(ref rows) = data.rand_prop_points {
        insert_timed(
            "rand_prop_points",
            rows.len(),
            db::insert_rand_prop_points(pool, rows, patch),
        )
        .await?;
    }
    Ok(())
}

async fn insert_timed<F>(label: &str, count: usize, future: F) -> Result<()>
where
    F: std::future::Future<Output = Result<(), sqlx::Error>>,
{
    let start = Instant::now();
    future.await?;
    let elapsed = start.elapsed().as_secs_f64();
    tracing::info!(
        "  {} inserted: {} rows in {:.2}s ({:.0} rows/sec)",
        label,
        count,
        elapsed,
        count as f64 / elapsed
    );
    Ok(())
}

// ============================================================================
// Timing Helpers
// ============================================================================

fn timed<T, E, F>(label: &str, f: F) -> Result<T, E>
where
    F: FnOnce() -> Result<T, E>,
{
    tracing::info!("{}...", label);
    let start = Instant::now();
    let result = f();
    tracing::info!("{} in {:.2}s", label, start.elapsed().as_secs_f64());
    result
}

async fn timed_async<T, E, F>(label: &str, future: F) -> Result<T, E>
where
    F: std::future::Future<Output = Result<T, E>>,
{
    tracing::info!("{}...", label);
    let start = Instant::now();
    let result = future.await;
    tracing::info!("{} in {:.2}s", label, start.elapsed().as_secs_f64());
    result
}

// ============================================================================
// Logging
// ============================================================================

fn log_sync_start(args: &SyncArgs) {
    if args.tables.is_empty() {
        tracing::info!("Syncing ALL tables for patch {}", args.patch);
    } else {
        let names: Vec<_> = args.tables.iter().map(|t| t.to_string()).collect();
        tracing::info!("Syncing [{}] for patch {}", names.join(", "), args.patch);
    }
    tracing::info!("Data directory: {:?}", args.data_dir);
}
