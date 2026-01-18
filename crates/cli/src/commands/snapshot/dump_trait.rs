//! Dump trait command - Output a trait tree as JSON for debugging

use anyhow::Result;
use wowlab_parsers::{transform::transform_trait_tree, DbcData};

use super::DumpTraitArgs;

pub fn run_dump_trait(args: DumpTraitArgs) -> Result<()> {
    // Load DBC data
    let dbc = DbcData::load_all(&args.data_dir)?;

    // Transform the requested trait tree
    let tree = transform_trait_tree(&dbc, args.spec_id)?;

    // Output as pretty JSON
    let json = serde_json::to_string_pretty(&tree)?;
    println!("{}", json);

    Ok(())
}
