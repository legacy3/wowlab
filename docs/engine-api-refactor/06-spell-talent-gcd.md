# Spell, Talent, GCD & Pet Conditions

## Spell

| Condition         | Returns | Description                          |
| ----------------- | ------- | ------------------------------------ |
| `spell_usable`    | bool    | Can cast spell right now             |
| `spell_cost`      | f64     | Primary resource cost                |
| `spell_cast_time` | f64     | Effective cast time (haste-adjusted) |
| `spell_range`     | f64     | Max range in yards                   |
| `spell_in_range`  | bool    | Can spell reach current target       |

### spell_usable

Returns `true` if the spell can be cast right now.

**Checks:**

- Spell is known/learned
- Resources available (mana, focus, rage, etc.)
- Not on cooldown
- Target in range
- Not silenced/stunned/incapacitated

**Does NOT check:**

- Cast time interruption (movement, damage)
- Line of sight

Spell name is validated at parse time.

### spell_cost

Returns the PRIMARY resource cost only.

- For multi-resource spells, only returns the main resource cost
- Health costs are NOT included (separate mechanic)
- Returns `0.0` for spells with no resource cost

### spell_cast_time

Returns EFFECTIVE cast time in seconds (haste-adjusted).

- Instant cast spells return `0.0`
- Channeled spells return channel duration
- Cast time is reduced by haste

### spell_range

Returns max range of spell in yards.

### spell_in_range

Returns `true` if spell can reach current target at current distance.

## Talent

| Condition         | Returns | Description                     |
| ----------------- | ------- | ------------------------------- |
| `talent_enabled`  | bool    | Talent is selected (rank >= 1)  |
| `talent_rank`     | i32     | Current rank (0 = not selected) |
| `talent_max_rank` | i32     | Maximum rank for talent         |

### talent_enabled

Returns `true` if talent is selected (rank >= 1).

Talent name is validated at parse time.

### talent_rank

Returns current rank of the talent. Returns `0` if talent is not selected.

### talent_max_rank

Returns maximum rank available for the talent.

## GCD

| Condition       | Returns | Description                           |
| --------------- | ------- | ------------------------------------- |
| `gcd_active`    | bool    | GCD is currently running              |
| `gcd_remaining` | f64     | Seconds until GCD ends                |
| `gcd_duration`  | f64     | Current GCD duration (haste-adjusted) |

### gcd_active

Returns `true` if global cooldown is currently running.

### gcd_remaining

Returns seconds until GCD ends. Returns `0.0` if GCD is not active.

### gcd_duration

Returns CURRENT GCD duration (haste-adjusted), even if not active.

## Pet

| Condition       | Returns | Description                          |
| --------------- | ------- | ------------------------------------ |
| `pet_active`    | bool    | Any pet is currently active          |
| `pet_count`     | i32     | Number of active pets                |
| `pet_remaining` | f64     | Seconds until temporary pet despawns |

### pet_active

Returns `true` if any pet is currently active.

### pet_count

Returns number of active pets. Returns `0` if no pets are active.

### pet_remaining

Returns seconds until TEMPORARY pet despawns.

- For permanent pets: returns `f64::MAX`
- If no pet: returns `0.0`

## JSON

```json
{"type": "spell_usable", "spell": "kill_command"}
{"type": "spell_cost", "spell": "kill_command"}
{"type": "spell_cast_time", "spell": "aimed_shot"}
{"type": "spell_range", "spell": "arcane_shot"}
{"type": "spell_in_range", "spell": "arcane_shot"}

{"type": "talent_enabled", "talent": "killer_instinct"}
{"type": "talent_rank", "talent": "killer_instinct"}
{"type": "talent_max_rank", "talent": "killer_instinct"}

{"type": "gcd_active"}
{"type": "gcd_remaining"}
{"type": "gcd_duration"}

{"type": "pet_active"}
{"type": "pet_count"}
{"type": "pet_remaining"}
```

## Rust

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Expr {
    SpellUsable { spell: String },
    SpellCost { spell: String },
    SpellCastTime { spell: String },
    SpellRange { spell: String },
    SpellInRange { spell: String },

    TalentEnabled { talent: String },
    TalentRank { talent: String },
    TalentMaxRank { talent: String },

    GcdActive,
    GcdRemaining,
    GcdDuration,

    PetActive,
    PetCount,
    PetRemaining,
}
```
