# Phase 2: CLI Sync Command

## Context

You are adding a `snapshot sync` command to the existing CLI (`crates/cli`) that writes transformed flat data from Phase 1 to Supabase Postgres. This uses **direct Postgres connection** (sqlx) for writes, not PostgREST.

**Prerequisites:**
- Phase 1 complete (`crates/snapshot-parser` with all transformation logic)
- Supabase project created

## Objective

Implement `wowlab snapshot sync --patch 11.2.0 --data-dir ./data` that:
1. Loads DBC CSV files using snapshot-parser
2. Transforms all data (spells, talents, items, auras, specs)
3. Writes to Supabase Postgres flat tables in a single transaction
4. Cleans up old patch versions

## Database Schema

Create these tables in Supabase. The schema must match Phase 1's flat types exactly.

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_flat_tables.sql

BEGIN;

-- Spell data flat table (matches SpellDataFlat from Phase 1)
CREATE TABLE public.spell_data_flat (
    id INTEGER PRIMARY KEY,
    patch_version TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Core
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    aura_description TEXT NOT NULL DEFAULT '',
    description_variables TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT 'inv_misc_questionmark',
    is_passive BOOLEAN NOT NULL DEFAULT FALSE,
    knowledge_source JSONB NOT NULL DEFAULT '{"source": "unknown"}',

    -- Timing
    cast_time INTEGER NOT NULL DEFAULT 0,
    recovery_time INTEGER NOT NULL DEFAULT 0,
    start_recovery_time INTEGER NOT NULL DEFAULT 1500,

    -- Resources
    mana_cost INTEGER NOT NULL DEFAULT 0,
    power_cost INTEGER NOT NULL DEFAULT 0,
    power_cost_pct REAL NOT NULL DEFAULT 0,
    power_type INTEGER NOT NULL DEFAULT -1,

    -- Charges
    charge_recovery_time INTEGER NOT NULL DEFAULT 0,
    max_charges INTEGER NOT NULL DEFAULT 0,

    -- Range
    range_max_0 REAL NOT NULL DEFAULT 0,
    range_max_1 REAL NOT NULL DEFAULT 0,
    range_min_0 REAL NOT NULL DEFAULT 0,
    range_min_1 REAL NOT NULL DEFAULT 0,

    -- Geometry
    cone_degrees REAL NOT NULL DEFAULT 0,
    radius_max REAL NOT NULL DEFAULT 0,
    radius_min REAL NOT NULL DEFAULT 0,

    -- Damage/Defense
    defense_type INTEGER NOT NULL DEFAULT 0,
    school_mask INTEGER NOT NULL DEFAULT 0,

    -- Scaling
    bonus_coefficient_from_ap REAL NOT NULL DEFAULT 0,
    effect_bonus_coefficient REAL NOT NULL DEFAULT 0,

    -- Interrupts
    interrupt_aura_0 INTEGER NOT NULL DEFAULT 0,
    interrupt_aura_1 INTEGER NOT NULL DEFAULT 0,
    interrupt_channel_0 INTEGER NOT NULL DEFAULT 0,
    interrupt_channel_1 INTEGER NOT NULL DEFAULT 0,
    interrupt_flags INTEGER NOT NULL DEFAULT 0,

    -- Duration
    duration INTEGER NOT NULL DEFAULT 0,
    max_duration INTEGER NOT NULL DEFAULT 0,

    -- Empower
    can_empower BOOLEAN NOT NULL DEFAULT FALSE,
    empower_stages JSONB NOT NULL DEFAULT '[]',

    -- Mechanics
    dispel_type INTEGER NOT NULL DEFAULT 0,
    facing_caster_flags INTEGER NOT NULL DEFAULT 0,
    speed REAL NOT NULL DEFAULT 0,
    spell_class_mask_1 INTEGER NOT NULL DEFAULT 0,
    spell_class_mask_2 INTEGER NOT NULL DEFAULT 0,
    spell_class_mask_3 INTEGER NOT NULL DEFAULT 0,
    spell_class_mask_4 INTEGER NOT NULL DEFAULT 0,
    spell_class_set INTEGER NOT NULL DEFAULT 0,

    -- Levels
    base_level INTEGER NOT NULL DEFAULT 0,
    max_level INTEGER NOT NULL DEFAULT 0,
    max_passive_aura_level INTEGER NOT NULL DEFAULT 0,
    spell_level INTEGER NOT NULL DEFAULT 0,

    -- Aura Restrictions
    caster_aura_spell INTEGER NOT NULL DEFAULT 0,
    caster_aura_state INTEGER NOT NULL DEFAULT 0,
    exclude_caster_aura_spell INTEGER NOT NULL DEFAULT 0,
    exclude_caster_aura_state INTEGER NOT NULL DEFAULT 0,
    exclude_target_aura_spell INTEGER NOT NULL DEFAULT 0,
    exclude_target_aura_state INTEGER NOT NULL DEFAULT 0,
    target_aura_spell INTEGER NOT NULL DEFAULT 0,
    target_aura_state INTEGER NOT NULL DEFAULT 0,

    -- Replacement
    replacement_spell_id INTEGER NOT NULL DEFAULT 0,

    -- Shapeshift
    shapeshift_exclude_0 INTEGER NOT NULL DEFAULT 0,
    shapeshift_exclude_1 INTEGER NOT NULL DEFAULT 0,
    shapeshift_mask_0 INTEGER NOT NULL DEFAULT 0,
    shapeshift_mask_1 INTEGER NOT NULL DEFAULT 0,
    stance_bar_order INTEGER NOT NULL DEFAULT 0,

    -- Totems
    required_totem_category_0 INTEGER NOT NULL DEFAULT 0,
    required_totem_category_1 INTEGER NOT NULL DEFAULT 0,
    totem_0 INTEGER NOT NULL DEFAULT 0,
    totem_1 INTEGER NOT NULL DEFAULT 0,

    -- Arrays
    attributes INTEGER[] NOT NULL DEFAULT '{}',
    effect_trigger_spell INTEGER[] NOT NULL DEFAULT '{}',
    implicit_target INTEGER[] NOT NULL DEFAULT '{}',
    learn_spells JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_spell_data_flat_patch ON spell_data_flat(patch_version);
CREATE INDEX idx_spell_data_flat_name ON spell_data_flat USING gin(to_tsvector('english', name));

-- Talent tree flat table (matches TalentTreeFlat from Phase 1)
CREATE TABLE public.talent_tree_flat (
    spec_id INTEGER PRIMARY KEY,
    patch_version TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    spec_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    tree_id INTEGER NOT NULL,
    all_node_ids INTEGER[] NOT NULL DEFAULT '{}',
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    sub_trees JSONB NOT NULL DEFAULT '[]',
    point_limits JSONB NOT NULL DEFAULT '{"class": 0, "spec": 0, "hero": 0}'
);

CREATE INDEX idx_talent_tree_flat_patch ON talent_tree_flat(patch_version);

-- Item data flat table (matches ItemDataFlat from Phase 1)
CREATE TABLE public.item_data_flat (
    id INTEGER PRIMARY KEY,
    patch_version TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT 'inv_misc_questionmark',
    item_level INTEGER NOT NULL DEFAULT 0,
    quality INTEGER NOT NULL DEFAULT 0,
    required_level INTEGER NOT NULL DEFAULT 0,
    binding INTEGER NOT NULL DEFAULT 0,
    buy_price INTEGER NOT NULL DEFAULT 0,
    sell_price INTEGER NOT NULL DEFAULT 0,
    max_count INTEGER NOT NULL DEFAULT 0,
    stackable INTEGER NOT NULL DEFAULT 1,
    speed INTEGER NOT NULL DEFAULT 0,

    class_id INTEGER NOT NULL DEFAULT 0,
    subclass_id INTEGER NOT NULL DEFAULT 0,
    inventory_type INTEGER NOT NULL DEFAULT 0,
    classification JSONB,

    stats JSONB NOT NULL DEFAULT '[]',
    effects JSONB NOT NULL DEFAULT '[]',

    sockets INTEGER[] NOT NULL DEFAULT '{}',
    socket_bonus_enchant_id INTEGER NOT NULL DEFAULT 0,

    flags INTEGER[] NOT NULL DEFAULT '{}',

    allowable_class INTEGER NOT NULL DEFAULT -1,
    allowable_race BIGINT NOT NULL DEFAULT -1,

    expansion_id INTEGER NOT NULL DEFAULT 0,
    item_set_id INTEGER NOT NULL DEFAULT 0,
    set_info JSONB,

    drop_sources JSONB NOT NULL DEFAULT '[]',

    dmg_variance REAL NOT NULL DEFAULT 0,
    gem_properties INTEGER NOT NULL DEFAULT 0,
    modified_crafting_reagent_item_id INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_item_data_flat_patch ON item_data_flat(patch_version);
CREATE INDEX idx_item_data_flat_name ON item_data_flat USING gin(to_tsvector('english', name));
CREATE INDEX idx_item_data_flat_ilevel ON item_data_flat(item_level);

-- Aura data flat table (matches AuraDataFlat from Phase 1)
CREATE TABLE public.aura_data_flat (
    spell_id INTEGER PRIMARY KEY,
    patch_version TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    base_duration_ms INTEGER NOT NULL DEFAULT 0,
    max_duration_ms INTEGER NOT NULL DEFAULT 0,
    max_stacks INTEGER NOT NULL DEFAULT 1,
    periodic_type TEXT,
    tick_period_ms INTEGER NOT NULL DEFAULT 0,
    refresh_behavior TEXT NOT NULL DEFAULT 'pandemic',
    duration_hasted BOOLEAN NOT NULL DEFAULT FALSE,
    hasted_ticks BOOLEAN NOT NULL DEFAULT FALSE,
    pandemic_refresh BOOLEAN NOT NULL DEFAULT FALSE,
    rolling_periodic BOOLEAN NOT NULL DEFAULT FALSE,
    tick_may_crit BOOLEAN NOT NULL DEFAULT FALSE,
    tick_on_application BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_aura_data_flat_patch ON aura_data_flat(patch_version);

-- Spec data flat table (matches SpecDataFlat from Phase 1)
CREATE TABLE public.spec_data_flat (
    id INTEGER PRIMARY KEY,
    patch_version TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    class_id INTEGER NOT NULL,
    role INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    icon_file_id INTEGER NOT NULL DEFAULT 0,
    mastery_spell_id_0 INTEGER NOT NULL DEFAULT 0,
    mastery_spell_id_1 INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_spec_data_flat_patch ON spec_data_flat(patch_version);
CREATE INDEX idx_spec_data_flat_class ON spec_data_flat(class_id);

-- RLS: public read, no write
ALTER TABLE public.spell_data_flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_tree_flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_data_flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_data_flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_data_flat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON public.spell_data_flat FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.talent_tree_flat FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.item_data_flat FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.aura_data_flat FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.spec_data_flat FOR SELECT USING (true);

COMMIT;
```

## CLI Implementation

### Directory Structure

```
crates/cli/src/
├── main.rs
├── commands/
│   ├── mod.rs
│   └── snapshot/
│       ├── mod.rs
│       ├── sync.rs
│       ├── dump_spell.rs
│       └── dump_talent.rs
└── db.rs
```

### Cargo.toml Dependencies

Add to `crates/cli/Cargo.toml`:

```toml
[dependencies]
snapshot-parser = { path = "../snapshot-parser" }
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "json"] }
tokio = { version = "1", features = ["full"] }
clap = { version = "4", features = ["derive"] }
anyhow = "1"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
indicatif = "0.17"
serde_json = "1"
```

### Command Structure

```rust
// crates/cli/src/commands/snapshot/mod.rs
use clap::Subcommand;
use std::path::PathBuf;

#[derive(Subcommand)]
pub enum SnapshotCommand {
    /// Sync transformed data to Supabase Postgres
    Sync(SyncArgs),
    /// Dump a single spell to JSON (for debugging)
    DumpSpell(DumpSpellArgs),
    /// Dump a talent tree to JSON (for debugging)
    DumpTalent(DumpTalentArgs),
}

#[derive(clap::Args)]
pub struct SyncArgs {
    /// Patch version to tag data with (e.g., "11.2.0")
    #[arg(long)]
    pub patch: String,

    /// Directory containing DBC CSV files
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,

    /// Delete existing data for this patch before inserting
    #[arg(long, default_value = "true")]
    pub clean: bool,

    /// Dry run - transform but don't write to database
    #[arg(long)]
    pub dry_run: bool,

    /// Chunk size for batch inserts
    #[arg(long, default_value = "1000")]
    pub chunk_size: usize,
}

#[derive(clap::Args)]
pub struct DumpSpellArgs {
    /// Spell ID to dump
    pub spell_id: i32,

    /// Directory containing DBC CSV files
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,
}

#[derive(clap::Args)]
pub struct DumpTalentArgs {
    /// Spec ID to dump
    pub spec_id: i32,

    /// Directory containing DBC CSV files
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,
}
```

### Sync Implementation

```rust
// crates/cli/src/commands/snapshot/sync.rs
use anyhow::Result;
use indicatif::{ProgressBar, ProgressStyle};
use snapshot_parser::{
    dbc::DbcData,
    flat::{SpellDataFlat, TalentTreeFlat, ItemDataFlat, AuraDataFlat},
    transform::{
        transform_all_spells, transform_all_talent_trees,
        transform_all_items, transform_all_auras
    },
};
use sqlx::PgPool;
use std::path::Path;

use super::SyncArgs;

pub async fn run_sync(args: SyncArgs) -> Result<()> {
    // 1. Validate environment
    let database_url = std::env::var("SUPABASE_DB_URL")
        .map_err(|_| anyhow::anyhow!(
            "SUPABASE_DB_URL not set. Get it from Supabase Dashboard → Settings → Database → Connection string"
        ))?;

    // 2. Connect to database
    tracing::info!("Connecting to database...");
    let pool = PgPool::connect(&database_url).await?;
    tracing::info!("Connected to database");

    // 3. Load DBC data
    tracing::info!("Loading DBC data from {:?}", args.data_dir);
    let dbc = DbcData::load_all(&args.data_dir)?;
    tracing::info!("Loaded DBC data");

    // 4. Transform all data
    tracing::info!("Transforming data...");

    let pb = ProgressBar::new(4);
    pb.set_style(ProgressStyle::default_bar()
        .template("{msg} [{bar:40}] {pos}/{len}")?);

    pb.set_message("Spells");
    let spells = transform_all_spells(&dbc)?;
    pb.inc(1);

    pb.set_message("Talents");
    let talent_trees = transform_all_talent_trees(&dbc)?;
    pb.inc(1);

    pb.set_message("Items");
    let items = transform_all_items(&dbc)?;
    pb.inc(1);

    pb.set_message("Auras");
    let auras = transform_all_auras(&dbc)?;
    pb.inc(1);
    pb.finish_with_message("Transformation complete");

    tracing::info!(
        "Transformed {} spells, {} talent trees, {} items, {} auras",
        spells.len(),
        talent_trees.len(),
        items.len(),
        auras.len()
    );

    if args.dry_run {
        tracing::info!("Dry run - not writing to database");
        return Ok(());
    }

    // 5. Write in transaction
    let mut tx = pool.begin().await?;

    if args.clean {
        tracing::info!("Cleaning old data for patch {}", args.patch);
        cleanup_patch(&mut tx, &args.patch).await?;
    }

    tracing::info!("Inserting spells...");
    insert_spells(&mut tx, &spells, &args.patch, args.chunk_size).await?;

    tracing::info!("Inserting talent trees...");
    insert_talent_trees(&mut tx, &talent_trees, &args.patch).await?;

    tracing::info!("Inserting items...");
    insert_items(&mut tx, &items, &args.patch, args.chunk_size).await?;

    tracing::info!("Inserting auras...");
    insert_auras(&mut tx, &auras, &args.patch, args.chunk_size).await?;

    tx.commit().await?;
    tracing::info!("Sync complete for patch {}", args.patch);

    Ok(())
}

async fn cleanup_patch(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    patch: &str,
) -> Result<()> {
    sqlx::query("DELETE FROM spell_data_flat WHERE patch_version = $1")
        .bind(patch)
        .execute(&mut **tx)
        .await?;
    sqlx::query("DELETE FROM talent_tree_flat WHERE patch_version = $1")
        .bind(patch)
        .execute(&mut **tx)
        .await?;
    sqlx::query("DELETE FROM item_data_flat WHERE patch_version = $1")
        .bind(patch)
        .execute(&mut **tx)
        .await?;
    sqlx::query("DELETE FROM aura_data_flat WHERE patch_version = $1")
        .bind(patch)
        .execute(&mut **tx)
        .await?;
    Ok(())
}

async fn insert_spells(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    spells: &[SpellDataFlat],
    patch: &str,
    chunk_size: usize,
) -> Result<()> {
    let pb = ProgressBar::new(spells.len() as u64);
    pb.set_style(ProgressStyle::default_bar()
        .template("  Spells [{bar:40}] {pos}/{len}")?);

    for chunk in spells.chunks(chunk_size) {
        for spell in chunk {
            // Individual inserts for clarity. Can optimize with COPY later.
            sqlx::query(r#"
                INSERT INTO spell_data_flat (
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
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
                    $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50,
                    $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65, $66,
                    $67, $68, $69, $70, $71, $72
                )
                ON CONFLICT (id) DO UPDATE SET
                    patch_version = EXCLUDED.patch_version,
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            "#)
            .bind(spell.id)
            .bind(patch)
            .bind(&spell.name)
            .bind(&spell.description)
            .bind(&spell.aura_description)
            .bind(&spell.description_variables)
            .bind(&spell.file_name)
            .bind(spell.is_passive)
            .bind(serde_json::to_value(&spell.knowledge_source)?)
            .bind(spell.cast_time)
            .bind(spell.recovery_time)
            .bind(spell.start_recovery_time)
            .bind(spell.mana_cost)
            .bind(spell.power_cost)
            .bind(spell.power_cost_pct)
            .bind(spell.power_type)
            .bind(spell.charge_recovery_time)
            .bind(spell.max_charges)
            .bind(spell.range_max_0)
            .bind(spell.range_max_1)
            .bind(spell.range_min_0)
            .bind(spell.range_min_1)
            .bind(spell.cone_degrees)
            .bind(spell.radius_max)
            .bind(spell.radius_min)
            .bind(spell.defense_type)
            .bind(spell.school_mask)
            .bind(spell.bonus_coefficient_from_ap)
            .bind(spell.effect_bonus_coefficient)
            .bind(spell.interrupt_aura_0)
            .bind(spell.interrupt_aura_1)
            .bind(spell.interrupt_channel_0)
            .bind(spell.interrupt_channel_1)
            .bind(spell.interrupt_flags)
            .bind(spell.duration)
            .bind(spell.max_duration)
            .bind(spell.can_empower)
            .bind(serde_json::to_value(&spell.empower_stages)?)
            .bind(spell.dispel_type)
            .bind(spell.facing_caster_flags)
            .bind(spell.speed)
            .bind(spell.spell_class_mask_1)
            .bind(spell.spell_class_mask_2)
            .bind(spell.spell_class_mask_3)
            .bind(spell.spell_class_mask_4)
            .bind(spell.spell_class_set)
            .bind(spell.base_level)
            .bind(spell.max_level)
            .bind(spell.max_passive_aura_level)
            .bind(spell.spell_level)
            .bind(spell.caster_aura_spell)
            .bind(spell.caster_aura_state)
            .bind(spell.exclude_caster_aura_spell)
            .bind(spell.exclude_caster_aura_state)
            .bind(spell.exclude_target_aura_spell)
            .bind(spell.exclude_target_aura_state)
            .bind(spell.target_aura_spell)
            .bind(spell.target_aura_state)
            .bind(spell.replacement_spell_id)
            .bind(spell.shapeshift_exclude_0)
            .bind(spell.shapeshift_exclude_1)
            .bind(spell.shapeshift_mask_0)
            .bind(spell.shapeshift_mask_1)
            .bind(spell.stance_bar_order)
            .bind(spell.required_totem_category_0)
            .bind(spell.required_totem_category_1)
            .bind(spell.totem_0)
            .bind(spell.totem_1)
            .bind(&spell.attributes)
            .bind(&spell.effect_trigger_spell)
            .bind(&spell.implicit_target)
            .bind(serde_json::to_value(&spell.learn_spells)?)
            .execute(&mut **tx)
            .await?;
        }
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_talent_trees(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    trees: &[TalentTreeFlat],
    patch: &str,
) -> Result<()> {
    for tree in trees {
        sqlx::query(r#"
            INSERT INTO talent_tree_flat (
                spec_id, patch_version, spec_name, class_name, tree_id,
                all_node_ids, nodes, edges, sub_trees, point_limits
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (spec_id) DO UPDATE SET
                patch_version = EXCLUDED.patch_version,
                spec_name = EXCLUDED.spec_name,
                class_name = EXCLUDED.class_name,
                tree_id = EXCLUDED.tree_id,
                all_node_ids = EXCLUDED.all_node_ids,
                nodes = EXCLUDED.nodes,
                edges = EXCLUDED.edges,
                sub_trees = EXCLUDED.sub_trees,
                point_limits = EXCLUDED.point_limits,
                updated_at = NOW()
        "#)
        .bind(tree.spec_id)
        .bind(patch)
        .bind(&tree.spec_name)
        .bind(&tree.class_name)
        .bind(tree.tree_id)
        .bind(&tree.all_node_ids)
        .bind(serde_json::to_value(&tree.nodes)?)
        .bind(serde_json::to_value(&tree.edges)?)
        .bind(serde_json::to_value(&tree.sub_trees)?)
        .bind(serde_json::to_value(&tree.point_limits)?)
        .execute(&mut **tx)
        .await?;
    }
    Ok(())
}

async fn insert_items(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    items: &[ItemDataFlat],
    patch: &str,
    chunk_size: usize,
) -> Result<()> {
    let pb = ProgressBar::new(items.len() as u64);
    pb.set_style(ProgressStyle::default_bar()
        .template("  Items [{bar:40}] {pos}/{len}")?);

    for chunk in items.chunks(chunk_size) {
        for item in chunk {
            sqlx::query(r#"
                INSERT INTO item_data_flat (
                    id, patch_version, name, description, file_name, item_level, quality,
                    required_level, binding, buy_price, sell_price, max_count, stackable, speed,
                    class_id, subclass_id, inventory_type, classification, stats, effects,
                    sockets, socket_bonus_enchant_id, flags, allowable_class, allowable_race,
                    expansion_id, item_set_id, set_info, drop_sources, dmg_variance,
                    gem_properties, modified_crafting_reagent_item_id
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                    $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
                )
                ON CONFLICT (id) DO UPDATE SET
                    patch_version = EXCLUDED.patch_version,
                    name = EXCLUDED.name,
                    updated_at = NOW()
            "#)
            .bind(item.id)
            .bind(patch)
            .bind(&item.name)
            .bind(&item.description)
            .bind(&item.file_name)
            .bind(item.item_level)
            .bind(item.quality)
            .bind(item.required_level)
            .bind(item.binding)
            .bind(item.buy_price)
            .bind(item.sell_price)
            .bind(item.max_count)
            .bind(item.stackable)
            .bind(item.speed)
            .bind(item.class_id)
            .bind(item.subclass_id)
            .bind(item.inventory_type)
            .bind(serde_json::to_value(&item.classification)?)
            .bind(serde_json::to_value(&item.stats)?)
            .bind(serde_json::to_value(&item.effects)?)
            .bind(&item.sockets)
            .bind(item.socket_bonus_enchant_id)
            .bind(&item.flags)
            .bind(item.allowable_class)
            .bind(item.allowable_race)
            .bind(item.expansion_id)
            .bind(item.item_set_id)
            .bind(serde_json::to_value(&item.set_info)?)
            .bind(serde_json::to_value(&item.drop_sources)?)
            .bind(item.dmg_variance)
            .bind(item.gem_properties)
            .bind(item.modified_crafting_reagent_item_id)
            .execute(&mut **tx)
            .await?;
        }
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}

async fn insert_auras(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    auras: &[AuraDataFlat],
    patch: &str,
    chunk_size: usize,
) -> Result<()> {
    let pb = ProgressBar::new(auras.len() as u64);
    pb.set_style(ProgressStyle::default_bar()
        .template("  Auras [{bar:40}] {pos}/{len}")?);

    for chunk in auras.chunks(chunk_size) {
        for aura in chunk {
            sqlx::query(r#"
                INSERT INTO aura_data_flat (
                    spell_id, patch_version, base_duration_ms, max_duration_ms, max_stacks,
                    periodic_type, tick_period_ms, refresh_behavior, duration_hasted, hasted_ticks,
                    pandemic_refresh, rolling_periodic, tick_may_crit, tick_on_application
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (spell_id) DO UPDATE SET
                    patch_version = EXCLUDED.patch_version,
                    updated_at = NOW()
            "#)
            .bind(aura.spell_id)
            .bind(patch)
            .bind(aura.base_duration_ms)
            .bind(aura.max_duration_ms)
            .bind(aura.max_stacks)
            .bind(aura.periodic_type.as_ref().map(|t| format!("{:?}", t).to_lowercase()))
            .bind(aura.tick_period_ms)
            .bind(format!("{:?}", aura.refresh_behavior).to_lowercase())
            .bind(aura.duration_hasted)
            .bind(aura.hasted_ticks)
            .bind(aura.pandemic_refresh)
            .bind(aura.rolling_periodic)
            .bind(aura.tick_may_crit)
            .bind(aura.tick_on_application)
            .execute(&mut **tx)
            .await?;
        }
        pb.inc(chunk.len() as u64);
    }

    pb.finish();
    Ok(())
}
```

## Environment Variables

```bash
# Required: Direct Postgres connection string
# Get from: Supabase Dashboard → Settings → Database → Connection string (URI)
export SUPABASE_DB_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
```

## Usage

```bash
# Sync all data for patch 11.2.0
wowlab snapshot sync --patch 11.2.0 --data-dir ./data

# Dry run (transform only, no database write)
wowlab snapshot sync --patch 11.2.0 --dry-run

# Debug: dump a single spell to JSON
wowlab snapshot dump-spell 53351 --data-dir ./data | jq

# Debug: dump a talent tree to JSON
wowlab snapshot dump-talent 253 --data-dir ./data | jq
```

## Version Management

The `patch_version` column enables version management:

```sql
-- See what versions exist
SELECT DISTINCT patch_version FROM spell_data_flat;

-- Clean up old versions (keep only current)
DELETE FROM spell_data_flat WHERE patch_version != '11.2.0';
DELETE FROM talent_tree_flat WHERE patch_version != '11.2.0';
DELETE FROM item_data_flat WHERE patch_version != '11.2.0';
DELETE FROM aura_data_flat WHERE patch_version != '11.2.0';
```

## Checklist

### Setup
- [ ] Add dependencies to `crates/cli/Cargo.toml` (sqlx, indicatif, snapshot-parser)
- [ ] Create `commands/snapshot/mod.rs` with SnapshotCommand enum
- [ ] Add SnapshotCommand to main CLI parser

### Database
- [ ] Create migration file with all 5 tables (spell, talent, item, aura, spec)
- [ ] Apply migration: `supabase db push`
- [ ] Verify tables exist in Supabase dashboard
- [ ] Verify RLS policies are correct (public read, no public write)

### Sync Command
- [ ] Implement database connection with error message for missing env var
- [ ] Implement `cleanup_patch` function
- [ ] Implement `insert_spells` with all 72 columns
- [ ] Implement `insert_talent_trees` with JSONB columns
- [ ] Implement `insert_items` with all 32 columns
- [ ] Implement `insert_auras` with all 14 columns
- [ ] Add progress bars with indicatif
- [ ] Add dry-run mode
- [ ] Wrap all inserts in transaction

### Debug Commands
- [ ] Implement `dump-spell` command (transform single spell, print JSON)
- [ ] Implement `dump-talent` command (transform single tree, print JSON)
- [ ] Verify JSON output matches TypeScript

### Testing
- [ ] Test sync with small dataset (10 spells)
- [ ] Test sync with full dataset (~100k spells)
- [ ] Test rollback on failure (Ctrl+C during sync)
- [ ] Verify data in Supabase dashboard
- [ ] Test RLS: query with anon key works, insert with anon key fails

## Success Criteria

1. **Sync works**: `wowlab snapshot sync --patch 11.2.0` completes without error
2. **Transaction safety**: Interrupted sync leaves database unchanged
3. **Data integrity**: All rows match snapshot-parser output
4. **Performance**: Full sync completes in < 5 minutes
5. **Idempotent**: Running sync twice produces same result (UPSERT)
6. **RLS works**: Can query with anon key, cannot insert with anon key

## Notes

- Use direct Postgres (sqlx) for writes - faster than PostgREST for bulk inserts
- Transaction ensures atomicity - all or nothing
- UPSERT (ON CONFLICT) handles re-runs gracefully
- Progress bars give user feedback during long sync operations
- Individual INSERTs for clarity; can optimize with COPY or bulk VALUES later
