# Reference: SimC Aura Behaviors (v2)

Reference only; do not implement directly. Mirrors SimulationCraft semantics so we match refresh math and tick options.

## Refresh Behaviors

| Behavior   | Description                             | Default For                |
| ---------- | --------------------------------------- | -------------------------- |
| `DISABLED` | Refresh does nothing to duration        | -                          |
| `DURATION` | Replace duration entirely               | Non-periodic buffs         |
| `EXTEND`   | Add full duration to remaining          | -                          |
| `PANDEMIC` | Add duration + min(30% base, remaining) | Periodic buffs (DoTs/HoTs) |
| `TICK`     | Carry over residual tick fraction       | Ticking with extend flag   |
| `MAX`      | Keep max of (remaining, new duration)   | -                          |
| `CUSTOM`   | Delegate to user callback               | -                          |

Pandemic window = 30% of base duration. Example: 12s DoT refreshed at 4s remaining ⇒ new = 12 + min(4, 3.6) = 15.6s.

## Stacking Mechanics

- **Synchronous** (default): all stacks share one timer.
- **Asynchronous**: each stack expires separately (e.g., Deadly Poison).

Useful stack policy flags: `reverse`, `reverse_stack_reduction`, `consume_all_stacks`, `expire_at_max_stack`, `freeze_stacks`.

## Tick Behavior

- **UNHASTED**: static tick period.
- **HASTED**: tickPeriod / (1 + haste).
- **tick_on_application / tick_zero**: first tick immediately.
- **partial_tick**: allow truncated final tick.

## Application / Refresh / Expire Flow (SimC)

1) Apply → schedule expiration → prime ticks if needed.
2) Refresh → adjust duration per behavior → rebuild expiration → optional tick carry.
3) Expire → cancel ticks → clear stacks → fire callbacks.

Use this doc to reason about expected outcomes; actual implementation rules live in the phase docs.
