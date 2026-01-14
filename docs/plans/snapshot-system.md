# Snapshot System for Engine Data

## Overview

A system for generating, storing, and consuming pre-assembled game data snapshots. **Everything is Rust** - CLI, generation, transformation, and consumption.

```
Raw DBC CSVs (data/)
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│               crates/snapshot-parser (Rust)                  │
│  - CSV parsing (csv crate)                                   │
│  - DBC type definitions (serde structs)                      │
│  - Spell/Talent/Aura/Item transformation                     │
│  - Snapshot generation → JSON                                │
│  - Snapshot consumption (native + WASM)                      │
│  - Talent string decoding                                    │
│  - Spell description parsing                                 │
└──────────────────────────────────────────────────────────────┘
    │                           │                           │
    ▼                           ▼                           ▼
┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│ crates/cli     │   │ crates/engine      │   │ packages/wowlab    │
│ (Rust + clap)  │   │ (native dep)       │   │ (WASM wrapper)     │
│ - generate     │   │ - Simulation       │   │ - apps/portal      │
│ - upload       │   │ - DPS calc         │   │                    │
│ - validate     │   │                    │   │                    │
└────────────────┘   └────────────────────┘   └────────────────────┘
                                │
                                ▼
                     ┌────────────────────┐
                     │ Supabase Storage   │
                     │ snapshots/11.2.0/  │
                     └────────────────────┘
```

## Architecture

### Crates

| Crate | Purpose |
|-------|---------|
| `crates/snapshot-parser` | DBC parsing, transformation, snapshot types, loaders |
| `crates/cli` | Command-line tool (generate, upload, validate, list) |
| `crates/engine` | Simulation engine, uses snapshot-parser |

### What Lives Where

| Component | Location |
|-----------|----------|
| DBC type definitions | `crates/snapshot-parser/src/dbc/` |
| CSV parsing | `crates/snapshot-parser/src/dbc/loader.rs` |
| Data transformation | `crates/snapshot-parser/src/transform/` |
| Snapshot types | `crates/snapshot-parser/src/snapshot/types.rs` |
| Snapshot generation | `crates/snapshot-parser/src/snapshot/generator.rs` |
| Snapshot consumption | `crates/snapshot-parser/src/loader/` |
| Talent string decoder | `crates/snapshot-parser/src/talent/` |
| Spell description parser | `crates/snapshot-parser/src/spell/` |
| WASM bindings | `crates/snapshot-parser/src/wasm.rs` |
| CLI commands | `crates/cli/src/` |

### packages/

Single package wrapping WASM for web use:

```
packages/
└── wowlab/
    ├── package.json
    ├── wasm/                    # wasm-pack output
    │   ├── snapshot_parser.d.ts
    │   ├── snapshot_parser.js
    │   └── snapshot_parser_bg.wasm
    └── src/
        └── index.ts             # Re-exports WASM bindings
```

## crates/snapshot-parser Structure

```
crates/snapshot-parser/
├── Cargo.toml
└── src/
    ├── lib.rs                   # Public API
    │
    ├── dbc/                     # DBC definitions + CSV parsing
    │   ├── mod.rs
    │   ├── loader.rs            # CSV loader
    │   ├── spell.rs             # spell_*, spell_effect, etc.
    │   ├── talent.rs            # trait_*, talent_* tables
    │   ├── item.rs              # item_*, item_effect, etc.
    │   ├── character.rs         # chr_classes, chr_specialization
    │   └── curve.rs             # expected_stat, content_tuning
    │
    ├── transform/               # Raw DBC → Snapshot transformation
    │   ├── mod.rs
    │   ├── spell.rs
    │   ├── talent.rs
    │   ├── aura.rs
    │   ├── item.rs
    │   ├── spec.rs
    │   └── curve.rs
    │
    ├── snapshot/                # Snapshot types + generation
    │   ├── mod.rs
    │   ├── types.rs             # TalentSnapshot, SpellSnapshot, etc.
    │   ├── generator.rs         # Batch generation logic
    │   └── manifest.rs          # Manifest generation
    │
    ├── loader/                  # Snapshot consumption
    │   ├── mod.rs               # SnapshotLoader trait
    │   ├── native.rs            # reqwest + fs (native)
    │   └── wasm.rs              # fetch + IndexedDB (wasm)
    │
    ├── talent/                  # Talent-specific logic
    │   ├── mod.rs
    │   ├── decoder.rs           # Base64 talent string decoding
    │   └── resolver.rs          # Map selections → spell IDs
    │
    ├── spell/                   # Spell-specific logic
    │   ├── mod.rs
    │   ├── description.rs       # Variable substitution parser
    │   └── damage.rs            # Damage formula calculations
    │
    ├── wasm.rs                  # wasm-bindgen exports
    └── errors.rs                # Error types
```

## crates/cli Structure

```
crates/cli/
├── Cargo.toml
└── src/
    ├── main.rs                  # Entry point
    ├── commands/
    │   ├── mod.rs
    │   ├── generate.rs          # Generate snapshots from DBC CSVs
    │   ├── upload.rs            # Upload to Supabase Storage
    │   ├── list.rs              # List available snapshots
    │   └── validate.rs          # Validate snapshot integrity
    └── config.rs                # CLI configuration
```

## CLI Usage

Native Rust binary using clap:

```bash
# Generate snapshots
wowlab snapshot generate --patch 11.2.0 --data-dir ./data --output ./snapshots
wowlab snapshot generate --patch 11.2.0 --types talents,spells
wowlab snapshot generate --patch 11.2.0 --specs 253,254

# Upload to Supabase Storage
wowlab snapshot upload --patch 11.2.0 --input ./snapshots

# List available snapshots
wowlab snapshot list
wowlab snapshot list --patch 11.2.0 --verbose

# Validate snapshot integrity
wowlab snapshot validate --patch 11.2.0
wowlab snapshot validate --patch 11.2.0 --remote
```

### CLI Implementation

```rust
// crates/cli/src/main.rs
use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "wowlab")]
#[command(about = "WoW Lab CLI tools")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Snapshot {
        #[command(subcommand)]
        action: SnapshotCommands,
    },
}

#[derive(Subcommand)]
enum SnapshotCommands {
    Generate {
        #[arg(long)]
        patch: String,
        #[arg(long, default_value = "./data")]
        data_dir: PathBuf,
        #[arg(long, default_value = "./snapshots")]
        output: PathBuf,
        #[arg(long)]
        types: Option<String>,
        #[arg(long)]
        specs: Option<String>,
    },
    Upload {
        #[arg(long)]
        patch: String,
        #[arg(long, default_value = "./snapshots")]
        input: PathBuf,
        #[arg(long)]
        force: bool,
    },
    List {
        #[arg(long)]
        patch: Option<String>,
        #[arg(long)]
        verbose: bool,
    },
    Validate {
        #[arg(long)]
        patch: String,
        #[arg(long)]
        remote: bool,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Snapshot { action } => match action {
            SnapshotCommands::Generate { patch, data_dir, output, types, specs } => {
                commands::generate::run(patch, data_dir, output, types, specs)
            }
            SnapshotCommands::Upload { patch, input, force } => {
                commands::upload::run(patch, input, force)
            }
            SnapshotCommands::List { patch, verbose } => {
                commands::list::run(patch, verbose)
            }
            SnapshotCommands::Validate { patch, remote } => {
                commands::validate::run(patch, remote)
            }
        }
    }
}
```

```rust
// crates/cli/src/commands/generate.rs
use snapshot_parser::{dbc, transform, snapshot};

pub fn run(
    patch: String,
    data_dir: PathBuf,
    output: PathBuf,
    types: Option<String>,
    specs: Option<String>,
) -> Result<()> {
    println!("Loading DBC data from {:?}...", data_dir);

    let dbc_data = dbc::load_all(&data_dir)?;

    let types: Vec<&str> = types
        .as_deref()
        .map(|t| t.split(',').collect())
        .unwrap_or_else(|| vec!["talents", "spells", "auras", "items", "specs", "curves"]);

    let specs: Option<Vec<u32>> = specs
        .map(|s| s.split(',').filter_map(|id| id.parse().ok()).collect());

    let mut generated = 0;

    for snapshot_type in types {
        match snapshot_type {
            "talents" => {
                let snapshots = transform::talents(&dbc_data, specs.as_deref())?;
                for (spec_id, snapshot) in snapshots {
                    let path = output.join(format!("{}/talents/{}.json", patch, spec_id));
                    snapshot::write(&path, &snapshot)?;
                    generated += 1;
                }
            }
            "spells" => {
                let snapshots = transform::spells(&dbc_data)?;
                for (class, snapshot) in snapshots {
                    let path = output.join(format!("{}/spells/{}.json", patch, class));
                    snapshot::write(&path, &snapshot)?;
                    generated += 1;
                }
            }
            // ... other types
            _ => {}
        }
    }

    // Generate manifest
    let manifest = snapshot::generate_manifest(&output, &patch)?;
    snapshot::write(&output.join(format!("{}/manifest.json", patch)), &manifest)?;

    println!("Generated {} snapshot files", generated);
    Ok(())
}
```

## Snapshot Types

All defined in Rust, serialized to JSON via serde.

### TalentSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentSnapshot {
    pub spec_id: u32,
    pub spec_name: String,
    pub class_name: String,
    pub tree_id: u32,
    pub all_node_ids: Vec<u32>,
    pub nodes: Vec<TalentNodeSnapshot>,
    pub point_limits: PointLimits,
    pub sub_trees: Vec<SubTreeSnapshot>,
}
```

### SpellSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellSnapshot {
    pub id: u32,
    pub name: String,
    pub cast_time_ms: u32,
    pub gcd_ms: u32,
    pub cooldown_ms: u32,
    pub charges: u8,
    pub charge_recovery_ms: u32,
    pub costs: Vec<SpellCost>,
    pub school: u8,
    pub ap_coefficient: f64,
    pub sp_coefficient: f64,
    pub base_points: i32,
    pub variance: f64,
    pub range: f32,
    pub radius: f32,
    pub max_targets: u8,
    pub effects: Vec<SpellEffectSnapshot>,
    pub is_passive: bool,
    pub can_crit: bool,
    pub ignores_gcd: bool,
}
```

### AuraSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuraSnapshot {
    pub id: u32,
    pub name: String,
    pub spell_id: u32,
    pub base_duration_ms: u32,
    pub max_duration_ms: u32,
    pub max_stacks: u8,
    pub stack_behavior: StackBehavior,
    pub tick_period_ms: u32,
    pub periodic_type: PeriodicType,
    pub refresh_behavior: RefreshBehavior,
    pub pandemic_window: f32,
    pub effects: Vec<AuraEffectSnapshot>,
    pub flags: AuraFlags,
}
```

### ItemSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemSnapshot {
    pub id: u32,
    pub name: String,
    pub item_level: u16,
    pub quality: u8,
    pub inventory_type: u8,
    pub class_id: u8,
    pub subclass_id: u8,
    pub stats: Vec<ItemStat>,
    pub effects: Vec<ItemEffect>,
    pub set_id: Option<u32>,
    pub set_bonuses: Option<Vec<SetBonus>>,
    pub weapon: Option<WeaponStats>,
}
```

## Storage Structure

```
Supabase Storage: wowlab-snapshots bucket
└── snapshots/
    ├── manifest.json           # Global manifest
    └── 11.2.0/                  # Patch version
        ├── manifest.json       # Patch manifest with checksums
        ├── talents/
        │   ├── 253.json        # BM Hunter
        │   ├── 254.json        # MM Hunter
        │   └── ...
        ├── spells/
        │   ├── hunter.json
        │   └── ...
        ├── auras/
        │   ├── hunter.json
        │   └── ...
        ├── items/
        │   ├── trinkets.json
        │   ├── tier-sets.json
        │   └── ...
        ├── specs/
        │   └── all.json
        └── curves/
            └── scaling.json
```

## WASM Exports

For web use via `packages/wowlab`:

```rust
// crates/snapshot-parser/src/wasm.rs

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub async fn load_talents(spec_id: u32) -> Result<JsValue, JsValue> {
    let snapshot = crate::loader::wasm::load_talents(spec_id).await?;
    serde_wasm_bindgen::to_value(&snapshot).map_err(|e| e.into())
}

#[wasm_bindgen]
pub fn decode_talent_string(talent_string: &str) -> Result<JsValue, JsValue> {
    let decoded = crate::talent::decoder::decode(talent_string)?;
    serde_wasm_bindgen::to_value(&decoded).map_err(|e| e.into())
}

#[wasm_bindgen]
pub fn resolve_talents(snapshot: JsValue, decoded: JsValue) -> Result<JsValue, JsValue> {
    let snap: TalentSnapshot = serde_wasm_bindgen::from_value(snapshot)?;
    let dec: DecodedLoadout = serde_wasm_bindgen::from_value(decoded)?;
    let spells = crate::talent::resolver::resolve(&snap, &dec);
    serde_wasm_bindgen::to_value(&spells).map_err(|e| e.into())
}

#[wasm_bindgen]
pub async fn load_spells(class_name: &str) -> Result<JsValue, JsValue> {
    let snapshot = crate::loader::wasm::load_spells(class_name).await?;
    serde_wasm_bindgen::to_value(&snapshot).map_err(|e| e.into())
}

#[wasm_bindgen]
pub fn parse_spell_description(template: &str, spell: JsValue) -> Result<String, JsValue> {
    let spell: SpellSnapshot = serde_wasm_bindgen::from_value(spell)?;
    crate::spell::description::parse(template, &spell).map_err(|e| e.into())
}
```

## Integration Examples

### Portal (Web)

```typescript
// apps/portal/src/hooks/use-talents.ts
import { useEffect, useState } from 'react';
import { initWasm, loadTalents, decodeTalentString, resolveTalents } from '@wowlab/wowlab';

let initialized = false;

export function useTalentTree(specId: number, talentString?: string) {
  const [snapshot, setSnapshot] = useState<TalentSnapshot | null>(null);
  const [activeSpells, setActiveSpells] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!initialized) {
        await initWasm();
        initialized = true;
      }

      const snap = await loadTalents(specId);
      setSnapshot(snap);

      if (talentString) {
        const decoded = decodeTalentString(talentString);
        const spells = resolveTalents(snap, decoded);
        setActiveSpells(spells);
      }

      setLoading(false);
    }
    load();
  }, [specId, talentString]);

  return { snapshot, activeSpells, loading };
}
```

### Engine (Native Rust)

```rust
// crates/engine/src/simulation.rs
use snapshot_parser::{NativeLoader, LoaderConfig};
use snapshot_parser::talent::{decoder, resolver};

pub fn create_simulation(config: SimConfig) -> Result<Simulation, EngineError> {
    let loader = NativeLoader::new(LoaderConfig {
        base_url: config.snapshot_url,
        patch: config.patch,
        cache_dir: dirs::cache_dir().unwrap().join("wowlab/snapshots"),
    });

    let talent_snap = loader.load_talents(config.spec_id)?;
    let decoded = decoder::decode(&config.talent_string)?;
    let active_spells = resolver::resolve(&talent_snap, &decoded);
    let spell_snap = loader.load_spells(&config.class_name)?;

    Ok(Simulation::new(active_spells, spell_snap))
}
```

## Cargo.toml

### crates/snapshot-parser/Cargo.toml

```toml
[package]
name = "snapshot-parser"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = ["native"]
native = ["reqwest", "dirs"]
wasm = ["wasm-bindgen", "wasm-bindgen-futures", "web-sys", "js-sys", "serde-wasm-bindgen", "console_error_panic_hook"]

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
csv = "1.3"
thiserror = "2"

# Native-only
reqwest = { version = "0.12", features = ["json", "blocking"], optional = true }
dirs = { version = "5", optional = true }

# WASM-only
wasm-bindgen = { version = "0.2", optional = true }
wasm-bindgen-futures = { version = "0.4", optional = true }
web-sys = { version = "0.3", features = ["Window", "Request", "Response", "Headers", "console"], optional = true }
js-sys = { version = "0.3", optional = true }
serde-wasm-bindgen = { version = "0.6", optional = true }
console_error_panic_hook = { version = "0.1", optional = true }
```

### crates/cli/Cargo.toml

```toml
[package]
name = "wowlab-cli"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "wowlab"
path = "src/main.rs"

[dependencies]
snapshot-parser = { path = "../snapshot-parser" }
clap = { version = "4", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1"
reqwest = { version = "0.12", features = ["json"] }
sha2 = "0.10"
```

## Build Commands

```bash
# Build CLI (native)
cargo build --release -p wowlab-cli

# Build snapshot-parser (WASM)
cd crates/snapshot-parser && wasm-pack build --target web --out-dir ../../packages/wowlab/wasm

# Run CLI
./target/release/wowlab snapshot generate --patch 11.2.0

# Or via cargo
cargo run -p wowlab-cli -- snapshot generate --patch 11.2.0
```

## Implementation Phases

### Phase 1: crates/snapshot-parser Foundation

1. Create `crates/snapshot-parser` with Cargo.toml
2. Implement DBC CSV parsing (`csv` crate + serde structs)
3. Define all snapshot types
4. Basic transformation logic

**Deliverables:**
- DBC parsing working
- Snapshot types defined

### Phase 2: CLI

1. Create `crates/cli` with clap
2. Implement `generate` command
3. Implement `upload` command (Supabase)
4. Implement `list` and `validate` commands

**Deliverables:**
- `wowlab` CLI binary
- Snapshot generation working

### Phase 3: Loaders + WASM

1. Implement native loader (reqwest + fs cache)
2. Implement WASM loader (fetch + IndexedDB)
3. Add wasm-bindgen exports
4. Create `packages/wowlab` wrapper

**Deliverables:**
- WASM build working
- `packages/wowlab` npm package

### Phase 4: Engine Integration

1. Add snapshot-parser dependency to engine
2. Refactor handlers to use snapshots
3. Remove hardcoded talent data

**Deliverables:**
- Engine uses snapshots
- Dynamic talent configuration

### Phase 5: Portal Migration

1. Update portal to use `@wowlab/wowlab`
2. Remove old Effect service dependencies
3. Update hooks to use WASM

**Deliverables:**
- Portal using snapshots
- No more direct Supabase queries for game data

## Migration Checklist

- [ ] Create `crates/snapshot-parser/`
- [ ] Port DBC type definitions from old `@wowlab/core`
- [ ] Implement CSV parsing
- [ ] Port extractors from old `@wowlab/services`
- [ ] Port talent transformer
- [ ] Port spell transformer
- [ ] Port aura/item transformers
- [ ] Port talent string decoder from old `@wowlab/parsers`
- [ ] Port spell description parser
- [ ] Create `crates/cli/`
- [ ] Implement CLI commands
- [ ] Implement WASM exports
- [ ] Create `packages/wowlab/`
- [ ] Update portal imports
- [ ] Update engine to use snapshot-parser
