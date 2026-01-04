# Issue 17: Missing NewType Wrappers

## Category

Type Safety

## Severity

Low

## Locations

- `src/sim/engine.rs` - spell_idx as usize
- `src/sim/state.rs` - aura_idx as u8
- `src/rotation/condition.rs` - various indices

## Description

Raw integer types are used for indices throughout the codebase. This allows passing the wrong index type to functions (spell index where aura index expected) without compile-time errors.

## Current Code

```rust
// engine.rs
fn cast_spell_inline(&mut self, spell_idx: usize) { ... }
fn apply_aura_inline(&mut self, aura_idx: u8) { ... }

// condition.rs
pub enum Condition {
    SpellReady { idx: u8 },
    SpellOnCooldown { idx: u8 },
    AuraActive { idx: u8 },
    AuraStacks { idx: u8, min: u8 },
}

// Easy to mix up:
cast_spell_inline(aura_idx as usize);  // WRONG but compiles!
apply_aura_inline(spell_idx as u8);    // WRONG but compiles!
```

## Problems

1. **No type distinction** - All indices are just integers
2. **Easy to mix up** - Aura index passed where spell index expected
3. **No validation** - Any u8 value accepted
4. **Silent bugs** - Wrong index = wrong spell/aura, hard to debug

## Proposed Fix

### 1. Define NewType Wrappers

```rust
// src/sim/types.rs (new file)

/// A validated spell index
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct SpellIdx(u8);

impl SpellIdx {
    /// Maximum number of spells (256)
    pub const MAX: usize = 256;

    /// Create from raw u8 (unchecked, use in validated contexts)
    #[inline(always)]
    pub const fn from_raw(idx: u8) -> Self {
        Self(idx)
    }

    /// Try to create from usize with bounds check
    pub fn try_from_usize(idx: usize, spell_count: usize) -> Option<Self> {
        if idx < spell_count && idx < Self::MAX {
            Some(Self(idx as u8))
        } else {
            None
        }
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    /// Get raw u8 value
    #[inline(always)]
    pub const fn as_u8(self) -> u8 {
        self.0
    }
}

/// A validated aura index
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct AuraIdx(u8);

impl AuraIdx {
    /// Maximum number of aura slots
    pub const MAX: usize = 32;

    #[inline(always)]
    pub const fn from_raw(idx: u8) -> Self {
        Self(idx)
    }

    pub fn try_from_usize(idx: usize, aura_count: usize) -> Option<Self> {
        if idx < aura_count && idx < Self::MAX {
            Some(Self(idx as u8))
        } else {
            None
        }
    }

    #[inline(always)]
    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    #[inline(always)]
    pub const fn as_u8(self) -> u8 {
        self.0
    }
}

/// A validated resource type index
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct ResourceIdx(u8);

/// A validated target index (for multi-target)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(transparent)]
pub struct TargetIdx(u8);
```

### 2. Update Function Signatures

```rust
// Before
fn cast_spell_inline(&mut self, spell_idx: usize) { ... }
fn apply_aura_inline(&mut self, aura_idx: u8) { ... }

// After
fn cast_spell_inline(&mut self, spell_idx: SpellIdx) { ... }
fn apply_aura_inline(&mut self, aura_idx: AuraIdx) { ... }
```

### 3. Update Condition Enum

```rust
pub enum Condition {
    SpellReady { idx: SpellIdx },
    SpellOnCooldown { idx: SpellIdx },
    AuraActive { idx: AuraIdx },
    AuraStacks { idx: AuraIdx, min: u8 },
    ResourceAbove { idx: ResourceIdx, amount: f32 },
}
```

### 4. Update Call Sites

```rust
// Before
let spell_idx = rotation.next_action(&state) as usize;
cast_spell_inline(spell_idx);

// After
let spell_idx = rotation.next_action(&state);  // Returns SpellIdx
cast_spell_inline(spell_idx);

// Array access
let spell_state = &state.player.spell_states[spell_idx.as_usize()];
```

### 5. Validation at Boundaries

```rust
// In rotation compiler - create validated indices
impl RotationCompiler {
    fn compile_cast(&mut self, spell_name: &str) -> Result<SpellIdx, RotationError> {
        let idx = self.spell_map.get(spell_name)
            .ok_or_else(|| RotationError::UnknownSpell(spell_name.to_string()))?;

        SpellIdx::try_from_usize(*idx, self.spell_count)
            .ok_or(RotationError::SpellIndexOutOfBounds { idx: *idx })
    }
}
```

### 6. Derive Useful Traits

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
#[repr(transparent)]
pub struct SpellIdx(u8);

// Allow iteration over all spell indices
impl SpellIdx {
    pub fn iter(count: usize) -> impl Iterator<Item = SpellIdx> {
        (0..count.min(Self::MAX)).map(|i| SpellIdx(i as u8))
    }
}

// Serde support for config files
#[cfg(feature = "serde")]
impl serde::Serialize for SpellIdx {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}
```

## Benefits

| Aspect            | Raw Integers | NewTypes           |
| ----------------- | ------------ | ------------------ |
| Mix-up prevention | No           | Yes, compile error |
| Documentation     | Via comments | Self-documenting   |
| Validation        | Manual       | At construction    |
| Refactoring       | Find/replace | Compiler-guided    |
| Debug output      | Just number  | "SpellIdx(5)"      |

## Migration Strategy

1. Add types to new file `src/sim/types.rs`
2. Update one module at a time (start with rotation)
3. Keep `as_usize()` / `as_u8()` for backward compat
4. Use `#[allow(deprecated)]` for old APIs during transition

## Impact

- Compile-time prevention of index mix-ups
- Self-documenting code
- Clearer error messages
- Foundation for more type safety

## Effort

Medium (6-8 hours for full migration)

## Tests Required

- Test SpellIdx::try_from_usize bounds
- Test AuraIdx::try_from_usize bounds
- Test compile error when mixing types (doc test)
- Verify no performance regression
