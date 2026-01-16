# Known Issues

## Engine

### Stubbed Implementations

These return hardcoded values and need real implementations:

| Expression | File | Returns | Needs |
|------------|------|---------|-------|
| `spell.cost` | expr/spell.rs | 0.0 | Spell data lookup |
| `spell.cast_time` | expr/spell.rs | 0.0 | Spell data lookup |
| `spell.range` | expr/spell.rs | 40.0 | Spell data lookup |
| `spell.in_range` | expr/spell.rs | distance <= 40.0 | Spell data lookup |
| `spell.usable` | expr/spell.rs | cooldown check only | Full usability check |
| `enemy.spell_targets_hit` | expr/enemy.rs | 1 | Enemy positional logic |
| `trinket.ready` | context.rs | false | Equipment system |
| `trinket.remaining` | context.rs | 0.0 | Equipment system |
| `player.armor` | expr/player.rs | 0.0 | Armor tracking |
| `equipped.<item>` | context.rs | Not implemented | Equipment system |

### Stubbed Actions

| Action | File | Behavior | Needs |
|--------|------|----------|-------|
| `use_trinket` | compiler.rs | Silently skips | Equipment system |
| `use_item` | compiler.rs | Silently skips | Inventory system |
| `set_var` | compiler.rs | Compile-time only | Runtime variable storage |
| `modify_var` | compiler.rs | Compile-time only | Runtime variable storage |

### Known Limitations

- **JIT Module Memory**: Compiled rotations leak memory (Box::leak) - acceptable for simulation lifetime
- **Variables are compile-time only**: SetVar/ModifyVar evaluate at compile time, not runtime
