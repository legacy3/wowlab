# Event Collection & Timeline Integration

> How simulation events flow from the runtime to the timeline visualization.

## Overview

The simulation produces **CombatLogEvents** (WoW's CLEU format). The timeline expects a different **CombatData** format. This doc explains both and how to bridge them.

## 1. Simulation Event System

### Event Flow

```
┌─────────────────┐
│ Rotation Logic  │  APL decides what to cast
└────────┬────────┘
         │ emit(SpellCastSuccess)
         ▼
┌─────────────────┐
│  Event Queue    │  TinyQueue (priority by timestamp)
└────────┬────────┘
         │ poll()
         ▼
┌─────────────────┐
│  SimDriver      │  Processes event, runs handlers
│                 │  Handlers may emit MORE events
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Subscribers    │  Collect events for timeline
└─────────────────┘
```

### CombatLogEvent Types

The simulation emits **25+ event types**. Key ones for timeline:

| Category      | Events                                                                                      | Use Case                     |
| ------------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| **Casts**     | `SPELL_CAST_START`, `SPELL_CAST_SUCCESS`, `SPELL_CAST_FAILED`                               | Cast bars, rotation timeline |
| **Damage**    | `SPELL_DAMAGE`, `SPELL_PERIODIC_DAMAGE`, `SWING_DAMAGE`                                     | DPS chart, damage breakdown  |
| **Auras**     | `SPELL_AURA_APPLIED`, `SPELL_AURA_REMOVED`, `SPELL_AURA_REFRESH`, `SPELL_AURA_APPLIED_DOSE` | Buff/debuff tracks           |
| **Resources** | `SPELL_ENERGIZE`, `SPELL_DRAIN`                                                             | Focus/mana chart             |
| **Healing**   | `SPELL_HEAL`, `SPELL_PERIODIC_HEAL`                                                         | HPS chart (future)           |

### Event Base Fields

Every CombatLogEvent has:

```typescript
{
  _tag: "SPELL_DAMAGE",        // Discriminator
  timestamp: number,           // MS from sim start
  sourceGUID: string,          // Who did it
  sourceName: string,
  destGUID: string,            // Target
  destName: string,
  // ... flags
}
```

### Spell Event Fields

Events with `SPELL_` prefix add:

```typescript
{
  spellId: number,
  spellName: string,
}
```

### Damage Suffix Fields

```typescript
{
  amount: number,
  school: number,              // 1=Physical, 2=Holy, 4=Fire, etc.
  critical: boolean,
  overkill?: number,
}
```

### Aura Suffix Fields

```typescript
{
  auraType: "BUFF" | "DEBUFF",
  amount?: number,             // Stack count for dose events
}
```

## 2. Timeline Data Format

The timeline expects `CombatData`:

```typescript
interface CombatData {
  casts: CastEvent[];
  damage: DamageEvent[];
  buffs: BuffEvent[];
  resources: ResourceEvent[];
  phases: PhaseMarker[];
}
```

### CastEvent

```typescript
interface CastEvent {
  type: "cast";
  id: string; // Unique ID for React key
  spellId: number;
  timestamp: number; // SECONDS (not ms!)
  duration: number; // Cast time in seconds
  target?: string;
  successful: boolean;
}
```

### DamageEvent

```typescript
interface DamageEvent {
  type: "damage";
  id: string;
  spellId: number;
  timestamp: number; // SECONDS
  amount: number;
  isCrit: boolean;
  target: string;
  overkill?: number;
}
```

### BuffEvent

```typescript
interface BuffEvent {
  type: "buff" | "debuff";
  id: string;
  spellId: number;
  start: number; // SECONDS
  end: number; // SECONDS
  stacks?: number;
  target: string; // "Player", "Pet", "Target"
}
```

### ResourceEvent

```typescript
interface ResourceEvent {
  type: "resource";
  id: string;
  timestamp: number; // SECONDS
  focus: number;
  maxFocus: number;
}
```

## 3. Current Gap

### What We Have

The runner collects raw events:

```typescript
// lib/simulation/runner.ts
const events: Schemas.CombatLog.CombatLogEvent[] = [];

yield* combatLog.subscribe({
  filter: ["SPELL_CAST_SUCCESS", "SPELL_DAMAGE", ...],
  handler: (event) => events.push(event),
});
```

### What's Missing

The transformation in `simulation-result-tabs.tsx` is incomplete:

```typescript
// Current (naive)
if (evt.type === "cast") { ... }
if (evt.type === "damage") { ... }

// Problems:
// 1. Events have _tag not type
// 2. Timestamps are MS, timeline expects SECONDS
// 3. No buff tracking at all
// 4. No resource tracking
```

## 4. Required Transformation

### Proper Event Transformer

```typescript
function transformEvents(
  events: CombatLogEvent[],
  durationMs: number,
): CombatData {
  const casts: CastEvent[] = [];
  const damage: DamageEvent[] = [];
  const buffs: BuffEvent[] = [];
  const resources: ResourceEvent[] = [];

  // Track active auras for start/end pairing
  const activeAuras = new Map<
    string,
    { spellId: number; start: number; target: string }
  >();

  let idx = 0;
  const id = () => `evt-${idx++}`;

  for (const event of events) {
    const timeSec = event.timestamp / 1000;

    switch (event._tag) {
      case "SPELL_CAST_SUCCESS":
        casts.push({
          type: "cast",
          id: id(),
          spellId: event.spellId,
          timestamp: timeSec,
          duration: 0, // TODO: track from CAST_START
          target: event.destName,
          successful: true,
        });
        break;

      case "SPELL_DAMAGE":
      case "SPELL_PERIODIC_DAMAGE":
        damage.push({
          type: "damage",
          id: id(),
          spellId: event.spellId,
          timestamp: timeSec,
          amount: event.amount,
          isCrit: event.critical,
          target: event.destName,
          overkill: event.overkill,
        });
        break;

      case "SPELL_AURA_APPLIED":
        const auraKey = `${event.destGUID}:${event.spellId}`;
        activeAuras.set(auraKey, {
          spellId: event.spellId,
          start: timeSec,
          target: event.destName,
        });
        break;

      case "SPELL_AURA_REMOVED":
        const key = `${event.destGUID}:${event.spellId}`;
        const aura = activeAuras.get(key);
        if (aura) {
          buffs.push({
            type: event.auraType === "DEBUFF" ? "debuff" : "buff",
            id: id(),
            spellId: aura.spellId,
            start: aura.start,
            end: timeSec,
            target: aura.target,
          });
          activeAuras.delete(key);
        }
        break;

      case "SPELL_ENERGIZE":
        // Need to track current resource level
        // This requires state tracking...
        break;
    }
  }

  // Close any auras still active at fight end
  const endSec = durationMs / 1000;
  for (const [key, aura] of activeAuras) {
    buffs.push({
      type: "buff",
      id: id(),
      spellId: aura.spellId,
      start: aura.start,
      end: endSec,
      target: aura.target,
    });
  }

  return {
    casts,
    damage,
    buffs,
    resources,
    phases: [
      {
        type: "phase",
        id: "p1",
        name: "Combat",
        start: 0,
        end: endSec,
        color: "#3B82F6",
      },
    ],
  };
}
```

## 5. Resource Tracking Challenge

Resources are tricky because `SPELL_ENERGIZE` only tells us the _change_, not the current value.

### Option A: Track During Simulation

Add resource snapshots to the event stream:

```typescript
// In runner, after each GCD
events.push({
  _tag: "RESOURCE_SNAPSHOT",
  timestamp: currentTime,
  focus: state.player.power.focus.current,
  maxFocus: state.player.power.focus.max,
});
```

### Option B: Reconstruct From Events

Start with known initial value, apply energize/drain events:

```typescript
let focus = 100; // Starting focus
const maxFocus = 120;

for (const event of events) {
  if (event._tag === "SPELL_ENERGIZE" && event.powerType === "FOCUS") {
    focus = Math.min(maxFocus, focus + event.amount);
    resources.push({ timestamp: event.timestamp / 1000, focus, maxFocus });
  }
  if (event._tag === "SPELL_CAST_SUCCESS") {
    const cost = getSpellCost(event.spellId);
    focus = Math.max(0, focus - cost);
    resources.push({ timestamp: event.timestamp / 1000, focus, maxFocus });
  }
}
```

**Recommendation**: Option A is cleaner - emit snapshots from the runner.

## 6. Implementation Steps

1. **Update runner.ts** to collect all needed event types
2. **Create transformer** in `lib/simulation/transform-events.ts`
3. **Add resource snapshots** to event collection
4. **Update simulation-result-tabs.tsx** to use transformer
5. **Add spell info** to SPELLS constant for new spells

## 7. Event Collection Filter

Current filter in runner should include:

```typescript
const TIMELINE_EVENTS = [
  // Casts
  "SPELL_CAST_START",
  "SPELL_CAST_SUCCESS",
  "SPELL_CAST_FAILED",

  // Damage
  "SPELL_DAMAGE",
  "SPELL_PERIODIC_DAMAGE",

  // Auras
  "SPELL_AURA_APPLIED",
  "SPELL_AURA_REMOVED",
  "SPELL_AURA_REFRESH",
  "SPELL_AURA_APPLIED_DOSE",
  "SPELL_AURA_REMOVED_DOSE",

  // Resources
  "SPELL_ENERGIZE",
  "SPELL_DRAIN",
];
```

## Next Steps

→ [Phase 6: Transformer Implementation](./06-transformer-implementation.md)
