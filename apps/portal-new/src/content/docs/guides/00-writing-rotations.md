---
title: Writing Rotations
description: How to write rotation priority lists
updatedAt: 2025-12-17
---

# Writing Rotations

Rotations are priority lists written in [Rhai](https://rhai.rs/), a lightweight scripting language. All you write is the spell priority. The engine handles everything else.

## What you write

```rhai
if bestial_wrath.ready() { cast("bestial_wrath") }
if barbed_shot.ready() { cast("barbed_shot") }
if kill_command.ready() { cast("kill_command") }
if cobra_shot.ready() { cast("cobra_shot") }
```

That's it - the list runs from top to bottom in priority order. The simulation handles cooldowns, GCDs, and timing.

## Rhai basics

Rhai is a simple scripting language embedded in the Rust simulation engine. If you know JavaScript or any C-style language, you already know most of Rhai.

**Only the order of casts matters.** Use any logic you want to decide what to cast:

```rhai
// Conditional logic
if player_health < 30 {
  cast("healthstone")
}

// Pool resources
if energy < 80 && !buff_active("tiger_fury") {
  return; // Wait for energy
}

// Normal priority
if ferocious_bite.ready() { cast("ferocious_bite") }
if rake.ready() { cast("rake") }
```

## Available conditions

Use these conditions to check spell and aura state:

- `spell.ready()` - Spell off cooldown and has resources
- `aura.active()` - Aura is currently applied
- `aura.stacks() >= N` - Aura has at least N stacks
- `aura.remaining() <= N` - Aura expires within N seconds

## Example: DoT refresh

```rhai
// Refresh Rake in pandemic window (4.5s remaining)
if rake.remaining() <= 4.5 {
  cast("rake")
}
```

Check out [existing rotations](/rotations) for more examples. The [Rhai documentation](https://rhai.rs/book/) covers the full language if you want to go deeper.
