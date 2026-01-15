# Phase 2: WASM Module - Build from Engine Crate

## Objective

Build WASM directly from the engine crate using feature flags. Tsify generates TypeScript definitions in the crate where `#[derive(Tsify)]` is applied.

## Prerequisites

- Phase 1 complete (all types have Tsify/Serde derives)
- `wasm-pack` installed
- Heavy engine dependencies made optional (Cranelift, CLI tools)

## Architecture

```
crates/engine/
├── Cargo.toml              # wasm feature added
├── src/
│   ├── lib.rs              # #[cfg(feature = "wasm")] mod wasm_exports;
│   ├── wasm_exports.rs     # NEW - WASM-specific exports
│   ├── spec/               # Types with Tsify derives
│   ├── types/              # Types with Tsify derives
│   └── ...
```


## Changes Required

### 1. Update `crates/engine/Cargo.toml`

```toml
[lib]
crate-type = ["rlib", "cdylib"]  # Add cdylib for WASM

[dependencies]
# Core deps (always included)
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# WASM deps (optional)
tsify = { version = "0.5", features = ["js"], optional = true }
wasm-bindgen = { version = "0.2", optional = true }
serde-wasm-bindgen = { version = "0.6", optional = true }

# Heavy deps (optional, disabled for WASM)
cranelift = { version = "0.127", optional = true }
cranelift-jit = { version = "0.127", optional = true }
cranelift-module = { version = "0.127", optional = true }
cranelift-native = { version = "0.127", optional = true }
rayon = { version = "1.11", optional = true }
tokio = { version = "1", features = ["rt-multi-thread"], optional = true }
mimalloc = { version = "0.1", optional = true }
clap = { version = "4", features = ["derive"], optional = true }
indicatif = { version = "0.17", optional = true }
console = { version = "0.15", optional = true }
tabled = { version = "0.15", optional = true }

[features]
default = ["jit", "cli", "parallel"]
jit = ["cranelift", "cranelift-jit", "cranelift-module", "cranelift-native"]
cli = ["clap", "indicatif", "console", "tabled"]
parallel = ["rayon", "tokio"]
allocator = ["mimalloc"]
wasm = ["tsify", "wasm-bindgen", "serde-wasm-bindgen"]
```

### 2. Create `crates/engine/src/wasm_exports.rs`

```rust
//! WASM exports for the engine.
//! Only compiled when `wasm` feature is enabled.

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use tsify::Tsify;

use crate::spec::{SpellDef, AuraDef, SpellEffect, EffectCondition};
use crate::types::{ResourceType, DamageSchool, Attribute, RatingType};

// ============================================================================
// Schema Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct ConditionFieldDef {
    pub category: String,
    pub name: String,
    pub label: String,
    pub field_type: FieldType,
    pub operators: Vec<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase")]
pub enum FieldType {
    Number,
    Boolean,
    SpellId,
    AuraId,
    TalentName,
    ResourceType,
    Text,
}

// ============================================================================
// WASM Functions
// ============================================================================

/// Get the engine version
#[wasm_bindgen(js_name = getEngineVersion)]
pub fn get_engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get condition field schema for building query UIs
#[wasm_bindgen(js_name = getConditionSchema)]
pub fn get_condition_schema() -> Vec<ConditionFieldDef> {
    // Generate from EffectCondition enum variants
    vec![
        ConditionFieldDef {
            category: "target".into(),
            name: "target.health.pct".into(),
            label: "Target Health %".into(),
            field_type: FieldType::Number,
            operators: vec!["<", "<=", ">", ">=", "=", "!="].into_iter().map(String::from).collect(),
            description: Some("Target's current health percentage".into()),
        },
        ConditionFieldDef {
            category: "buff".into(),
            name: "buff.active".into(),
            label: "Buff Active".into(),
            field_type: FieldType::AuraId,
            operators: vec!["=", "!="].into_iter().map(String::from).collect(),
            description: Some("Check if a buff is active".into()),
        },
        ConditionFieldDef {
            category: "talent".into(),
            name: "talent.enabled".into(),
            label: "Talent Enabled".into(),
            field_type: FieldType::TalentName,
            operators: vec!["=", "!="].into_iter().map(String::from).collect(),
            description: Some("Check if a talent is selected".into()),
        },
        // TODO: Generate exhaustively from EffectCondition enum
    ]
}

/// Get all resource types
#[wasm_bindgen(js_name = getResourceTypes)]
pub fn get_resource_types() -> JsValue {
    let types: Vec<(&str, u8)> = vec![
        ("mana", ResourceType::Mana as u8),
        ("rage", ResourceType::Rage as u8),
        ("focus", ResourceType::Focus as u8),
        ("energy", ResourceType::Energy as u8),
        ("comboPoints", ResourceType::ComboPoints as u8),
        ("runes", ResourceType::Runes as u8),
        ("runicPower", ResourceType::RunicPower as u8),
        ("soulShards", ResourceType::SoulShards as u8),
        ("lunarPower", ResourceType::LunarPower as u8),
        ("holyPower", ResourceType::HolyPower as u8),
        ("maelstrom", ResourceType::Maelstrom as u8),
        ("chi", ResourceType::Chi as u8),
        ("insanity", ResourceType::Insanity as u8),
        ("arcaneCharges", ResourceType::ArcaneCharges as u8),
        ("fury", ResourceType::Fury as u8),
        ("pain", ResourceType::Pain as u8),
        ("essence", ResourceType::Essence as u8),
    ];
    serde_wasm_bindgen::to_value(&types).unwrap()
}

/// Get all damage schools
#[wasm_bindgen(js_name = getDamageSchools)]
pub fn get_damage_schools() -> JsValue {
    let schools: Vec<(&str, u8)> = vec![
        ("physical", DamageSchool::Physical as u8),
        ("holy", DamageSchool::Holy as u8),
        ("fire", DamageSchool::Fire as u8),
        ("nature", DamageSchool::Nature as u8),
        ("frost", DamageSchool::Frost as u8),
        ("shadow", DamageSchool::Shadow as u8),
        ("arcane", DamageSchool::Arcane as u8),
    ];
    serde_wasm_bindgen::to_value(&schools).unwrap()
}
```

### 3. Update `crates/engine/src/lib.rs`

Add conditional module:

```rust
// At the top of lib.rs
#[cfg(feature = "wasm")]
pub mod wasm_exports;

#[cfg(feature = "wasm")]
pub use wasm_exports::*;
```

## Build Process

### Build WASM

```bash
cd crates/engine
wasm-pack build --target web --features wasm --no-default-features --out-dir ../../packages/engine-wasm
```

**Flags explained:**
- `--target web`: Browser-compatible output
- `--features wasm`: Enable WASM-specific code
- `--no-default-features`: Disable JIT/CLI/parallel (incompatible with WASM)
- `--out-dir`: Output to packages/ for npm packaging

### Create Tarball

```bash
cd packages/engine-wasm
npm pack --pack-destination ../
```

This creates `packages/engine-X.X.X.tgz`.

### Update `scripts/build.sh`

```bash
build_engine_wasm() {
    info "Building engine WASM..."
    cd "$ROOT_DIR/crates/engine"

    wasm-pack build \
        --target web \
        --features wasm \
        --no-default-features \
        --out-dir "$ROOT_DIR/.wasm-build-engine"

    cd "$ROOT_DIR/.wasm-build-engine"
    rm -f "$ROOT_DIR/packages/engine-"*.tgz
    local tarball=$(npm pack --pack-destination "$ROOT_DIR/packages" 2>/dev/null)
    cd "$ROOT_DIR"
    rm -rf "$ROOT_DIR/.wasm-build-engine"

    success "Engine WASM built -> packages/$tarball"
}
```

## Generated Output

The build generates:

```
packages/engine-X.X.X.tgz
├── engine.js           # WASM bindings
├── engine.d.ts         # TypeScript definitions (ALL types with Tsify)
├── engine_bg.wasm      # WebAssembly binary
└── package.json
```

### Generated TypeScript (engine.d.ts)

```typescript
// Auto-generated types from Tsify derives
export type SpellIdx = number;
export type AuraIdx = number;
export type SimTime = number;

export type ResourceType =
  | "mana" | "rage" | "focus" | "energy" | "comboPoints"
  | "runes" | "runicPower" | "soulShards" | "lunarPower"
  | "holyPower" | "maelstrom" | "chi" | "insanity"
  | "arcaneCharges" | "fury" | "pain" | "essence";

export type DamageSchool =
  | "physical" | "holy" | "fire" | "nature"
  | "frost" | "shadow" | "arcane";

export interface SpellDef {
  id: number;
  name: string;
  school: DamageSchool;
  castType: CastType;
  gcd: GcdType;
  costs: ResourceCost[];
  cooldown: number;
  // ... all fields
}

export type SpellEffect =
  | { reduceCooldown: { spell: number; amount: number } }
  | { gainCharge: { spell: number } }
  | { triggerSpell: { spell: number } }
  | { applyBuff: { aura: number; stacks: number } }
  | { conditional: { condition: EffectCondition; effect: SpellEffect } };

// WASM functions
export function getEngineVersion(): string;
export function getConditionSchema(): ConditionFieldDef[];
export function getResourceTypes(): [string, number][];
export function getDamageSchools(): [string, number][];
```

## Verification

1. **Build check**: `wasm-pack build --features wasm --no-default-features`
2. **Inspect types**: Check `pkg/engine.d.ts` contains all expected types
3. **Test in Node**:
   ```javascript
   import init, { getEngineVersion, getConditionSchema } from "./engine.js";
   await init();
   console.log(getEngineVersion());
   console.log(getConditionSchema());
   ```

## Success Criteria

- [ ] `wasm-pack build` succeeds with `--features wasm --no-default-features`
- [ ] Generated `.d.ts` contains ALL types with `#[derive(Tsify)]`
- [ ] WASM functions callable from JavaScript
- [ ] Tarball created in `packages/`
- [ ] Bundle size reasonable (<500KB, ideally <200KB)

---

## Prompt for Fresh Claude Instance

```
I'm working on Phase 2 of the engine-types-export plan for the wowlab project.

GOAL: Build WASM from the engine crate using feature flags.

CONTEXT:
- Phase 1 complete: all engine types have Tsify/Serde derives
- Existing pattern: crates/parsers builds WASM tarball to packages/
- Heavy deps (Cranelift, rayon, tokio) are disabled for WASM builds

TASKS:
1. Update crates/engine/Cargo.toml:
   - Add crate-type = ["rlib", "cdylib"]
   - Make heavy deps optional
   - Create "wasm" feature for tsify/wasm-bindgen/serde-wasm-bindgen
   - Create "jit", "cli", "parallel" features for heavy deps

2. Create crates/engine/src/wasm_exports.rs:
   - ConditionFieldDef struct for editor schema
   - getConditionSchema() WASM function
   - getResourceTypes(), getDamageSchools() helper functions
   - getEngineVersion() function

3. Update crates/engine/src/lib.rs:
   - Add #[cfg(feature = "wasm")] mod wasm_exports;

4. Update scripts/build.sh:
   - Add build_engine_wasm() function
   - Use --features wasm --no-default-features

BUILD COMMAND:
wasm-pack build --target web --features wasm --no-default-features --out-dir ../../packages/engine-wasm

Start by reading crates/engine/Cargo.toml to understand current dependencies.
```
