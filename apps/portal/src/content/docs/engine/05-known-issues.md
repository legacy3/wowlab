---
title: Known Issues
description: Current limitations and areas for improvement
updatedAt: 2026-01-16
---

# Known Issues

Current limitations and anti-patterns in the engine.

## Critical issues

### JIT memory leak

`rotation/compiler.rs:377`

```rust
Box::leak(Box::new(module)); // Memory never freed
```

The compiled module must stay alive as long as the JIT function is used. Currently leaked intentionally. If many rotations are compiled, memory accumulates.

**Impact**: Memory grows with each unique rotation compiled.

**Mitigation**: Reuse compiled rotations. For typical usage (a few rotations per session), this is acceptable.

### Hardcoded armor constant

`combat/damage/pipeline.rs`

```rust
const ARMOR_CONSTANT: f32 = 7390.0; // Level 80 only
```

Armor mitigation uses a constant for level 80 targets. Simulating different target levels gives incorrect mitigation.

**Impact**: Physical damage calculations wrong for non-80 targets.

**Fix needed**: Make armor constant configurable per target level.

### Pet stat inheritance inconsistency

`actor/pet.rs`

- AP/SP scaled by inheritance factor (typically 0.6)
- Haste/Crit copied directly (not scaled)

Some stats scale, others don't. This matches WoW behavior but can be confusing.

**Impact**: Pet damage may be slightly off if inheritance rules are misunderstood.

### Talents as compile-time constants

`rotation/expr/talent.rs`

Talents are baked into JIT code at compile time. Changing talents requires recompiling the rotation.

**Impact**: Cannot dynamically toggle talents without recompilation.

**Tradeoff**: Faster runtime evaluation vs flexibility.

## Performance concerns

### Proc registry lookup

`proc/registry.rs`

O(n) linear search through handlers for each proc check.

```rust
// Current: O(n) per check
handlers.iter().find(|h| h.can_proc(event))
```

**Impact**: Scales poorly with many proc handlers (50+ in BM Hunter).

**Fix needed**: HashMap with ProcIdx key for O(1) lookup.

### Context buffer allocation

`rotation/compiler.rs`

```rust
let mut buffer = vec![0u8; self.schema.size.max(8)];
```

Buffer allocated on every rotation evaluation.

**Impact**: Allocation overhead on hot path.

**Fix needed**: Thread-local arena or pre-allocated buffer.

### String-based talent checks

`spec/executor.rs`

```rust
ctx.talents.iter().any(|t| *t == name.as_str())
```

O(n) string comparison for each talent check.

**Impact**: Scales poorly with many talents and frequent checks.

**Fix needed**: Use talent flags or HashMap for O(1) lookup.

## Design issues

### Dual parse paths

`rotation/parser.rs`

- `from_json()` - Returns unresolved AST
- `from_json_resolved()` - Returns resolved AST

Two different parse functions that look similar but have different outputs.

**Impact**: Easy to use wrong function and get confusing errors.

**Fix needed**: Single parse function with explicit resolution step.

### Incomplete spell information

`rotation/expr/spell.rs`

Some expressions have TODO implementations:

- Cost: Returns 0
- CastTime: Returns 0
- Range: Hardcoded 40 yards

**Impact**: Rotations can't make decisions based on these values.

**Fix needed**: Wire up SpellDef data to expression evaluation.

### Missing SchoolModifiers integration

`combat/damage/multipliers.rs`

`SchoolModifiers` struct exists but isn't connected to the damage pipeline.

```rust
SchoolModifiers {
    physical: f32,
    fire: f32,
    // ...
}
```

**Impact**: Per-school debuffs don't affect damage calculations.

**Fix needed**: Apply school modifiers in damage calculation.

### Silent tuning failures

`data/loader.rs`

If a spell name in the tuning file doesn't match any SpellDef, it's silently skipped.

**Impact**: Typos in tuning files cause values to be ignored without warning.

**Fix needed**: Log warnings for unknown spell/aura names.

## Recommendations

### High priority

1. **Fix JIT memory leak** - Implement proper module lifecycle
2. **Add spell definition lookup** - Player.can_cast_spell should consult SpellDef
3. **Integrate SchoolModifiers** - Connect to damage pipeline
4. **Add tuning validation** - Log warnings for unknown names

### Medium priority

1. **HashMap for proc lookups** - Replace O(n) scan with O(1)
2. **Cache context buffer** - Thread-local allocation
3. **Parameterize armor constant** - Support different target levels
4. **Consistent pet inheritance** - Document or normalize behavior

### Low priority

1. **u64 SimTime** - Support simulations longer than ~49 days
2. **Memoize condition evaluation** - Cache complex nested conditions
3. **Parallel batch fetches** - SupabaseResolver should parallelize
4. **Talent as runtime values** - Allow dynamic talent changes
