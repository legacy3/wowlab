# Crate Restructure Plan

> **NO BLOAT:** No rollback plans. No migration phases. No backwards compatibility. No re-exports for old paths. No deprecation stubs. No file checklists. No "future considerations". Just do the work.

> **NAMING:** Directories stay short, crate names are namespaced. All crates:
>
> | Directory | Crate Name | Rust Import |
> |-----------|------------|-------------|
> | `crates/types/` | `wowlab-types` | `wowlab_types` |
> | `crates/parsers/` | `wowlab-parsers` | `wowlab_parsers` |
> | `crates/engine/` | `wowlab-engine` | `wowlab_engine` |
> | `crates/api/` | `wowlab-api` | `wowlab_api` |
> | `crates/node/` | `wowlab-node` | `wowlab_node` |
> | `crates/node-gui/` | `wowlab-node-gui` | `wowlab_node_gui` |
> | `crates/node-headless/` | `wowlab-node-headless` | `wowlab_node_headless` |
> | `crates/cli/` | `wowlab-cli` | `wowlab_cli` |

Extract `types` crate, rename `supabase-client` → `api`, fix versions.

## Target Structure

```
crates/
├── types/               # Foundation layer (WASM)
├── parsers/             # Parsing logic only
├── engine/              # Simulation runtime
├── api/                 # Data access (renamed from supabase-client)
├── node/                # Distributed worker
├── node-gui/            # Desktop binary
├── node-headless/       # Server binary
└── cli/                 # CLI tools
```

## Dependency Graph

```
                    types
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    parsers          api         engine
        │             │             │
        └─────────────┼─────────────┘
                      ▼
                    node
                    /  \
            node-gui    node-headless

            cli ← parsers + api
```

## types Crate

```
crates/types/src/
├── lib.rs
├── combat/
│   ├── mod.rs
│   ├── damage.rs       # DamageSchool, DamageFlags, HitResult
│   └── resource.rs     # ResourceType
├── game/
│   ├── mod.rs
│   ├── class.rs        # WowClass, WowSpec, Faction
│   ├── attribute.rs    # Attribute
│   └── slot.rs         # ItemSlot, ItemQuality
├── data/
│   ├── mod.rs
│   ├── spell.rs        # SpellDataFlat
│   ├── aura.rs         # AuraDataFlat
│   ├── item.rs         # ItemDataFlat, ItemEffect
│   ├── talent.rs       # TraitTreeFlat, TraitNode, TraitNodeEntry
│   ├── spec.rs         # SpecDataFlat, ClassDataFlat
│   └── shared.rs       # RefreshBehavior, PeriodicType, KnowledgeSource
├── sim/
│   ├── mod.rs
│   ├── idx.rs          # SpellIdx, AuraIdx, ProcIdx
│   ├── time.rs         # SimTime, Duration
│   └── snapshot.rs     # Snapshot types
└── rotation/
    ├── mod.rs
    ├── action.rs       # Action, ActionList, ActionType
    ├── condition.rs    # Condition, ConditionField
    └── variable.rs     # Variable
```

### Cargo.toml

```toml
[package]
name = "wowlab-types"
version.workspace = true
edition.workspace = true

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = []
wasm = ["dep:tsify", "dep:wasm-bindgen", "dep:serde-wasm-bindgen"]

[dependencies]
serde = { version = "1", features = ["derive"] }
bitflags = { version = "2", features = ["serde"] }
tsify = { version = "0.5", optional = true, default-features = false, features = ["js"] }
wasm-bindgen = { version = "0.2", optional = true }
serde-wasm-bindgen = { version = "0.6", optional = true }
```

## What Moves Where

### engine::types → types

| From | To |
|------|-----|
| `engine::types::damage::*` | `types::combat::damage` |
| `engine::types::resource::*` | `types::combat::resource` |
| `engine::types::attribute::*` | `types::game::attribute` |
| `engine::types::class::*` | `types::game::class` |
| `engine::types::idx::*` | `types::sim::idx` |
| `engine::types::time::*` | `types::sim::time` |
| `engine::types::snapshot::*` | `types::sim::snapshot` |

### parsers::flat → types::data

| From | To |
|------|-----|
| `parsers::flat::SpellDataFlat` | `types::data::spell` |
| `parsers::flat::AuraDataFlat` | `types::data::aura` |
| `parsers::flat::ItemDataFlat` | `types::data::item` |
| `parsers::flat::TraitTreeFlat` | `types::data::talent` |
| `parsers::flat::SpecDataFlat` | `types::data::spec` |
| `parsers::flat::ClassDataFlat` | `types::data::spec` |
| `parsers::flat::{RefreshBehavior, PeriodicType, KnowledgeSource}` | `types::data::shared` |

### engine::rotation (types only) → types::rotation

Action, ActionList, Variable, Condition types move. Execution logic stays in engine.

## Deletes

- `crates/engine/src/types/` — entire directory
- `crates/parsers/src/flat/` — entire directory
- `crates/supabase-client/` — renamed to `api/`

## Version Fix

All crates use `version.workspace = true`. No more v99.0.0 or v0.3.0 bullshit.

## WASM Packages

| Package | Contents |
|---------|----------|
| `wowlab-types` | Type definitions (~50 KB) |
| `wowlab-parsers` | SimC parsing, loadout encoding (~150 KB) |
| `wowlab-engine` | Simulation, validation (~500 KB) |

## Portal Imports

```typescript
// Types - lightweight
import type { ResourceType, SpellDataFlat, Action } from "wowlab-types";

// Parsing
import { parseSimc, decodeLoadout } from "wowlab-parsers";

// Simulation - lazy load
const engine = await import("wowlab-engine");
```

## Done When

- `cargo build --workspace`
- `cargo test --workspace`
- `pnpm build`
- `pnpm test`
