# Issue 15: Cast Truncation Without Guards

## Category

Type Safety

## Severity

Medium

## Location

`src/rotation/compiler.rs:74-82`

## Description

The rotation compiler casts spell indices to `u8` with a clippy allow, but doesn't guard against having more than 255 spells.

## Current Code

```rust
// compiler.rs:74-82
impl RotationCompiler {
    fn build_spell_map(config: &SimConfig) -> HashMap<String, u8> {
        let mut spell_map = HashMap::new();

        for (i, spell) in config.spells.iter().enumerate() {
            let name = normalize_name(&spell.name);
            #[allow(clippy::cast_possible_truncation)]
            spell_map.insert(name, i as u8);  // TRUNCATES if i > 255
        }

        spell_map
    }
}
```

## Problem

If a config has 256+ spells:

- Index 256 becomes 0 (truncated)
- Index 257 becomes 1
- Wrong spells get cast
- Silent corruption of rotation logic

## Proposed Fix

### Option A: Compile-Time Error

```rust
impl RotationCompiler {
    fn build_spell_map(config: &SimConfig) -> Result<HashMap<String, u8>, RotationError> {
        if config.spells.len() > u8::MAX as usize {
            return Err(RotationError::TooManySpells {
                count: config.spells.len(),
                max: u8::MAX as usize,
            });
        }

        let mut spell_map = HashMap::new();

        for (i, spell) in config.spells.iter().enumerate() {
            let name = normalize_name(&spell.name);
            // Safe: we checked bounds above
            spell_map.insert(name, i as u8);
        }

        Ok(spell_map)
    }
}

// Add error variant
#[derive(Debug, Error)]
pub enum RotationError {
    // ... existing variants

    #[error("too many spells ({count}), maximum is {max}")]
    TooManySpells { count: usize, max: usize },
}
```

### Option B: Use u16 Instead

```rust
// If 256 spells is too restrictive
impl RotationCompiler {
    fn build_spell_map(config: &SimConfig) -> Result<HashMap<String, u16>, RotationError> {
        if config.spells.len() > u16::MAX as usize {
            return Err(RotationError::TooManySpells {
                count: config.spells.len(),
                max: u16::MAX as usize,
            });
        }

        let mut spell_map = HashMap::new();

        for (i, spell) in config.spells.iter().enumerate() {
            let name = normalize_name(&spell.name);
            spell_map.insert(name, i as u16);
        }

        Ok(spell_map)
    }
}
```

### Option C: NewType with Validation

```rust
/// A validated spell index that fits in u8
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SpellIdx(u8);

impl SpellIdx {
    /// Create a new spell index from usize
    ///
    /// # Errors
    /// Returns error if index exceeds u8::MAX
    pub fn try_new(idx: usize) -> Result<Self, SpellIdxError> {
        if idx > u8::MAX as usize {
            Err(SpellIdxError::IndexTooLarge { idx })
        } else {
            Ok(Self(idx as u8))
        }
    }

    /// Get raw u8 value
    #[inline(always)]
    pub fn as_u8(self) -> u8 {
        self.0
    }

    /// Get as usize for array indexing
    #[inline(always)]
    pub fn as_usize(self) -> usize {
        self.0 as usize
    }
}

#[derive(Debug, Error)]
#[error("spell index {idx} exceeds maximum of 255")]
pub struct SpellIdxError {
    idx: usize,
}

// Usage
impl RotationCompiler {
    fn build_spell_map(config: &SimConfig) -> Result<HashMap<String, SpellIdx>, RotationError> {
        let mut spell_map = HashMap::new();

        for (i, spell) in config.spells.iter().enumerate() {
            let idx = SpellIdx::try_new(i)
                .map_err(|e| RotationError::TooManySpells {
                    count: config.spells.len(),
                    max: u8::MAX as usize,
                })?;

            let name = normalize_name(&spell.name);
            spell_map.insert(name, idx);
        }

        Ok(spell_map)
    }
}
```

## Similar Issues

Also check these locations for similar truncation:

```rust
// compiler.rs:81-82 - aura indices
#[allow(clippy::cast_possible_truncation)]
aura_map.insert(name, i as u8);

// condition.rs:80, 104, 111, 123 - index usage
let spell_state = &state.player.spell_states[*idx as usize];
```

## Recommendation

Use **Option A** (compile-time error):

- 256 spells is plenty for any spec
- Clear error message if limit exceeded
- No runtime overhead
- Simple implementation

## Impact

- Prevents silent truncation bugs
- Clear limit documented in code
- Fail-fast on invalid config

## Effort

Low (1-2 hours)

## Tests Required

- Test 255 spells succeeds
- Test 256 spells returns TooManySpells error
- Test 1000 spells returns error with correct count
