---
title: Writing Rotations
description: How to build rotation priority lists in the editor
updatedAt: 2026-01-16
---

# Writing Rotations

Build rotations in the [rotation editor](/rotations/editor). The visual interface lets you add spells, set conditions, and organize priority lists. Everything serializes to JSON and saves to the database.

## Using the editor

1. Open [/rotations/editor](/rotations/editor)
2. Select your spec
3. Add actions to the priority list
4. Set conditions for each action
5. Save your rotation

The editor validates your rotation against the engine's type system before saving.

## How rotations work

Rotations are priority lists. The engine evaluates from top to bottom, casting the first spell whose conditions pass.

**Example priority:**

1. Cast Bestial Wrath if ready
2. Cast Barbed Shot if ready
3. Cast Kill Command if ready
4. Cast Cobra Shot (filler)

The engine handles cooldowns, GCDs, and timing. You just define the priority.

## JSON format

Under the hood, rotations serialize to JSON:

```json
{
  "name": "BM Hunter",
  "variables": {},
  "actions": [
    { "cast": "bestial_wrath", "if": "cooldown.bestial_wrath.ready" },
    { "cast": "barbed_shot", "if": "cooldown.barbed_shot.ready" },
    { "cast": "kill_command", "if": "cooldown.kill_command.ready" },
    { "cast": "cobra_shot" }
  ]
}
```

## Action types

**Cast** - Use a spell:

```json
{ "cast": "kill_command", "if": "cooldown.kill_command.ready" }
```

**Call** - Jump to a named action list, return if nothing casts:

```json
{ "call": "cooldowns", "if": "combat.time > 0" }
```

**Run** - Jump to a named action list, never return:

```json
{ "run": "aoe", "if": "target.count >= 3" }
```

**Wait** - Pause before the next action:

```json
{ "wait": 0.5 }
```

**Pool** - Wait for resources:

```json
{ "pool": { "extra": 20 } }
```

## Conditions

Conditions check game state. Combine with `&` (and), `|` (or), and `!` (not).

### Cooldowns

```
cooldown.kill_command.ready           // Off cooldown
cooldown.kill_command.remains < 2     // Less than 2s remaining
cooldown.barbed_shot.charges >= 2     // At least 2 charges
```

### Buffs and debuffs

```
buff.bestial_wrath.active             // Buff is up
buff.bestial_wrath.remains < 3        // Less than 3s remaining
buff.frenzy.stacks >= 3               // At least 3 stacks
debuff.serpent_sting.refreshable      // In pandemic window
```

### Resources

```
focus.current >= 50                   // At least 50 focus
focus.deficit > 30                    // Missing more than 30 focus
focus.percent < 80                    // Below 80% focus
```

### Combat state

```
combat.time > 5                       // 5+ seconds into fight
combat.remains < 20                   // Less than 20s remaining
target.health_percent < 20            // Execute range
```

## Named action lists

Break complex rotations into reusable lists:

```json
{
  "lists": {
    "cooldowns": [
      { "cast": "bestial_wrath", "if": "cooldown.bestial_wrath.ready" },
      { "cast": "call_of_the_wild", "if": "cooldown.call_of_the_wild.ready" }
    ],
    "st": [{ "cast": "kill_command" }, { "cast": "cobra_shot" }]
  },
  "actions": [{ "call": "cooldowns" }, { "run": "st" }]
}
```

## Variables

Define reusable expressions:

```json
{
  "variables": {
    "pool_for_cds": "cooldown.bestial_wrath.remains < 2 & focus.current < 50"
  },
  "actions": [
    { "pool": {}, "if": "variable.pool_for_cds" },
    { "cast": "cobra_shot" }
  ]
}
```

## Next steps

- Browse [existing rotations](/rotations) for examples
- See the [Rotation Reference](/docs/reference/02-rotation-reference) for all expressions
- Read [Simulation Overview](/docs/reference/01-simulation-overview) to understand execution
