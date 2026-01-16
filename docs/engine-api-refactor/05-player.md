# Player Conditions

Player state queries.

## Health

| Condition               | Type | Description               |
| ----------------------- | ---- | ------------------------- |
| `player_health`         | f64  | Current health            |
| `player_health_max`     | f64  | Maximum health            |
| `player_health_percent` | f64  | Health percentage (0-100) |
| `player_health_deficit` | f64  | `max - current`           |

**Edge cases:**

- Dead player: `player_health` = 0, `player_health_percent` = 0

## Stats

| Condition             | Type | Description                                             |
| --------------------- | ---- | ------------------------------------------------------- |
| `player_level`        | i32  | Player's current level                                  |
| `player_armor`        | f64  | Total armor value                                       |
| `player_stamina`      | f64  | Total stamina                                           |
| `player_primary_stat` | f64  | Primary stat for spec (agi/str/int)                     |
| `player_haste`        | f64  | Haste percentage (0-100), e.g., 20.0 = 20% haste        |
| `player_crit`         | f64  | Crit chance percentage (0-100), e.g., 25.5 = 25.5% crit |
| `player_mastery`      | f64  | Mastery percentage (0-100)                              |
| `player_versatility`  | f64  | Versatility damage percentage (0-100)                   |
| `player_attack_power` | f64  | Total attack power (base + bonuses)                     |
| `player_spell_power`  | f64  | Total spell power (base + bonuses)                      |

**Edge cases:**

- All stat queries work regardless of class (may return 0 for inapplicable stats)
- `player_spell_power` on melee class: returns 0
- `player_attack_power` on caster class: returns 0

## State

| Condition          | Type | Description          |
| ------------------ | ---- | -------------------- |
| `player_alive`     | bool | Is player alive?     |
| `player_in_combat` | bool | Is player in combat? |
| `player_stealthed` | bool | Is player stealthed? |
| `player_mounted`   | bool | Is player mounted?   |

**Edge cases:**

- Dead player: `player_alive` = false

## Movement

| Condition                   | Type | Description                                |
| --------------------------- | ---- | ------------------------------------------ |
| `player_moving`             | bool | True if player position changed this frame |
| `player_movement_remaining` | f64  | Seconds of forced movement remaining       |

**`player_moving` semantics:**

- Includes: walking, running, jumping, falling, knockback
- Does NOT include: being moved by conveyor/vehicle

**`player_movement_remaining` semantics:**

- Seconds of forced movement remaining (knockback, charge, etc.)
- Returns 0.0 if no forced movement active

## JSON

```json
{"type": "player_health"}
{"type": "player_health_max"}
{"type": "player_health_percent"}
{"type": "player_health_deficit"}

{"type": "player_level"}
{"type": "player_armor"}
{"type": "player_stamina"}
{"type": "player_primary_stat"}
{"type": "player_haste"}
{"type": "player_crit"}
{"type": "player_mastery"}
{"type": "player_versatility"}
{"type": "player_attack_power"}
{"type": "player_spell_power"}

{"type": "player_alive"}
{"type": "player_in_combat"}
{"type": "player_stealthed"}
{"type": "player_mounted"}

{"type": "player_moving"}
{"type": "player_movement_remaining"}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    // Health
    PlayerHealth,
    PlayerHealthMax,
    PlayerHealthPercent,
    PlayerHealthDeficit,

    // Stats
    PlayerLevel,
    PlayerArmor,
    PlayerStamina,
    PlayerPrimaryStat,
    PlayerHaste,
    PlayerCrit,
    PlayerMastery,
    PlayerVersatility,
    PlayerAttackPower,
    PlayerSpellPower,

    // State
    PlayerAlive,
    PlayerInCombat,
    PlayerStealthed,
    PlayerMounted,

    // Movement
    PlayerMoving,
    PlayerMovementRemaining,
}
```
