//! Snapshot processing commands
//!
//! Commands for loading, transforming, and syncing DBC snapshot data.

mod dump_spell;
mod dump_talent;
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
    /// Dump a talent tree to JSON (for debugging)
    DumpTalent(DumpTalentArgs),
}

impl SnapshotCommand {
    pub async fn run(self) -> Result<()> {
        match self {
            Self::Sync(args) => sync::run_sync(args).await,
            Self::DumpSpell(args) => dump_spell::run_dump_spell(args),
            Self::DumpTalent(args) => dump_talent::run_dump_talent(args),
        }
    }
}

/// Valid table names for --table filter
#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::ValueEnum)]
pub enum SyncTable {
    Spells,
    Talents,
    Items,
    Auras,
    Specs,
}

impl std::fmt::Display for SyncTable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyncTable::Spells => write!(f, "spells"),
            SyncTable::Talents => write!(f, "talents"),
            SyncTable::Items => write!(f, "items"),
            SyncTable::Auras => write!(f, "auras"),
            SyncTable::Specs => write!(f, "specs"),
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
