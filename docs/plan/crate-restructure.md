# Crate Restructure Plan

> Pre-release architecture overhaul for wowlab v0.5.0

## Executive Summary

Extract a dedicated `types` crate to serve as the foundation layer for all wowlab crates. This separates pure data definitions from parsing logic and simulation runtime, enabling lighter WASM bundles for the portal and cleaner dependency boundaries.

---

## Current State

### Structure

```
crates/
├── cli/                 # Binary: data tools
├── engine/              # Lib+Binary: simulation (WASM)
├── node/                # Library: distributed worker
├── node-gui/            # Binary: desktop UI [v99.0.0 ⚠️]
├── node-headless/       # Binary: server node [v0.3.0 ⚠️]
├── parsers/             # Library: DBC/SimC parsing (WASM)
└── supabase-client/     # Library: REST API
```

### Dependency Graph

```
         parsers ←──────────────────┐
            │                       │
            ▼                       │
         engine ◄─── supabase-client (optional)
            │
            ▼
          node
          /  \
         ▼    ▼
   node-gui  node-headless

   cli ◄─── parsers
```

### Problems

| Issue | Impact |
|-------|--------|
| Types scattered across `engine::types` and `parsers::flat` | Confusing ownership, duplication risk |
| Both `parsers` and `engine` compile to WASM separately | Duplicate serde/wasm-bindgen overhead in portal |
| Portal imports 40+ types from `engine` | Heavy bundle just for type definitions |
| Version inconsistency (`node-gui` v99.0.0, `node-headless` v0.3.0) | Unprofessional, confusing |
| `supabase-client` name too specific | Limits future data source flexibility |

---

## Target State

### Structure

```
crates/
├── types/               # NEW: Foundation layer, WASM-first
├── parsers/             # Parsing logic only
├── engine/              # Simulation runtime
├── api/                 # Renamed: data access layer
├── node/                # Distributed worker library
├── node-gui/            # Desktop binary
├── node-headless/       # Server binary
└── cli/                 # CLI tools binary
```

### Dependency Graph

```
                         ┌─────────┐
                         │  types  │ ◄── WASM package #1
                         └────┬────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ parsers  │    │   api    │    │  engine  │
        └────┬─────┘    └────┬─────┘    └────┬─────┘
             │               │               │
             │   WASM #2     │               │   WASM #3
             │               │               │
             └───────────────┼───────────────┘
                             │
                             ▼
                       ┌──────────┐
                       │   node   │
                       └────┬─────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
           ┌───────────┐       ┌──────────────┐
           │ node-gui  │       │ node-headless│
           └───────────┘       └──────────────┘

                       ┌──────────┐
                       │   cli    │ ◄── parsers + api
                       └──────────┘
```

### Layered View

```
┌─────────────────────────────────────────────────────────────────┐
│                        BINARIES                                  │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │ node-gui  │  │node-headless │  │     cli      │  │ engine │  │
│  │  (egui)   │  │   (tokio)    │  │   (clap)     │  │  (cli) │  │
│  └─────┬─────┘  └──────┬───────┘  └──────┬───────┘  └────────┘  │
└────────┼───────────────┼─────────────────┼──────────────────────┘
         │               │                 │
         └───────┬───────┘                 │
                 ▼                         │
┌────────────────────────────┐             │
│           node             │             │
│   (worker pool, realtime)  │             │
└─────────────┬──────────────┘             │
              │                            │
┌─────────────┼────────────────────────────┼──────────────────────┐
│             │           LIBRARIES        │                      │
│             ▼                            ▼                      │
│  ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │     engine      │  │     api     │  │   parsers   │          │
│  │  (simulation)   │  │  (supabase) │  │ (simc, dbc) │          │
│  └────────┬────────┘  └──────┬──────┘  └──────┬──────┘          │
└───────────┼──────────────────┼────────────────┼─────────────────┘
            │                  │                │
            └──────────────────┼────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          types                                   │
│                    (pure data, WASM-first)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## `types` Crate Design

### Module Structure

```
crates/types/
├── Cargo.toml
├── README.md
└── src/
    ├── lib.rs
    ├── combat/
    │   ├── mod.rs
    │   ├── damage.rs       # DamageSchool, DamageFlags, HitResult
    │   └── resource.rs     # ResourceType
    ├── game/
    │   ├── mod.rs
    │   ├── class.rs        # WowClass, WowSpec, Faction
    │   ├── attribute.rs    # Attribute enum
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
    │   ├── idx.rs          # SpellIdx, AuraIdx, ProcIdx, etc.
    │   ├── time.rs         # SimTime, Duration types
    │   └── snapshot.rs     # Snapshot types
    └── rotation/
        ├── mod.rs
        ├── action.rs       # Action, ActionList, ActionType
        ├── condition.rs    # Condition, ConditionField types
        └── variable.rs     # Variable definitions
```

### Cargo.toml

```toml
[package]
name = "wowlab-types"
version.workspace = true
edition = "2024"
license = "MIT"
description = "Core type definitions for wowlab"
repository = "https://github.com/wowlab/wowlab"

[lib]
crate-type = ["cdylib", "rlib"]

[features]
default = []
wasm = ["dep:tsify", "dep:wasm-bindgen", "dep:serde-wasm-bindgen"]

[dependencies]
serde = { version = "1", features = ["derive"] }
bitflags = { version = "2", features = ["serde"] }

# WASM (optional)
tsify = { version = "0.5", optional = true, default-features = false, features = ["js"] }
wasm-bindgen = { version = "0.2", optional = true }
serde-wasm-bindgen = { version = "0.6", optional = true }
```

### lib.rs

```rust
//! Core type definitions for wowlab.
//!
//! This crate contains all shared data types used across the wowlab ecosystem.
//! Types are designed to be WASM-compatible and serializable.

#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod combat;
pub mod data;
pub mod game;
pub mod rotation;
pub mod sim;

/// Convenient re-exports of commonly used types.
pub mod prelude {
    pub use crate::combat::{DamageFlags, DamageSchool, HitResult, ResourceType};
    pub use crate::data::{AuraDataFlat, ItemDataFlat, SpellDataFlat, TraitTreeFlat};
    pub use crate::game::{Attribute, WowClass, WowSpec};
    pub use crate::rotation::{Action, ActionList, Variable};
    pub use crate::sim::{AuraIdx, SimTime, SpellIdx};
}
```

---

## Type Migration Map

### From `engine::types` → `types`

| Source | Destination |
|--------|-------------|
| `engine::types::damage::DamageSchool` | `types::combat::DamageSchool` |
| `engine::types::damage::DamageFlags` | `types::combat::DamageFlags` |
| `engine::types::damage::HitResult` | `types::combat::HitResult` |
| `engine::types::resource::ResourceType` | `types::combat::ResourceType` |
| `engine::types::attribute::Attribute` | `types::game::Attribute` |
| `engine::types::class::*` | `types::game::class` |
| `engine::types::idx::*` | `types::sim::idx` |
| `engine::types::time::*` | `types::sim::time` |
| `engine::types::snapshot::*` | `types::sim::snapshot` |

### From `parsers::flat` → `types::data`

| Source | Destination |
|--------|-------------|
| `parsers::flat::SpellDataFlat` | `types::data::SpellDataFlat` |
| `parsers::flat::AuraDataFlat` | `types::data::AuraDataFlat` |
| `parsers::flat::ItemDataFlat` | `types::data::ItemDataFlat` |
| `parsers::flat::ItemEffect` | `types::data::ItemEffect` |
| `parsers::flat::TraitTreeFlat` | `types::data::TraitTreeFlat` |
| `parsers::flat::TraitNode` | `types::data::TraitNode` |
| `parsers::flat::TraitNodeEntry` | `types::data::TraitNodeEntry` |
| `parsers::flat::SpecDataFlat` | `types::data::SpecDataFlat` |
| `parsers::flat::ClassDataFlat` | `types::data::ClassDataFlat` |
| `parsers::flat::RefreshBehavior` | `types::data::RefreshBehavior` |
| `parsers::flat::PeriodicType` | `types::data::PeriodicType` |
| `parsers::flat::KnowledgeSource` | `types::data::KnowledgeSource` |

### From `engine::rotation` (types only) → `types::rotation`

| Source | Destination |
|--------|-------------|
| Rotation action types | `types::rotation::Action` |
| ActionList definition | `types::rotation::ActionList` |
| Variable definition | `types::rotation::Variable` |
| Condition field types | `types::rotation::Condition` |

---

## WASM Build Strategy

### Three Packages

| Package | Purpose | Approx Size | Build Command |
|---------|---------|-------------|---------------|
| `wowlab-types` | Type definitions only | ~50 KB | `wasm-pack build --features wasm` |
| `wowlab-parsers` | SimC parsing, loadout encoding | ~150 KB | `wasm-pack build --features wasm` |
| `wowlab-engine` | Simulation, validation | ~500 KB | `wasm-pack build --features wasm --no-default-features` |

### Build Script Update

```bash
#!/bin/bash
# scripts/build-wasm.sh

set -e

PACKAGES_DIR="packages"

build_wasm() {
    local crate=$1
    local pkg_name=$2

    echo "Building $crate..."
    cd "crates/$crate"
    wasm-pack build --target web --features wasm --no-default-features

    # Update package name
    cd pkg
    jq ".name = \"$pkg_name\"" package.json > tmp.json && mv tmp.json package.json

    # Pack and move
    npm pack
    mv *.tgz "../../../$PACKAGES_DIR/"
    cd ../../..
}

build_wasm "types" "wowlab-types"
build_wasm "parsers" "wowlab-parsers"
build_wasm "engine" "wowlab-engine"

echo "Done. Packages in $PACKAGES_DIR/"
```

### Portal package.json

```json
{
  "dependencies": {
    "wowlab-types": "file:../../packages/wowlab-types-0.5.0.tgz",
    "wowlab-parsers": "file:../../packages/wowlab-parsers-0.5.0.tgz",
    "wowlab-engine": "file:../../packages/wowlab-engine-0.5.0.tgz"
  }
}
```

### Portal Import Pattern

```typescript
// Types for UI components and state - lightweight import
import type {
  ResourceType,
  DamageSchool,
  SpellDataFlat,
  AuraDataFlat,
  Action,
  ActionList,
  Variable,
} from "wowlab-types";

// Parsing user input
import { parseSimc, decodeLoadout, encodeLoadout } from "wowlab-parsers";

// Validation and simulation - heavy import, lazy load
const engine = await import("wowlab-engine");
const result = await engine.validateRotation(json);
```

---

## Crate Rename

| Old Name | New Name | Reason |
|----------|----------|--------|
| `supabase-client` | `api` | Not tied to Supabase; could support other backends |

### api Crate Structure

```
crates/api/
├── Cargo.toml
└── src/
    ├── lib.rs
    ├── client.rs         # HTTP client abstraction
    ├── supabase/         # Supabase implementation
    │   ├── mod.rs
    │   ├── client.rs
    │   ├── queries.rs
    │   └── realtime.rs
    ├── cache.rs          # Caching layer
    └── error.rs          # Error types
```

---

## Version Alignment

All crates must use workspace version:

```toml
# Root Cargo.toml
[workspace.package]
version = "0.5.0"
edition = "2024"
license = "MIT"
repository = "https://github.com/wowlab/wowlab"

# Each crate's Cargo.toml
[package]
name = "wowlab-types"
version.workspace = true
edition.workspace = true
license.workspace = true
repository.workspace = true
```

### Version Fixes Required

| Crate | Current | Target |
|-------|---------|--------|
| `node-gui` | 99.0.0 | workspace (0.5.0) |
| `node-headless` | 0.3.0 | workspace (0.5.0) |
| All others | 0.4.0 | workspace (0.5.0) |

---

## Migration Steps

### Phase 1: Foundation

1. Create `crates/types/` directory structure
2. Add `Cargo.toml` with workspace version
3. Create module files with empty implementations
4. Add `types` to workspace members

### Phase 2: Type Extraction

5. Move types from `engine::types::damage` → `types::combat::damage`
6. Move types from `engine::types::resource` → `types::combat::resource`
7. Move types from `engine::types::attribute` → `types::game::attribute`
8. Move types from `engine::types::class` → `types::game::class`
9. Move types from `engine::types::idx` → `types::sim::idx`
10. Move types from `engine::types::time` → `types::sim::time`
11. Move types from `engine::types::snapshot` → `types::sim::snapshot`
12. Move types from `parsers::flat::*` → `types::data::*`

### Phase 3: Dependency Update

13. Update `parsers/Cargo.toml` to depend on `types`
14. Update `parsers` imports to use `wowlab_types::`
15. Remove moved code from `parsers::flat`
16. Update `engine/Cargo.toml` to depend on `types`
17. Update `engine` imports to use `wowlab_types::`
18. Remove `engine::types` module entirely
19. Update `supabase-client` to depend on `types`

### Phase 4: Rename & Cleanup

20. Rename `supabase-client` → `api`
21. Update all references to `supabase-client` → `api`
22. Fix all crate versions to `version.workspace = true`
23. Update `node`, `node-gui`, `node-headless` dependencies

### Phase 5: WASM & Portal

24. Update `scripts/build-wasm.sh` for three packages
25. Build all three WASM packages
26. Update `apps/portal/package.json` with new packages
27. Update portal imports throughout codebase
28. Update `apps/portal/src/lib/engine/` facade

### Phase 6: Verification

29. `cargo build --workspace`
30. `cargo test --workspace`
31. `cargo clippy --workspace`
32. `pnpm build` (full monorepo build)
33. `pnpm test` (full test suite)

---

## File Checklist

### New Files

- [ ] `crates/types/Cargo.toml`
- [ ] `crates/types/README.md`
- [ ] `crates/types/src/lib.rs`
- [ ] `crates/types/src/combat/mod.rs`
- [ ] `crates/types/src/combat/damage.rs`
- [ ] `crates/types/src/combat/resource.rs`
- [ ] `crates/types/src/game/mod.rs`
- [ ] `crates/types/src/game/class.rs`
- [ ] `crates/types/src/game/attribute.rs`
- [ ] `crates/types/src/game/slot.rs`
- [ ] `crates/types/src/data/mod.rs`
- [ ] `crates/types/src/data/spell.rs`
- [ ] `crates/types/src/data/aura.rs`
- [ ] `crates/types/src/data/item.rs`
- [ ] `crates/types/src/data/talent.rs`
- [ ] `crates/types/src/data/spec.rs`
- [ ] `crates/types/src/data/shared.rs`
- [ ] `crates/types/src/sim/mod.rs`
- [ ] `crates/types/src/sim/idx.rs`
- [ ] `crates/types/src/sim/time.rs`
- [ ] `crates/types/src/sim/snapshot.rs`
- [ ] `crates/types/src/rotation/mod.rs`
- [ ] `crates/types/src/rotation/action.rs`
- [ ] `crates/types/src/rotation/condition.rs`
- [ ] `crates/types/src/rotation/variable.rs`
- [ ] `crates/api/Cargo.toml` (renamed)
- [ ] `scripts/build-wasm.sh` (updated)

### Deleted Files

- [ ] `crates/engine/src/types/mod.rs`
- [ ] `crates/engine/src/types/damage.rs`
- [ ] `crates/engine/src/types/resource.rs`
- [ ] `crates/engine/src/types/attribute.rs`
- [ ] `crates/engine/src/types/class.rs`
- [ ] `crates/engine/src/types/idx.rs`
- [ ] `crates/engine/src/types/time.rs`
- [ ] `crates/engine/src/types/snapshot.rs`
- [ ] `crates/parsers/src/flat/spell.rs` (content moved)
- [ ] `crates/parsers/src/flat/aura.rs` (content moved)
- [ ] `crates/parsers/src/flat/item.rs` (content moved)
- [ ] `crates/parsers/src/flat/trait.rs` (content moved)
- [ ] `crates/parsers/src/flat/spec.rs` (content moved)
- [ ] `crates/parsers/src/flat/shared.rs` (content moved)
- [ ] `crates/supabase-client/` (renamed to `api/`)

### Modified Files

- [ ] `crates/Cargo.toml` (workspace members)
- [ ] `crates/parsers/Cargo.toml` (add types dep)
- [ ] `crates/parsers/src/lib.rs` (re-export from types)
- [ ] `crates/engine/Cargo.toml` (add types dep)
- [ ] `crates/engine/src/lib.rs` (remove types mod)
- [ ] `crates/node/Cargo.toml` (update deps)
- [ ] `crates/node-gui/Cargo.toml` (fix version)
- [ ] `crates/node-headless/Cargo.toml` (fix version)
- [ ] `crates/cli/Cargo.toml` (update deps)
- [ ] `apps/portal/package.json` (new WASM packages)
- [ ] `apps/portal/src/lib/engine/engine.ts`
- [ ] `apps/portal/src/lib/engine/types.ts`

---

## Rollback Plan

If migration fails mid-way:

1. `git stash` or `git reset --hard HEAD`
2. All changes are in-repo, no external dependencies affected
3. WASM packages in `packages/` can be rebuilt from any commit

---

## Success Criteria

- [ ] `cargo build --workspace` succeeds
- [ ] `cargo test --workspace` passes
- [ ] `cargo clippy --workspace -- -D warnings` passes
- [ ] All WASM packages build successfully
- [ ] Portal builds with new packages
- [ ] Portal tests pass
- [ ] No runtime errors in portal dev mode
- [ ] Bundle size for types-only import < 100 KB

---

## Future Considerations

### Potential `types` Submodules

If `types` grows too large, consider splitting:

```
wowlab-types-core     # combat, game, sim
wowlab-types-data     # DBC flat types
wowlab-types-rotation # rotation DSL types
```

### Generated Types

Consider generating types from a schema:

```
schema/
├── combat.json
├── game.json
└── data.json

→ generates both Rust and TypeScript types
```

This ensures perfect type alignment without manual synchronization.

### Protocol Buffers / FlatBuffers

For binary serialization (node ↔ engine communication), consider:

- Protocol Buffers for schema evolution
- FlatBuffers for zero-copy deserialization

Current JSON serialization is fine for v0.5.0.
