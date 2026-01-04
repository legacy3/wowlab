# Issue 11: Silent Failures in AuraTracker

## Category

Error Handling

## Severity

High

## Location

`src/sim/state.rs:247-270`

## Description

The `AuraTracker` silently ignores operations on invalid slots instead of returning errors. This makes debugging configuration issues very difficult.

## Current Code

```rust
// state.rs:247-249
pub fn start_dot(&mut self, slot: usize, first_tick_time: u32) {
    if slot < MAX_AURA_SLOTS {
        self.next_tick[slot] = first_tick_time;
        self.active_dots |= 1 << slot;
    }
    // Silent failure if slot >= 32!
}

// state.rs:252-258
pub fn apply_slot(
    &mut self,
    slot: usize,
    time: u32,
    duration: u32,
    max_stacks: u8,
) -> u8 {
    if slot >= MAX_AURA_SLOTS {
        return 0;  // Silent failure, returns 0 stacks
    }
    // ...
}

// engine.rs:642-645
fn apply_aura_inline(&mut self, aura_idx: u8, ...) {
    let idx = aura_idx as usize;
    if idx >= config.auras.len() {
        return;  // Silent failure!
    }
    // ...
}
```

## Problems

1. **No feedback to caller** - Operations fail without indication
2. **Hard to debug** - Auras not applying? No error, no warning
3. **Configuration bugs hidden** - Invalid aura references silently ignored
4. **No logging option** - Can't even enable warnings in debug mode

## Proposed Fix

### Option A: Return Result (Strict)

```rust
#[derive(Debug, thiserror::Error)]
pub enum AuraError {
    #[error("invalid aura slot {slot}, max is {max}")]
    InvalidSlot { slot: usize, max: usize },

    #[error("aura index {idx} out of bounds, only {count} auras defined")]
    AuraNotFound { idx: usize, count: usize },

    #[error("aura {name} is not active")]
    AuraNotActive { name: String },
}

impl AuraTracker {
    pub fn start_dot(&mut self, slot: usize, first_tick_time: u32) -> Result<(), AuraError> {
        if slot >= MAX_AURA_SLOTS {
            return Err(AuraError::InvalidSlot {
                slot,
                max: MAX_AURA_SLOTS
            });
        }
        self.next_tick[slot] = first_tick_time;
        self.active_dots |= 1 << slot;
        Ok(())
    }

    pub fn apply_slot(
        &mut self,
        slot: usize,
        time: u32,
        duration: u32,
        max_stacks: u8,
    ) -> Result<u8, AuraError> {
        if slot >= MAX_AURA_SLOTS {
            return Err(AuraError::InvalidSlot {
                slot,
                max: MAX_AURA_SLOTS
            });
        }

        // Apply logic...
        let stacks = /* ... */;
        Ok(stacks)
    }
}
```

### Option B: Debug Assertions (Performance-Friendly)

```rust
impl AuraTracker {
    pub fn start_dot(&mut self, slot: usize, first_tick_time: u32) {
        debug_assert!(
            slot < MAX_AURA_SLOTS,
            "invalid aura slot {slot}, max is {MAX_AURA_SLOTS}"
        );

        if slot < MAX_AURA_SLOTS {
            self.next_tick[slot] = first_tick_time;
            self.active_dots |= 1 << slot;
        }
    }

    pub fn apply_slot(
        &mut self,
        slot: usize,
        time: u32,
        duration: u32,
        max_stacks: u8,
    ) -> u8 {
        debug_assert!(
            slot < MAX_AURA_SLOTS,
            "invalid aura slot {slot}, max is {MAX_AURA_SLOTS}"
        );

        if slot >= MAX_AURA_SLOTS {
            return 0;
        }
        // ...
    }
}
```

### Option C: Logging with Feature Flag

```rust
#[cfg(feature = "debug-auras")]
macro_rules! aura_warn {
    ($($arg:tt)*) => {
        eprintln!("[AURA WARN] {}", format!($($arg)*));
    };
}

#[cfg(not(feature = "debug-auras"))]
macro_rules! aura_warn {
    ($($arg:tt)*) => {};
}

impl AuraTracker {
    pub fn start_dot(&mut self, slot: usize, first_tick_time: u32) {
        if slot >= MAX_AURA_SLOTS {
            aura_warn!("invalid slot {} (max {})", slot, MAX_AURA_SLOTS);
            return;
        }
        self.next_tick[slot] = first_tick_time;
        self.active_dots |= 1 << slot;
    }
}
```

## Recommendation

**Use Option B (Debug Assertions)** for AuraTracker internals:

- Zero runtime cost in release builds
- Catches bugs during development
- Maintains hot-path performance

**Use Option A (Result)** for configuration validation:

- `apply_aura_inline` should return Result
- Config loading should validate all aura references upfront

## Combined Approach

```rust
// In AuraTracker (hot path) - debug assertions
impl AuraTracker {
    #[inline]
    pub fn apply_slot(&mut self, slot: usize, ...) -> u8 {
        debug_assert!(slot < MAX_AURA_SLOTS);
        // Fast path without checks in release
        unsafe {
            // Only if we've validated at config time
            self.slots.get_unchecked_mut(slot)
        }
    }
}

// In config validation (cold path) - Result
impl SimConfig {
    pub fn validate(&self) -> Result<(), ConfigError> {
        for spell in &self.spells {
            for effect in &spell.effects {
                if let SpellEffect::ApplyAura { aura_id, .. } = effect {
                    if !self.auras.iter().any(|a| a.id == *aura_id) {
                        return Err(ConfigError::AuraNotFound {
                            spell: spell.name.clone(),
                            aura_id: *aura_id,
                        });
                    }
                }
            }
        }
        Ok(())
    }
}

// In engine initialization
impl Simulator {
    pub fn new(config: SimConfig) -> Result<Self, EngineError> {
        // Validate all references before simulation
        config.validate()?;

        // Now safe to use unchecked access in hot path
        Ok(Self { config, ... })
    }
}
```

## Impact

- Catches configuration bugs early
- Clear error messages for debugging
- No performance impact in release builds

## Effort

Medium (4-6 hours)

## Tests Required

- Test invalid slot triggers assertion (debug mode)
- Test config validation catches missing auras
- Verify no performance regression in release
