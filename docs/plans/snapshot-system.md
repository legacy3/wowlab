# Snapshot System for Engine Data

## Overview

A system for generating, storing, and consuming pre-assembled game data snapshots. **All data logic lives in Rust** - generation, transformation, and consumption are unified in `crates/gamedata`.

```
Raw DBC CSVs (data/)
    │
    ▼
┌──────────────────────────────────────────────────────────────┐
│                    crates/gamedata (Rust)                    │
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
│ Supabase       │   │ crates/engine      │   │ packages/wowlab    │
│ Storage        │   │ (native dep)       │   │ (WASM wrapper)     │
│ snapshots/     │   │ - Simulation       │   │ - apps/cli         │
│                │   │ - DPS calc         │   │ - apps/portal  │
└────────────────┘   └────────────────────┘   └────────────────────┘
```

## Architecture

### What Lives Where

| Component | Location | Notes |
|-----------|----------|-------|
| DBC type definitions | `crates/gamedata/src/dbc/` | Rust structs with serde |
| CSV parsing | `crates/gamedata/src/dbc/` | `csv` crate |
| Data transformation | `crates/gamedata/src/transform/` | Spell, talent, aura, item |
| Snapshot generation | `crates/gamedata/src/snapshot/` | JSON output |
| Snapshot consumption | `crates/gamedata/src/loader/` | Native + WASM |
| Talent string decoder | `crates/gamedata/src/talent/` | Base64 bit reader |
| Spell description parser | `crates/gamedata/src/spell/` | Variable substitution |
| WASM bindings | `crates/gamedata/src/wasm.rs` | wasm-bindgen exports |
| TypeScript wrapper | `packages/wowlab/` | Only package, just wraps WASM |

### packages/ Demolition

**DELETE ENTIRELY:**
- `packages/wowlab-core/` - DBC schemas move to Rust
- `packages/wowlab-services/` - Transformers move to Rust
- `packages/wowlab-parsers/` - Parsers move to Rust
- `packages/wowlab-engine/` - Merged into wowlab package
- `packages/wowlab-gamedata/` - Merged into wowlab package

**KEEP (renamed/consolidated):**
- `packages/wowlab/` - Single package wrapping all WASM exports

### Final packages/ Structure

```
packages/
└── wowlab/
    ├── package.json
    ├── wasm/                    # wasm-pack output
    │   ├── wowlab.d.ts
    │   ├── wowlab.js
    │   └── wowlab_bg.wasm
    └── src/
        └── index.ts             # Re-exports WASM bindings
```

## crates/gamedata Structure

```
crates/gamedata/
├── Cargo.toml
├── src/
│   ├── lib.rs                   # Public API
│   │
│   ├── dbc/                     # DBC definitions + CSV parsing
│   │   ├── mod.rs
│   │   ├── loader.rs            # CSV loader
│   │   ├── spell.rs             # spell_*, spell_effect, etc.
│   │   ├── talent.rs            # trait_*, talent_* tables
│   │   ├── item.rs              # item_*, item_effect, etc.
│   │   ├── character.rs         # chr_classes, chr_specialization
│   │   └── curve.rs             # expected_stat, content_tuning
│   │
│   ├── transform/               # Raw DBC → Snapshot transformation
│   │   ├── mod.rs
│   │   ├── spell.rs             # SpellSnapshot generation
│   │   ├── talent.rs            # TalentSnapshot generation
│   │   ├── aura.rs              # AuraSnapshot generation
│   │   ├── item.rs              # ItemSnapshot generation
│   │   ├── spec.rs              # SpecSnapshot generation
│   │   └── curve.rs             # CurveSnapshot generation
│   │
│   ├── snapshot/                # Snapshot types + generation
│   │   ├── mod.rs
│   │   ├── types.rs             # All snapshot struct definitions
│   │   ├── generator.rs         # Batch generation logic
│   │   └── manifest.rs          # Manifest generation
│   │
│   ├── loader/                  # Snapshot consumption
│   │   ├── mod.rs               # SnapshotLoader trait
│   │   ├── native.rs            # reqwest + fs (native)
│   │   └── wasm.rs              # fetch + IndexedDB (wasm)
│   │
│   ├── talent/                  # Talent-specific logic
│   │   ├── mod.rs
│   │   ├── decoder.rs           # Base64 talent string decoding
│   │   └── resolver.rs          # Map selections → spell IDs
│   │
│   ├── spell/                   # Spell-specific logic
│   │   ├── mod.rs
│   │   ├── description.rs       # Variable substitution parser
│   │   └── damage.rs            # Damage formula calculations
│   │
│   ├── wasm.rs                  # wasm-bindgen exports
│   └── errors.rs                # Error types
│
└── tests/
    ├── dbc_parsing.rs
    ├── transformation.rs
    └── snapshot_roundtrip.rs
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentNodeSnapshot {
    pub id: u32,
    #[serde(rename = "type")]
    pub node_type: u8,
    pub max_ranks: u8,
    pub tree_index: u8,
    pub sub_tree_id: u32,
    pub entries: Vec<TalentEntrySnapshot>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TalentEntrySnapshot {
    pub id: u32,
    pub spell_id: u32,
    pub definition_id: u32,
    pub name: String,
}
```

### SpellSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpellSnapshot {
    pub id: u32,
    pub name: String,

    // Timing
    pub cast_time_ms: u32,
    pub gcd_ms: u32,
    pub cooldown_ms: u32,
    pub charges: u8,
    pub charge_recovery_ms: u32,

    // Resources
    pub costs: Vec<SpellCost>,

    // Damage
    pub school: u8,
    pub ap_coefficient: f64,
    pub sp_coefficient: f64,
    pub base_points: i32,
    pub variance: f64,

    // Targeting
    pub range: f32,
    pub radius: f32,
    pub max_targets: u8,

    // Effects
    pub effects: Vec<SpellEffectSnapshot>,

    // Flags
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

### SpecSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecSnapshot {
    pub id: u32,
    pub name: String,
    pub class_id: u8,
    pub class_name: String,

    pub primary_resource: String,
    pub max_resource: u16,
    pub base_regen: f32,

    pub base_stats: BaseStats,

    pub mastery_coefficient: f32,
    pub haste_coefficient: f32,

    pub role: Role,
    pub armor_type: ArmorType,
}
```

### CurveSnapshot

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurveSnapshot {
    pub expected_stats: Vec<ExpectedStat>,
    pub content_tuning: Vec<ContentTuning>,
    pub rating_conversions: RatingConversions,
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
        │   ├── hunter.json     # All hunter spells
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

## CLI Usage

The CLI calls into gamedata WASM for all operations.

```bash
# Generate snapshots (calls gamedata::snapshot::generate)
pnpm cli snapshot generate --patch 11.2.0
pnpm cli snapshot generate --patch 11.2.0 --types talents,spells
pnpm cli snapshot generate --patch 11.2.0 --specs 253,254

# Upload to Supabase Storage
pnpm cli snapshot upload --patch 11.2.0

# List/validate
pnpm cli snapshot list --patch 11.2.0
pnpm cli snapshot validate --patch 11.2.0
```

### CLI Implementation

```typescript
// apps/cli/commands/snapshot/generate.ts
import { initWasm, generateSnapshots } from '@wowlab/wowlab';

export async function generate(options: GenerateOptions) {
  await initWasm();

  const result = await generateSnapshots({
    patch: options.patch,
    dataDir: './data',  // Path to DBC CSVs
    outputDir: './snapshots',
    types: options.types,
    specs: options.specs,
  });

  console.log(`Generated ${result.fileCount} files`);
}
```

## WASM Exports

```rust
// crates/gamedata/src/wasm.rs

use wasm_bindgen::prelude::*;

/// Initialize the WASM module
#[wasm_bindgen]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Generate snapshots from DBC CSVs
#[wasm_bindgen]
pub async fn generate_snapshots(options: JsValue) -> Result<JsValue, JsValue> {
    let opts: GenerateOptions = serde_wasm_bindgen::from_value(options)?;
    let result = crate::snapshot::generator::generate(opts).await?;
    serde_wasm_bindgen::to_value(&result).map_err(|e| e.into())
}

/// Load a talent snapshot (with caching)
#[wasm_bindgen]
pub async fn load_talents(spec_id: u32) -> Result<JsValue, JsValue> {
    let snapshot = crate::loader::wasm::load_talents(spec_id).await?;
    serde_wasm_bindgen::to_value(&snapshot).map_err(|e| e.into())
}

/// Decode a talent loadout string
#[wasm_bindgen]
pub fn decode_talent_string(talent_string: &str) -> Result<JsValue, JsValue> {
    let decoded = crate::talent::decoder::decode(talent_string)?;
    serde_wasm_bindgen::to_value(&decoded).map_err(|e| e.into())
}

/// Resolve talent selections to active spell IDs
#[wasm_bindgen]
pub fn resolve_talents(
    snapshot: JsValue,
    decoded: JsValue,
) -> Result<JsValue, JsValue> {
    let snap: TalentSnapshot = serde_wasm_bindgen::from_value(snapshot)?;
    let dec: DecodedLoadout = serde_wasm_bindgen::from_value(decoded)?;
    let spells = crate::talent::resolver::resolve(&snap, &dec);
    serde_wasm_bindgen::to_value(&spells).map_err(|e| e.into())
}

/// Load spell data for a class
#[wasm_bindgen]
pub async fn load_spells(class_name: &str) -> Result<JsValue, JsValue> {
    let snapshot = crate::loader::wasm::load_spells(class_name).await?;
    serde_wasm_bindgen::to_value(&snapshot).map_err(|e| e.into())
}

/// Parse spell description with variable substitution
#[wasm_bindgen]
pub fn parse_spell_description(
    template: &str,
    spell: JsValue,
) -> Result<String, JsValue> {
    let spell: SpellSnapshot = serde_wasm_bindgen::from_value(spell)?;
    crate::spell::description::parse(template, &spell).map_err(|e| e.into())
}
```

## packages/wowlab

The single surviving package - just re-exports WASM.

```typescript
// packages/wowlab/src/index.ts
import init, {
  generate_snapshots,
  load_talents,
  load_spells,
  decode_talent_string,
  resolve_talents,
  parse_spell_description,
} from '../wasm/wowlab.js';

export { init as initWasm };

export async function generateSnapshots(options: GenerateOptions): Promise<GenerateResult> {
  return generate_snapshots(options);
}

export async function loadTalents(specId: number): Promise<TalentSnapshot> {
  return load_talents(specId);
}

export async function loadSpells(className: string): Promise<SpellsSnapshot> {
  return load_spells(className);
}

export function decodeTalentString(talentString: string): DecodedLoadout {
  return decode_talent_string(talentString);
}

export function resolveTalents(
  snapshot: TalentSnapshot,
  decoded: DecodedLoadout
): number[] {
  return resolve_talents(snapshot, decoded);
}

export function parseSpellDescription(
  template: string,
  spell: SpellSnapshot
): string {
  return parse_spell_description(template, spell);
}

// Re-export types
export type {
  TalentSnapshot,
  SpellSnapshot,
  AuraSnapshot,
  ItemSnapshot,
  SpecSnapshot,
  CurveSnapshot,
  DecodedLoadout,
  GenerateOptions,
  GenerateResult,
};
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
use gamedata::{NativeLoader, LoaderConfig};
use gamedata::talent::decoder::decode;
use gamedata::talent::resolver::resolve;

pub fn create_simulation(config: SimConfig) -> Result<Simulation, EngineError> {
    let loader = NativeLoader::new(LoaderConfig {
        base_url: config.snapshot_url,
        patch: config.patch,
        cache_dir: dirs::cache_dir().unwrap().join("wowlab/snapshots"),
    });

    // Load talent snapshot
    let talent_snap = loader.load_talents(config.spec_id)?;

    // Decode talent string
    let decoded = decode(&config.talent_string)?;

    // Resolve to spell IDs
    let active_spells = resolve(&talent_snap, &decoded);

    // Load spell data
    let spell_snap = loader.load_spells(&config.class_name)?;

    // Build simulation with loaded data
    Ok(Simulation::new(active_spells, spell_snap))
}
```

### CLI

```typescript
// apps/cli/commands/snapshot/generate.ts
import { Command } from '@effect/cli';
import { initWasm, generateSnapshots } from '@wowlab/wowlab';
import * as fs from 'fs/promises';

export const generate = Command.make('generate', { patch, types, specs, output }, async (args) => {
  await initWasm();

  const result = await generateSnapshots({
    patch: args.patch,
    dataDir: './data',
    types: args.types?.split(','),
    specs: args.specs?.split(',').map(Number),
  });

  // Write output files
  for (const file of result.files) {
    const path = `${args.output}/${file.path}`;
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, JSON.stringify(file.data, null, 2));
  }

  console.log(`Generated ${result.files.length} files to ${args.output}`);
});
```

## Implementation Phases

### Phase 1: crates/gamedata Foundation

1. Create `crates/gamedata` with Cargo.toml (dual-target: native + wasm)
2. Implement DBC CSV parsing (`csv` crate + serde structs)
3. Define all snapshot types in Rust
4. Implement basic WASM exports

**Deliverables:**
- `crates/gamedata/` with DBC parsing
- Snapshot type definitions
- Basic WASM build working

### Phase 2: Transformation Layer

1. Port spell transformation from TypeScript extractors
2. Port talent transformation
3. Port aura/item transformation
4. Implement snapshot generation

**Deliverables:**
- All transformers in Rust
- `generate_snapshots()` working

### Phase 3: packages/wowlab + CLI

1. Create `packages/wowlab/` with WASM wrapper
2. Delete all other packages
3. Update CLI to use WASM
4. Test snapshot generation end-to-end

**Deliverables:**
- Single `packages/wowlab/` package
- CLI generating snapshots via WASM

### Phase 4: Loaders + Consumption

1. Implement native loader (reqwest + fs cache)
2. Implement WASM loader (fetch + IndexedDB)
3. Add talent decoder
4. Add talent resolver

**Deliverables:**
- Snapshot consumption working
- Talent string → spell IDs working

### Phase 5: Engine Integration

1. Add gamedata dependency to engine
2. Refactor handlers to use snapshots
3. Remove hardcoded talent data

**Deliverables:**
- Engine loads data from snapshots
- Dynamic talent configuration

### Phase 6: Portal Migration

1. Update portal to use `@wowlab/wowlab`
2. Remove Effect service dependencies
3. Update hooks to use WASM

**Deliverables:**
- Portal using snapshots
- No more direct Supabase queries for game data

## Cargo.toml

```toml
[package]
name = "gamedata"
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

## Build Commands

```bash
# Build gamedata (native)
cd crates/gamedata && cargo build --release

# Build gamedata (WASM)
cd crates/gamedata && wasm-pack build --target web --out-dir ../../packages/wowlab/wasm

# Generate snapshots
pnpm cli snapshot generate --patch 11.2.0

# Upload snapshots
pnpm cli snapshot upload --patch 11.2.0
```

## Migration Checklist

- [ ] Create `crates/gamedata/`
- [ ] Port DBC type definitions from `@wowlab/core`
- [ ] Implement CSV parsing
- [ ] Port extractors from `@wowlab/services`
- [ ] Port talent transformer
- [ ] Port spell transformer
- [ ] Port aura/item transformers
- [ ] Port talent string decoder from `@wowlab/parsers`
- [ ] Port spell description parser
- [ ] Implement WASM exports
- [ ] Create `packages/wowlab/`
- [ ] Delete `packages/wowlab-core/`
- [ ] Delete `packages/wowlab-services/`
- [ ] Delete `packages/wowlab-parsers/`
- [ ] Delete `packages/wowlab-engine/`
- [ ] Delete `packages/wowlab-gamedata/`
- [ ] Update CLI commands
- [ ] Update portal imports
- [ ] Update engine to use gamedata crate
