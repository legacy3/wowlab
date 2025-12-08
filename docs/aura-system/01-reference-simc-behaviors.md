# Reference: SimC Aura Behaviors

> **This is a reference document.** Do not implement anything from this file directly - it explains how SimulationCraft handles auras so we can mirror the behavior.

## Refresh Behaviors

SimC defines all refresh behaviors in `engine/sc_enums.hpp`:

| Behavior   | Description                             | Default For                |
| ---------- | --------------------------------------- | -------------------------- |
| `DISABLED` | Refresh does nothing to duration        | -                          |
| `DURATION` | Replace duration entirely               | Non-periodic buffs         |
| `EXTEND`   | Add full duration to remaining          | -                          |
| `PANDEMIC` | Add duration + min(30% base, remaining) | Periodic buffs (DoTs/HoTs) |
| `TICK`     | Carry over residual tick fraction       | Ticking with extend flag   |
| `MAX`      | Keep max of (remaining, new duration)   | -                          |
| `CUSTOM`   | Delegate to user callback               | -                          |

### Pandemic Window

The "pandemic window" is **30% of the base duration**. When refreshing:

- You keep up to 30% of the remaining duration
- This prevents "clipping" losses while not allowing infinite extension

Example: A 12s DoT refreshed at 4s remaining:

- Pandemic cap = 12 \* 0.3 = 3.6s
- New duration = 12 + min(4, 3.6) = 15.6s

### Duration Calculation

```
DISABLED  → duration = 0 (no refresh)
DURATION  → duration = baseDuration
PANDEMIC  → duration = baseDuration + min(remaining, baseDuration * 0.3)
EXTEND    → duration = remaining + baseDuration
TICK      → duration = baseDuration + (remainingTickFraction * tickPeriod)
MAX       → duration = max(remaining, baseDuration)
```

## Stacking Mechanics

### Synchronous vs Asynchronous

**Synchronous** (default): All stacks share one expiration timer.

**Asynchronous**: Each stack has its own expiration timer. Example: Rogue's Deadly Poison.

### Stack Policies

| Policy                    | Description                               |
| ------------------------- | ----------------------------------------- |
| `reverse`                 | New triggers decrement existing stacks    |
| `reverse_stack_reduction` | How many stacks to remove per tick        |
| `consume_all_stacks`      | Consume takes all vs partial              |
| `expire_at_max_stack`     | Auto-expire when hitting cap              |
| `freeze_stacks`           | Prevent auto-increment/decrement per tick |

## Tick Behavior

### Tick Time

```
UNHASTED  → Static tick period
HASTED    → tickPeriod / (1 + haste)
CUSTOM    → User callback
```

### Tick Flags

| Flag                  | Effect                                    |
| --------------------- | ----------------------------------------- |
| `tick_on_application` | First tick fires immediately on apply     |
| `tick_zero`           | Same as above, different timing semantics |
| `partial_tick`        | Allow truncated final ticks               |

## Application Flow

1. Check cooldowns/internal cooldowns
2. Check RPPM or flat proc chance
3. Check sleeping-state
4. Apply "server delay" bundling
5. Schedule expirations
6. Update regen if aura affects caches
7. Prime ticks (respecting `tick_on_application`)

## Refresh Flow

1. Bump stacks/value
2. Apply refresh duration policy
3. Cancel/rebuild expiration events
4. Handle infinite durations
5. Optionally clip or preserve tick timers
6. Handle `tick_zero`/`tick_on_application` for HoTs

## Expire Flow

1. Optional expiration delay
2. Cancel tick/delay events
3. Record remaining duration and stack count
4. Clear stack uptime
5. Fire expire callback
6. Flip regen/cache flags
7. Reset values

## Specialized Buff Types

### stat_buff_t

- Parses spell effects into stat deltas
- Rating translations (crit rating → crit %)
- Per-stack rounding

### absorb_buff_t

- Registers with `player->absorb_buff_list`
- Optionally cumulates shield values on refresh
- Eligibility filters (school, spell type)

### damage_buff_t

- Direct damage multiplier
- Periodic damage multiplier
- Auto-attack multiplier
- Crit chance bonus
