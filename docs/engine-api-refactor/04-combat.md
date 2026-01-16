# Combat & Target Conditions

Combat state and target information.

## Combat

| Condition          | Returns | Description                                                                                               |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------- |
| `combat_time`      | f64     | Seconds since combat started (first hostile action). Resets on wipe or full disengage.                    |
| `combat_remaining` | f64     | Seconds until combat ends. Only valid in timed encounters (dungeons/raids); returns `f64::MAX` otherwise. |

## Target

| Condition                | Returns | Description                                                                                                                                                                   |
| ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target_health`          | f64     | Target's current absolute health.                                                                                                                                             |
| `target_health_max`      | f64     | Target's maximum health.                                                                                                                                                      |
| `target_health_percent`  | f64     | Target health 0-100.                                                                                                                                                          |
| `target_time_to_die`     | f64     | Estimated seconds until dead. Uses rolling 3-second DPS average: `current_health / recent_dps`. Returns `f64::MAX` if no damage dealt. Minimum: 0.0.                          |
| `target_time_to_percent` | f64     | Seconds until target reaches specified health %. Uses same DPS estimate as TTD. Returns 0.0 if target already below percent. Percent must be 0-100 (validated at parse time). |
| `target_distance`        | f64     | Yards to target's hitbox edge (accounts for target hitbox radius). Returns `f64::MAX` if no target. Updated each frame (not predictive).                                      |
| `target_casting`         | bool    | Whether target is currently casting a spell.                                                                                                                                  |
| `target_moving`          | bool    | Whether target is currently moving.                                                                                                                                           |

## Enemy

| Condition        | Returns | Description                                                                                                                                                  |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enemy_count`    | i32     | Enemies currently in combat with player. Includes all threat-linked enemies regardless of range. Excludes dead enemies and CC'd enemies that dropped combat. |
| `spell_targets_hit` | i32     | Target count from LAST cast of specified spell. Returns 0 if spell never cast this combat. Spell name validated at parse time.                               |

## JSON

```json
{"type": "combat_time"}
{"type": "combat_remaining"}

{"type": "target_health"}
{"type": "target_health_max"}
{"type": "target_health_percent"}
{"type": "target_time_to_die"}
{"type": "target_time_to_percent", "percent": 20}
{"type": "target_distance"}
{"type": "target_casting"}
{"type": "target_moving"}

{"type": "enemy_count"}
{"type": "spell_targets_hit", "spell": "multi_shot"}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    CombatTime,
    CombatRemaining,

    TargetHealth,
    TargetHealthMax,
    TargetHealthPercent,
    TargetTimeToDie,
    TargetTimeToPercent { percent: f64 },
    TargetDistance,
    TargetCasting,
    TargetMoving,

    EnemyCount,
    SpellTargetsHit { spell: String },
}
```
