# Phase 1: Foundation - Add Tsify to Engine Core Types

## Objective

Add `tsify` and `serde` derives to the engine's core type system, making all spec-related types serializable and TypeScript-exportable.

> **Note:** Use `tsify` 0.5+ (maintained, full feature support).

## Prerequisites

- Rust toolchain installed
- Understanding of `crates/engine/src/spec/` structure

## Files to Modify

### 1. `crates/engine/Cargo.toml`

Add dependencies:

```toml
[dependencies]
tsify = { version = "0.5", features = ["js"], optional = true }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde-wasm-bindgen = { version = "0.6", optional = true }
wasm-bindgen = { version = "0.2", optional = true }

[features]
default = ["jit", "cli"]
jit = ["dep:cranelift", "dep:cranelift-jit", "dep:cranelift-module", "dep:cranelift-native"]
cli = ["dep:clap", "dep:indicatif", "dep:console", "dep:tabled"]
wasm = ["tsify", "serde-wasm-bindgen", "wasm-bindgen"]
```

> **Critical:** Heavy dependencies (Cranelift, CLI tools) must be optional and disabled for WASM builds.

### 2. Core Type Files

Add derives to these files in `crates/engine/src/`:

| File                 | Types to Derive                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `types/idx.rs`       | `SpellIdx`, `AuraIdx`, `ProcIdx`, `UnitIdx`, `TargetIdx`, `PetIdx`, `EnemyIdx`, `SnapshotIdx`, `ResourceIdx` |
| `types/time.rs`      | `SimTime`                                                                                      |
| `types/resource.rs`  | `ResourceType`                                                                                 |
| `types/damage.rs`    | `DamageSchool`, `DamageFlags`, `HitResult`                                                     |
| `types/attribute.rs` | `Attribute`, `RatingType`, `DerivedStat`                                                       |
| `spec/effect.rs`     | `SpellEffect`, `EffectCondition`, `ModCondition`, `DamageMod`, `TalentDef`                     |
| `spec/spell.rs`      | `SpellDef`, `CastType`, `GcdType`, `SpellTarget`, `ResourceCost`, `DamageEffect`, `SpellFlags` |
| `spec/aura_def.rs`   | `AuraDef`, `AuraEffect`, `AuraFlags`                                                           |
| `aura/periodic.rs`   | `PeriodicEffect`                                                                               |

**Skip execution context types** (lifetime references):
- `CastCheck<'a>` in `spec/context.rs`
- `EffectContext<'a>` in `spec/executor.rs`

### 3. Derive Pattern

For each type, add:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[serde(rename_all = "camelCase")]
pub struct/enum TypeName { ... }
```

> **Important:** The `#[tsify(into_wasm_abi, from_wasm_abi)]` attribute is required for types that will be passed to/from JavaScript via WASM functions.

## Key Challenges

### Challenge 1: `&'static str` fields

**Problem**: `&'static str` cannot be serialized for WASM export.

**Solution**: Convert to `String`.

```rust
// Before
pub name: &'static str,

// After - MUST use String
pub name: String,
```

**Affected types:**
- `SpellDef::name`
- `AuraDef::name`
- `TalentDef::name`, `display_name`
- `DamageMod::name`
- `EffectCondition::TalentEnabled(&'static str)` → `TalentEnabled(String)`
- `ModCondition::TalentEnabled(&'static str)` → `TalentEnabled(String)`
- `SpellEffect::SummonPet { name: &'static str }` → `SummonPet { name: String }`

This is a **breaking change** to the engine API. All spell/aura/talent constructors must be updated.

### Challenge 2: Newtype wrappers (`SpellIdx`, `AuraIdx`)

**Problem**: `SpellIdx(pub u32)` serializes as `{"0": 123}` by default.
**Solution**: Use `#[serde(transparent)]`:

```rust
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(transparent)]
pub struct SpellIdx(pub u32);
```

### Challenge 3: `bitflags!` types (`SpellFlags`, `DamageFlags`)

**Note**: `AuraFlags` is a regular struct with bool fields, NOT a bitflags type.

**Solution**: bitflags 2.x has native serde support. Add derives INSIDE the macro:

```rust
bitflags::bitflags! {
    #[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
    #[serde(transparent)]  // Serializes as the underlying integer
    pub struct SpellFlags: u32 {
        const ON_GCD = 1 << 0;
        const PET_ABILITY = 1 << 1;
        // ...
    }
}
```

This serializes as a number in TypeScript. If you need string representation, use custom serialization to output `["ON_GCD", "PET_ABILITY"]`.

### Challenge 4: `Box<SpellEffect>` in recursive enums

**Problem**: Recursive types need special handling.
**Solution**: Tsify handles `Box<T>` correctly if `T` is Tsify-derivable.

## Verification Steps

1. **Compile check**: `cargo build --features wasm`
2. **Test serialization**:

```rust
#[test]
fn test_spell_effect_serializes() {
    let effect = SpellEffect::ReduceCooldown { spell: SpellIdx(34026), amount: 1.0 };
    let json = serde_json::to_string(&effect).unwrap();
    assert!(json.contains("reduceCooldown"));
}
```

## Success Criteria

- [ ] All spec types have `Serialize`, `Deserialize` derives
- [ ] `cargo build --features wasm` compiles without errors
- [ ] `cargo test` passes with serialization tests
- [ ] No breaking changes to existing engine functionality

## Estimated Scope

- ~25 files modified (types/, spec/, aura/, specs/hunter/*)
- ~300 lines of derive additions
- ~100 lines of serde attribute additions
- **Breaking change**: All `&'static str` → `String` conversions require updating constructors in spec modules

---

## Prompt for Fresh Claude Instance

```
I'm working on Phase 1 of the engine-types-export plan for the wowlab project.

GOAL: Add tsify and serde derives to all engine spec types so they can be exported to TypeScript via WASM.

CONTEXT:
- Engine is at crates/engine/
- Core types are in src/spec/ (effect.rs, spell.rs, aura_def.rs), src/types/, and src/aura/
- Use tsify 0.5+
- Heavy deps (Cranelift, CLI tools) are optional for WASM builds

TASKS:
1. Update Cargo.toml:
   - Add tsify, wasm-bindgen, serde-wasm-bindgen as optional deps
   - Create "wasm" feature that enables them
   - Make cranelift/cli deps optional behind "jit"/"cli" features

2. Add derives to all serializable types:
   - types/idx.rs (SpellIdx, AuraIdx, ProcIdx, UnitIdx, TargetIdx, PetIdx, EnemyIdx, SnapshotIdx, ResourceIdx)
   - types/time.rs (SimTime)
   - types/resource.rs, types/damage.rs, types/attribute.rs
   - spec/effect.rs, spec/spell.rs, spec/aura_def.rs
   - aura/periodic.rs (PeriodicEffect)

3. Convert &'static str fields to String:
   - SpellDef::name, AuraDef::name, TalentDef::name/display_name, DamageMod::name
   - EffectCondition::TalentEnabled, ModCondition::TalentEnabled, SpellEffect::SummonPet

4. Add #[serde(transparent)] to newtypes
5. Add serde derives INSIDE bitflags! macros (SpellFlags, DamageFlags)
6. Skip lifetime types (CastCheck<'a>, EffectContext<'a>)
7. Add #[tsify(into_wasm_abi, from_wasm_abi)] for types crossing WASM boundary

Start by reading crates/engine/Cargo.toml to understand current deps.
```
