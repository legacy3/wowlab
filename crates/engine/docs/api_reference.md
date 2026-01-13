# Rotation DSL API Reference

> wowlab rotation definition language

## Overview

Rotations are defined in JSON. A rotation consists of:
- **Variables** - Named expressions for reuse
- **Lists** - Named sequences of actions
- **Actions** - The main entry point

---

## Expression Language

### Literals

```json
42              // Integer
3.14            // Float
true            // Boolean
false           // Boolean
```

### Comparison

| Operator | Example |
|----------|---------|
| `>` | `{ ">": ["resource.focus", 50] }` |
| `>=` | `{ ">=": ["resource.focus", 30] }` |
| `<` | `{ "<": ["target.health_percent", 20] }` |
| `<=` | `{ "<=": ["cd.kill_command.remaining", 1] }` |
| `==` | `{ "==": ["buff.frenzy.stacks", 3] }` |
| `!=` | `{ "!=": ["enemy.count", 1] }` |

### Logical

| Operator | Example |
|----------|---------|
| `and` | `{ "and": ["buff.a.active", "buff.b.active"] }` |
| `or` | `{ "or": ["buff.a.active", "buff.b.active"] }` |
| `not` | `{ "not": "buff.a.active" }` |

`and` and `or` accept 2+ operands:

```json
{ "and": ["a", "b", "c", "d"] }
```

### Arithmetic

| Operator | Example |
|----------|---------|
| `+` | `{ "+": ["resource.focus", 10] }` |
| `-` | `{ "-": ["resource.focus.max", "resource.focus"] }` |
| `*` | `{ "*": ["buff.x.stacks", 0.1] }` |
| `/` | `{ "/": ["resource.focus", "resource.focus.max"] }` |
| `%` | `{ "%": ["combat.time", 30] }` |

### Functions

| Function | Example |
|----------|---------|
| `floor` | `{ "floor": { "/": ["resource.focus", 30] } }` |
| `ceil` | `{ "ceil": { "/": ["resource.focus", 30] } }` |
| `abs` | `{ "abs": { "-": ["a", "b"] } }` |
| `min` | `{ "min": ["resource.focus", 50] }` |
| `max` | `{ "max": ["resource.focus", 30] }` |

### Shorthand

Boolean variables can be used directly as conditions:

```json
// These are equivalent:
"cd.kill_command.ready"
{ "==": ["cd.kill_command.ready", true] }
```

User-defined variables from the `variables` block:

```json
{
  "variables": {
    "should_burst": { "and": ["cd.big_cd.ready", "cd.other_cd.ready"] }
  },
  "actions": [
    { "cast": "big_cd", "if": "should_burst" }
  ]
}
```

---

## Variables

### resource.*

Primary resource for the spec (focus, energy, mana, rage, etc.).

| Path | Type | Description |
|------|------|-------------|
| `resource.{type}` | float | Current value |
| `resource.{type}.max` | float | Maximum capacity |
| `resource.{type}.deficit` | float | `max - current` |
| `resource.{type}.percent` | float | `(current / max) * 100` |
| `resource.{type}.regen` | float | Per-second regeneration rate |

Resource types: `focus`, `energy`, `mana`, `rage`, `runic_power`, `holy_power`, `soul_shards`, `combo_points`, `chi`, `maelstrom`, `insanity`, `astral_power`, `arcane_charges`, `essence`, `fury`

```json
{ ">=": ["resource.focus", 30] }
{ "<": ["resource.focus.deficit", 20] }
{ ">": ["resource.energy.percent", 80] }
```

### player.*

| Path | Type | Description |
|------|------|-------------|
| `player.health` | float | Current health |
| `player.health.max` | float | Maximum health |
| `player.health.percent` | float | Health percentage (0-100) |

### cd.*

Cooldown state for spells.

| Path | Type | Description |
|------|------|-------------|
| `cd.{spell}.ready` | bool | Off cooldown |
| `cd.{spell}.remaining` | float | Seconds until ready |
| `cd.{spell}.duration` | float | Base cooldown length |
| `cd.{spell}.charges` | int | Current charges (if charged) |
| `cd.{spell}.charges_max` | int | Maximum charges |
| `cd.{spell}.recharge_time` | float | Time until next charge |
| `cd.{spell}.full_recharge` | float | Time until all charges |

```json
"cd.kill_command.ready"
{ ">=": ["cd.barbed_shot.charges", 2] }
{ "<": ["cd.bestial_wrath.remaining", 3] }
```

### buff.*

Buffs on the player.

| Path | Type | Description |
|------|------|-------------|
| `buff.{name}.active` | bool | Buff is active |
| `buff.{name}.inactive` | bool | Buff is not active |
| `buff.{name}.remaining` | float | Seconds remaining |
| `buff.{name}.stacks` | int | Current stacks |
| `buff.{name}.stacks_max` | int | Maximum stacks |
| `buff.{name}.duration` | float | Total duration when applied |

```json
"buff.bestial_wrath.active"
{ ">=": ["buff.frenzy.stacks", 3] }
{ "<": ["buff.frenzy.remaining", 2] }
```

### debuff.*

Debuffs on the current target.

| Path | Type | Description |
|------|------|-------------|
| `debuff.{name}.active` | bool | Debuff is on target |
| `debuff.{name}.inactive` | bool | Debuff is not on target |
| `debuff.{name}.remaining` | float | Seconds remaining |
| `debuff.{name}.stacks` | int | Current stacks |
| `debuff.{name}.refreshable` | bool | Below pandemic threshold (30%) |

```json
"debuff.hunters_mark.active"
{ "<": ["debuff.serpent_sting.remaining", 3] }
"debuff.barbed_shot.refreshable"
```

### dot.*

DoTs are debuffs you apply. Alias for `debuff.*` with additional properties.

| Path | Type | Description |
|------|------|-------------|
| `dot.{name}.ticking` | bool | DoT is active |
| `dot.{name}.remaining` | float | Time remaining |
| `dot.{name}.refreshable` | bool | Below pandemic threshold |
| `dot.{name}.ticks_remaining` | int | Ticks left |

```json
"dot.barbed_shot.ticking"
"dot.serpent_sting.refreshable"
```

### target.*

Current target state.

| Path | Type | Description |
|------|------|-------------|
| `target.health_percent` | float | Target health (0-100) |
| `target.time_to_die` | float | Estimated seconds until death |
| `target.distance` | float | Yards to target |

```json
{ "<": ["target.health_percent", 20] }
{ ">": ["target.time_to_die", 10] }
```

### enemy.*

Enemy count information.

| Path | Type | Description |
|------|------|-------------|
| `enemy.count` | int | Number of active enemies |

```json
{ ">=": ["enemy.count", 3] }
```

### combat.*

Combat timing.

| Path | Type | Description |
|------|------|-------------|
| `combat.time` | float | Seconds since combat started |
| `combat.remaining` | float | Estimated fight duration remaining |

```json
{ "<": ["combat.time", 5] }
{ ">": ["combat.remaining", 30] }
```

### gcd.*

Global cooldown state.

| Path | Type | Description |
|------|------|-------------|
| `gcd.remaining` | float | Time until GCD ready |
| `gcd.duration` | float | Current hasted GCD length |

```json
{ "<": ["gcd.remaining", 0.1] }
```

### pet.*

Pet state (for pet classes).

| Path | Type | Description |
|------|------|-------------|
| `pet.active` | bool | Pet is alive |
| `pet.remaining` | float | Temp pet duration remaining |
| `pet.buff.{name}.active` | bool | Pet has buff |

### talent.*

Talent selection. Compile-time constant - if false, entire branch is removed.

| Path | Type | Description |
|------|------|-------------|
| `talent.{name}` | bool | Talent is selected |

```json
{ "and": ["talent.killer_instinct", { "<": ["target.health_percent", 35] }] }
```

### equipped.*

Equipped items and trinkets.

| Path | Type | Description |
|------|------|-------------|
| `equipped.{item}` | bool | Item is equipped |
| `trinket.1.ready` | bool | Trinket slot 1 ready |
| `trinket.2.ready` | bool | Trinket slot 2 ready |
| `trinket.1.remaining` | float | Trinket slot 1 CD remaining |
| `trinket.2.remaining` | float | Trinket slot 2 CD remaining |

### spell.*

Spell info (cost, cast time).

| Path | Type | Description |
|------|------|-------------|
| `spell.{name}.cost` | float | Resource cost |
| `spell.{name}.cast_time` | float | Cast time in seconds |

---

## Actions

### Cast Spell

```json
{ "cast": "kill_command" }
{ "cast": "kill_command", "if": { ">=": ["resource.focus", 30] } }
```

### Call List

Calls a sub-list. If no action executes, continues to next action in caller.

```json
{ "call": "cooldowns" }
{ "call": "cleave", "if": { ">=": ["enemy.count", 2] } }
```

### Run List

Calls a sub-list. If no action executes, does NOT continue (hard switch).

```json
{ "run": "execute_phase", "if": { "<": ["target.health_percent", 20] } }
```

### Set Variable

Sets a runtime variable (re-evaluated each tick).

```json
{ "set": "pooling", "value": { "<": ["cd.bestial_wrath.remaining", 3] } }
```

### Modify Variable

Modifies a runtime variable with an operation.

```json
{ "modify": "counter", "op": "add", "value": 1 }
{ "modify": "min_focus", "op": "min", "value": "resource.focus" }
```

Operations: `set`, `add`, `sub`, `mul`, `div`, `min`, `max`, `reset`

### Wait

```json
{ "wait": 0.5 }
{ "wait_until": "cd.bestial_wrath.ready" }
```

### Pool Resource

Wait until enough resources for next action.

```json
{ "pool": true }
{ "pool": true, "extra": 20 }
```

### Use Item

```json
{ "use_item": "manic_grieftorch" }
{ "use_trinket": 1 }
{ "use_trinket": 2, "if": "buff.bloodlust.active" }
```

---

## Rotation Structure

```json
{
  "name": "Rotation Name",

  "variables": {
    "var_name": { /* expression */ }
  },

  "lists": {
    "list_name": [
      { /* action */ },
      { /* action */ }
    ]
  },

  "actions": [
    { /* action */ }
  ]
}
```

### Example

```json
{
  "name": "BM Hunter",

  "variables": {
    "sync_ready": {
      "and": [
        "cd.bestial_wrath.ready",
        { "or": [
          "cd.call_of_the_wild.ready",
          { ">": ["cd.call_of_the_wild.remaining", 30] }
        ]}
      ]
    },
    "frenzy_falling": {
      "and": [
        "buff.frenzy.active",
        { "<": ["buff.frenzy.remaining", { "*": ["gcd.duration", 2] }] }
      ]
    }
  },

  "lists": {
    "cooldowns": [
      { "cast": "call_of_the_wild", "if": "sync_ready" },
      { "cast": "bestial_wrath", "if": "sync_ready" },
      { "cast": "bloodshed", "if": "buff.bestial_wrath.active" }
    ],

    "cleave": [
      { "cast": "multi_shot", "if": { "<": ["buff.beast_cleave.remaining", 0.5] } },
      { "call": "st" }
    ],

    "st": [
      { "cast": "barbed_shot", "if": "frenzy_falling" },
      { "cast": "kill_shot", "if": { "<": ["target.health_percent", 20] } },
      { "cast": "kill_command" },
      { "cast": "barbed_shot", "if": { ">=": ["cd.barbed_shot.charges", 2] } },
      { "cast": "dire_beast" },
      { "cast": "cobra_shot", "if": { ">=": ["resource.focus", 50] } }
    ]
  },

  "actions": [
    { "call": "cooldowns" },
    { "call": "cleave", "if": { ">=": ["enemy.count", 2] } },
    { "call": "st" }
  ]
}
```

---

## Quick Reference

### Operators

| Category | Operators |
|----------|-----------|
| Comparison | `>`, `>=`, `<`, `<=`, `==`, `!=` |
| Logical | `and`, `or`, `not` |
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Functions | `floor`, `ceil`, `abs`, `min`, `max` |

### Actions

| Action | Key | Example |
|--------|-----|---------|
| Cast | `cast` | `{ "cast": "spell_name" }` |
| Call list | `call` | `{ "call": "list_name" }` |
| Run list | `run` | `{ "run": "list_name" }` |
| Set variable | `set` | `{ "set": "var", "value": expr }` |
| Modify variable | `modify` | `{ "modify": "var", "op": "add", "value": 1 }` |
| Wait | `wait` | `{ "wait": 0.5 }` |
| Wait until | `wait_until` | `{ "wait_until": "condition" }` |
| Pool | `pool` | `{ "pool": true }` |
| Use item | `use_item` | `{ "use_item": "item_name" }` |
| Use trinket | `use_trinket` | `{ "use_trinket": 1 }` |

### Variable Namespaces

| Namespace | Examples |
|-----------|----------|
| `resource.*` | `resource.focus`, `resource.focus.max`, `resource.focus.deficit` |
| `player.*` | `player.health`, `player.health.percent` |
| `cd.*` | `cd.X.ready`, `cd.X.remaining`, `cd.X.charges` |
| `buff.*` | `buff.X.active`, `buff.X.remaining`, `buff.X.stacks` |
| `debuff.*` | `debuff.X.active`, `debuff.X.remaining`, `debuff.X.refreshable` |
| `dot.*` | `dot.X.ticking`, `dot.X.remaining`, `dot.X.refreshable` |
| `target.*` | `target.health_percent`, `target.time_to_die` |
| `enemy.*` | `enemy.count` |
| `combat.*` | `combat.time`, `combat.remaining` |
| `gcd.*` | `gcd.remaining`, `gcd.duration` |
| `pet.*` | `pet.active`, `pet.buff.X.active` |
| `talent.*` | `talent.X` |
| `equipped.*` | `equipped.X` |
| `trinket.*` | `trinket.1.ready`, `trinket.2.remaining` |
| `spell.*` | `spell.X.cost`, `spell.X.cast_time` |
