//! Dump spell command - Output a single spell as JSON for debugging

use anyhow::Result;
use parsers::{transform::transform_spell, DbcData};

use super::DumpSpellArgs;

pub fn run_dump_spell(args: DumpSpellArgs) -> Result<()> {
    // Load DBC data
    let dbc = DbcData::load_all(&args.data_dir)?;

    // Transform the requested spell
    let spell = transform_spell(&dbc, args.spell_id, None)?;

    // Output as pretty JSON
    let json = serde_json::to_string_pretty(&spell)?;
    println!("{}", json);

    Ok(())
}
