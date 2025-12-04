# Prediction Engine Architecture

## Why CLEU Mirroring?

WowLab mirrors WoW's Combat Log Event Unfiltered (CLEU) system. This is not arbitrary - it enables the same codebase to work in two modes:

1. **Simulator mode**: WowLab emits CLEU events, handlers consume them to update state
2. **In-game mode**: WoW emits CLEU events, same handlers consume them to update state

The event types (`SPELL_CAST_SUCCESS`, `SPELL_AURA_APPLIED`, `SPELL_DAMAGE`, etc.) match WoW's actual combat log API.

## Two SimDrivers

WowLab uses two separate simulation drivers:

### Live SimDriver (Authoritative)

Processes real CLEU events:

- In-game: received from WoW's combat log API
- Simulator: emitted by the simulation engine

Events go through the full pipeline: EventQueue → HandlerRegistry → Handlers → State mutation.

This is the **authoritative state**. It includes:

- Procs that actually fired (RNG outcomes)
- Actual buff/debuff applications
- Real damage values
- Cooldown resets from procs
- Resource gains/costs

### Prediction SimDriver (Speculative)

**Does NOT emit CLEU events.** Instead:

- Forks from live state (snapshot)
- Runs APL to determine next spell
- Calls handler state mutation logic directly (skips event queue)
- Repeats for N spells
- Discards forked state

This is how Hekili works. The key insight: for prediction, you don't need the event indirection. You just need to know what state would look like after casting.

## Architecture

```
                          LIVE SIMDRIVER
                          ══════════════
Real CLEU ──► EventQueue ──► Handlers ──► Live State (authoritative)
    │                                          │
    │                                          │
    │         PREDICTION SIMDRIVER             │
    │         ════════════════════             │
    │                                          │
    │         ┌────── fork ◄───────────────────┘
    │         │
    │         ▼
    │    Forked State ──► Run APL ──► Spell #1
    │         │               │
    │         │   ┌───────────┘
    │         │   │
    │         │   ▼
    │         │  Call handlers directly (no events)
    │         │   │
    │         │   ▼
    │         │  Mutate forked state
    │         │   │
    │         ▼   ▼
    │    Forked State ──► Run APL ──► Spell #2
    │         │
    │         │  ... repeat for N spells ...
    │         │
    │         ▼
    │    [Spell #1, Spell #2, Spell #3, ...]
    │         │
    │         ▼
    │    "Next 3 spells" UI
    │
    └─── invalidate on new real CLEU ◄─────────────────────────
              (fresh fork from live state)
```

## Prediction Cycle

1. **Trigger**: New real CLEU event arrives (or timer/debounce)
2. **Fork**: Snapshot current live state
3. **Predict spell 1**: Run APL against forked state → get spell to cast
4. **Apply**: Call handler logic directly on forked state (no event emission)
5. **Advance**: Move forked state time forward (GCD, cast time, etc.)
6. **Repeat** steps 3-5 for spells 2, 3, etc.
7. **Output**: List of predicted spells
8. **Discard**: Throw away forked state (it's stale immediately)

## Why Skip Events for Prediction?

Hekili taught us this. Benefits:

1. **Performance**: No event queue overhead, no handler dispatch
2. **Simplicity**: Direct state mutation is faster and easier to reason about
3. **No divergence**: Event timing differences can't compound

The handlers already know how to mutate state. For prediction, just call that logic directly.

## What Prediction Cannot Know

Prediction is limited because it cannot know:

- **Procs**: Will Kill Command reset its cooldown? (RNG)
- **External events**: Will the boss cast something? Will you take damage?
- **Other players**: In group content, others' actions affect state
- **Latency**: Actual cast timing differs from predicted timing

This is why prediction must be **continuously invalidated and rebuilt** as real events arrive.

## RNG Handling

Three modes (inspired by Hekili analysis):

1. **Deterministic** (default): Assume no procs. Stable UI.
2. **Expected value**: Probability-weighted (e.g., 30% proc = 0.3 buff uptime)
3. **Stochastic**: Monte Carlo sampling. Opt-in for theorycraft.

Hekili's approach: don't guess procs. Re-scrape actual aura state. Only model deterministic pseudo-RNG (stack counters, guaranteed procs).

## Consumer Use Cases

### In-Game Overlay (Hekili-style)

- Subscribes to: **Prediction SimDriver output**
- Shows: Next 3 recommended spells
- Updates: On every real CLEU event (triggers re-prediction)

### Timeline Renderer (Portal)

- Subscribes to: **Live SimDriver events**
- Shows: What actually happened in the simulation
- Updates: As simulation runs

### State Tracker

- Subscribes to: **Live SimDriver state**
- Purpose: Maintain authoritative game state
- Used by: Prediction SimDriver as fork source

### CLI Output

- Subscribes to: **Live SimDriver events**
- Shows: ASCII timeline of events

## Implementation Requirements

### State Forking

Live state must be efficiently cloneable:

- Use Immutable.js structural sharing
- Or copy-on-write semantics
- Target: fork in <1ms

### Handler Dual Interface

Handlers need to support both modes:

- **Live mode**: Called via event dispatch (receives event + emitter)
- **Prediction mode**: Called directly (receives forked state, mutates it)

Could be same function with different calling convention, or extract shared mutation logic.

### Invalidation

When real events arrive:

- Cancel any in-progress prediction
- Fresh fork from live state
- Re-run prediction

### Performance Budget

- <2ms for 3 spell lookahead
- 4-5ms for 5+ spells
- Drop depth if budget exceeded
- Debounce invalidation (~50ms) during burst phases (DoT ticks, AoE)

## Open Questions

1. **Granularity**: Predict on GCD start + material events? Debounce ~50ms?
2. **Depth**: Time-based ("predict 4s ahead") vs count-based ("predict 3 spells")?
3. **Handler interface**: How to cleanly support both live (event) and prediction (direct) modes?
