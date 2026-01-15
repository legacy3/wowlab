# Engine Types Export Plan

## Status: Not Started

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation - Add Tsify to Engine Core Types | Not Started |
| 2 | WASM Module - Build from Engine with Feature Flag | Not Started |
| 3 | Portal Integration - Use Engine Types | Not Started |
| 4 | Spec Registry - Export Implementation Coverage | Not Started |
| 5 | Rotation Schema - Export Existing Engine Types | Not Started |

---

## Problem Statement

**Current state:** Types are defined twice - in Rust (engine) and TypeScript (portal). The portal has 850+ hardcoded condition fields and manually-defined types that duplicate engine concepts.

**Goal:** Rust engine is the single source of truth. TypeScript types are generated, not manually maintained.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RUST ENGINE (SOURCE OF TRUTH)                         │
│                                                                          │
│  crates/engine/                                                          │
│  ├── Cargo.toml          # wasm feature flag                            │
│  ├── src/                                                                │
│  │   ├── spec/           #[derive(Tsify, Serialize)]                    │
│  │   │   ├── effect.rs   SpellEffect, EffectCondition                   │
│  │   │   ├── spell.rs    SpellDef, CastType, GcdType                    │
│  │   │   └── aura_def.rs AuraDef, AuraEffect                            │
│  │   ├── types/          #[derive(Tsify, Serialize)]                    │
│  │   │   ├── idx.rs      SpellIdx, AuraIdx (transparent)                │
│  │   │   ├── resource.rs ResourceType                                    │
│  │   │   └── damage.rs   DamageSchool                                   │
│  │   ├── rotation/       #[derive(Tsify, Serialize)]                    │
│  │   │   └── ast.rs      Rotation, Expr, VarPath, Action                │
│  │   └── wasm_exports.rs WASM functions (cfg(feature = "wasm"))         │
│  │                                                                       │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ wasm-pack build --features wasm
                               │               --no-default-features
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      packages/engine-X.X.X.tgz                          │
│                                                                          │
│  engine.d.ts      (GENERATED - ALL TYPES)                               │
│  engine.js        (WASM bindings)                                       │
│  engine_bg.wasm   (WebAssembly binary)                                  │
│                                                                          │
│  Types:                                                                  │
│  - SpellEffect, EffectCondition, ModCondition                           │
│  - SpellDef, AuraDef, TalentDef                                         │
│  - ResourceType, DamageSchool, Attribute                                │
│  - Rotation, Expr, VarPath, Action                                      │
│                                                                          │
│  Functions:                                                              │
│  - getConditionSchema(), getResourceTypes(), getDamageSchools()         │
│  - getImplementedSpecs(), getSpecCoverage()                             │
│  - validateRotation(), parseRotation()                                  │
│                                                                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ npm dependency
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              PORTAL                                      │
│                                                                          │
│  import type { SpellEffect, Rotation, ... } from "engine"               │
│  import { getConditionSchema, validateRotation } from "@/lib/engine"    │
│                                                                          │
│  DELETED:                                                                │
│  - src/components/editor/types.ts                                       │
│  - src/components/editor/conditions/fields.ts                           │
│  - src/components/editor/constants.ts                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Use `tsify` 0.5+

The maintained tsify crate with full feature support.

### 2. Build WASM from Engine Crate

Tsify generates TypeScript definitions in the crate where `#[derive(Tsify)]` is applied.

```bash
cd crates/engine
wasm-pack build --target web --features wasm --no-default-features
```

### 3. Use `String` for Names

All name fields (`SpellDef::name`, `AuraDef::name`, etc.) use `String`.

### 4. Engine is Source of Truth

Portal imports types from the engine package.

### 5. Export Existing Rotation Types

The engine's `Rotation`, `Expr`, `VarPath`, `Action` types are exported directly.

---

## Phase Summary

### Phase 1: Foundation

Add `#[derive(Tsify, Serialize)]` to all engine types. Handle `&'static str` → `String`, newtypes with transparent, bitflags.

**Key changes:**
- ~25 files modified
- All `&'static str` fields → `String` (breaking change)
- Heavy deps (Cranelift, CLI) made optional

### Phase 2: WASM Module

Build WASM from engine crate using `--features wasm --no-default-features`. Create `wasm_exports.rs` with helper functions.

**Output:** `packages/engine-X.X.X.tgz`

### Phase 3: Portal Integration

Add engine dependency to portal. Create `src/lib/engine/index.ts` with async WASM initialization. Delete old type files.

### Phase 4: Spec Registry

Extend `SpecHandler` trait with coverage methods. Export via WASM: `getImplementedSpecs()`, `getSpecCoverage()`.

### Phase 5: Rotation Schema

Add Tsify derives to existing `Rotation`, `Expr`, `VarPath`, `Action` types. Export `validateRotation()`, `parseRotation()`.

---

## Benefits

1. **Single source of truth** - Types defined once in Rust
2. **No manual sync** - TypeScript generated automatically
3. **Type safety** - Changes in engine fail TypeScript build if incompatible
4. **Less code** - Delete 1000+ lines of manual TypeScript
5. **Validation in Rust** - Business logic where it belongs
6. **Runtime queries** - Portal can ask engine what's implemented
