//! Dump talent command - Output a talent tree as JSON for debugging

use anyhow::Result;
use snapshot_parser::{transform::transform_talent_tree, DbcData};

use super::DumpTalentArgs;

pub fn run_dump_talent(args: DumpTalentArgs) -> Result<()> {
    // Load DBC data
    let dbc = DbcData::load_all(&args.data_dir)?;

    // Transform the requested talent tree
    let tree = transform_talent_tree(&dbc, args.spec_id)?;

    // Output as pretty JSON
    let json = serde_json::to_string_pretty(&tree)?;
    println!("{}", json);

    Ok(())
}
