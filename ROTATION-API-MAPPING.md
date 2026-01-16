# SimC → Rotation API v2 Complete Mapping

This document maps every SimC APL expression to the new Rotation API v2 format.

---

## Table of Contents

1. [Operators](#operators)
2. [Resources](#resources)
3. [Cooldowns](#cooldowns)
4. [Buffs](#buffs)
5. [Debuffs](#debuffs)
6. [DoTs](#dots)
7. [Target](#target)
8. [Combat & Simulation](#combat--simulation)
9. [Player Health](#player-health)
10. [GCD](#gcd)
11. [Action/Spell Properties](#actionspell-properties)
12. [Casting State](#casting-state)
13. [Action History](#action-history)
14. [Talents](#talents)
15. [Equipment](#equipment)
16. [Trinkets](#trinkets)
17. [Pet](#pet)
18. [Variables](#variables)
19. [Spec/Class/Race](#specclassrace)
20. [Hero Trees](#hero-trees)
21. [Stats](#stats)
22. [Haste & Speed](#haste--speed)
23. [Crit & Hit](#crit--hit)
24. [Movement](#movement)
25. [Swing Timer](#swing-timer)
26. [Position](#position)
27. [Level & Misc](#level--misc)
28. [Set Bonuses](#set-bonuses)
29. [Actions (APL Statements)](#actions-apl-statements)
30. [Not Mapped](#not-mapped)

---

## Operators

### Arithmetic Operators

| SimC | API v2 | Description |
|------|--------|-------------|
| `a + b` | `{ "add": [a, b] }` | Addition |
| `a - b` | `{ "subtract": [a, b] }` | Subtraction |
| `a * b` | `{ "multiply": [a, b] }` | Multiplication |
| `a % b` | `{ "divide": [a, b] }` | Division |
| `a %% b` | `{ "modulo": [a, b] }` | Modulus |
| `+a` | `a` | Unary plus (no-op) |
| `-a` | `{ "negate": a }` | Unary negation |

### Logical Operators

| SimC | API v2 | Description |
|------|--------|-------------|
| `a & b` | `{ "and": [a, b] }` | Logical AND |
| `a && b` | `{ "and": [a, b] }` | Logical AND |
| `a \| b` | `{ "or": [a, b] }` | Logical OR |
| `a \|\| b` | `{ "or": [a, b] }` | Logical OR |
| `a ^ b` | `{ "xor": [a, b] }` | Logical XOR |
| `a ^^ b` | `{ "xor": [a, b] }` | Logical XOR |
| `!a` | `{ "not": a }` | Logical NOT |

### Comparison Operators

| SimC | API v2 | Description |
|------|--------|-------------|
| `a == b` | Embedded: `{ "query": { "==": b } }` | Equal |
| `a != b` | Embedded: `{ "query": { "!=": b } }` | Not equal |
| `a < b` | Embedded: `{ "query": { "<": b } }` | Less than |
| `a <= b` | Embedded: `{ "query": { "<=": b } }` | Less than or equal |
| `a > b` | Embedded: `{ "query": { ">": b } }` | Greater than |
| `a >= b` | Embedded: `{ "query": { ">=": b } }` | Greater than or equal |
| `a ~ b` | `{ "in": [a, b] }` | IN operator |
| `a !~ b` | `{ "not_in": [a, b] }` | NOT IN operator |

### Math Functions

| SimC | API v2 | Description |
|------|--------|-------------|
| `@a` | `{ "abs": a }` | Absolute value |
| `floor(a)` | `{ "floor": a }` | Floor function |
| `ceil(a)` | `{ "ceil": a }` | Ceiling function |
| `a <? b` | `{ "min": [a, b] }` | Minimum |
| `a >? b` | `{ "max": [a, b] }` | Maximum |

### Operator Precedence (SimC, High to Low)

| Precedence | Operators |
|------------|-----------|
| 1 | `floor()`, `ceil()`, `@` (abs) |
| 2 | `!`, `+` (unary), `-` (unary) |
| 3 | `*`, `%`, `%%` |
| 4 | `+`, `-` (binary) |
| 5 | `<?`, `>?` (min, max) |
| 6 | `==`, `!=`, `<`, `<=`, `>`, `>=`, `~`, `!~` |
| 7 | `&&`, `&` |
| 8 | `^^`, `^` |
| 9 | `\|\|`, `\|` |

---

## Resources

### Current Resource Value

| SimC | API v2 |
|------|--------|
| `focus` | `{ "resource": { "type": "focus", ">=": 0 } }` |
| `focus>=50` | `{ "resource": { "type": "focus", ">=": 50 } }` |
| `focus<30` | `{ "resource": { "type": "focus", "<": 30 } }` |
| `focus==100` | `{ "resource": { "type": "focus", "==": 100 } }` |
| `mana` | `{ "resource": { "type": "mana", ... } }` |
| `energy` | `{ "resource": { "type": "energy", ... } }` |
| `rage` | `{ "resource": { "type": "rage", ... } }` |
| `runic_power` | `{ "resource": { "type": "runic_power", ... } }` |
| `combo_points` | `{ "resource": { "type": "combo_points", ... } }` |
| `holy_power` | `{ "resource": { "type": "holy_power", ... } }` |
| `chi` | `{ "resource": { "type": "chi", ... } }` |
| `soul_shards` | `{ "resource": { "type": "soul_shards", ... } }` |
| `astral_power` | `{ "resource": { "type": "astral_power", ... } }` |
| `maelstrom` | `{ "resource": { "type": "maelstrom", ... } }` |
| `insanity` | `{ "resource": { "type": "insanity", ... } }` |
| `fury` | `{ "resource": { "type": "fury", ... } }` |
| `pain` | `{ "resource": { "type": "pain", ... } }` |
| `essence` | `{ "resource": { "type": "essence", ... } }` |
| `runes` | `{ "resource": { "type": "runes", ... } }` |
| `arcane_charges` | `{ "resource": { "type": "arcane_charges", ... } }` |
| `soul_fragments` | `{ "resource": { "type": "soul_fragments", ... } }` |

### Resource Properties

| SimC | API v2 |
|------|--------|
| `focus.deficit` | `{ "resource.deficit": { "type": "focus", ... } }` |
| `focus.deficit>=30` | `{ "resource.deficit": { "type": "focus", ">=": 30 } }` |
| `focus.pct` | `{ "resource.percent": { "type": "focus", ... } }` |
| `focus.percent` | `{ "resource.percent": { "type": "focus", ... } }` |
| `focus.pct<50` | `{ "resource.percent": { "type": "focus", "<": 50 } }` |
| `focus.max` | `{ "resource.max": { "type": "focus", ... } }` |
| `focus.max_nonproc` | `{ "resource.max_nonproc": { "type": "focus", ... } }` |
| `focus.pct_nonproc` | `{ "resource.percent_nonproc": { "type": "focus", ... } }` |
| `focus.regen` | `{ "resource.regen": { "type": "focus", ... } }` |
| `focus.net_regen` | `{ "resource.net_regen": { "type": "focus", ... } }` |
| `focus.time_to_max` | `{ "resource.time_to_max": { "type": "focus", ... } }` |
| `focus.time_to_50` | `{ "resource.time_to": { "type": "focus", "value": 50, ... } }` |
| `focus.time_to_80` | `{ "resource.time_to": { "type": "focus", "value": 80, ... } }` |

---

## Cooldowns

### Boolean Cooldown Checks

| SimC | API v2 |
|------|--------|
| `cooldown.kill_command.ready` | `{ "cooldown.ready": "Kill Command" }` |
| `cooldown.kill_command.up` | `{ "cooldown.ready": "Kill Command" }` |
| `!cooldown.kill_command.ready` | `{ "not": { "cooldown.ready": "Kill Command" } }` |

### Cooldown Remaining Time

| SimC | API v2 |
|------|--------|
| `cooldown.kill_command.remains` | `{ "cooldown.remaining": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.remains<3` | `{ "cooldown.remaining": { "spell": "Kill Command", "<": 3 } }` |
| `cooldown.kill_command.remains<=gcd` | `{ "cooldown.remaining": { "spell": "Kill Command", "<=": { "gcd.duration": {} } } }` |
| `cooldown.kill_command.remains_guess` | `{ "cooldown.remaining_expected": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.remains_expected` | `{ "cooldown.remaining_expected": { "spell": "Kill Command", ... } }` |

### Cooldown Duration

| SimC | API v2 |
|------|--------|
| `cooldown.kill_command.duration` | `{ "cooldown.duration": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.base_duration` | `{ "cooldown.base_duration": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.duration_guess` | `{ "cooldown.duration_expected": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.duration_expected` | `{ "cooldown.duration_expected": { "spell": "Kill Command", ... } }` |

### Cooldown Charges

| SimC | API v2 |
|------|--------|
| `cooldown.kill_command.charges` | `{ "cooldown.charges": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.charges>=2` | `{ "cooldown.charges": { "spell": "Kill Command", ">=": 2 } }` |
| `cooldown.kill_command.charges_fractional` | `{ "cooldown.charges_fractional": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.charges_fractional>=1.5` | `{ "cooldown.charges_fractional": { "spell": "Kill Command", ">=": 1.5 } }` |
| `cooldown.kill_command.max_charges` | `{ "cooldown.max_charges": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.recharge_time` | `{ "cooldown.recharge_time": { "spell": "Kill Command", ... } }` |
| `cooldown.kill_command.full_recharge_time` | `{ "cooldown.full_recharge_time": { "spell": "Kill Command", ... } }` |

---

## Buffs

### Boolean Buff Checks

| SimC | API v2 |
|------|--------|
| `buff.bestial_wrath.up` | `{ "buff.active": "Bestial Wrath" }` |
| `buff.bestial_wrath.down` | `{ "buff.inactive": "Bestial Wrath" }` |
| `!buff.bestial_wrath.up` | `{ "not": { "buff.active": "Bestial Wrath" } }` |
| `buff.bestial_wrath.react` | `{ "buff.react": { "aura": "Bestial Wrath", ">=": 1 } }` |
| `buff.bestial_wrath.react>=1` | `{ "buff.react": { "aura": "Bestial Wrath", ">=": 1 } }` |
| `buff.bestial_wrath.at_max_stacks` | `{ "buff.at_max_stacks": "Bestial Wrath" }` |
| `buff.bestial_wrath.refreshable` | `{ "buff.refreshable": "Bestial Wrath" }` |

### Buff Time Properties

| SimC | API v2 |
|------|--------|
| `buff.bestial_wrath.remains` | `{ "buff.remaining": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.remains<5` | `{ "buff.remaining": { "aura": "Bestial Wrath", "<": 5 } }` |
| `buff.bestial_wrath.remains>=10` | `{ "buff.remaining": { "aura": "Bestial Wrath", ">=": 10 } }` |
| `buff.bestial_wrath.duration` | `{ "buff.duration": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.elapsed` | `{ "buff.elapsed": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.tick_time` | `{ "buff.tick_time": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.tick_time_remains` | `{ "buff.tick_time_remaining": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.cooldown_remains` | `{ "buff.cooldown_remaining": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.cooldown_react` | `{ "buff.cooldown_react": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.internal_cooldown_remains` | `{ "buff.internal_cooldown_remaining": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.last_trigger` | `{ "buff.last_trigger": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.last_expire` | `{ "buff.last_expire": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.expiration_delay_remains` | `{ "buff.expiration_delay_remaining": { "aura": "Bestial Wrath", ... } }` |

### Buff Stack Properties

| SimC | API v2 |
|------|--------|
| `buff.frenzy.stack` | `{ "buff.stacks": { "aura": "Frenzy", ... } }` |
| `buff.frenzy.stack>=3` | `{ "buff.stacks": { "aura": "Frenzy", ">=": 3 } }` |
| `buff.frenzy.stack==5` | `{ "buff.stacks": { "aura": "Frenzy", "==": 5 } }` |
| `buff.frenzy.stack_pct` | `{ "buff.stacks_percent": { "aura": "Frenzy", ... } }` |
| `buff.frenzy.max_stack` | `{ "buff.max_stacks": { "aura": "Frenzy", ... } }` |
| `buff.frenzy.react_pct` | `{ "buff.react_percent": { "aura": "Frenzy", ... } }` |

### Buff Value Properties

| SimC | API v2 |
|------|--------|
| `buff.bestial_wrath.value` | `{ "buff.value": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.default_value` | `{ "buff.default_value": { "aura": "Bestial Wrath", ... } }` |
| `buff.bestial_wrath.stack_value` | `{ "buff.stack_value": { "aura": "Bestial Wrath", ... } }` |

---

## Debuffs

### Boolean Debuff Checks

| SimC | API v2 |
|------|--------|
| `debuff.hunters_mark.up` | `{ "debuff.active": "Hunter's Mark" }` |
| `debuff.hunters_mark.down` | `{ "debuff.inactive": "Hunter's Mark" }` |
| `!debuff.hunters_mark.up` | `{ "not": { "debuff.active": "Hunter's Mark" } }` |
| `debuff.hunters_mark.refreshable` | `{ "debuff.refreshable": "Hunter's Mark" }` |
| `debuff.hunters_mark.ticking` | `{ "debuff.ticking": "Hunter's Mark" }` |

### Debuff Time Properties

| SimC | API v2 |
|------|--------|
| `debuff.hunters_mark.remains` | `{ "debuff.remaining": { "aura": "Hunter's Mark", ... } }` |
| `debuff.hunters_mark.remains<5` | `{ "debuff.remaining": { "aura": "Hunter's Mark", "<": 5 } }` |
| `debuff.hunters_mark.duration` | `{ "debuff.duration": { "aura": "Hunter's Mark", ... } }` |
| `debuff.hunters_mark.tick_time` | `{ "debuff.tick_time": { "aura": "Hunter's Mark", ... } }` |
| `debuff.hunters_mark.tick_time_remains` | `{ "debuff.tick_time_remaining": { "aura": "Hunter's Mark", ... } }` |

### Debuff Stack Properties

| SimC | API v2 |
|------|--------|
| `debuff.hunters_mark.stack` | `{ "debuff.stacks": { "aura": "Hunter's Mark", ... } }` |
| `debuff.hunters_mark.stack>=3` | `{ "debuff.stacks": { "aura": "Hunter's Mark", ">=": 3 } }` |
| `debuff.hunters_mark.max_stack` | `{ "debuff.max_stacks": { "aura": "Hunter's Mark", ... } }` |

### Debuff Value Properties

| SimC | API v2 |
|------|--------|
| `debuff.hunters_mark.value` | `{ "debuff.value": { "aura": "Hunter's Mark", ... } }` |
| `debuff.hunters_mark.pmultiplier` | `{ "debuff.persistent_multiplier": { "aura": "Hunter's Mark", ... } }` |

---

## DoTs

### Boolean DoT Checks

| SimC | API v2 |
|------|--------|
| `dot.serpent_sting.ticking` | `{ "dot.ticking": "Serpent Sting" }` |
| `!dot.serpent_sting.ticking` | `{ "not": { "dot.ticking": "Serpent Sting" } }` |
| `dot.serpent_sting.refreshable` | `{ "dot.refreshable": "Serpent Sting" }` |

### DoT Time Properties

| SimC | API v2 |
|------|--------|
| `dot.serpent_sting.remains` | `{ "dot.remaining": { "dot": "Serpent Sting", ... } }` |
| `dot.serpent_sting.remains<5` | `{ "dot.remaining": { "dot": "Serpent Sting", "<": 5 } }` |
| `dot.serpent_sting.duration` | `{ "dot.duration": { "dot": "Serpent Sting", ... } }` |
| `dot.serpent_sting.tick_time` | `{ "dot.tick_time": { "dot": "Serpent Sting", ... } }` |
| `dot.serpent_sting.tick_time_remains` | `{ "dot.tick_time_remaining": { "dot": "Serpent Sting", ... } }` |

### DoT Tick Properties

| SimC | API v2 |
|------|--------|
| `dot.serpent_sting.ticks_remain` | `{ "dot.ticks_remaining": { "dot": "Serpent Sting", ... } }` |
| `dot.serpent_sting.tick_count` | `{ "dot.ticks_remaining": { "dot": "Serpent Sting", ... } }` |
| `dot.serpent_sting.pmultiplier` | `{ "dot.persistent_multiplier": { "dot": "Serpent Sting", ... } }` |

### Active DoT Count

| SimC | API v2 |
|------|--------|
| `active_dot.serpent_sting` | `{ "active_dots": { "dot": "Serpent Sting", ... } }` |
| `active_dot.serpent_sting>=3` | `{ "active_dots": { "dot": "Serpent Sting", ">=": 3 } }` |

### Enemy DoTs

| SimC | API v2 |
|------|--------|
| `enemy_dot.serpent_sting.ticking` | `{ "enemy_dot.ticking": "Serpent Sting" }` |
| `enemy_dot.serpent_sting.remains` | `{ "enemy_dot.remaining": { "dot": "Serpent Sting", ... } }` |

---

## Target

### Target Health

| SimC | API v2 |
|------|--------|
| `target.health` | `{ "target.health": { ... } }` |
| `target.health.pct` | `{ "target.health_percent": { ... } }` |
| `target.health.pct<20` | `{ "target.health_percent": { "<": 20 } }` |
| `target.health.pct>=80` | `{ "target.health_percent": { ">=": 80 } }` |
| `target.health.max` | `{ "target.health_max": { ... } }` |

### Target Time To Die

| SimC | API v2 |
|------|--------|
| `target.time_to_die` | `{ "target.time_to_die": { ... } }` |
| `target.time_to_die<10` | `{ "target.time_to_die": { "<": 10 } }` |
| `target.time_to_die>30` | `{ "target.time_to_die": { ">": 30 } }` |
| `target.time_to_pct_20` | `{ "target.time_to_percent": { "percent": 20, ... } }` |
| `target.time_to_pct_35` | `{ "target.time_to_percent": { "percent": 35, ... } }` |
| `target.time_to_pct_20<10` | `{ "target.time_to_percent": { "percent": 20, "<": 10 } }` |

### Target Position

| SimC | API v2 |
|------|--------|
| `target.distance` | `{ "target.distance": { ... } }` |
| `target.distance<8` | `{ "target.distance": { "<": 8 } }` |
| `target.distance>=40` | `{ "target.distance": { ">=": 40 } }` |

### Target Type

| SimC | API v2 |
|------|--------|
| `target.is_boss` | `{ "target.is_boss": true }` |
| `target.is_add` | `{ "target.is_add": true }` |
| `target.is_enemy` | `{ "target.is_enemy": true }` |
| `target.level` | `{ "target.level": { ... } }` |

### Target Buffs/Debuffs

| SimC | API v2 |
|------|--------|
| `target.debuff.hunters_mark.up` | `{ "target.debuff.active": "Hunter's Mark" }` |
| `target.debuff.hunters_mark.remains` | `{ "target.debuff.remaining": { "aura": "Hunter's Mark", ... } }` |
| `target.debuff.hunters_mark.stack` | `{ "target.debuff.stacks": { "aura": "Hunter's Mark", ... } }` |
| `target.buff.X.up` | `{ "target.buff.active": "X" }` |
| `target.buff.X.remains` | `{ "target.buff.remaining": { "aura": "X", ... } }` |

### Multiple Targets

| SimC | API v2 |
|------|--------|
| `target.1.health.pct` | `{ "target.health_percent": { "index": 1, ... } }` |
| `target.2.debuff.X.up` | `{ "target.debuff.active": { "index": 2, "aura": "X" } }` |

---

## Combat & Simulation

### Combat Time

| SimC | API v2 |
|------|--------|
| `time` | `{ "combat.time": { ... } }` |
| `time<10` | `{ "combat.time": { "<": 10 } }` |
| `time>=30` | `{ "combat.time": { ">=": 30 } }` |
| `fight_remains` | `{ "combat.remaining": { ... } }` |
| `fight_remains<30` | `{ "combat.remaining": { "<": 30 } }` |
| `fight_remains>60` | `{ "combat.remaining": { ">": 60 } }` |

### Combat State

| SimC | API v2 |
|------|--------|
| `in_combat` | `{ "combat.active": true }` |
| `!in_combat` | `{ "combat.active": false }` |
| `in_boss_encounter` | `{ "combat.boss_encounter": true }` |

### Enemy Count

| SimC | API v2 |
|------|--------|
| `active_enemies` | `{ "enemy.count": { ... } }` |
| `active_enemies>=3` | `{ "enemy.count": { ">=": 3 } }` |
| `active_enemies==1` | `{ "enemy.count": { "==": 1 } }` |
| `active_enemies_within.8` | `{ "enemy.count_within": { "range": 8, ... } }` |

### Spell Targets

| SimC | API v2 |
|------|--------|
| `spell_targets` | `{ "spell.targets": { ... } }` |
| `spell_targets.multi_shot` | `{ "spell.targets": { "spell": "Multi-Shot", ... } }` |
| `spell_targets.multi_shot>=3` | `{ "spell.targets": { "spell": "Multi-Shot", ">=": 3 } }` |

---

## Player Health

### Current Health

| SimC | API v2 |
|------|--------|
| `health` | `{ "player.health": { ... } }` |
| `health.pct` | `{ "player.health_percent": { ... } }` |
| `health.pct<50` | `{ "player.health_percent": { "<": 50 } }` |
| `health.pct>=80` | `{ "player.health_percent": { ">=": 80 } }` |
| `health.max` | `{ "player.health_max": { ... } }` |
| `health.deficit` | `{ "player.health_deficit": { ... } }` |

### Incoming Damage

| SimC | API v2 |
|------|--------|
| `incoming_damage_3s` | `{ "player.incoming_damage": { "seconds": 3, ... } }` |
| `incoming_damage_5s` | `{ "player.incoming_damage": { "seconds": 5, ... } }` |
| `incoming_damage_5s>health.max*0.5` | `{ "player.incoming_damage": { "seconds": 5, ">": { "multiply": [{ "player.health_max": {} }, 0.5] } } }` |
| `incoming_magic_damage_3s` | `{ "player.incoming_magic_damage": { "seconds": 3, ... } }` |
| `incoming_magic_damage_5s` | `{ "player.incoming_magic_damage": { "seconds": 5, ... } }` |
| `incoming_physical_damage_3s` | `{ "player.incoming_physical_damage": { "seconds": 3, ... } }` |

---

## GCD

| SimC | API v2 |
|------|--------|
| `gcd.remains` | `{ "gcd.remaining": { ... } }` |
| `gcd.remains<0.5` | `{ "gcd.remaining": { "<": 0.5 } }` |
| `gcd.remains==0` | `{ "gcd.remaining": { "==": 0 } }` |
| `gcd.max` | `{ "gcd.duration": { ... } }` |
| `gcd.max<1.5` | `{ "gcd.duration": { "<": 1.5 } }` |

---

## Action/Spell Properties

### Spell Readiness

| SimC | API v2 |
|------|--------|
| `action.kill_command.ready` | `{ "spell.ready": "Kill Command" }` |
| `action.kill_command.usable` | `{ "spell.usable": "Kill Command" }` |
| `action.kill_command.enabled` | `{ "spell.enabled": "Kill Command" }` |
| `action.kill_command.cost_affordable` | `{ "spell.affordable": "Kill Command" }` |
| `spell.kill_command.exists` | `{ "spell.exists": "Kill Command" }` |

### Spell Timing

| SimC | API v2 |
|------|--------|
| `action.kill_command.cast_time` | `{ "spell.cast_time": { "spell": "Kill Command", ... } }` |
| `action.kill_command.execute_time` | `{ "spell.execute_time": { "spell": "Kill Command", ... } }` |
| `action.kill_command.gcd` | `{ "spell.gcd": { "spell": "Kill Command", ... } }` |
| `action.kill_command.gcd.max` | `{ "spell.gcd_max": { "spell": "Kill Command", ... } }` |
| `action.kill_command.gcd.remains` | `{ "spell.gcd_remaining": { "spell": "Kill Command", ... } }` |
| `action.kill_command.cooldown` | `{ "spell.cooldown_duration": { "spell": "Kill Command", ... } }` |
| `action.kill_command.travel_time` | `{ "spell.travel_time": { "spell": "Kill Command", ... } }` |
| `action.kill_command.usable_in` | `{ "spell.usable_in": { "spell": "Kill Command", ... } }` |
| `action.kill_command.last_used` | `{ "spell.last_used": { "spell": "Kill Command", ... } }` |

### Spell Cost

| SimC | API v2 |
|------|--------|
| `action.kill_command.cost` | `{ "spell.cost": { "spell": "Kill Command", ... } }` |
| `action.kill_command.cost<30` | `{ "spell.cost": { "spell": "Kill Command", "<": 30 } }` |

### Spell Damage Estimates

| SimC | API v2 |
|------|--------|
| `action.kill_command.damage` | `{ "spell.damage": { "spell": "Kill Command", ... } }` |
| `action.kill_command.hit_damage` | `{ "spell.hit_damage": { "spell": "Kill Command", ... } }` |
| `action.kill_command.crit_damage` | `{ "spell.crit_damage": { "spell": "Kill Command", ... } }` |
| `action.kill_command.tick_damage` | `{ "spell.tick_damage": { "spell": "Kill Command", ... } }` |
| `action.kill_command.hit_tick_damage` | `{ "spell.hit_tick_damage": { "spell": "Kill Command", ... } }` |
| `action.kill_command.crit_tick_damage` | `{ "spell.crit_tick_damage": { "spell": "Kill Command", ... } }` |

### Spell Healing Estimates

| SimC | API v2 |
|------|--------|
| `action.kill_command.hit_heal` | `{ "spell.hit_heal": { "spell": "Kill Command", ... } }` |
| `action.kill_command.crit_heal` | `{ "spell.crit_heal": { "spell": "Kill Command", ... } }` |
| `action.kill_command.tick_heal` | `{ "spell.tick_heal": { "spell": "Kill Command", ... } }` |

### Spell Multipliers

| SimC | API v2 |
|------|--------|
| `action.kill_command.multiplier` | `{ "spell.multiplier": { "spell": "Kill Command", ... } }` |
| `action.kill_command.tick_multiplier` | `{ "spell.tick_multiplier": { "spell": "Kill Command", ... } }` |
| `action.kill_command.persistent_multiplier` | `{ "spell.persistent_multiplier": { "spell": "Kill Command", ... } }` |
| `action.kill_command.crit_pct_current` | `{ "spell.crit_chance": { "spell": "Kill Command", ... } }` |

### Spell Targeting

| SimC | API v2 |
|------|--------|
| `action.kill_command.target` | `{ "spell.target": { "spell": "Kill Command", ... } }` |
| `action.kill_command.primary_target` | `{ "spell.primary_target": "Kill Command" }` |
| `action.kill_command.available_targets` | `{ "spell.available_targets": { "spell": "Kill Command", ... } }` |

### Spell DoT Properties

| SimC | API v2 |
|------|--------|
| `action.kill_command.tick_time` | `{ "spell.tick_time": { "spell": "Kill Command", ... } }` |
| `action.kill_command.new_tick_time` | `{ "spell.new_tick_time": { "spell": "Kill Command", ... } }` |
| `action.kill_command.dot.ticking` | `{ "spell.dot.ticking": "Kill Command" }` |
| `action.kill_command.dot.remains` | `{ "spell.dot.remaining": { "spell": "Kill Command", ... } }` |

### Spell Energize

| SimC | API v2 |
|------|--------|
| `action.kill_command.energize_amount` | `{ "spell.energize_amount": { "spell": "Kill Command", ... } }` |

### Spell In Flight

| SimC | API v2 |
|------|--------|
| `action.kill_command.in_flight` | `{ "spell.in_flight": "Kill Command" }` |
| `action.kill_command.in_flight_to_target` | `{ "spell.in_flight_to_target": "Kill Command" }` |
| `action.kill_command.in_flight_count` | `{ "spell.in_flight_count": { "spell": "Kill Command", ... } }` |
| `action.kill_command.in_flight_to_target_count` | `{ "spell.in_flight_to_target_count": { "spell": "Kill Command", ... } }` |
| `action.kill_command.in_flight_remains` | `{ "spell.in_flight_remaining": { "spell": "Kill Command", ... } }` |

---

## Casting State

### Player Casting

| SimC | API v2 |
|------|--------|
| `casting` | `{ "player.casting": true }` |
| `!casting` | `{ "player.casting": false }` |
| `channeling` | `{ "player.channeling": true }` |
| `executing` | `{ "player.executing": true }` |

### Specific Spell Casting

| SimC | API v2 |
|------|--------|
| `action.aimed_shot.casting` | `{ "spell.casting": "Aimed Shot" }` |
| `action.aimed_shot.channeling` | `{ "spell.channeling": "Aimed Shot" }` |
| `action.aimed_shot.executing` | `{ "spell.executing": "Aimed Shot" }` |
| `action.aimed_shot.cast_remains` | `{ "spell.cast_remaining": { "spell": "Aimed Shot", ... } }` |
| `action.aimed_shot.channel_remains` | `{ "spell.channel_remaining": { "spell": "Aimed Shot", ... } }` |
| `action.aimed_shot.execute_remains` | `{ "spell.execute_remaining": { "spell": "Aimed Shot", ... } }` |

---

## Action History

### Previous Action

| SimC | API v2 |
|------|--------|
| `prev.kill_command` | `{ "prev": "Kill Command" }` |
| `!prev.kill_command` | `{ "not": { "prev": "Kill Command" } }` |
| `prev_off_gcd.kill_command` | `{ "prev_off_gcd": "Kill Command" }` |

### GCD History

| SimC | API v2 |
|------|--------|
| `prev_gcd.1.kill_command` | `{ "prev_gcd": { "position": 1, "spell": "Kill Command" } }` |
| `prev_gcd.2.kill_command` | `{ "prev_gcd": { "position": 2, "spell": "Kill Command" } }` |
| `prev_gcd.3.kill_command` | `{ "prev_gcd": { "position": 3, "spell": "Kill Command" } }` |
| `!prev_gcd.1.kill_command` | `{ "not": { "prev_gcd": { "position": 1, "spell": "Kill Command" } } }` |

---

## Talents

### Talent Checks

| SimC | API v2 |
|------|--------|
| `talent.killer_instinct` | `{ "talent": "Killer Instinct" }` |
| `talent.killer_instinct.enabled` | `{ "talent": "Killer Instinct" }` |
| `!talent.killer_instinct` | `{ "not": { "talent": "Killer Instinct" } }` |

### Talent Ranks

| SimC | API v2 |
|------|--------|
| `talent.killer_instinct.rank` | `{ "talent.rank": { "talent": "Killer Instinct", ... } }` |
| `talent.killer_instinct.rank>=2` | `{ "talent.rank": { "talent": "Killer Instinct", ">=": 2 } }` |
| `talent.killer_instinct.rank==1` | `{ "talent.rank": { "talent": "Killer Instinct", "==": 1 } }` |

---

## Equipment

### Item Equipped

| SimC | API v2 |
|------|--------|
| `equipped.aberrant_shard_of_arcana` | `{ "equipped": "Aberrant Shard of Arcana" }` |
| `equipped.123456` | `{ "equipped.id": 123456 }` |
| `!equipped.aberrant_shard_of_arcana` | `{ "not": { "equipped": "Aberrant Shard of Arcana" } }` |

### Weapon Type

| SimC | API v2 |
|------|--------|
| `main_hand.1h` | `{ "main_hand": "1h" }` |
| `main_hand.2h` | `{ "main_hand": "2h" }` |
| `off_hand.1h` | `{ "off_hand": "1h" }` |
| `off_hand.2h` | `{ "off_hand": "2h" }` |

---

## Trinkets

### Trinket Readiness

| SimC | API v2 |
|------|--------|
| `trinket.1.ready` | `{ "trinket.ready": { "slot": 1 } }` |
| `trinket.2.ready` | `{ "trinket.ready": { "slot": 2 } }` |
| `!trinket.1.ready` | `{ "not": { "trinket.ready": { "slot": 1 } } }` |

### Trinket Cooldown

| SimC | API v2 |
|------|--------|
| `trinket.1.cooldown.remains` | `{ "trinket.remaining": { "slot": 1, ... } }` |
| `trinket.1.cooldown.remains<10` | `{ "trinket.remaining": { "slot": 1, "<": 10 } }` |
| `trinket.2.cooldown.duration` | `{ "trinket.duration": { "slot": 2, ... } }` |

### Trinket Properties

| SimC | API v2 |
|------|--------|
| `trinket.1.has_buff.X` | `{ "trinket.has_buff": { "slot": 1, "buff": "X" } }` |
| `trinket.1.has_use_buff` | `{ "trinket.has_use_buff": { "slot": 1 } }` |
| `trinket.1.has_stat.any_dps` | `{ "trinket.has_stat": { "slot": 1, "stat": "any_dps" } }` |
| `trinket.1.is.X` | `{ "trinket.is": { "slot": 1, "item": "X" } }` |
| `trinket.1.cast_time` | `{ "trinket.cast_time": { "slot": 1, ... } }` |
| `trinket.1.proc.X.duration` | `{ "trinket.proc_duration": { "slot": 1, "proc": "X", ... } }` |

---

## Pet

### Pet Active

| SimC | API v2 |
|------|--------|
| `pet.active` | `{ "pet.active": true }` |
| `!pet.active` | `{ "pet.active": false }` |
| `pet.any.active` | `{ "pet.any_active": true }` |
| `pet.main.active` | `{ "pet.active": { "pet": "main" } }` |

### Pet Duration

| SimC | API v2 |
|------|--------|
| `pet.main.remains` | `{ "pet.remaining": { "pet": "main", ... } }` |
| `pet.main.remains<5` | `{ "pet.remaining": { "pet": "main", "<": 5 } }` |

### Pet Buffs

| SimC | API v2 |
|------|--------|
| `pet.main.buff.frenzy.up` | `{ "pet.buff.active": { "pet": "main", "aura": "Frenzy" } }` |
| `pet.main.buff.frenzy.remains` | `{ "pet.buff.remaining": { "pet": "main", "aura": "Frenzy", ... } }` |
| `pet.main.buff.frenzy.stack` | `{ "pet.buff.stacks": { "pet": "main", "aura": "Frenzy", ... } }` |

---

## Variables

### User-Defined Variables

| SimC | API v2 |
|------|--------|
| `variable.pooling` | `"$pooling"` |
| `variable.my_custom_var` | `"$my_custom_var"` |
| `variable.need_refresh` | `"$need_refresh"` |
| `!variable.pooling` | `{ "not": "$pooling" }` |
| `variable.counter>=3` | N/A (compare in expression where defined) |

---

## Spec/Class/Race

### Specialization

| SimC | API v2 |
|------|--------|
| `spec.beast_mastery` | `{ "spec": "Beast Mastery" }` |
| `spec.marksmanship` | `{ "spec": "Marksmanship" }` |
| `spec.survival` | `{ "spec": "Survival" }` |

### Class

| SimC | API v2 |
|------|--------|
| `class.hunter` | `{ "class": "Hunter" }` |
| `class.warrior` | `{ "class": "Warrior" }` |
| `class.paladin` | `{ "class": "Paladin" }` |
| `class.death_knight` | `{ "class": "Death Knight" }` |

### Race

| SimC | API v2 |
|------|--------|
| `race.orc` | `{ "race": "Orc" }` |
| `race.human` | `{ "race": "Human" }` |
| `race.blood_elf` | `{ "race": "Blood Elf" }` |
| `race.night_elf` | `{ "race": "Night Elf" }` |

### Role

| SimC | API v2 |
|------|--------|
| `role.dps` | `{ "role": "dps" }` |
| `role.tank` | `{ "role": "tank" }` |
| `role.healer` | `{ "role": "healer" }` |
| `role.attack` | `{ "role": "attack" }` |
| `role.spell` | `{ "role": "spell" }` |

---

## Hero Trees

| SimC | API v2 |
|------|--------|
| `hero_tree.dark_ranger` | `{ "hero_tree": "Dark Ranger" }` |
| `hero_tree.pack_leader` | `{ "hero_tree": "Pack Leader" }` |
| `hero_tree.sentinel` | `{ "hero_tree": "Sentinel" }` |
| `!hero_tree.dark_ranger` | `{ "not": { "hero_tree": "Dark Ranger" } }` |

---

## Stats

### Primary Stats

| SimC | API v2 |
|------|--------|
| `stat.strength` | `{ "stat": { "type": "strength", ... } }` |
| `stat.agility` | `{ "stat": { "type": "agility", ... } }` |
| `stat.intellect` | `{ "stat": { "type": "intellect", ... } }` |
| `stat.stamina` | `{ "stat": { "type": "stamina", ... } }` |
| `stat.spirit` | `{ "stat": { "type": "spirit", ... } }` |

### Secondary Stats

| SimC | API v2 |
|------|--------|
| `stat.crit_rating` | `{ "stat": { "type": "crit_rating", ... } }` |
| `stat.haste_rating` | `{ "stat": { "type": "haste_rating", ... } }` |
| `stat.mastery_rating` | `{ "stat": { "type": "mastery_rating", ... } }` |
| `stat.versatility_rating` | `{ "stat": { "type": "versatility_rating", ... } }` |
| `stat.hit_rating` | `{ "stat": { "type": "hit_rating", ... } }` |
| `stat.expertise_rating` | `{ "stat": { "type": "expertise_rating", ... } }` |

### Derived Stats

| SimC | API v2 |
|------|--------|
| `stat.spell_power` | `{ "stat": { "type": "spell_power", ... } }` |
| `stat.attack_power` | `{ "stat": { "type": "attack_power", ... } }` |
| `stat.armor` | `{ "stat": { "type": "armor", ... } }` |
| `stat.bonus_armor` | `{ "stat": { "type": "bonus_armor", ... } }` |

### Defense Stats

| SimC | API v2 |
|------|--------|
| `stat.dodge_rating` | `{ "stat": { "type": "dodge_rating", ... } }` |
| `stat.parry_rating` | `{ "stat": { "type": "parry_rating", ... } }` |
| `stat.block_rating` | `{ "stat": { "type": "block_rating", ... } }` |

---

## Haste & Speed

| SimC | API v2 |
|------|--------|
| `attack_haste` | `{ "player.attack_haste": { ... } }` |
| `spell_haste` | `{ "player.spell_haste": { ... } }` |
| `spell_cast_speed` | `{ "player.spell_cast_speed": { ... } }` |
| `auto_attack_speed` | `{ "player.auto_attack_speed": { ... } }` |
| `raw_haste_pct` | `{ "player.raw_haste_percent": { ... } }` |

---

## Crit & Hit

| SimC | API v2 |
|------|--------|
| `attack_crit` | `{ "player.attack_crit": { ... } }` |
| `spell_crit` | `{ "player.spell_crit": { ... } }` |
| `mastery_value` | `{ "player.mastery_value": { ... } }` |

### Defense Chances

| SimC | API v2 |
|------|--------|
| `parry_chance` | `{ "player.parry_chance": { ... } }` |
| `dodge_chance` | `{ "player.dodge_chance": { ... } }` |
| `block_chance` | `{ "player.block_chance": { ... } }` |

---

## Movement

| SimC | API v2 |
|------|--------|
| `moving` | `{ "player.moving": true }` |
| `!moving` | `{ "player.moving": false }` |
| `movement.remains` | `{ "movement.remaining": { ... } }` |
| `movement.remains<2` | `{ "movement.remaining": { "<": 2 } }` |
| `movement.distance` | `{ "movement.distance": { ... } }` |
| `movement.speed` | `{ "movement.speed": { ... } }` |

---

## Swing Timer

| SimC | API v2 |
|------|--------|
| `swing.mh.remains` | `{ "swing.remaining": { "hand": "main", ... } }` |
| `swing.mainhand.remains` | `{ "swing.remaining": { "hand": "main", ... } }` |
| `swing.oh.remains` | `{ "swing.remaining": { "hand": "off", ... } }` |
| `swing.offhand.remains` | `{ "swing.remaining": { "hand": "off", ... } }` |
| `swing.mh.remains<0.5` | `{ "swing.remaining": { "hand": "main", "<": 0.5 } }` |

---

## Position

| SimC | API v2 |
|------|--------|
| `position_front` | `{ "player.position": "front" }` |
| `position_back` | `{ "player.position": "back" }` |
| `!position_front` | `{ "not": { "player.position": "front" } }` |

---

## Level & Misc

### Player Level

| SimC | API v2 |
|------|--------|
| `level` | `{ "player.level": { ... } }` |
| `level>=70` | `{ "player.level": { ">=": 70 } }` |
| `level==80` | `{ "player.level": { "==": 80 } }` |

### Simulation Flags

| SimC | API v2 |
|------|--------|
| `ptr` | `{ "sim.ptr": true }` |
| `bugs` | `{ "sim.bugs": true }` |

### Raid Events

| SimC | API v2 |
|------|--------|
| `time_to_bloodlust` | `{ "raid.time_to_bloodlust": { ... } }` |
| `time_to_bloodlust<10` | `{ "raid.time_to_bloodlust": { "<": 10 } }` |

### APL Profile

| SimC | API v2 |
|------|--------|
| `using_apl.precombat` | `{ "using_apl": "precombat" }` |

---

## Set Bonuses

| SimC | API v2 |
|------|--------|
| `set_bonus.tier31_2pc` | `{ "set_bonus": { "tier": 31, "pieces": 2 } }` |
| `set_bonus.tier31_4pc` | `{ "set_bonus": { "tier": 31, "pieces": 4 } }` |
| `set_bonus.tier32_2pc` | `{ "set_bonus": { "tier": 32, "pieces": 2 } }` |
| `set_bonus.tier32_4pc` | `{ "set_bonus": { "tier": 32, "pieces": 4 } }` |
| `!set_bonus.tier31_4pc` | `{ "not": { "set_bonus": { "tier": 31, "pieces": 4 } } }` |

---

## Actions (APL Statements)

### Cast Spell

| SimC | API v2 |
|------|--------|
| `actions+=/kill_command` | `{ "action": "cast", "spell": "Kill Command" }` |
| `actions+=/kill_command,if=focus>=30` | `{ "action": "cast", "spell": "Kill Command", "condition": { "resource": { "type": "focus", ">=": 30 } } }` |

### Call Action List

| SimC | API v2 |
|------|--------|
| `actions+=/call_action_list,name=cooldowns` | `{ "action": "call", "list": "cooldowns" }` |
| `actions+=/call_action_list,name=cooldowns,if=...` | `{ "action": "call", "list": "cooldowns", "condition": ... }` |

### Run Action List

| SimC | API v2 |
|------|--------|
| `actions+=/run_action_list,name=aoe` | `{ "action": "run", "list": "aoe" }` |
| `actions+=/run_action_list,name=aoe,if=active_enemies>=3` | `{ "action": "run", "list": "aoe", "condition": { "enemy.count": { ">=": 3 } } }` |

### Variables

| SimC | API v2 |
|------|--------|
| `actions+=/variable,name=pooling,value=1` | `{ "action": "set", "variable": "pooling", "value": 1 }` |
| `actions+=/variable,name=pooling,value=focus<50` | `{ "action": "set", "variable": "pooling", "value": { "resource": { "type": "focus", "<": 50 } } }` |
| `actions+=/variable,name=counter,op=add,value=1` | `{ "action": "modify", "variable": "counter", "operation": "add", "value": 1 }` |
| `actions+=/variable,name=counter,op=sub,value=1` | `{ "action": "modify", "variable": "counter", "operation": "subtract", "value": 1 }` |
| `actions+=/variable,name=counter,op=mul,value=2` | `{ "action": "modify", "variable": "counter", "operation": "multiply", "value": 2 }` |
| `actions+=/variable,name=counter,op=div,value=2` | `{ "action": "modify", "variable": "counter", "operation": "divide", "value": 2 }` |
| `actions+=/variable,name=counter,op=min,value=5` | `{ "action": "modify", "variable": "counter", "operation": "min", "value": 5 }` |
| `actions+=/variable,name=counter,op=max,value=0` | `{ "action": "modify", "variable": "counter", "operation": "max", "value": 0 }` |
| `actions+=/variable,name=counter,op=set,value=0` | `{ "action": "modify", "variable": "counter", "operation": "set", "value": 0 }` |
| `actions+=/variable,name=counter,op=reset` | `{ "action": "modify", "variable": "counter", "operation": "reset", "value": 0 }` |

### Wait

| SimC | API v2 |
|------|--------|
| `actions+=/wait,sec=1.5` | `{ "action": "wait", "seconds": 1.5 }` |
| `actions+=/wait,sec=0.5,if=...` | `{ "action": "wait", "seconds": 0.5, "condition": ... }` |

### Wait Until

| SimC | API v2 |
|------|--------|
| `actions+=/wait,sec=cooldown.kill_command.remains` | `{ "action": "wait_until", "condition": { "cooldown.ready": "Kill Command" } }` |

### Pool Resource

| SimC | API v2 |
|------|--------|
| `actions+=/pool_resource,for_next=1` | `{ "action": "pool" }` |
| `actions+=/pool_resource,extra_amount=20` | `{ "action": "pool", "extra": 20 }` |
| `actions+=/pool_resource,for_next=1,if=...` | `{ "action": "pool", "condition": ... }` |

### Use Item

| SimC | API v2 |
|------|--------|
| `actions+=/use_item,name=maledict` | `{ "action": "use_item", "item": "Maledict" }` |
| `actions+=/use_item,slot=trinket1` | `{ "action": "use_trinket", "slot": 1 }` |
| `actions+=/use_item,slot=trinket2` | `{ "action": "use_trinket", "slot": 2 }` |
| `actions+=/use_items` | `{ "action": "use_items" }` |

### Potion

| SimC | API v2 |
|------|--------|
| `actions+=/potion` | `{ "action": "use_potion" }` |
| `actions+=/potion,if=buff.bloodlust.up` | `{ "action": "use_potion", "condition": { "buff.active": "Bloodlust" } }` |

### Racial

| SimC | API v2 |
|------|--------|
| `actions+=/blood_fury` | `{ "action": "cast", "spell": "Blood Fury" }` |
| `actions+=/berserking` | `{ "action": "cast", "spell": "Berserking" }` |
| `actions+=/arcane_torrent` | `{ "action": "cast", "spell": "Arcane Torrent" }` |
| `actions+=/lights_judgment` | `{ "action": "cast", "spell": "Light's Judgment" }` |
| `actions+=/fireblood` | `{ "action": "cast", "spell": "Fireblood" }` |
| `actions+=/ancestral_call` | `{ "action": "cast", "spell": "Ancestral Call" }` |
| `actions+=/bag_of_tricks` | `{ "action": "cast", "spell": "Bag of Tricks" }` |

### Auto Attack

| SimC | API v2 |
|------|--------|
| `actions+=/auto_attack` | `{ "action": "auto_attack" }` |
| `actions+=/auto_shot` | `{ "action": "auto_attack" }` |

### Snapshot Stats

| SimC | API v2 |
|------|--------|
| `actions+=/snapshot_stats` | `{ "action": "snapshot_stats" }` |

---

## Not Mapped

These SimC features are not mapped because they're simulation-specific, deprecated, or outside the scope of rotation logic.

### Simulation Configuration

| SimC | Reason |
|------|--------|
| `dbc.spell.X.field` | Direct DBC access - engine abstracts this |
| `dbc.effect.X.field` | Direct DBC access - engine abstracts this |
| `dbc.power.X.field` | Direct DBC access - engine abstracts this |

### Deprecated/Expansion-Specific

| SimC | Reason |
|------|--------|
| `covenant.kyrian` | Shadowlands covenant - deprecated |
| `covenant.venthyr` | Shadowlands covenant - deprecated |
| `covenant.night_fae` | Shadowlands covenant - deprecated |
| `covenant.necrolord` | Shadowlands covenant - deprecated |
| `soulbind.X` | Shadowlands soulbinds - deprecated |
| `conduit.X` | Shadowlands conduits - deprecated |
| `runeforge.X` | Shadowlands runeforges - deprecated |
| `legendary.X` | Shadowlands legendaries - deprecated |

### Expansion Options

| SimC | Reason |
|------|--------|
| `bfa.X` | BFA-specific options |
| `shadowlands.X` | Shadowlands-specific options |
| `dragonflight.X` | Dragonflight-specific options |

### Aliases/Redundant

| SimC | Reason |
|------|--------|
| `self.X` | Redundant - use expression directly |
| `name` | Actor index - simulation specific |
| `target` (as index) | Actor index - simulation specific |

### Simulation Internals

| SimC | Reason |
|------|--------|
| `sim.X` | Simulation-level properties |
| `raid_event.X` | Raid event simulation |
| `desired_targets` | Simulation configuration |

---

## API v2 Expression Reference (New Queries)

This section lists all query types available in API v2, organized by category.

### Boolean Queries (Simple Form)

These return true/false and take a simple string argument:

```json
{ "cooldown.ready": "Spell Name" }
{ "buff.active": "Aura Name" }
{ "buff.inactive": "Aura Name" }
{ "buff.refreshable": "Aura Name" }
{ "buff.at_max_stacks": "Aura Name" }
{ "debuff.active": "Aura Name" }
{ "debuff.inactive": "Aura Name" }
{ "debuff.refreshable": "Aura Name" }
{ "debuff.ticking": "Aura Name" }
{ "dot.ticking": "DoT Name" }
{ "dot.refreshable": "DoT Name" }
{ "talent": "Talent Name" }
{ "equipped": "Item Name" }
{ "spell.ready": "Spell Name" }
{ "spell.usable": "Spell Name" }
{ "spell.enabled": "Spell Name" }
{ "spell.affordable": "Spell Name" }
{ "spell.exists": "Spell Name" }
{ "spell.casting": "Spell Name" }
{ "spell.channeling": "Spell Name" }
{ "spell.executing": "Spell Name" }
{ "spell.in_flight": "Spell Name" }
{ "spell.in_flight_to_target": "Spell Name" }
{ "spell.primary_target": "Spell Name" }
{ "spell.dot.ticking": "Spell Name" }
{ "prev": "Spell Name" }
{ "prev_off_gcd": "Spell Name" }
{ "hero_tree": "Hero Tree Name" }
{ "target.debuff.active": "Aura Name" }
{ "target.buff.active": "Aura Name" }
{ "enemy_dot.ticking": "DoT Name" }
```

### Comparison Queries (Object Form)

These require an object with the entity identifier and comparison operator:

```json
{ "cooldown.remaining": { "spell": "Spell Name", "<": 3 } }
{ "cooldown.duration": { "spell": "Spell Name", ">=": 30 } }
{ "cooldown.charges": { "spell": "Spell Name", ">=": 2 } }
{ "cooldown.charges_fractional": { "spell": "Spell Name", ">=": 1.5 } }
{ "cooldown.max_charges": { "spell": "Spell Name", "==": 3 } }
{ "cooldown.recharge_time": { "spell": "Spell Name", "<": 5 } }
{ "cooldown.full_recharge_time": { "spell": "Spell Name", "<": 10 } }

{ "buff.remaining": { "aura": "Aura Name", "<": 5 } }
{ "buff.duration": { "aura": "Aura Name", ">=": 10 } }
{ "buff.stacks": { "aura": "Aura Name", ">=": 3 } }
{ "buff.max_stacks": { "aura": "Aura Name", "==": 5 } }
{ "buff.react": { "aura": "Aura Name", ">=": 1 } }
{ "buff.value": { "aura": "Aura Name", ">=": 100 } }
{ "buff.elapsed": { "aura": "Aura Name", ">=": 5 } }

{ "debuff.remaining": { "aura": "Aura Name", "<": 5 } }
{ "debuff.stacks": { "aura": "Aura Name", ">=": 3 } }

{ "dot.remaining": { "dot": "DoT Name", "<": 5 } }
{ "dot.duration": { "dot": "DoT Name", ">=": 10 } }
{ "dot.ticks_remaining": { "dot": "DoT Name", ">=": 3 } }
{ "dot.tick_time": { "dot": "DoT Name", "<": 2 } }

{ "resource": { "type": "focus", ">=": 50 } }
{ "resource.deficit": { "type": "focus", ">=": 30 } }
{ "resource.percent": { "type": "focus", "<": 50 } }
{ "resource.max": { "type": "focus", ">=": 100 } }
{ "resource.regen": { "type": "focus", ">=": 10 } }
{ "resource.time_to_max": { "type": "focus", "<": 5 } }
{ "resource.time_to": { "type": "focus", "value": 80, "<": 3 } }

{ "target.health_percent": { "<": 20 } }
{ "target.health": { ">=": 1000000 } }
{ "target.time_to_die": { "<": 10 } }
{ "target.time_to_percent": { "percent": 20, "<": 10 } }
{ "target.distance": { "<": 8 } }

{ "player.health_percent": { "<": 50 } }
{ "player.health": { ">=": 100000 } }
{ "player.incoming_damage": { "seconds": 5, ">": 50000 } }

{ "combat.time": { "<": 10 } }
{ "combat.remaining": { "<": 30 } }
{ "enemy.count": { ">=": 3 } }

{ "gcd.remaining": { "<": 0.5 } }
{ "gcd.duration": { "<": 1.5 } }

{ "spell.cost": { "spell": "Spell Name", "<": 30 } }
{ "spell.cast_time": { "spell": "Spell Name", "<": 2 } }
{ "spell.targets": { "spell": "Spell Name", ">=": 3 } }

{ "talent.rank": { "talent": "Talent Name", ">=": 2 } }

{ "trinket.remaining": { "slot": 1, "<": 10 } }

{ "pet.remaining": { "pet": "main", "<": 5 } }
{ "pet.buff.remaining": { "pet": "main", "aura": "Frenzy", "<": 3 } }
{ "pet.buff.stacks": { "pet": "main", "aura": "Frenzy", ">=": 3 } }

{ "prev_gcd": { "position": 1, "spell": "Spell Name" } }

{ "active_dots": { "dot": "DoT Name", ">=": 3 } }

{ "set_bonus": { "tier": 31, "pieces": 4 } }

{ "stat": { "type": "agility", ">=": 5000 } }

{ "swing.remaining": { "hand": "main", "<": 0.5 } }
```

### Logical Compounds

```json
{ "and": [expr1, expr2, ...] }
{ "or": [expr1, expr2, ...] }
{ "not": expr }
{ "xor": [expr1, expr2] }
```

### Arithmetic Operations

```json
{ "add": [a, b] }
{ "subtract": [a, b] }
{ "multiply": [a, b] }
{ "divide": [a, b] }
{ "modulo": [a, b] }
{ "negate": a }
{ "abs": a }
{ "floor": a }
{ "ceil": a }
{ "min": [a, b] }
{ "max": [a, b] }
```

### Literals and Variables

```json
true
false
42
3.14
"$user_variable"
```
