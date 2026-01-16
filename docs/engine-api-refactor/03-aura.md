# Aura Conditions

Unified buff/debuff/dot system. Where it lives is specified by `on` field.

## Validation

Aura names are validated at parse time against the aura registry. Invalid aura names cause a parse-time error - they do not silently fail at runtime.

## Target

| Value      | Description                         |
| ---------- | ----------------------------------- |
| `"player"` | Buff on self                        |
| `"target"` | Debuff on current target            |
| `"pet"`    | Buff on player's primary active pet |

**Pet behavior**: `on: "pet"` refers to the player's primary active pet. If no pet is active, all pet aura queries return `false` (for bool) or `0`/`0.0` (for numeric). In multi-pet scenarios, queries target the primary pet only.

## Conditions

| Type                   | Returns | Description                                                                            |
| ---------------------- | ------- | -------------------------------------------------------------------------------------- |
| `aura_active`          | `bool`  | Aura is present                                                                        |
| `aura_inactive`        | `bool`  | Aura is not present (equivalent to `not(aura_active)`, kept for readability)           |
| `aura_remaining`       | `f64`   | Seconds until expires (clamped to 0.0, never negative)                                 |
| `aura_stacks`          | `i32`   | Current stack count (0 if inactive, 1 for active non-stacking auras)                   |
| `aura_stacks_max`      | `i32`   | Maximum stacks (1 for non-stacking auras)                                              |
| `aura_duration`        | `f64`   | Base duration (returns base duration even if aura inactive)                            |
| `aura_refreshable`     | `bool`  | Below 30% duration remaining (WoW's pandemic window)                                   |
| `aura_ticking`         | `bool`  | Aura is active AND has periodic effect                                                 |
| `aura_ticks_remaining` | `i32`   | Number of future ticks, not including current (0 if non-periodic or inactive)          |
| `aura_tick_time`       | `f64`   | Base time between ticks (haste-adjusted)                                               |
| `aura_next_tick`       | `f64`   | Seconds until next tick fires (0 if tick is imminent, 0.0 if non-periodic or inactive) |

### Pandemic Logic

`aura_refreshable` uses the 30% threshold (WoW's standard pandemic window). This is NOT configurable.

For custom thresholds, use an explicit comparison:

```json
{
  "type": "lt",
  "left": { "type": "aura_remaining", "aura": "serpent_sting", "on": "target" },
  "right": {
    "type": "mul",
    "left": {
      "type": "aura_duration",
      "aura": "serpent_sting",
      "on": "target"
    },
    "right": { "type": "value", "value": 0.4 }
  }
}
```

Pandemic extension (adding remaining time to refreshed duration, capped at 30%) is handled automatically by the engine on refresh - this behavior is not queryable.

### Tick Semantics

- `aura_ticking`: Returns `true` only if the aura is active AND has a periodic effect
- `aura_ticks_remaining`: Number of future ticks that will occur (excludes any tick happening right now)
- `aura_next_tick`: Time in seconds until the next tick fires; returns `0.0` if a tick is imminent
- `aura_tick_time`: Base interval between ticks, adjusted for haste

### Stack Behavior

- **Stacking auras**: `aura_stacks` returns current count, `aura_stacks_max` returns the cap
- **Non-stacking auras**: `aura_stacks` = 1 if active, 0 if inactive; `aura_stacks_max` = 1
- **Inactive aura**: `aura_stacks` = 0

### Edge Cases

| Scenario          | Behavior                                                                   |
| ----------------- | -------------------------------------------------------------------------- |
| Invalid aura name | Parse-time error                                                           |
| Inactive aura     | `aura_remaining` = 0.0, `aura_duration` = base duration                    |
| Non-periodic aura | `aura_ticking` = false, `aura_ticks_remaining` = 0, `aura_next_tick` = 0.0 |
| No pet active     | All pet queries return false/0/0.0                                         |
| Aura expired      | `aura_remaining` clamped to 0.0 (never negative)                           |

## JSON

```json
{"type": "aura_active", "aura": "bestial_wrath", "on": "player"}
{"type": "aura_remaining", "aura": "bestial_wrath", "on": "player"}
{"type": "aura_stacks", "aura": "frenzy", "on": "pet"}

{"type": "aura_active", "aura": "hunters_mark", "on": "target"}
{"type": "aura_refreshable", "aura": "serpent_sting", "on": "target"}

{"type": "aura_ticking", "aura": "serpent_sting", "on": "target"}
{"type": "aura_ticks_remaining", "aura": "serpent_sting", "on": "target"}
{"type": "aura_next_tick", "aura": "serpent_sting", "on": "target"}
```

## Rust

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuraOn {
    Player,
    Target,
    Pet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    AuraActive { aura: String, on: AuraOn },
    AuraInactive { aura: String, on: AuraOn },
    AuraRemaining { aura: String, on: AuraOn },
    AuraStacks { aura: String, on: AuraOn },
    AuraStacksMax { aura: String, on: AuraOn },
    AuraDuration { aura: String, on: AuraOn },
    AuraRefreshable { aura: String, on: AuraOn },
    AuraTicking { aura: String, on: AuraOn },
    AuraTicksRemaining { aura: String, on: AuraOn },
    AuraTickTime { aura: String, on: AuraOn },
    AuraNextTick { aura: String, on: AuraOn },
}
```
