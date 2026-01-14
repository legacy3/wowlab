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
