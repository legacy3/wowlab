# Resource Conditions

Player resource state (focus, energy, mana, combo points, etc).

## Valid Resource Names

Resource availability depends on class/spec.

**Primary Resources:**

- `focus`, `energy`, `rage`, `mana`, `runic_power`, `maelstrom`, `insanity`, `fury`, `pain`, `lunar_power`, `astral_power`

**Secondary Resources:**

- `combo_points`, `soul_shards`, `holy_power`, `chi`, `arcane_charges`, `runes`

## Conditions

| Type                       | Returns | Description                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------- |
| `resource_current`         | f64     | Current amount                                                      |
| `resource_max`             | f64     | Maximum amount                                                      |
| `resource_deficit`         | f64     | `max - current` (clamped to 0 if overcapped)                        |
| `resource_deficit_percent` | f64     | `deficit / max * 100`                                               |
| `resource_percent`         | f64     | `current / max * 100` (returns 0.0 if max is 0)                     |
| `resource_regen`           | f64     | Per-second regeneration rate (haste-adjusted)                       |
| `resource_time_to_max`     | f64     | Seconds until full (uses current haste-adjusted regen)              |
| `resource_time_to`         | f64     | Seconds until reaching `amount` (uses current haste-adjusted regen) |

## Haste Handling

- `resource_regen` returns the current regeneration rate, already adjusted for haste
- `resource_time_to` and `resource_time_to_max` use the current regen rate (haste-adjusted)
- These are best-effort predictions assuming regen stays constant

## Edge Cases

| Condition                                          | Behavior            |
| -------------------------------------------------- | ------------------- |
| Invalid resource name                              | Parse-time error    |
| `resource_time_to` with amount below current       | Returns 0.0         |
| `resource_time_to` with amount above max           | Returns time to max |
| `resource_deficit` when overcapped (current > max) | Returns 0 (clamped) |
| `resource_percent` when max is 0                   | Returns 0.0         |

## JSON

```json
{"type": "resource_current", "resource": "focus"}
{"type": "resource_max", "resource": "focus"}
{"type": "resource_deficit", "resource": "focus"}
{"type": "resource_deficit_percent", "resource": "focus"}
{"type": "resource_percent", "resource": "focus"}
{"type": "resource_regen", "resource": "focus"}
{"type": "resource_time_to_max", "resource": "focus"}
{"type": "resource_time_to", "resource": "focus", "amount": 50}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    ResourceCurrent { resource: String },
    ResourceMax { resource: String },
    ResourceDeficit { resource: String },
    ResourceDeficitPercent { resource: String },
    ResourcePercent { resource: String },
    ResourceRegen { resource: String },
    ResourceTimeToMax { resource: String },
    ResourceTimeTo { resource: String, amount: f64 },
}
```
