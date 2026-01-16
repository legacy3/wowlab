# Cooldown Conditions

Spell cooldown state.

## Spell Validation

Spell names are validated at **parse time** against the spell registry. Invalid spell names cause a parse-time error.

## Conditions

| Type                    | Returns | Description                                       |
| ----------------------- | ------- | ------------------------------------------------- |
| `cooldown_ready`              | bool    | Cooldown available (can cast)                     |
| `cooldown_remaining`          | f64     | Seconds until ready (0.0 when ready)              |
| `cooldown_duration`           | f64     | Effective cooldown duration (haste-adjusted)      |
| `cooldown_base_duration`      | f64     | Base cooldown duration (unmodified)               |
| `cooldown_charges`            | i32     | Current charge count                              |
| `cooldown_charges_max`        | i32     | Maximum charges                                   |
| `cooldown_charges_fractional` | f64     | Charges including partial (0.0 to cooldown_charges_max) |
| `cooldown_recharge_time`      | f64     | Seconds until next charge (0.0 at max charges)    |
| `cooldown_full_recharge_time` | f64     | Seconds until all charges full                    |

## Non-Charged Spells

For spells without charges (single-use cooldowns):

| Condition               | Behavior                        |
| ----------------------- | ------------------------------- |
| `cooldown_charges`            | 1 if ready, 0 if on cooldown    |
| `cooldown_charges_max`        | Always 1                        |
| `cooldown_charges_fractional` | 0.0 or 1.0 (same as cooldown_charges) |
| `cooldown_recharge_time`      | Same as cooldown_remaining            |
| `cooldown_full_recharge_time` | Same as cooldown_remaining            |

## Haste Interaction

- `cooldown_duration` is haste-adjusted for hasted cooldowns
- `cooldown_remaining` reflects actual remaining time (accounts for haste at cast time)
- `cooldown_recharge_time` is haste-adjusted
- `cooldown_base_duration` is never haste-adjusted

## JSON

```json
{"type": "cooldown_ready", "spell": "kill_command"}
{"type": "cooldown_remaining", "spell": "kill_command"}
{"type": "cooldown_duration", "spell": "kill_command"}
{"type": "cooldown_base_duration", "spell": "kill_command"}
{"type": "cooldown_charges", "spell": "barbed_shot"}
{"type": "cooldown_charges_max", "spell": "barbed_shot"}
{"type": "cooldown_charges_fractional", "spell": "barbed_shot"}
{"type": "cooldown_recharge_time", "spell": "barbed_shot"}
{"type": "cooldown_full_recharge_time", "spell": "barbed_shot"}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    CooldownReady { spell: String },
    CooldownRemaining { spell: String },
    CooldownDuration { spell: String },
    CooldownBaseDuration { spell: String },
    CooldownCharges { spell: String },
    CooldownChargesMax { spell: String },
    CooldownChargesFractional { spell: String },
    CooldownRechargeTime { spell: String },
    CooldownFullRechargeTime { spell: String },
}
```
