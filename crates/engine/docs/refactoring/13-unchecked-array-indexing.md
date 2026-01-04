# Issue 13: Unchecked Array Indexing

## Category

Error Handling / Type Safety

## Severity

Medium

## Location

`src/sim/state.rs:437-440`

## Description

The hot path uses `get_unchecked_mut` with a safety comment claiming config-time validation, but there's no explicit bounds checking at config time.

## Current Code

```rust
// state.rs:437-440
impl SimResults {
    #[inline(always)]
    pub fn record_spell_damage(&mut self, spell_idx: usize, damage: f32) {
        // SAFETY: spell_idx is always < spell_count (validated at config time)
        unsafe {
            *self.spell_damage.get_unchecked_mut(spell_idx) += damage;
            *self.spell_casts.get_unchecked_mut(spell_idx) += 1;
        }
    }
}
```

## Problems

1. **No explicit validation** - Comment claims config-time validation but it's not visible
2. **Index source unclear** - Where does `spell_idx` come from?
3. **Potential UB** - If validation is ever bypassed, undefined behavior
4. **Silent corruption** - Out-of-bounds writes corrupt adjacent memory

## Call Chain Analysis

```rust
// engine.rs - spell_idx comes from rotation
let spell_idx = rotation.next_action(&state);

// rotation/engine.rs - returns action from script
pub fn next_action(&self, state: &SimState) -> Option<u8> {
    // Rhai script returns action index
    self.engine.eval_ast_with_scope(&mut scope, &self.ast)
}

// The u8 is cast to usize
let spell_idx = action as usize;
```

The index originates from Rhai script evaluation and is cast from `u8` to `usize`. The script could potentially return any value 0-255.

## Where Validation Should Happen

```rust
// In rotation compilation (compiler.rs)
if spell_idx >= config.spells.len() {
    return Err(RotationError::InvalidSpellIndex {
        idx: spell_idx,
        max: config.spells.len(),
    });
}
```

## Proposed Fix

### Option A: Add Debug Assertion (Minimal)

```rust
impl SimResults {
    #[inline(always)]
    pub fn record_spell_damage(&mut self, spell_idx: usize, damage: f32) {
        debug_assert!(
            spell_idx < self.spell_damage.len(),
            "spell_idx {} out of bounds (max {})",
            spell_idx,
            self.spell_damage.len()
        );

        // SAFETY: Validated at config time AND debug_assert above
        unsafe {
            *self.spell_damage.get_unchecked_mut(spell_idx) += damage;
            *self.spell_casts.get_unchecked_mut(spell_idx) += 1;
        }
    }
}
```

### Option B: Explicit Bounds Check with Fallback

```rust
impl SimResults {
    #[inline(always)]
    pub fn record_spell_damage(&mut self, spell_idx: usize, damage: f32) {
        // Bounds check with branch prediction hint
        if spell_idx < self.spell_damage.len() {
            // SAFETY: Just checked bounds
            unsafe {
                *self.spell_damage.get_unchecked_mut(spell_idx) += damage;
                *self.spell_casts.get_unchecked_mut(spell_idx) += 1;
            }
        } else {
            // Log error in debug builds
            debug_assert!(false, "spell_idx {} out of bounds", spell_idx);
        }
    }
}
```

### Option C: Use Checked Access (Safe)

```rust
impl SimResults {
    #[inline(always)]
    pub fn record_spell_damage(&mut self, spell_idx: usize, damage: f32) {
        if let Some(d) = self.spell_damage.get_mut(spell_idx) {
            *d += damage;
        }
        if let Some(c) = self.spell_casts.get_mut(spell_idx) {
            *c += 1;
        }
    }
}
```

### Option D: NewType Wrapper (Type Safety)

```rust
/// A validated spell index
#[derive(Debug, Clone, Copy)]
pub struct SpellIdx(u8);

impl SpellIdx {
    /// Create a new spell index, panicking if out of bounds
    pub fn new(idx: u8, spell_count: usize) -> Self {
        assert!(
            (idx as usize) < spell_count,
            "spell index {} out of bounds (max {})",
            idx,
            spell_count
        );
        Self(idx)
    }

    /// Get the raw index value
    #[inline(always)]
    pub fn as_usize(self) -> usize {
        self.0 as usize
    }
}

// Usage - validation happens once at construction
impl SimResults {
    #[inline(always)]
    pub fn record_spell_damage(&mut self, spell_idx: SpellIdx, damage: f32) {
        let idx = spell_idx.as_usize();
        // SAFETY: SpellIdx is validated at construction
        unsafe {
            *self.spell_damage.get_unchecked_mut(idx) += damage;
            *self.spell_casts.get_unchecked_mut(idx) += 1;
        }
    }
}
```

## Recommendation

**Use Option D (NewType)** for long-term safety:

- Validation happens once at rotation compilation
- Index cannot be forged without going through constructor
- Zero runtime cost after validation
- Self-documenting code

**Use Option A (Debug Assert)** for quick fix:

- Catches bugs in development
- No production overhead
- Easy to add

## Additional Validation Needed

```rust
// In rotation/compiler.rs - validate all spell references
impl RotationCompiler {
    pub fn compile(script: &str, config: &SimConfig) -> Result<CompiledRotation, RotationError> {
        let mut compiler = Self::new(config);

        // Build spell map with validation
        for (i, spell) in config.spells.iter().enumerate() {
            if i > u8::MAX as usize {
                return Err(RotationError::TooManySpells {
                    count: config.spells.len(),
                    max: 256,
                });
            }
            compiler.spell_map.insert(spell.name.clone(), SpellIdx::new(i as u8, config.spells.len()));
        }

        // ... compile script
    }
}
```

## Impact

- Prevents undefined behavior
- Catches configuration bugs early
- Maintains hot-path performance

## Effort

Low for Option A (1 hour)
Medium for Option D (4-6 hours)

## Tests Required

- Test SpellIdx rejects out-of-bounds
- Test rotation compilation validates indices
- Verify no performance regression
