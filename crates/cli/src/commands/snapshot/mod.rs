//! Snapshot processing commands
//!
//! Commands for loading, transforming, and syncing DBC snapshot data.
//!
//! Structure:
//! - `sync.rs` - Main sync command orchestration
//! - `db.rs` - Database operations (bulk insert, cleanup)
//! - `dump_spell.rs` - Debug utility for single spell
//! - `dump_trait.rs` - Debug utility for single trait tree

mod db;
mod dump_spell;
mod dump_trait;
mod sync;

use anyhow::Result;
use clap::Subcommand;
use std::path::PathBuf;

#[derive(Subcommand)]
pub enum SnapshotCommand {
    /// Sync transformed data to Supabase Postgres
    Sync(SyncArgs),
    /// Dump a single spell to JSON (for debugging)
    DumpSpell(DumpSpellArgs),
    /// Dump a trait tree to JSON (for debugging)
    DumpTrait(DumpTraitArgs),
}

impl SnapshotCommand {
    pub async fn run(self) -> Result<()> {
        match self {
            Self::Sync(args) => sync::run_sync(args).await,
            Self::DumpSpell(args) => dump_spell::run_dump_spell(args),
            Self::DumpTrait(args) => dump_trait::run_dump_trait(args),
        }
    }
}

/// Valid table names for --table filter
#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
pub enum SyncTable {
    Spells,
    Traits,
    Items,
    Auras,
    Specs,
    Classes,
    GlobalColors,
    GlobalStrings,
}

impl std::fmt::Display for SyncTable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncTable::Spells => write!(f, "spells"),
            SyncTable::Traits => write!(f, "traits"),
            SyncTable::Items => write!(f, "items"),
            SyncTable::Auras => write!(f, "auras"),
            SyncTable::Specs => write!(f, "specs"),
            SyncTable::Classes => write!(f, "classes"),
            SyncTable::GlobalColors => write!(f, "global_colors"),
            SyncTable::GlobalStrings => write!(f, "global_strings"),
        }
    }
}

#[derive(clap::Args)]
pub struct SyncArgs {
    /// Patch version to tag data with (e.g., "11.2.0")
    #[arg(long)]
    pub patch: String,

    /// Directory containing DBC CSV files
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,

    /// Skip cleaning old data for this patch before inserting
    #[arg(long)]
    pub no_clean: bool,

    /// Dry run - transform but don't write to database
    #[arg(long)]
    pub dry_run: bool,

    /// Only sync specific tables (can be specified multiple times)
    /// If not specified, all tables are synced
    #[arg(long = "table", value_enum)]
    pub tables: Vec<SyncTable>,
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
pub struct DumpTraitArgs {
    /// Spec ID to dump
    pub spec_id: i32,

    /// Directory containing DBC CSV files
    #[arg(long, default_value = "./data")]
    pub data_dir: PathBuf,
}
